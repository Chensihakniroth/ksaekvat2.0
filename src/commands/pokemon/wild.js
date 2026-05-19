"use strict";
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const PokemonBattleService = require('../../services/PokemonBattleService').default || require('../../services/PokemonBattleService');
const EconomyService = require('../../services/EconomyService').default || require('../../services/EconomyService');
const BattleRenderer = require('../../services/BattleRenderer').default || require('../../services/BattleRenderer');

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
  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([turn, entries]) => ({ turn, entries }));
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
      return message.reply("Wait! (・_・ヾ You already have a battle running!");
    }

    // ─── LOAD PLAYER TEAM ────────────────────────────────────────────
    const playerTeamData = await database.getPokemonTeam(message.author.id);
    if (playerTeamData.length < config.pokemonBattle.maxTeamSize) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(colors.error)
          .setTitle('(｡•́︿•̀｡) Team not ready!')
          .setDescription(
            `You need exactly **${config.pokemonBattle.maxTeamSize}** Pokémon in your battle team!\n` +
            `Current: **${playerTeamData.length}/${config.pokemonBattle.maxTeamSize}**\n\n` +
            `Use \`Kpteam add <pokemon>\` to fill your team.`
          )
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
        return message.reply("(ಥ﹏ಥ) Failed to load some of your Pokémon stats. Try again!");
      }

      const avgLevel = Math.floor(
        playerTeam.reduce((s, p) => s + p.level, 0) / playerTeam.length
      );
      const wildTeam = await PokemonBattleService.generateWildTeam(avgLevel);

      // ─── INTRO: Two-stage battle open ────────────────────────────
      // Stage 1 — "Wild appeared!" flash (dark card, 1.2 s)
      // Stage 2 — Full matchup embed with HP bars + power scores
      // Stage 1 ── dark flash card
      const wildNames = wildTeam.map(p => p.name).join(', ');
      const battleMsg = await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x1a1a2e)
            .setDescription(
              '```\n' +
              '  ！！！ A wild team appeared ！！！\n' +
              '```'
            )
            .addFields({
              name: '\u200B',
              value: `> **${wildNames}**\n> *blocked your path!*`,
            })
            .setFooter({ text: 'Checking your team…' }),
        ],
      });
      await new Promise(r => setTimeout(r, 700));

      // ─── INTRO STAGE 2: Clean matchup card ───────────────────────
      // Name + type + level only — image already shows HP bars.
      const buildMatchupField = (team, side) => {
        return team.map((p, i) => {
          const typeStr = PokemonBattleService.getTypeEmojis(p.types);
          const slot = side === 'player'
            ? ['①', '②', '③'][i] ?? `${i + 1}.`
            : ['Ⅰ', 'Ⅱ', 'Ⅲ'][i] ?? `${i + 1}.`;
          return `${slot} ${typeStr} **${p.name}** \`Lv.${p.level}\``;
        }).join('\n');
      };

      const powerScore = team => {
        const avg = team.reduce((s, p) => s + p.level, 0) / team.length;
        const stars = Math.min(5, Math.max(1, Math.round(avg / 20)));
        return '★'.repeat(stars) + '☆'.repeat(5 - stars);
      };

      const initialSnapshot = {
        teamA: playerTeam.map(p => ({ hp: p.hp, status: 'none' })),
        teamB: wildTeam.map(p => ({ hp: p.hp, status: 'none' })),
      };
      const introFrame = await BattleRenderer.renderFrame(
        playerTeam, wildTeam, initialSnapshot
      );
      const introAttachment = new AttachmentBuilder(
        introFrame, { name: 'battle_intro.png' }
      );

      const matchupEmbed = new EmbedBuilder()
        .setColor(0xFF4500)
        .setTitle('⚔️  B A T T L E  S T A R T')
        .addFields(
          {
            name: `🔴  ${message.author.username}  ${powerScore(playerTeam)}`,
            value: buildMatchupField(playerTeam, 'player'),
            inline: true,
          },
          {
            name: `🔵  Wild Team  ${powerScore(wildTeam)}`,
            value: buildMatchupField(wildTeam, 'wild'),
            inline: true,
          }
        )
        .setImage('attachment://battle_intro.png')
        .setFooter({ text: '3v3  ·  Auto-Battle  ·  Starting in 2s…' });

      await safeEdit(battleMsg, {
        content: null,
        embeds: [matchupEmbed],
        files: [introAttachment],
      });

      await new Promise(r => setTimeout(r, 2000));

      // ─── RUN SIMULATION ──────────────────────────────────────────
      const result = PokemonBattleService.simulateBattle(
        playerTeam, wildTeam, config.pokemonBattle.maxTurns
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
      // Only render on notable events (faint/crit/super_effective) or
      // every QUIET_FLUSH turns — skips quiet turns to keep it snappy.
      const NOTABLE = new Set(['faint', 'crit', 'super_effective']);
      const QUIET_FLUSH = 3;
      let lastRenderedTurn = 0;

      for (let i = 0; i < turns.length; i++) {
        const { turn, entries } = turns[i];
        const isLastTurn = i === turns.length - 1;
        const highlight = entries.find(e => NOTABLE.has(e.type));
        const turnsSinceLast = turn - lastRenderedTurn;

        if (!highlight && !isLastTurn && turnsSinceLast < QUIET_FLUSH) continue;

        const snap = snapshotMap.get(turn) ??
          result.snapshots[result.snapshots.length - 1];

        const frameBuffer = await BattleRenderer.renderFrame(
          playerTeam, wildTeam,
          { teamA: snap.teamA, teamB: snap.teamB }
        );
        const frameAttachment = new AttachmentBuilder(
          frameBuffer, { name: `battle_t${turn}.png` }
        );

        const topEvent = highlight ?? entries[0];
        const prefix =
          topEvent?.type === 'faint' ? '💀' :
            topEvent?.type === 'crit' ? '💥' :
              topEvent?.type === 'super_effective' ? '⚡' : '▸';
        const eventLine = topEvent ? `  ${prefix} ${topEvent.text}` : '';

        await safeEdit(battleMsg, {
          content: `\`Turn ${turn}/${result.turns}\`${eventLine}`,
          files: [frameAttachment],
          embeds: [],
        });

        lastRenderedTurn = turn;

        if (!isLastTurn) {
          await message.channel.sendTyping();
          await new Promise(r => setTimeout(r,
            highlight?.type === 'faint' ? 1200 :
              highlight?.type === 'crit' ? 800 : 700
          ));
        }
      }

      // ─── APPLY REWARDS ────────────────────────────────────────────
      const rewards = PokemonBattleService.calculateBattleRewards(
        won, playerTeam, wildTeam, config.pokemonBattle.faintedXpPenalty
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
            fainted: playerTeam.find(bp => bp.id === p._id.toString())?.hp <= 0,
          });
        }
      }

      // ─── FINAL RESULT ─────────────────────────────────────────────
      const finalSnap = result.snapshots[result.snapshots.length - 1];

      const xpLines = xpResults
        .map(r => {
          let s = `${r.fainted ? '💀' : '✅'} ${r.name} +${r.xp} XP`;
          if (r.leveledUp) s += ` 🎊 Lv.${r.newLevel}!`;
          return s;
        })
        .join('  ·  ');

      const outcomeLine = won
        ? `(✧ω✧) **VICTORY!** ${result.turns} turns  ·  💰 +${EconomyService.format(rewards.money)} ${config.economy.currency}`
        : `(ಥ﹏ಥ) **DEFEAT** after ${result.turns} turns`;

      const finalContent = xpLines
        ? `${outcomeLine}\n${xpLines}`
        : outcomeLine;

      const finalFrame = await BattleRenderer.renderFrame(
        playerTeam, wildTeam,
        finalSnap ? { teamA: finalSnap.teamA, teamB: finalSnap.teamB } : undefined
      );
      const finalAttachment = new AttachmentBuilder(finalFrame, { name: 'battle_final.png' });

      await safeEdit(battleMsg, {
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