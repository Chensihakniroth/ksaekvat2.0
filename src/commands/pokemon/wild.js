'use strict';
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const PokemonBattleService =
  require('../../services/PokemonBattleService').default ||
  require('../../services/PokemonBattleService');
const EconomyService =
  require('../../services/EconomyService').default || require('../../services/EconomyService');
const BattleRenderer =
  require('../../services/BattleRenderer').default || require('../../services/BattleRenderer');

const activeBattles = new Set();

// ─── HELPERS ────────────────────────────────────────────────────────────────

/**
 * Safe message edit — swallows "Unknown Message" errors that can occur
 * if the message was deleted mid-battle.
 */
async function safeEdit(msg, payload) {
  try {
    await msg.edit(payload);
  } catch (err) {
    if (err.code !== 10008) throw err; // re-throw if not "Unknown Message"
  }
}

/**
 * Group raw log entries by turn number into an ordered array of
 * { turn, entries[] } objects.
 */
function groupByTurn(log) {
  const map = new Map();
  for (const entry of log) {
    if (!map.has(entry.turn)) map.set(entry.turn, []);
    map.get(entry.turn).push(entry);
  }
  return [...map.entries()].sort(([a], [b]) => a - b).map(([turn, entries]) => ({ turn, entries }));
}

// ─── COMMAND ────────────────────────────────────────────────────────────────

