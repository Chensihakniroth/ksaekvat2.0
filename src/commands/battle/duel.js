const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const PokemonBattleService = require('../../services/PokemonBattleService').default || require('../../services/PokemonBattleService');
const EconomyService = require('../../services/EconomyService').default || require('../../services/EconomyService');
const BattleRenderer = require('../../services/BattleRenderer').default || require('../../services/BattleRenderer');

const activeDuels = new Set();

module.exports = {
  name: 'duel',
  aliases: ['challenge', 'pvp'],
  description: 'Challenge another trainer to a 3v3 Pokémon battle! ⚔️',
  usage: 'duel <@user> [bet_amount]',
  cooldown: config.pokemonBattle.duelCooldown,
  async execute(message, args, client) {
    // ─── VALIDATION ──────────────────────────────────────────────────
    if (args.length < 1) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(colors.error)
          .setTitle('(・_・ヾ Who are you challenging?')
          .setDescription('Usage: `Kduel @user [bet_amount]`\nExample: `Kduel @friend 1000`')
        ],
      });
    }

    // Get target user
    let target = null;
    if (message.mentions.users.size > 0) {
      target = message.mentions.users.first();
    } else {
      target = client.users.cache.get(args[0]);
    }

    if (!target) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(colors.error)
          .setTitle("(・_・ヾ Can't find them!")
          .setDescription("I couldn't find that trainer. Make sure to @mention them!")
        ],
      });
    }

    if (target.id === message.author.id) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(colors.warning)
          .setTitle("(≧◡≦) Can't battle yourself!")
          .setDescription("Find another trainer to challenge!")
        ],
      });
    }

    if (target.bot) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(colors.warning)
          .setTitle('(・_・ヾ Bots are busy!')
          .setDescription("Bots don't have Pokémon teams! Challenge a real trainer.")
        ],
      });
    }

    if (activeDuels.has(message.author.id) || activeDuels.has(target.id)) {
      return message.reply("One of you is already in a duel! Wait for it to finish. (・_・ヾ");
    }

    // ─── LOAD BOTH TEAMS ─────────────────────────────────────────────
    const [challengerTeamData, targetTeamData] = await Promise.all([
      database.getPokemonTeam(message.author.id),
      database.getPokemonTeam(target.id),
    ]);

    if (challengerTeamData.length < config.pokemonBattle.maxTeamSize) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(colors.error)
          .setTitle("(｡•́︿•̀｡) Your team isn't ready!")
          .setDescription(`You need ${config.pokemonBattle.maxTeamSize} Pokémon in your team.\nCurrent: **${challengerTeamData.length}/${config.pokemonBattle.maxTeamSize}**\nUse \`Kpteam add <pokemon>\` to fill your squad!`)
        ],
      });
    }

    if (targetTeamData.length < config.pokemonBattle.maxTeamSize) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(colors.error)
          .setTitle(`(｡•́︿•̀｡) ${target.username}'s team isn't ready!`)
          .setDescription(`They need ${config.pokemonBattle.maxTeamSize} Pokémon. They have **${targetTeamData.length}/${config.pokemonBattle.maxTeamSize}**.`)
        ],
      });
    }

    // ─── BET HANDLING ────────────────────────────────────────────────
    let betAmount = 0;
    const betArg = message.mentions.users.size > 0 ? args[1] : args[1];
    if (betArg) {
      const userData = await database.getUser(message.author.id);
      betAmount = EconomyService.parseBet(betArg, userData.balance);
      if (betAmount < 0) betAmount = 0;
    }

    if (betAmount > 0) {
      if (!(await database.hasBalance(message.author.id, betAmount))) {
        return message.reply({
          embeds: [new EmbedBuilder()
            .setColor(colors.error)
            .setTitle("(ಥ﹏ಥ) Not enough coins!")
            .setDescription(`You don't have enough ${config.economy.currency} for this bet!`)
          ],
        });
      }
      if (!(await database.hasBalance(target.id, betAmount))) {
        return message.reply({
          embeds: [new EmbedBuilder()
            .setColor(colors.error)
            .setTitle(`(ಥ﹏ಥ) ${target.username} can't match that bet!`)
            .setDescription(`They don't have enough ${config.economy.currency}.`)
          ],
        });
      }
    }

    // ─── BUILD TEAM PREVIEWS ─────────────────────────────────────────
    const buildPreview = async (teamData) => {
      const lines = [];
      for (const p of teamData) {
        const base = await PokemonBattleService.getBaseStats(p.speciesKey);
        const typeStr = base ? PokemonBattleService.getTypeEmojis(base.types) : '❓';
        lines.push(`${typeStr} **${p.speciesKey.charAt(0).toUpperCase() + p.speciesKey.slice(1)}** (Lv.${p.level})`);
      }
      return lines.join('\n');
    };

    const [challengerPreview, targetPreview] = await Promise.all([
      buildPreview(challengerTeamData),
      buildPreview(targetTeamData),
    ]);

    // ─── INVITE EMBED ────────────────────────────────────────────────
    const inviteEmbed = new EmbedBuilder()
      .setColor(0xFF6B35)
      .setTitle('⚔️ Pokémon Duel Challenge!')
      .setDescription(`${message.author} challenges ${target} to a 3v3 battle!`)
      .addFields(
        { name: `🔴 ${message.author.username}'s Team`, value: challengerPreview, inline: true },
        { name: `🔵 ${target.username}'s Team`, value: targetPreview, inline: true },
      );

    if (betAmount > 0) {
      inviteEmbed.addFields({
        name: '💰 Stakes',
        value: `**Bet:** ${EconomyService.format(betAmount)} ${config.economy.currency}\n**Winner Takes:** ${EconomyService.format(betAmount * 2)} ${config.economy.currency}`,
      });
    }

    inviteEmbed.addFields({
      name: '📋 Accept?',
      value: `${target}, react with ⚔️ to accept or ❌ to decline!\n**Time Limit:** 60 seconds`,
    });

    const sentMessage = await message.reply({ embeds: [inviteEmbed] });

    try {
      await new Promise((r) => setTimeout(r, 500));
      await sentMessage.react('⚔️');
      await sentMessage.react('❌');

      const filter = (reaction, user) => ['⚔️', '❌'].includes(reaction.emoji.name) && user.id === target.id;
      const collector = sentMessage.createReactionCollector({ filter, time: 60000, max: 1 });

      let processed = false;

      collector.on('collect', async (reaction) => {
        if (processed) return;
        processed = true;

        if (reaction.emoji.name === '❌') {
          const declineEmbed = new EmbedBuilder()
            .setColor(colors.error)
            .setTitle('(・_・ヾ Challenge declined')
            .setDescription(`${target.username} decided not to battle.`);
          await sentMessage.edit({ embeds: [declineEmbed] });
          await sentMessage.reactions.removeAll().catch(() => {});
          return;
        }

        // ⚔️ ACCEPTED — START BATTLE
        activeDuels.add(message.author.id);
        activeDuels.add(target.id);

        try {
          // Deduct bets
          if (betAmount > 0) {
            await database.removeBalance(message.author.id, betAmount);
            await database.removeBalance(target.id, betAmount);
            await database.updateStats(message.author.id, 'gambled', betAmount);
            await database.updateStats(target.id, 'gambled', betAmount);
          }

          const acceptEmbed = new EmbedBuilder()
            .setColor(colors.success)
            .setTitle('(ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ Battle accepted!')
            .setDescription('Preparing the battlefield...');
          await sentMessage.edit({ embeds: [acceptEmbed] });
          await sentMessage.reactions.removeAll().catch(() => {});
          await new Promise((r) => setTimeout(r, 2000));

          // Build battle teams
          const teamA = [];
          const teamB = [];

          for (const p of challengerTeamData) {
            const bp = await PokemonBattleService.buildBattlePokemon(p, 'A');
            if (bp) teamA.push(bp);
          }
          for (const p of targetTeamData) {
            const bp = await PokemonBattleService.buildBattlePokemon(p, 'B');
            if (bp) teamB.push(bp);
          }

          // Run simulation
          const result = PokemonBattleService.simulateBattle(teamA, teamB, config.pokemonBattle.maxTurns);
          const won = result.winner === 'A';
          const winner = won ? message.author : target;
          const loser = won ? target : message.author;

          // ─── ANIMATED LOG ────────────────────────────────────────────
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

          const showChunks = logChunks.length > 5
            ? [logChunks[0], logChunks[1], logChunks[Math.floor(logChunks.length / 2)], logChunks[logChunks.length - 2], logChunks[logChunks.length - 1]]
            : logChunks;

          for (let i = 0; i < showChunks.length; i++) {
            const chunk = showChunks[i];
            const turnNum = chunk[0]?.turn || i + 1;

            // 🎨 Render visual frame (sprites + HP bars only)
            const frameBuffer = await BattleRenderer.renderFrame(teamA, teamB);
            const attachment = new AttachmentBuilder(frameBuffer, { name: `duel_${turnNum}.png` });

            // 📜 Battle log goes in the embed text
            const logText = chunk.map((e) => {
              const prefix = e.type === 'faint' ? '💀' : e.type === 'super_effective' ? '⚡' : e.type === 'crit' ? '💥' : '▸';
              return `${prefix} ${e.text}`;
            }).join('\n');

            const turnEmbed = new EmbedBuilder()
              .setColor(0xFF6B35)
              .setTitle(`⚔️ Duel — Turn ${turnNum}`)
              .setImage(`attachment://duel_${turnNum}.png`)
              .setDescription(logText.slice(0, 1024) || '...')
              .setFooter({ text: `Turn ${turnNum}/${result.turns}` });

            await sentMessage.edit({ embeds: [turnEmbed], files: [attachment] });
            if (i < showChunks.length - 1) {
              await new Promise((r) => setTimeout(r, config.pokemonBattle.turnDelay));
            }
          }

          // ─── REWARDS ──────────────────────────────────────────────────
          // Winner's team
          const winnerTeamData = won ? challengerTeamData : targetTeamData;
          const winnerTeam = won ? teamA : teamB;
          const loserTeamData = won ? targetTeamData : challengerTeamData;
          const loserTeam = won ? teamB : teamA;

          const winnerRewards = PokemonBattleService.calculateBattleRewards(true, winnerTeam, loserTeam, config.pokemonBattle.faintedXpPenalty);
          const loserRewards = PokemonBattleService.calculateBattleRewards(false, loserTeam, winnerTeam, config.pokemonBattle.faintedXpPenalty);

          // Apply XP to winner's Pokémon
          const winnerXpLines = [];
          for (const p of winnerTeamData) {
            const xp = winnerRewards.xpPerMember.get(p._id.toString()) || 0;
            const scaledXp = Math.floor(xp * config.pokemonBattle.xpMultiplier);
            if (scaledXp > 0) {
              const res = await database.addPokemonExp(p._id.toString(), scaledXp);
              const fainted = winnerTeam.find((bp) => bp.id === p._id.toString())?.hp <= 0;
              let line = `${fainted ? '💀' : '✅'} **${p.speciesKey.charAt(0).toUpperCase() + p.speciesKey.slice(1)}**: +${scaledXp} XP`;
              if (res.leveledUp) line += ` 🎊 **→ Lv.${res.newLevel}!**`;
              winnerXpLines.push(line);
            }
          }

          // Apply XP to loser's Pokémon (reduced)
          const loserXpLines = [];
          for (const p of loserTeamData) {
            const xp = loserRewards.xpPerMember.get(p._id.toString()) || 0;
            const scaledXp = Math.floor(xp * config.pokemonBattle.xpMultiplier);
            if (scaledXp > 0) {
              const res = await database.addPokemonExp(p._id.toString(), scaledXp);
              let line = `**${p.speciesKey.charAt(0).toUpperCase() + p.speciesKey.slice(1)}**: +${scaledXp} XP`;
              if (res.leveledUp) line += ` 🎊 **→ Lv.${res.newLevel}!**`;
              loserXpLines.push(line);
            }
          }

          // Bet payouts
          let betText = '';
          if (betAmount > 0) {
            const winAmount = betAmount * 2;
            await database.addBalance(winner.id, winAmount);
            await database.updateStats(winner.id, 'won', betAmount);
            await database.updateStats(loser.id, 'lost', betAmount);
            betText = `\n\n💰 **${winner.username}** wins **${EconomyService.format(winAmount)}** ${config.economy.currency}!`;
          }

          // Player XP
          await database.addExperience(winner.id, 50);
          await database.addExperience(loser.id, 25);

          // ─── RESULT EMBED ─────────────────────────────────────────────
          const resultEmbed = new EmbedBuilder()
            .setColor(colors.success)
            .setTitle(`🏆 ${winner.username} wins the duel!`)
            .setDescription(`**${winner.username}**'s team defeated **${loser.username}**'s team!${betText}`)
            .addFields(
              { name: `🥇 ${winner.username}'s XP`, value: winnerXpLines.join('\n') || 'None', inline: true },
              { name: `🥈 ${loser.username}'s XP`, value: loserXpLines.join('\n') || 'None', inline: true },
              { name: '📊 Battle Stats', value: `**Turns:** ${result.turns}\n**Winner:** +50 player XP\n**Loser:** +25 player XP` },
            )
            .setThumbnail(winner.displayAvatarURL())
            .setFooter({ text: 'All Pokémon are fully healed after battle!' });

          await sentMessage.edit({ embeds: [resultEmbed] });
          await database.updateStats(message.author.id, 'command');

        } finally {
          activeDuels.delete(message.author.id);
          activeDuels.delete(target.id);
        }
      });

      collector.on('end', async (collected) => {
        if (processed) return;
        if (collected.size === 0) {
          const timeoutEmbed = new EmbedBuilder()
            .setColor(colors.warning)
            .setTitle('(・_・ヾ No response...')
            .setDescription(`${target.username} didn't respond in time.`);
          await sentMessage.edit({ embeds: [timeoutEmbed] });
          await sentMessage.reactions.removeAll().catch(() => {});
        }
      });

    } catch (error) {
      console.error('❌ Error in duel:', error);
      activeDuels.delete(message.author.id);
      activeDuels.delete(target.id);
      await message.channel.send('Something went wrong with the duel. Try again! (ಥ﹏ಥ)');
    }

    await database.updateStats(message.author.id, 'command');
  },
};
