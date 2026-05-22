const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const AnimalService =
  require('../../services/AnimalService.js').default || require('../../services/AnimalService.js');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const TEMP_DIR = path.join(__dirname, '..', '..', '.tmp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// ─── Pokémon type emoji map ───────────────────────────────────────────────────
const TYPE_EMOJI = {
  normal: '⬜',
  fire: '🔥',
  water: '💧',
  electric: '⚡',
  grass: '🌿',
  ice: '❄️',
  fighting: '🥊',
  poison: '☠️',
  ground: '🌍',
  flying: '🦅',
  psychic: '🔮',
  bug: '🐛',
  rock: '🪨',
  ghost: '👻',
  dragon: '🐉',
  dark: '🌑',
  steel: '⚙️',
  fairy: '🌸',
};

const TYPE_COLORS = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  electric: '#F7D02C',
  grass: '#7AC74C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  dark: '#705746',
  steel: '#B7B7CE',
  fairy: '#D685AD',
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

async function buildPokedexEmbed(
  target,
  pkmnEntry,
  userAnimals,
  animalsData,
  index,
  total,
  client
) {
  const { key, name, rarity, count } = pkmnEntry;
  const { getRarityEmoji } = require('../../utils/images.js');
  const rarityEmoji = getRarityEmoji(rarity, client);

  let pokeData = null,
    speciesData = null;
  try {
    pokeData = await getPData(key === 'shinycharizard' ? 'charizard' : key);
  } catch (_) {}
  try {
    if (pokeData) speciesData = await getSpeciesData(pokeData.id);
  } catch (_) {}

  const primaryType = pokeData?.types?.[0]?.type?.name || 'normal';
  const types =
    pokeData?.types
      ?.map(
        (t) =>
          `${TYPE_EMOJI[t.type.name] || '❔'} ${t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1)}`
      )
      .join('  ') || '—';
  const embedColor = TYPE_COLORS[primaryType] || '#5080d0';

  let flavorText = '*No data available.*';
  if (speciesData?.flavor_text_entries) {
    const entry = speciesData.flavor_text_entries.find((e) => e.language.name === 'en');
    if (entry) flavorText = entry.flavor_text.replace(/\n|\f/g, ' ');
  }

  const dexNum = pokeData ? `#${String(pokeData.id).padStart(3, '0')}` : '#???';
  const heightM = pokeData ? `${(pokeData.height / 10).toFixed(1)} m` : '—';
  const weightKg = pokeData ? `${(pokeData.weight / 10).toFixed(1)} kg` : '—';

  let statsText = '*No stats data.*';
  if (pokeData?.stats) {
    const statNames = {
      hp: 'HP',
      attack: 'ATK',
      defense: 'DEF',
      'special-attack': 'SpA',
      'special-defense': 'SpD',
      speed: 'SPD',
    };
    statsText = pokeData.stats
      .map(
        (s) =>
          `\`${(statNames[s.stat.name] || s.stat.name.toUpperCase()).padEnd(3)}\` ${statBar(s.base_stat)}`
      )
      .join('\n');
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
      {
        name: '⭐ Rarity',
        value: `${rarityEmoji} ${rarity.charAt(0).toUpperCase() + rarity.slice(1)}`,
        inline: true,
      },
      { name: '📦 Owned', value: `**${count}×** caught`, inline: true },
      { name: '📏 Height', value: heightM, inline: true },
      { name: '⚖️ Weight', value: weightKg, inline: true },
      {
        name: '💰 Value',
        value: `${config.hunting.rarities[rarity]?.value?.toLocaleString() ?? '?'} coins`,
        inline: true,
      },
      { name: '📊 Base Stats', value: statsText, inline: false }
    )
    .setFooter({ text: `${target.username}'s Pokédex  •  ${index + 1} / ${total}  •  PokéAPI` })
    .setTimestamp();

  if (imgData) {
    const attachment = new (require('discord.js').AttachmentBuilder)(imgData.buffer, {
      name: imgData.fileName,
    });
    embed.setThumbnail(`attachment://${imgData.fileName}`);
    files.push(attachment);
  }
  return { embed, files };
}

// ─── Pokedex Visual Generator ──────────────────────────────────────────────────
async function createPokedexImage(pageLabel, pagePokemons, totalCaught, totalCount) {
  if (!pagePokemons || pagePokemons.length === 0) return null;

  const cols = 6;
  const rows = 5;
  const cellSize = 124;
  const padding = 18;
  const headerHeight = 72;
  const canvasWidth = padding * 2 + cols * cellSize;
  const canvasHeight = headerHeight + padding + rows * cellSize + padding;

  const bgSvg =
    Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#8a0f21"/>
        <stop offset="100%" stop-color="#4a040d"/>
      </linearGradient>
      <linearGradient id="hdr" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#590611"/>
        <stop offset="100%" stop-color="#3d0108"/>
      </linearGradient>
    </defs>
    <rect width="${canvasWidth}" height="${canvasHeight}" rx="16" ry="16" fill="url(#bg)"/>
    <rect x="2" y="2" width="${canvasWidth - 4}" height="${canvasHeight - 4}" rx="14" ry="14" fill="none" stroke="#ff4d4d" stroke-width="2" opacity="0.6"/>
    <rect x="12" y="10" width="${canvasWidth - 24}" height="50" rx="10" ry="10" fill="url(#hdr)"/>
    <text x="${canvasWidth / 2}" y="43" font-family="'Courier New',monospace" font-size="20" font-weight="bold" fill="#ff9999" text-anchor="middle" letter-spacing="4">${pageLabel}</text>
    <text x="30" y="44" font-family="sans-serif" font-size="22" fill="#ff4d4d">📖</text>
    <text x="${canvasWidth - 30}" y="42" font-family="sans-serif" font-size="16" font-weight="bold" fill="#ff9999" text-anchor="end">${totalCaught} / ${totalCount}</text>
    ${Array.from({ length: rows })
      .map((_, r) =>
        Array.from({ length: cols })
          .map((_, c) => {
            const cx = padding + c * cellSize;
            const cy = headerHeight + padding + r * cellSize;
            return `<rect x="${cx + 3}" y="${cy + 3}" width="${cellSize - 6}" height="${cellSize - 6}" rx="10" ry="10" fill="#111827" stroke="#330b13" stroke-width="1.5" opacity="0.9"/>`;
          })
          .join('')
      )
      .join('')}
    ${pagePokemons
      .map((pkmn, i) => {
        if (!pkmn.caught) return '';
        const r = Math.floor(i / cols);
        const c = i % cols;
        const cx = padding + c * cellSize;
        const cy = headerHeight + padding + r * cellSize;
        return `<rect x="${cx + 3}" y="${cy + 3}" width="${cellSize - 6}" height="${cellSize - 6}" rx="10" ry="10" fill="none" stroke="#ff4d4d" stroke-width="1.5" opacity="0.5"/>`;
      })
      .join('')}
  </svg>`);

  const fgSvg =
    Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}">
    ${pagePokemons
      .map((pkmn, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const cx = padding + c * cellSize;
        const cy = headerHeight + padding + r * cellSize;
        const displayName = pkmn.caught
          ? pkmn.name.length > 12
            ? pkmn.name.slice(0, 10) + '..'
            : pkmn.name
          : '??????';
        return `<text x="${cx + cellSize / 2}" y="${cy + cellSize - 15}" font-family="sans-serif" font-size="10" font-weight="bold" fill="${pkmn.caught ? '#fff' : '#4a5568'}" text-anchor="middle">${displayName.toUpperCase()}</text>`;
      })
      .join('')}
  </svg>`);

  const composites = [{ input: bgSvg, top: 0, left: 0 }];
  const spritePromises = pagePokemons.map(async (pkmn, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const cx = padding + c * cellSize;
    const cy = headerHeight + padding + r * cellSize;

    try {
      let buffer = null;
      if (pkmn.caught) {
        buffer = await AnimalService.getResizedSpriteBuffer(pkmn.key, cellSize - 6);
      } else {
        buffer = await AnimalService.getSilhouetteSpriteBuffer(pkmn.key, cellSize - 6);
      }

      if (buffer) {
        return { input: buffer, top: cy + 5, left: cx + 5 };
      }
    } catch (e) {
      console.error('Sprite render error for', pkmn.key, ':', e);
    }
    return null;
  });

  const results = await Promise.all(spritePromises);
  composites.push(...results.filter(Boolean));
  composites.push({ input: fgSvg, top: 0, left: 0 });

  const outPath = path.join(
    TEMP_DIR,
    `pokedex-${Date.now()}-${Math.floor(Math.random() * 9999)}.png`
  );
  await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toFile(outPath);
  return outPath;
}

