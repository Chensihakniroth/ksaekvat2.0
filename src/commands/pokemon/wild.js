const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const PokemonBattleService = require('../../services/PokemonBattleService').default || require('../../services/PokemonBattleService');
const EconomyService = require('../../services/EconomyService').default || require('../../services/EconomyService');
const BattleRenderer = require('../../services/BattleRenderer').default || require('../../services/BattleRenderer');

const activeBattles = new Set();

module.exports = {
  name: 'wild',
  aliases: ['wildbattle', 'pokebattle'],
  description: 'Battle a wild Pokémon team! 3v3 automated melee. (✧ω✧)',
  usage: 'wild',
  cooldown: config.pokemonBattle.wildCooldown,
  async execute(message, args, client) {
    if (activeBattles.has(message.author.id)) {
      return message.reply("Wait! (・_・ヾ You already have a battle running!");
    }

    // ─── LOAD PLAYER TEAM ────────────────────────────────────────────
    const playerTeamData = await database.getPokemonTeam(message.author.id);

    if (playerTeamData.length < config.pokemonBattle.maxTeamSize) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(colors.error)
          .setTitle('(｡•́︿•̀｡) Team not ready!')
          .setDescription(`You need exactly **${config.pokemonBattle.maxTeamSize}** Pokémon in your battle team!\nCurrent: **${playerTeamData.length}/${config.pokemonBattle.maxTeamSize}**\n\nUse \`Kpteam add <pokemon>\` to fill your team.`)
        ],
      });
    }

    activeBattles.add(message.author.id);

    try {
      await message.channel.sendTyping();

      // Build player's battle Pokémon
      const playerTeam = [];
      for (const p of playerTeamData) {
        const bp = await PokemonBattleService.buildBattlePokemon(p, 'A');
        if (bp) playerTeam.push(bp);
      }

      if (playerTeam.length < 3) {
        activeBattles.delete(message.author.id);
        return message.reply("(ಥ﹏ಥ) Failed to load some of your Pokémon stats. Try again!");
      }

      // Generate wild team scaled to player's avg level
      const avgLevel = Math.floor(playerTeam.reduce((s, p) => s + p.level, 0) / playerTeam.length);
      const wildTeam = await PokemonBattleService.generateWildTeam(avgLevel);

      // ─── INITIAL EMBED: MATCHUP ─────────────────────────────────────
      const formatTeamPreview = (team, label) => {
        return team.map((p) => {
          const typeStr = PokemonBattleService.getTypeEmojis(p.types);
          return `${typeStr} **${p.name}** (Lv.${p.level})`;
        }).join('\n');
      };

      const matchupEmbed = new EmbedBuilder()
        .setColor(0xFF6B35)
        .setTitle('⚔️ Wild Pokémon Battle!')
        .setDescription('A wild team appeared! Preparing for battle...')
        .addFields(
          { name: `🔴 ${message.author.username}'s Team`, value: formatTeamPreview(playerTeam, 'player'), inline: true },
          { name: '🔵 Wild Team', value: formatTeamPreview(wildTeam, 'wild'), inline: true },
        )
        .setFooter({ text: 'Battle starting...' });

      const battleMsg = await message.reply({ embeds: [matchupEmbed] });

      // ─── RUN SIMULATION ─────────────────────────────────────────────
      const result = PokemonBattleService.simulateBattle(
        playerTeam,
        wildTeam,
        config.pokemonBattle.maxTurns
      );

      const won = result.winner === 'A';

      // ─── ANIMATED BATTLE LOG ────────────────────────────────────────
      // Show log in chunks for dramatic effect
      const logChunks = [];
      let currentChunk = [];
      let lastTurn = 0;

      for (const entry of result.log) {
        if (entry.turn !== lastTurn && currentChunk.length > 0) {
          logChunks.push([...currentChunk]);
          currentChunk = [];
        }
        currentChunk.push(entry);
        lastTurn = entry.turn;
      }
      if (currentChunk.length > 0) logChunks.push(currentChunk);

      // Show up to 5 turn-by-turn updates
      const showChunks = logChunks.length > 5
        ? [logChunks[0], logChunks[1], logChunks[Math.floor(logChunks.length / 2)], logChunks[logChunks.length - 2], logChunks[logChunks.length - 1]]
        : logChunks;

      for (let i = 0; i < showChunks.length; i++) {
        const chunk = showChunks[i];
        const turnNum = chunk[0]?.turn || i + 1;

        // Find the matching HP snapshot for this turn
        const snapshot = result.snapshots.find(s => s.turn === turnNum) || result.snapshots[result.snapshots.length - 1];

        // 🎨 Render visual frame with correct HP for this turn
        const frameBuffer = await BattleRenderer.renderFrame(playerTeam, wildTeam, snapshot ? { teamA: snapshot.teamA, teamB: snapshot.teamB } : undefined);
        const attachment = new AttachmentBuilder(frameBuffer, { name: `battle_${turnNum}.png` });

        // 📜 Battle log as plain text (flows into the image naturally)
        const logText = chunk.map((e) => {
          const prefix = e.type === 'faint' ? '💀' : e.type === 'super_effective' ? '⚡' : e.type === 'crit' ? '💥' : e.type === 'immune' ? '🚫' : '▸';
          return `${prefix} ${e.text}`;
        }).join('\n');

        const content = `⚔️ **Wild Battle — Turn ${turnNum}/${result.turns}**\n${logText.slice(0, 1900)}`;

        await battleMsg.edit({ content, files: [attachment], embeds: [] });
        if (i < showChunks.length - 1) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      }

      // ─── APPLY REWARDS ──────────────────────────────────────────────
      const rewards = PokemonBattleService.calculateBattleRewards(
        won,
        playerTeam,
        wildTeam,
        config.pokemonBattle.faintedXpPenalty
      );

      // Award money
      if (rewards.money > 0) {
        await database.addBalance(message.author.id, rewards.money);
      }

      // Award XP to each team member
      const xpResults = [];
      for (const p of playerTeamData) {
        const xp = rewards.xpPerMember.get(p._id.toString()) || 0;
        const scaledXp = Math.floor(xp * config.pokemonBattle.xpMultiplier);
        if (scaledXp > 0) {
          const res = await database.addPokemonExp(p._id.toString(), scaledXp);
          xpResults.push({
            name: p.speciesKey.charAt(0).toUpperCase() + p.speciesKey.slice(1),
            xp: scaledXp,
            leveledUp: res.leveledUp,
            newLevel: res.newLevel,
            fainted: playerTeam.find((bp) => bp.id === p._id.toString())?.hp <= 0,
          });
        }
      }

      // ─── FINAL RESULT MESSAGE ───────────────────────────────────────
      const xpLines = xpResults.map((r) => {
        let line = `${r.fainted ? '💀' : '✅'} **${r.name}**: +${r.xp} XP`;
        if (r.leveledUp) line += ` 🎊 **→ Lv.${r.newLevel}!**`;
        return line;
      }).join('\n');

      const finalSnapshot = result.snapshots[result.snapshots.length - 1];
      const finalFrame = await BattleRenderer.renderFrame(playerTeam, wildTeam, finalSnapshot ? { teamA: finalSnapshot.teamA, teamB: finalSnapshot.teamB } : undefined);
      const finalAttachment = new AttachmentBuilder(finalFrame, { name: 'battle_final.png' });

      const finalContent = won
        ? `(✧ω✧) **VICTORY!** You won in ${result.turns} turns!\n💰 **Reward:** +${EconomyService.format(rewards.money)} ${config.economy.currency}\n\n**⭐ XP Earned**\n${xpLines || 'None'}`
        : `(ಥ﹏ಥ) **DEFEAT...** Your team fainted in ${result.turns} turns.\n\n**⭐ XP Earned**\n${xpLines || 'None'}`;

      await battleMsg.edit({ content: finalContent, embeds: [], files: [finalAttachment] });

      // Player XP reward
      const playerXp = won ? 30 : 10;
      await database.addExperience(message.author.id, playerXp);
      await database.updateStats(message.author.id, 'command');

    } finally {
      activeBattles.delete(message.author.id);
    }
  },
};
