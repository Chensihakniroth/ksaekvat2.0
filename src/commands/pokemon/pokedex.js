const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const AnimalService = require('../../services/AnimalService.js').default || require('../../services/AnimalService.js');

// ─── Pokémon type emoji map ───────────────────────────────────────────────────
const TYPE_EMOJI = {
  normal:   '⬜', fire:     '🔥', water:    '💧', electric: '⚡',
  grass:    '🌿', ice:      '❄️', fighting: '🥊', poison:   '☠️',
  ground:   '🌍', flying:   '🦅', psychic:  '🔮', bug:      '🐛',
  rock:     '🪨', ghost:    '👻', dragon:   '🐉', dark:     '🌑',
  steel:    '⚙️', fairy:    '🌸',
};

const TYPE_COLORS = {
  normal:   '#A8A77A', fire:     '#EE8130', water:    '#6390F0', electric: '#F7D02C',
  grass:    '#7AC74C', ice:      '#96D9D6', fighting: '#C22E28', poison:   '#A33EA1',
  ground:   '#E2BF65', flying:   '#A98FF3', psychic:  '#F95587', bug:      '#A6B91A',
  rock:     '#B6A136', ghost:    '#735797', dragon:   '#6F35FC', dark:     '#705746',
  steel:    '#B7B7CE', fairy:    '#D685AD',
};

// ─── Rarity display ───────────────────────────────────────────────────────────
const RARITY_EMOJIS = {
  priceless: '✨ Priceless',
  mythical:  '🌸 Mythical',
  legendary: '🔥 Legendary',
  epic:      '💜 Epic',
  rare:      '💙 Rare',
  uncommon:  '💚 Uncommon',
  common:    '⬜ Common',
};

const RARITY_ORDER = ['priceless', 'mythical', 'legendary', 'epic', 'rare', 'uncommon', 'common'];

// ─── Stat bar (block chars, max 15 blocks = 255 max stat) ────────────────────
function statBar(value, max = 255, length = 12) {
  const filled = Math.round((value / max) * length);
  const bar = '█'.repeat(filled) + '░'.repeat(length - filled);
  return `\`${bar}\` **${value}**`;
}

// ─── Fetch Pokémon data from PokéAPI via pokedex-promise-v2 ──────────────────
// We access the underlying P instance from AnimalService via getPokemonByName
let _P = null;
async function getPData(name) {
  // Use AnimalService's internal pokedex if available, otherwise re-create
  if (!_P) {
    const Pokedex = require('pokedex-promise-v2');
    const PokedexClass = Pokedex.default || Pokedex;
    _P = new PokedexClass();
  }
  return await _P.getPokemonByName(name.toLowerCase());
}

async function getSpeciesData(id) {
  if (!_P) {
    const Pokedex = require('pokedex-promise-v2');
    const PokedexClass = Pokedex.default || Pokedex;
    _P = new PokedexClass();
  }
  return await _P.getPokemonSpeciesById(id);
}

// ─── Build the wiki embed for one Pokémon ────────────────────────────────────
async function buildPokedexEmbed(target, pkmnEntry, userAnimals, animalsData, index, total) {
  const { key, name, rarity, count } = pkmnEntry;

  let pokeData = null;
  let speciesData = null;

  try { pokeData = await getPData(key === 'shinycharizard' ? 'charizard' : key); } catch (_) {}
  try { if (pokeData) speciesData = await getSpeciesData(pokeData.id); } catch (_) {}

  const primaryType = pokeData?.types?.[0]?.type?.name || 'normal';
  const types = pokeData?.types?.map(t =>
    `${TYPE_EMOJI[t.type.name] || '❔'} ${t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1)}`
  ).join('  ') || '—';

  const embedColor = TYPE_COLORS[primaryType] || '#5080d0';

  // Pokédex flavor text (first English entry)
  let flavorText = '*No data available.*';
  if (speciesData?.flavor_text_entries) {
    const entry = speciesData.flavor_text_entries.find(e => e.language.name === 'en');
    if (entry) flavorText = entry.flavor_text.replace(/\n|\f/g, ' ');
  }

  const dexNum = pokeData ? `#${String(pokeData.id).padStart(3, '0')}` : '#???';
  const heightM = pokeData ? `${(pokeData.height / 10).toFixed(1)} m` : '—';
  const weightKg = pokeData ? `${(pokeData.weight / 10).toFixed(1)} kg` : '—';

  const rarityDisplay = RARITY_EMOJIS[rarity] || rarity;

  // Stat block
  let statsText = '*No stats data.*';
  if (pokeData?.stats) {
    const statNames = { hp: 'HP', attack: 'ATK', defense: 'DEF', 'special-attack': 'SpA', 'special-defense': 'SpD', speed: 'SPD' };
    statsText = pokeData.stats.map(s => {
      const label = statNames[s.stat.name] || s.stat.name.toUpperCase();
      return `\`${label.padEnd(3)}\` ${statBar(s.base_stat)}`;
    }).join('\n');
  }

  const isShiny = key === 'shinycharizard';
  const imageUrl = await AnimalService.getPokemonImage(key);

  const embed = new EmbedBuilder()
    .setColor(embedColor)
    .setTitle(`📖  ${dexNum}  ${name}${isShiny ? '  ✨ Shiny' : ''}`)
    .setDescription(`*${flavorText}*`)
    .addFields(
      { name: '🏷️ Type',   value: types,         inline: true },
      { name: '⭐ Rarity', value: rarityDisplay,  inline: true },
      { name: '📦 Owned',  value: `**${count}×** caught`, inline: true },
      { name: '📏 Height', value: heightM,        inline: true },
      { name: '⚖️ Weight', value: weightKg,       inline: true },
      { name: '💰 Value',  value: `${config.hunting.rarities[rarity]?.value?.toLocaleString() ?? '?'} coins`, inline: true },
      { name: '📊 Base Stats', value: statsText,  inline: false },
    )
    .setFooter({ text: `${target.username}'s Pokédex  •  ${index + 1} / ${total}  •  PokéAPI` })
    .setTimestamp();

  if (imageUrl) embed.setThumbnail(imageUrl);

  return embed;
}

