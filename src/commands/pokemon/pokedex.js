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

async function buildPokedexEmbed(target, pkmnEntry, userAnimals, animalsData, index, total, client) {
  const { key, name, rarity, count } = pkmnEntry;
  const { getRarityEmoji } = require('../../utils/images.js');
  const rarityEmoji = getRarityEmoji(rarity, client);

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
  const imgData = await AnimalService.getPokemonImageBuffer(key);
  const files = [];

  const embed = new EmbedBuilder()
    .setColor(embedColor)
    .setTitle(`${rarityEmoji} ${name}${isShiny ? ' ✨' : ''}`)
    .setDescription(`*${flavorText}*`)
    .addFields(
      { name: '🏷️ Type', value: types, inline: true },
      { name: '⭐ Rarity', value: `${rarityEmoji} ${rarity.charAt(0).toUpperCase() + rarity.slice(1)}`, inline: true },
      { name: '📦 Owned', value: `**${count}×** caught`, inline: true },
      { name: '📏 Height', value: heightM, inline: true },
      { name: '⚖️ Weight', value: weightKg, inline: true },
      { name: '💰 Value', value: `${config.hunting.rarities[rarity]?.value?.toLocaleString() ?? '?'} coins`, inline: true },
      { name: '📊 Base Stats', value: statsText, inline: false },
    )
    .setFooter({ text: `${target.username}'s Pokédex  •  ${index + 1} / ${total}  •  PokéAPI` })
    .setTimestamp();

  if (imgData) {
    const attachment = new (require('discord.js').AttachmentBuilder)(imgData.buffer, { name: imgData.fileName });
    embed.setThumbnail(`attachment://${imgData.fileName}`);
    files.push(attachment);
  }
  return { embed, files };
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
    const flatRegistry = await database.getAnimalRegistry();
    
    const animalsObj = userDoc.animals || {};
    
    // Build a map of caught counts
    const caughtCounts = {};
    const rarityEntries = animalsObj instanceof Map ? animalsObj.entries() : Object.entries(animalsObj);
    for (const [rarity, animalCounts] of rarityEntries) {
      const animalEntries = animalCounts instanceof Map ? animalCounts.entries() : Object.entries(animalCounts || {});
      for (const [key, count] of animalEntries) {
        if (Number(count) > 0) caughtCounts[key] = Number(count);
      }
    }

    const allPokemon = [];
    for (const [key, def] of Object.entries(flatRegistry)) {
       allPokemon.push({
         key,
         name: def.name,
         rarity: def.rarity,
         emoji: def.emoji || '🐾',
         count: caughtCounts[key] || 0,
         caught: !!caughtCounts[key]
       });
    }

    const RW = {}; RARITY_ORDER.forEach((r, i) => RW[r] = i);
    allPokemon.sort((a, b) => (RW[a.rarity] ?? 99) - (RW[b.rarity] ?? 99) || a.name.localeCompare(b.name));

    const totalCaught = allPokemon.filter(p => p.caught).length;
    const totalCount = allPokemon.length;
    const percent = totalCount > 0 ? ((totalCaught / totalCount) * 100).toFixed(1) : '0.0';

    if (args.length > 0 && !message.mentions.users.has(args[0].replace(/[<@!>]/g, ''))) {
      // Detailed View Mode
      let qArgs = args;
      if (message.mentions.users.size > 0) {
         qArgs = args.filter(a => !a.startsWith('<@'));
      }
      if (qArgs.length > 0) {
        const q = qArgs.join(' ').toLowerCase();
        const found = allPokemon.find(p => p.key.toLowerCase() === q || p.name.toLowerCase().includes(q));
        if (!found) {
          return message.reply({ embeds: [new EmbedBuilder().setColor(colors.warning).setDescription(`(¯\\_(ツ)_/¯) Couldn't find **${q}** in the region's database!`)] });
        }

        if (!found.caught && target.id === message.author.id) {
           const { getRarityEmoji } = require('../../utils/images.js');
           const embed = new EmbedBuilder()
             .setColor('#2C2F33')
             .setTitle(`${getRarityEmoji(found.rarity, client)} ??????`)
             .setDescription(`*No data available. This Pokémon has not been registered in your Pokédex.*`)
             .addFields(
               { name: '⭐ Rarity', value: `${getRarityEmoji(found.rarity, client)} ${found.rarity.charAt(0).toUpperCase() + found.rarity.slice(1)}`, inline: true },
               { name: '📦 Owned', value: `**0×** caught`, inline: true },
             )
             .setFooter({ text: `${target.username}'s Pokédex  •  Unregistered` })
             .setTimestamp();
           return message.reply({ embeds: [embed] });
        } else if (!found.caught) {
           return message.reply({ embeds: [new EmbedBuilder().setColor(colors.warning).setDescription(`(¯\\_(ツ)_/¯) **${target.username}** hasn't caught **${found.name}** yet!`)] });
        }

        const msg = await message.reply({ content: '📖 Loading Pokédex entry...' });
        const { embed, files } = await buildPokedexEmbed(target, found, animalsObj, animalsData, 0, totalCaught, client);
        return msg.edit({ content: null, embeds: [embed], files });
      }
    }

    // List View Mode
    const PAGE_SIZE = 15;
    const maxPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
    let currentPage = 0;

    const generatePageEmbed = (page) => {
      const start = page * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      const items = allPokemon.slice(start, end);

      const description = items.map((p, idx) => {
        const num = String(start + idx + 1).padStart(3, '0');
        if (p.caught) {
          return `\`#${num}\` ${p.emoji} **${p.name}** \`[${p.rarity.toUpperCase()}]\` — ${p.count}×`;
        } else {
          return `\`#${num}\` ❔ **???????** \`[${p.rarity.toUpperCase()}]\` — Uncaught`;
        }
      }).join('\n');

      return new EmbedBuilder()
        .setColor(colors.primary || 0x0099ff)
        .setTitle(`📖 ${target.username}'s Pokédex Logbook`)
        .setDescription(`**Progress:** ${totalCaught} / ${totalCount} (${percent}%)\n\n${description}`)
        .setFooter({ text: `Page ${page + 1} of ${maxPages}` });
    };

    const msg = await message.reply({
      embeds: [generatePageEmbed(currentPage)],
      components: maxPages > 1 ? [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('pdex_prev').setLabel('◀  Prev').setStyle(ButtonStyle.Secondary).setDisabled(true),
          new ButtonBuilder().setCustomId('pdex_next').setLabel('Next  ▶').setStyle(ButtonStyle.Secondary).setDisabled(maxPages === 1),
        )
      ] : []
    });

    if (maxPages > 1) {
      const collector = msg.createMessageComponentCollector({ time: 60_000 });
      collector.on('collect', async (i) => {
        if (i.user.id !== message.author.id) return i.reply({ content: "That's not yours! (っ˘ω˘ς)", flags: [MessageFlags.Ephemeral] });
        if (i.customId === 'pdex_prev' && currentPage > 0) currentPage--;
        else if (i.customId === 'pdex_next' && currentPage < maxPages - 1) currentPage++;
        await i.deferUpdate();
        await msg.edit({
          embeds: [generatePageEmbed(currentPage)],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId('pdex_prev').setLabel('◀  Prev').setStyle(ButtonStyle.Secondary).setDisabled(currentPage === 0),
              new ButtonBuilder().setCustomId('pdex_next').setLabel('Next  ▶').setStyle(ButtonStyle.Secondary).setDisabled(currentPage === maxPages - 1),
            )
          ]
        });
      });
      collector.on('end', () => msg.edit({ components: [] }).catch(() => {}));
    }
    
    await database.updateStats(message.author.id, 'command');
  },
};