module.exports = {
  name: 'wild',
  aliases: ['wildbattle', 'pokebattle'],
  description: 'Battle a wild Pokémon team! 3v3 real-time turn-by-turn. (✧ω✧)',
  usage: 'wild',
  cooldown: config.pokemonBattle.wildCooldown,

  async execute(message, args, client) {
    if (activeBattles.has(message.author.id)) {
      return message.reply('Wait! (・_・ヾ You already have a battle running!');
    }

    // ─── LOAD PLAYER TEAM ────────────────────────────────────────────
    const playerTeamData = await database.getPokemonTeam(message.author.id);
    if (playerTeamData.length < config.pokemonBattle.maxTeamSize) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.error)
            .setTitle('(｡•́︿•̀｡) Team not ready!')
            .setDescription(
              `You need exactly **${config.pokemonBattle.maxTeamSize}** Pokémon in your battle team!\n` +
                `Current: **${playerTeamData.length}/${config.pokemonBattle.maxTeamSize}**\n\n` +
                `Use \`Kpteam add <pokemon>\` to fill your team.`
            ),
        ],
      });
    }

    activeBattles.add(message.author.id);

    try {
      await message.channel.sendTyping();

      // ─── BUILD TEAMS ─────────────────────────────────────────────
      const playerTeam = [];
      for (const p of playerTeamData) {
        const bp = await PokemonBattleService.buildBattlePokemon(p, 'A');
        if (bp) playerTeam.push(bp);
      }
      if (playerTeam.length < config.pokemonBattle.maxTeamSize) {
        activeBattles.delete(message.author.id);
        return message.reply('(ಥ﹏ಥ) Failed to load some of your Pokémon stats. Try again!');
      }

      const avgLevel = Math.floor(playerTeam.reduce((s, p) => s + p.level, 0) / playerTeam.length);
      const wildTeam = await PokemonBattleService.generateWildTeam(avgLevel);

      // ─── SEND INITIAL MESSAGE (will be overwritten by first turn) ──
      const battleMsg = await message.reply({
        content: '`Loading battle…`',
      });

      // ─── RUN SIMULATION ──────────────────────────────────────────
      const result = PokemonBattleService.simulateBattle(
        playerTeam,
        wildTeam,
        config.pokemonBattle.maxTurns
      );
      const won = result.winner === 'A';

      // Build a quick snapshot lookup: turn → { teamA, teamB }
      const snapshotMap = new Map();
      for (const s of result.snapshots) {
        snapshotMap.set(s.turn, s);
      }

      // Group log entries by turn
      const turns = groupByTurn(result.log);

      // ─── REAL-TIME TURN LOOP ──────────────────────────────────────
      // We only render an image on notable events or every QUIET_FLUSH turns.
      // We accumulate logs so skipped turns still show up in text!
      const NOTABLE = new Set(['faint', 'crit', 'super_effective']);
      const QUIET_FLUSH = 3;
      let lastRenderedTurn = 0;
      let accumulatedLogs = [];

      for (let i = 0; i < turns.length; i++) {
        const { turn, entries } = turns[i];
        const isLastTurn = i === turns.length - 1;
        const highlight = entries.find((e) => NOTABLE.has(e.type));
        const turnsSinceLast = turn - lastRenderedTurn;

        const topEvent = highlight ?? entries[0];
        if (topEvent) {
          const prefix =
            topEvent.type === 'faint'
              ? '💀'
              : topEvent.type === 'crit'
                ? '💥'
                : topEvent.type === 'super_effective'
                  ? '⚡'
                  : '▸';
          accumulatedLogs.push(`\`Turn ${turn}/${result.turns}\` ${prefix} ${topEvent.text}`);
        }

        // Keep maximum of 4 log lines on screen
        if (accumulatedLogs.length > 4) {
          accumulatedLogs = accumulatedLogs.slice(-4);
        }

        if (!highlight && !isLastTurn && turnsSinceLast < QUIET_FLUSH) {
          continue; // Skip rendering image, but we saved the log!
        }

        const snap = snapshotMap.get(turn) ?? result.snapshots[result.snapshots.length - 1];

        const frameBuffer = await BattleRenderer.renderFrame(playerTeam, wildTeam, {
          teamA: snap.teamA,
          teamB: snap.teamB,
        });
        const frameAttachment = new AttachmentBuilder(frameBuffer, { name: `battle_t${turn}.png` });

        await safeEdit(battleMsg, {
          content: accumulatedLogs.join('\n'),
          files: [frameAttachment],
          embeds: [],
        });

        lastRenderedTurn = turn;

        if (!isLastTurn) {
          // ⚠️ IMPORTANT: We must wait at least 1500ms when sending an image, 
          // otherwise Discord CDN gets overwhelmed and shows a blurry placeholder forever.
          await new Promise((r) =>
            setTimeout(
              r,
              highlight?.type === 'faint' ? 2200 : highlight?.type === 'crit' ? 1800 : 1500
            )
          );
        }
      }

      // ─── APPLY REWARDS ────────────────────────────────────────────
      const rewards = PokemonBattleService.calculateBattleRewards(
        won,
        playerTeam,
        wildTeam,
        config.pokemonBattle.faintedXpPenalty
      );

      if (rewards.money > 0) {
        await database.addBalance(message.author.id, rewards.money);
      }

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

      // ─── FINAL RESULT ─────────────────────────────────────────────
      const finalSnap = result.snapshots[result.snapshots.length - 1];

      const xpLines = xpResults
        .map((r) => {
          let s = `${r.fainted ? '💀' : '✅'} ${r.name} +${r.xp} XP`;
          if (r.leveledUp) s += ` 🎊 Lv.${r.newLevel}!`;
          return s;
        })
        .join('  ·  ');

      const outcomeLine = won
        ? `(✧ω✧) **VICTORY!** ${result.turns} turns  ·  💰 +${EconomyService.format(rewards.money)} ${config.economy.currency}`
        : `(ಥ﹏ಥ) **DEFEAT** after ${result.turns} turns`;

      const finalContent = xpLines ? `${outcomeLine}\n${xpLines}` : outcomeLine;

      const finalFrame = await BattleRenderer.renderFrame(
        playerTeam,
        wildTeam,
        finalSnap ? { teamA: finalSnap.teamA, teamB: finalSnap.teamB } : undefined
      );
      const finalAttachment = new AttachmentBuilder(finalFrame, { name: 'battle_final.png' });

      // Send final message as a NEW message to avoid Discord's "Image failed to load" edit cache bug
      await battleMsg.delete().catch(() => {});
      await message.reply({
        content: finalContent,
        embeds: [],
        files: [finalAttachment],
      });

      // Award player account XP
      const playerXp = won ? 30 : 10;
      await database.addExperience(message.author.id, playerXp);
      await database.updateStats(message.author.id, 'command');
    } finally {
      activeBattles.delete(message.author.id);
    }
  },
};
