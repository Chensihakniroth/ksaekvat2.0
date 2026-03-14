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

function statBar(value, max = 255, length = 12) {
  const filled = Math.round((value / max) * length);
  const bar = '█'.repeat(filled) + '░'.repeat(length - filled);
  return `\`${bar}\` **${value}**`;
}

let _P = null;
async function getPData(name) {
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

async function buildPokedexEmbed(target, pkmnEntry, userAnimals, animalsData, index, total) {
  const { key, name, rarity, count } = pkmnEntry;
  let pokeData = null, speciesData = null;
  try { pokeData = await getPData(key === 'shinycharizard' ? 'charizard' : key); } catch (_) {}
  try { if (pokeData) speciesData = await getSpeciesData(pokeData.id); } catch (_) {}

  const primaryType = pokeData?.types?.[0]?.type?.name || 'normal';
  const types = pokeData?.types?.map(t => `${TYPE_EMOJI[t.type.name] || '❔'} ${t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1)}`).join('  ') || '—';
  const embedColor = TYPE_COLORS[primaryType] || '#5080d0';

  let flavorText = '*No data available.*';
  if (speciesData?.flavor_text_entries) {
    const entry = speciesData.flavor_text_entries.find(e => e.language.name === 'en');
    if (entry) flavorText = entry.flavor_text.replace(/\n|\f/g, ' ');
  }

  const dexNum = pokeData ? `#${String(pokeData.id).padStart(3, '0')}` : '#???';
  const heightM = pokeData ? `${(pokeData.height / 10).toFixed(1)} m` : '—';
  const weightKg = pokeData ? `${(pokeData.weight / 10).toFixed(1)} kg` : '—';

  let statsText = '*No stats data.*';
  if (pokeData?.stats) {
    const statNames = { hp: 'HP', attack: 'ATK', defense: 'DEF', 'special-attack': 'SpA', 'special-defense': 'SpD', speed: 'SPD' };
    statsText = pokeData.stats.map(s => `\`${(statNames[s.stat.name] || s.stat.name.toUpperCase()).padEnd(3)}\` ${statBar(s.base_stat)}`).join('\n');
  }

  const isShiny = key === 'shinycharizard';
  const imageUrl = await AnimalService.getPokemonImage(key);

  const embed = new EmbedBuilder()
    .setColor(embedColor)
    .setTitle(`📖  ${dexNum}  ${name}${isShiny ? '  ✨ Shiny' : ''}`)
    .setDescription(`*${flavorText}*`)
    .addFields(
      { name: '🏷️ Type', value: types, inline: true },
      { name: '⭐ Rarity', value: RARITY_EMOJIS[rarity] || rarity, inline: true },
      { name: '📦 Owned', value: `**${count}×** caught`, inline: true },
      { name: '📏 Height', value: heightM, inline: true },
      { name: '⚖️ Weight', value: weightKg, inline: true },
      { name: '💰 Value', value: `${config.hunting.rarities[rarity]?.value?.toLocaleString() ?? '?'} coins`, inline: true },
      { name: '📊 Base Stats', value: statsText, inline: false },
    )
    .setFooter({ text: `${target.username}'s Pokédex  •  ${index + 1} / ${total}  •  PokéAPI` })
    .setTimestamp();

  if (imageUrl) embed.setThumbnail(imageUrl);
  return embed;
}

module.exports = {
  name: 'pokedex',
  aliases: ['pdex', 'pkdex', 'dex', 'pinfo'],
  description: 'View your personal Pokédex — a full wiki entry for each Pokémon you own! 📖',
  usage: 'pokedex [pokemon name]',
  async execute(message, args, client) {
    let target = message.author;
    if (message.mentions.users.size > 0) target = message.mentions.users.first();
    try { await message.channel.sendTyping(); } catch (_) {}

    const userDoc = await database.getUser(target.id, target.username);
    const animalsData = await database.loadAnimals();
    
    // Support both Map and plain objects for cross-compatibility! (｡♥‿♥｡)
    const animalsObj = userDoc.animals || {};

    const allCaught = [];
    const rarityEntries = animalsObj instanceof Map ? animalsObj.entries() : Object.entries(animalsObj);
    for (const [rarity, animalCounts] of rarityEntries) {
      const animalEntries = animalCounts instanceof Map ? animalCounts.entries() : Object.entries(animalCounts || {});
      for (const [key, count] of animalEntries) {
        const def = animalsData[rarity]?.[key];
        if (Number(count) > 0 && def) {
          allCaught.push({ key, name: def.name, rarity, count: Number(count) });
        }
      }
    }

    if (allCaught.length === 0) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(colors.warning).setDescription(`(｡•́︿•̀｡) **${target.username}** has no Pokémon yet! Use \`Khunt\` to start catching~`)] });
    }

    const RW = {}; RARITY_ORDER.forEach((r, i) => RW[r] = i);
    allCaught.sort((a, b) => (RW[a.rarity] ?? 99) - (RW[b.rarity] ?? 99) || a.name.localeCompare(b.name));

    let startIndex = 0;
    if (args.length > 0) {
      const q = args.join(' ').toLowerCase();
      const f = allCaught.findIndex(p => p.key.toLowerCase() === q || p.name.toLowerCase().includes(q));
      if (f !== -1) startIndex = f;
      else return message.reply({ embeds: [new EmbedBuilder().setColor(colors.warning).setDescription(`(¯\\_(ツ)_/¯) Couldn't find **${args.join(' ')}** in ${target.username}'s collection!`)] });
    }

    let current = startIndex;
    const msg = await message.reply({ content: '📖 Loading Pokédex entry...' });

    const createView = async (idx) => {
      const e = await buildPokedexEmbed(target, allCaught[idx], animalsObj, animalsData, idx, allCaught.length);
      const r = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('pdex_prev').setLabel('◀  Prev').setStyle(ButtonStyle.Secondary).setDisabled(idx === 0),
        new ButtonBuilder().setCustomId('pdex_next').setLabel('Next  ▶').setStyle(ButtonStyle.Secondary).setDisabled(idx === allCaught.length - 1),
      );
      return { embeds: [e], components: allCaught.length > 1 ? [r] : [] };
    };

    const initial = await createView(current);
    await msg.edit({ content: null, ...initial });

    if (allCaught.length > 1) {
      const collector = msg.createMessageComponentCollector({ time: 60_000 });
      collector.on('collect', async (i) => {
        if (i.user.id !== message.author.id) return i.reply({ content: "That's not yours! (っ˘ω˘ς)", flags: [MessageFlags.Ephemeral] });
        if (i.customId === 'pdex_prev' && current > 0) current--;
        else if (i.customId === 'pdex_next' && current < allCaught.length - 1) current++;
        await i.deferUpdate();
        const next = await createView(current);
        await msg.edit(next);
      });
      collector.on('end', () => msg.edit({ components: [] }).catch(() => {}));
    }
    await database.updateStats(message.author.id, 'command');
  },
};