module.exports = {
  name: 'pokedex',
  aliases: ['pdex', 'pkdex', 'dex', 'pinfo'],
  description: 'View your personal Pokédex — a full wiki entry for each Pokémon you own! 📖',
  usage: 'pokedex [pokemon name]',
  async execute(message, args, client) {
    let target = message.author;
    if (message.mentions.users.size > 0) target = message.mentions.users.first();
    try {
      await message.channel.sendTyping();
    } catch (_) {}

    const userDoc = await database.getUser(target.id, target.username);
    const animalsData = await database.loadAnimals();
    const flatRegistry = await database.getAnimalRegistry();

    const animalsObj = userDoc.animals || {};

    // Build a map of caught counts
    const caughtCounts = {};
    const rarityEntries =
      animalsObj instanceof Map ? animalsObj.entries() : Object.entries(animalsObj);
    for (const [rarity, animalCounts] of rarityEntries) {
      const animalEntries =
        animalCounts instanceof Map ? animalCounts.entries() : Object.entries(animalCounts || {});
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
        caught: !!caughtCounts[key],
      });
    }

    const RW = {};
    RARITY_ORDER.forEach((r, i) => (RW[r] = i));
    allPokemon.sort(
      (a, b) => (RW[a.rarity] ?? 99) - (RW[b.rarity] ?? 99) || a.name.localeCompare(b.name)
    );

    const totalCaught = allPokemon.filter((p) => p.caught).length;
    const totalCount = allPokemon.length;
    const percent = totalCount > 0 ? ((totalCaught / totalCount) * 100).toFixed(1) : '0.0';

    if (args.length > 0 && !message.mentions.users.has(args[0].replace(/[<@!>]/g, ''))) {
      // Detailed View Mode
      let qArgs = args;
      if (message.mentions.users.size > 0) {
        qArgs = args.filter((a) => !a.startsWith('<@'));
      }
      if (qArgs.length > 0) {
        const q = qArgs.join(' ').toLowerCase();
        const found = allPokemon.find(
          (p) => p.key.toLowerCase() === q || p.name.toLowerCase().includes(q)
        );
        if (!found) {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(colors.warning)
                .setDescription(`(¯\\_(ツ)_/¯) Couldn't find **${q}** in the region's database!`),
            ],
          });
        }

        if (!found.caught && target.id === message.author.id) {
          const { getRarityEmoji } = require('../../utils/images.js');
          const embed = new EmbedBuilder()
            .setColor('#2C2F33')
            .setTitle(`${getRarityEmoji(found.rarity, client)} ??????`)
            .setDescription(
              `*No data available. This Pokémon has not been registered in your Pokédex.*`
            )
            .addFields(
              {
                name: '⭐ Rarity',
                value: `${getRarityEmoji(found.rarity, client)} ${found.rarity.charAt(0).toUpperCase() + found.rarity.slice(1)}`,
                inline: true,
              },
              { name: '📦 Owned', value: `**0×** caught`, inline: true }
            )
            .setFooter({ text: `${target.username}'s Pokédex  •  Unregistered` })
            .setTimestamp();
          return message.reply({ embeds: [embed] });
        } else if (!found.caught) {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(colors.warning)
                .setDescription(
                  `(¯\\_(ツ)_/¯) **${target.username}** hasn't caught **${found.name}** yet!`
                ),
            ],
          });
        }

        const msg = await message.reply({ content: '📖 Loading Pokédex entry...' });
        const { embed, files } = await buildPokedexEmbed(
          target,
          found,
          animalsObj,
          animalsData,
          0,
          totalCaught,
          client
        );
        return msg.edit({ content: null, embeds: [embed], files });
      }
    }

    // List View Mode
    const PAGE_SIZE = 30;
    const maxPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
    let currentPage = 0;

    const { AttachmentBuilder } = require('discord.js');

    const generatePagePayload = async (page) => {
      const start = page * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      const items = allPokemon
        .slice(start, end)
        .map((p, idx) => ({ ...p, index: start + idx + 1 }));

      const imgPath = await createPokedexImage(`PAGE ${page + 1}`, items, totalCaught, totalCount);

      const embed = new EmbedBuilder()
        .setColor('#e63946')
        .setTitle(`📖 ${target.username}'s Pokédex Logbook`)
        .setImage('attachment://pokedex-page.png')
        .setFooter({
          text: `Page ${page + 1} of ${maxPages}  •  ${totalCaught} / ${totalCount} Caught`,
        });

      return {
        embeds: [embed],
        files: [new AttachmentBuilder(imgPath, { name: 'pokedex-page.png' })],
        imgPath,
      };
    };

    const payload = await generatePagePayload(currentPage);

    const msg = await message.reply({
      embeds: payload.embeds,
      files: payload.files,
      components:
        maxPages > 1
          ? [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId('pdex_prev')
                  .setLabel('◀  Prev')
                  .setStyle(ButtonStyle.Secondary)
                  .setDisabled(true),
                new ButtonBuilder()
                  .setCustomId('pdex_next')
                  .setLabel('Next  ▶')
                  .setStyle(ButtonStyle.Secondary)
                  .setDisabled(maxPages === 1)
              ),
            ]
          : [],
    });

    if (payload.imgPath) fs.unlink(payload.imgPath, () => {});

    if (maxPages > 1) {
      const collector = msg.createMessageComponentCollector({ time: 60_000 });
      collector.on('collect', async (i) => {
        if (i.user.id !== message.author.id)
          return i.reply({
            content: "That's not yours! (っ˘ω˘ς)",
            flags: [MessageFlags.Ephemeral],
          });
        if (i.customId === 'pdex_prev' && currentPage > 0) currentPage--;
        else if (i.customId === 'pdex_next' && currentPage < maxPages - 1) currentPage++;
        await i.deferUpdate();

        const nextPayload = await generatePagePayload(currentPage);

        await msg.edit({
          embeds: nextPayload.embeds,
          files: nextPayload.files,
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('pdex_prev')
                .setLabel('◀  Prev')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage === 0),
              new ButtonBuilder()
                .setCustomId('pdex_next')
                .setLabel('Next  ▶')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage === maxPages - 1)
            ),
          ],
        });
        if (nextPayload.imgPath) fs.unlink(nextPayload.imgPath, () => {});
      });
      collector.on('end', () => msg.edit({ components: [] }).catch(() => {}));
    }

    await database.updateStats(message.author.id, 'command');
  },
};