// ─── Command ──────────────────────────────────────────────────────────────────
module.exports = {
  name: 'pokedex',
  aliases: ['pdex', 'pkdex', 'dex', 'pinfo'],
  description: 'View your personal Pokédex — a full wiki entry for each Pokémon you own! 📖',
  usage: 'pokedex [pokemon name]',
  async execute(message, args, client) {
    let target = message.author;
    if (message.mentions.users.size > 0) target = message.mentions.users.first();

    try { await message.channel.sendTyping(); } catch (_) {}

    const userData    = await database.getUser(target.id, target.username);
    const animalsData = await database.loadAnimals();
    const userAnimals = userData.animals || {};

    // Flatten all caught Pokémon (same logic as kzoo)
    const allCaught = [];
    const rarityEntries = userAnimals instanceof Map ? userAnimals.entries() : Object.entries(userAnimals);
    for (const [rarity, animalsMap] of rarityEntries) {
      const entries = animalsMap instanceof Map ? animalsMap.entries() : Object.entries(animalsMap);
      for (const [key, count] of entries) {
        const def = animalsData[rarity]?.[key];
        if (count > 0 && def) {
          allCaught.push({ key, name: def.name, rarity, count: Number(count) });
        }
      }
    }

    if (allCaught.length === 0) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.warning)
            .setDescription(`(｡•́︿•̀｡) **${target.username}** has no Pokémon yet! Use \`Khunt\` to start catching~`),
        ],
      });
    }

    // Sort: rarest first, then alphabetical
    const RARITY_WEIGHT = {};
    RARITY_ORDER.forEach((r, i) => (RARITY_WEIGHT[r] = i));
    allCaught.sort((a, b) =>
      (RARITY_WEIGHT[a.rarity] ?? 99) - (RARITY_WEIGHT[b.rarity] ?? 99) || a.name.localeCompare(b.name)
    );

    // If a specific name was given, jump to it
    let startIndex = 0;
    if (args.length > 0) {
      const query = args.join(' ').toLowerCase();
      const found = allCaught.findIndex(p => p.key.toLowerCase() === query || p.name.toLowerCase().includes(query));
      if (found !== -1) startIndex = found;
      else {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(colors.warning)
              .setDescription(`(¯\\_(ツ)_/¯) Couldn't find **${args.join(' ')}** in ${target.username}'s collection!`),
          ],
        });
      }
    }

    let currentIndex = startIndex;
    const waitMsg = await message.reply({ content: '📖 Loading Pokédex entry...' });

    const embed = await buildPokedexEmbed(target, allCaught[currentIndex], userAnimals, animalsData, currentIndex, allCaught.length);

    const buildRow = (idx) => new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('pdex_prev')
        .setLabel('◀  Prev')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(idx === 0),
      new ButtonBuilder()
        .setCustomId('pdex_next')
        .setLabel('Next  ▶')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(idx === allCaught.length - 1),
    );

    await waitMsg.edit({
      content: null,
      embeds: [embed],
      components: allCaught.length > 1 ? [buildRow(currentIndex)] : [],
    });

    if (allCaught.length > 1) {
      const collector = waitMsg.createMessageComponentCollector({ time: 120_000 });

      collector.on('collect', async (i) => {
        if (i.user.id !== message.author.id) {
          return i.reply({ content: "That's not your Pokédex, darling! (っ˘ω˘ς)", flags: [MessageFlags.Ephemeral] });
        }
        if (i.customId === 'pdex_prev' && currentIndex > 0) currentIndex--;
        else if (i.customId === 'pdex_next' && currentIndex < allCaught.length - 1) currentIndex++;

        await i.deferUpdate();
        try { await waitMsg.edit({ content: '📖 Loading...' }); } catch (_) {}
        const newEmbed = await buildPokedexEmbed(target, allCaught[currentIndex], userAnimals, animalsData, currentIndex, allCaught.length);
        await waitMsg.edit({ content: null, embeds: [newEmbed], components: [buildRow(currentIndex)] });
      });

      collector.on('end', () => waitMsg.edit({ components: [] }).catch(() => {}));
    }

    await database.updateStats(message.author.id, 'command');
  },
};
