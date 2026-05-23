const { EmbedBuilder } = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const PokemonBattleService =
  require('../../services/PokemonBattleService').default ||
  require('../../services/PokemonBattleService');

module.exports = {
  name: 'pteam',
  aliases: ['poketeam', 'pt'],
  description: 'Manage your Pokémon Battle Team! (3 Slots) ⚔️',
  usage: 'pteam [add <pokemon> | remove <slot> | list]',
  cooldown: 3000,
  async execute(message, args, client) {
    const sub = args[0]?.toLowerCase();

    // ─── SUBCOMMAND: ADD ─────────────────────────────────────────────
    if (sub === 'add') {
      const speciesName = args.slice(1).join(' ').toLowerCase().replace(/\s+/g, '');
      if (!speciesName) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(colors.warning)
              .setTitle('(・_・ヾ Who should I train?')
              .setDescription('Usage: `Kpteam add <pokemon>`\nExample: `Kpteam add pikachu`'),
          ],
        });
      }

      // Check if team is full
      const currentTeam = await database.getPokemonTeam(message.author.id);
      if (currentTeam.length >= config.pokemonBattle.maxTeamSize) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(colors.error)
              .setTitle('(ಥ﹏ಥ) Team is full!')
              .setDescription(
                `Your battle team already has ${config.pokemonBattle.maxTeamSize} Pokémon!\nRemove one first with \`Kpteam remove <slot>\``
              ),
          ],
        });
      }

      const currentTeamIds = new Set(currentTeam.map((p) => p._id.toString()));

      // 1) Check if the user already has this species benched (trained but not in team)
      const trainedPokemon = await database.getTrainedPokemon(message.author.id);
      const availableBenched = trainedPokemon.filter(
        (p) => p.speciesKey === speciesName && !currentTeamIds.has(p._id.toString())
      );

      let pokemonToAdd;
      let usedFromBench = false;

      if (availableBenched.length > 0) {
        // Pick the highest level benched pokemon of this species
        availableBenched.sort((a, b) => b.level - a.level);
        pokemonToAdd = availableBenched[0];
        usedFromBench = true;
      } else {
        // 2) Train a new one from the Zoo (consumes 1 from Zoo count)
        await message.channel.sendTyping();
        const result = await database.trainPokemon(message.author.id, speciesName);

        if (!result.success) {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(colors.error)
                .setTitle('(｡•́︿•̀｡) Training Failed')
                .setDescription(result.message + "\n*(Or maybe they're already in your team!)*"),
            ],
          });
        }
        pokemonToAdd = result.pokemon;
      }

      // Add to team array
      const user = await database.getUser(message.author.id);
      const teamIds = (user.pokemonTeam || []).map((id) => id.toString());
      teamIds.push(pokemonToAdd._id.toString());
      await database.setPokemonTeam(message.author.id, teamIds);

      // Get type info for display
      const baseStats = await PokemonBattleService.getBaseStats(speciesName);
      const typeDisplay = baseStats
        ? baseStats.types
            .map(
              (t) =>
                `${PokemonBattleService.getTypeEmoji(t)} ${t.charAt(0).toUpperCase() + t.slice(1)}`
            )
            .join(' / ')
        : 'Unknown';

      const capitalizedName = speciesName.charAt(0).toUpperCase() + speciesName.slice(1);

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.success)
            .setTitle(`(ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ ${capitalizedName} joined the team!`)
            .setDescription(
              [
                `**Species:** ${capitalizedName}`,
                `**Type:** ${typeDisplay}`,
                `**Level:** ${pokemonToAdd.level}`,
                `**Team Slot:** ${teamIds.length}/${config.pokemonBattle.maxTeamSize}`,
                '',
                usedFromBench
                  ? `*Re-added from your benched Pokémon!*`
                  : `*1 ${capitalizedName} was consumed from your Zoo for training!*`,
              ].join('\n')
            ),
        ],
      });
    }

    // ─── SUBCOMMAND: REMOVE ──────────────────────────────────────────
    if (sub === 'remove') {
      const slot = parseInt(args[1]);
      if (isNaN(slot) || slot < 1 || slot > 3) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(colors.warning)
              .setTitle('(・_・ヾ Which slot?')
              .setDescription('Usage: `Kpteam remove <1-3>`'),
          ],
        });
      }

      const currentTeam = await database.getPokemonTeam(message.author.id);
      if (slot > currentTeam.length) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(colors.error)
              .setTitle('(｡•́︿•̀｡) Empty slot!')
              .setDescription('That slot is already empty.'),
          ],
        });
      }

      const removed = currentTeam[slot - 1];
      const user = await database.getUser(message.author.id);
      const teamIds = (user.pokemonTeam || []).map((id) => id.toString());
      teamIds.splice(slot - 1, 1);
      await database.setPokemonTeam(message.author.id, teamIds);

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.success)
            .setTitle('✅ Pokémon benched!')
            .setDescription(
              `**${removed.speciesKey.charAt(0).toUpperCase() + removed.speciesKey.slice(1)}** (Lv.${removed.level}) was removed from your team.\n*They're still trained — you can re-add them anytime!*`
            ),
        ],
      });
    }

    // ─── SUBCOMMAND: LIST (all trained, not just team) ───────────────
    if (sub === 'list') {
      const trained = await database.getTrainedPokemon(message.author.id);
      if (trained.length === 0) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(colors.warning)
              .setTitle('(・_・ヾ No trained Pokémon yet!')
              .setDescription('Train one from your Zoo with `Kpteam add <pokemon>`'),
          ],
        });
      }

      const currentTeam = await database.getPokemonTeam(message.author.id);
      const teamIds = new Set(currentTeam.map((p) => p._id.toString()));

      const lines = [];
      for (const p of trained) {
        const baseStats = await PokemonBattleService.getBaseStats(p.speciesKey);
        const typeEmoji = baseStats ? PokemonBattleService.getTypeEmojis(baseStats.types) : '❓';
        const inTeam = teamIds.has(p._id.toString()) ? ' ⚔️' : '';
        lines.push(
          `${typeEmoji} **${p.speciesKey.charAt(0).toUpperCase() + p.speciesKey.slice(1)}** — Lv.${p.level}${inTeam}`
        );
      }

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle(`📋 ${message.author.username}'s Trained Pokémon`)
            .setDescription(lines.join('\n'))
            .setFooter({ text: `${trained.length} trained | ⚔️ = In battle team` }),
        ],
      });
    }

    // ─── DEFAULT: SHOW CURRENT TEAM ──────────────────────────────────
    const currentTeam = await database.getPokemonTeam(message.author.id);

    if (currentTeam.length === 0) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.warning)
            .setTitle('(・_・ヾ Your battle team is empty!')
            .setDescription(
              [
                'You need to train Pokémon from your Zoo first!',
                '',
                '**Step 1:** Catch Pokémon with `Khunt`',
                '**Step 2:** Train them with `Kpteam add <pokemon>`',
                '**Step 3:** Battle with `Kwild` or `Kduel @user`!',
              ].join('\n')
            ),
        ],
      });
    }

    const teamLines = [];
    for (let i = 0; i < currentTeam.length; i++) {
      const p = currentTeam[i];
      const baseStats = await PokemonBattleService.getBaseStats(p.speciesKey);
      const typeDisplay = baseStats
        ? baseStats.types
            .map(
              (t) =>
                `${PokemonBattleService.getTypeEmoji(t)} ${t.charAt(0).toUpperCase() + t.slice(1)}`
            )
            .join(' / ')
        : 'Unknown';

      const bp = baseStats ? await PokemonBattleService.buildBattlePokemon(p, 'A') : null;

      teamLines.push(
        [
          `**Slot ${i + 1}:** ${p.speciesKey.charAt(0).toUpperCase() + p.speciesKey.slice(1)}`,
          `  Type: ${typeDisplay}`,
          `  Level: **${p.level}** | HP: **${bp?.maxHp || '?'}** | ATK: **${bp?.atk || '?'}** | DEF: **${bp?.def || '?'}** | SPD: **${bp?.speed || '?'}**`,
        ].join('\n')
      );
    }

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(colors.primary)
          .setTitle(`⚔️ ${message.author.username}'s Battle Team`)
          .setDescription(teamLines.join('\n\n'))
          .setFooter({
            text: `${currentTeam.length}/${config.pokemonBattle.maxTeamSize} slots | Kpteam add/remove/list`,
          }),
      ],
    });
  },
};
