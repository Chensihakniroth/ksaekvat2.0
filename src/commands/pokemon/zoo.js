const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, MessageFlags } = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const AnimalService = require('../../services/AnimalService.js').default || require('../../services/AnimalService.js');
const EconomyService = require('../../services/EconomyService').default || require('../../services/EconomyService');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const sharp = require('sharp');

const TEMP_DIR = path.join(__dirname, '..', '..', '.tmp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// ─── Rarity theme map ─────────────────────────────────────────────────────────
const RARITY_COLORS = {
  priceless: { hex: '#FFD700', r: 255, g: 215, b: 0 },
  mythical: { hex: '#FF4FB0', r: 255, g: 79, b: 176 },
  legendary: { hex: '#FF8C00', r: 255, g: 140, b: 0 },
  epic:      { hex: '#9932CC', r: 153, g: 50,  b: 204 },
  rare: { hex: '#0099FF', r: 0, g: 153, b: 255 },
  uncommon: { hex: '#00CC66', r: 0, g: 204, b: 102 },
  common: { hex: '#888888', r: 136, g: 136, b: 136 },
};

const RARITY_ORDER = ['priceless', 'mythical', 'legendary', 'epic', 'rare', 'uncommon', 'common'];

function getRarityColor(rarity) {
  return RARITY_COLORS[rarity] || RARITY_COLORS.common;
}

// ─── PC Box image builder (space theme) ───────────────────────────────────────
async function createPCBoxImage(boxName, boxPokemons) {
  const cols = 6;
  const rows = 5;
  const cellSize = 96;
  const padding = 18;
  const headerHeight = 72;
  const canvasWidth = padding * 2 + cols * cellSize;
  const canvasHeight = headerHeight + padding + rows * cellSize + padding;

  // ── Background: deep space navy with grid cells ──
  const bgSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0d101e"/>
        <stop offset="100%" stop-color="#060912"/>
      </linearGradient>
      <linearGradient id="hdr" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#1a2750"/>
        <stop offset="100%" stop-color="#102040"/>
      </linearGradient>
    </defs>

    <!-- Background -->
    <rect width="${canvasWidth}" height="${canvasHeight}" rx="16" ry="16" fill="url(#bg)"/>
    <!-- Border glow -->
    <rect x="2" y="2" width="${canvasWidth - 4}" height="${canvasHeight - 4}" rx="14" ry="14"
          fill="none" stroke="#3a5fc8" stroke-width="2" opacity="0.7"/>

    <!-- Header bar -->
    <rect x="12" y="10" width="${canvasWidth - 24}" height="50" rx="10" ry="10" fill="url(#hdr)"/>
    <text x="${canvasWidth / 2}" y="43" font-family="'Courier New',monospace" font-size="20"
          font-weight="bold" fill="#88aaff" text-anchor="middle" letter-spacing="4">${boxName}</text>

    <!-- PC icon accent -->
    <text x="30" y="44" font-family="sans-serif" font-size="22" fill="#5577cc">💻</text>

    <!-- Grid cells -->
    ${Array.from({ length: rows }).map((_, r) =>
    Array.from({ length: cols }).map((_, c) => {
      const cx = padding + c * cellSize;
      const cy = headerHeight + padding + r * cellSize;
      return `<rect x="${cx + 3}" y="${cy + 3}" width="${cellSize - 6}" height="${cellSize - 6}"
                      rx="10" ry="10" fill="#111827" stroke="#1e2d4a" stroke-width="1.5" opacity="0.9"/>`;
    }).join('')
  ).join('')}
  </svg>`);

  const composites = [{ input: bgSvg, top: 0, left: 0 }];

  for (let i = 0; i < Math.min(boxPokemons.length, 30); i++) {
    const pkmn = boxPokemons[i];
    if (!pkmn) continue;

    const r = Math.floor(i / cols);
    const c = i % cols;
    const cx = padding + c * cellSize;
    const cy = headerHeight + padding + r * cellSize;
    const rc = getRarityColor(pkmn.rarity);

    // Rarity glow ring
    const glowSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cellSize - 6}" height="${cellSize - 6}">
      <rect x="0" y="0" width="${cellSize - 6}" height="${cellSize - 6}" rx="10" ry="10"
            fill="none" stroke="rgb(${rc.r},${rc.g},${rc.b})" stroke-width="2" opacity="0.55"/>
    </svg>`);
    composites.push({ input: glowSvg, top: cy + 3, left: cx + 3 });

    // Sprite
    try {
      const spriteUrl = await AnimalService.getPokemonSprite(pkmn.key);
      if (spriteUrl) {
        const resp = await axios.get(spriteUrl, { responseType: 'arraybuffer', timeout: 4000 });
        const imgBuffer = Buffer.from(resp.data);
        // Resize AND extend so every sprite is exactly the same canvas size
        const SPRITE_SIZE = cellSize - 22;
        const resized = await sharp(imgBuffer)
          .resize(SPRITE_SIZE, SPRITE_SIZE, {
            fit: 'contain',
            withoutEnlargement: false,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .toBuffer();
        const { width: rw, height: rh } = await sharp(resized).metadata();
        const padTop  = Math.floor((SPRITE_SIZE - rh) / 2);
        const padLeft = Math.floor((SPRITE_SIZE - rw) / 2);
        const layer = await sharp(resized)
          .extend({
            top:    Math.max(0, padTop),
            bottom: Math.max(0, SPRITE_SIZE - rh - padTop),
            left:   Math.max(0, padLeft),
            right:  Math.max(0, SPRITE_SIZE - rw - padLeft),
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .toBuffer();
        composites.push({ input: layer, top: cy + 11, left: cx + 11 });
      }
    } catch (e) {
      console.warn('Sprite fetch failed:', pkmn.key, e.message);
    }

    // Count badge
    if (pkmn.count > 1) {
      const badge = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cellSize - 6}" height="${cellSize - 6}">
        <rect x="${cellSize - 34}" y="${cellSize - 28}" width="28" height="18" rx="6" ry="6" fill="#e63946"/>
        <text x="${cellSize - 20}" y="${cellSize - 16}" font-family="sans-serif" font-size="11"
              font-weight="bold" fill="#fff" text-anchor="middle">×${pkmn.count}</text>
      </svg>`);
      composites.push({ input: badge, top: cy + 3, left: cx + 3 });
    }
  }

  const outPath = path.join(TEMP_DIR, `box-${Date.now()}-${Math.floor(Math.random() * 9999)}.png`);
  await sharp({
    create: { width: canvasWidth, height: canvasHeight, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  }).composite(composites).png().toFile(outPath);
  return outPath;
}

// ─── Build rarity breakdown string ────────────────────────────────────────────
function buildRarityBreakdown(allCaught) {
  const counts = {};
  for (const p of allCaught) {
    counts[p.rarity] = (counts[p.rarity] || 0) + 1;
  }

  const emojiMap = {
    priceless: '✨',
    mythical: '🌸',
    legendary: '🔥',
    epic: '💜',
    rare: '💙',
    uncommon: '💚',
    common: '⬜',
  };

  return RARITY_ORDER
    .filter(r => counts[r])
    .map(r => `${emojiMap[r]} **${counts[r]}** ${r.charAt(0).toUpperCase() + r.slice(1)}`)
    .join('  •  ');
}

// ─── Determine embed accent color from highest rarity owned ───────────────────
function pickEmbedColor(allCaught) {
  for (const r of RARITY_ORDER) {
    if (allCaught.some(p => p.rarity === r)) {
      return getRarityColor(r).hex;
    }
  }
  return '#3a5fc8';
}

// ─── Command ─────────────────────────────────────────────────────────────────
module.exports = {
  name: 'zoo',
  aliases: ['collection', 'animals', 'pokemon', 'pc', 'box'],
  description: 'Access your Pokémon PC Storage 💻✨',
  usage: 'zoo [@user]',
  async execute(message, args, client) {
    let target = message.author;
    if (message.mentions.users.size > 0) target = message.mentions.users.first();
    else if (args.length > 0) {
      const userId = args[0].replace(/[<@!>]/g, '');
      const found = client.users.cache.get(userId);
      if (found) target = found;
    }

    try { await message.channel.sendTyping(); } catch (_) { }

    const userData = await database.getUser(target.id, target.username);
    const animalsData = await database.loadAnimals();
    const userAnimals = userData.animals || {};

    const { totalAnimals, totalValue, rarityStats } = AnimalService.calculateZooStats(userAnimals, animalsData);

    if (totalAnimals === 0) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.warning)
            .setDescription(`Oh darling~ (｡•́︿•̀｡)\n**${target.username}** hasn't caught any Pokémon yet! Use \`Khunt\` to start your collection!`)
        ]
      });
    }

    // ── Flatten ALL caught Pokémon (no Kanto-only filter!) ──────────────────
    const allCaught = [];
    const rarityEntries = userAnimals instanceof Map ? userAnimals.entries() : Object.entries(userAnimals);

    for (const [rarity, animalsMap] of rarityEntries) {
      const entries = animalsMap instanceof Map ? animalsMap.entries() : Object.entries(animalsMap);
      for (const [key, count] of entries) {
        const def = animalsData[rarity]?.[key];
        if (count > 0 && def) {
          allCaught.push({
            key,
            name: def.name,
            rarity,
            weight: config.hunting.rarities[rarity]?.weight ?? 50,
            val: def.value,
            count: Number(count),
          });
        }
      }
    }

    // Sort: rarest first, then alphabetical
    allCaught.sort((a, b) => a.weight - b.weight || a.name.localeCompare(b.name));

    const chunk = (arr, size) =>
      Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));
    const boxes = chunk(allCaught, 30);

    const embedColor = pickEmbedColor(allCaught);
    const rarityBreakdown = buildRarityBreakdown(allCaught);

    let currentBox = 0;

    const generatePCMessage = async (boxIndex) => {
      const boxLabel = `PC BOX ${boxIndex + 1}`;
      const imgPath = await createPCBoxImage(boxLabel, boxes[boxIndex]);

      const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle(`💻  Pokémon PC Storage  —  ${target.username}`)
        .setDescription(
          `📦 **Pokémon Caught:** ${allCaught.length}  •  🔢 **Total Copies:** ${totalAnimals}\n\n${rarityBreakdown}`
        )
        .setImage('attachment://pc-box.png')
        .setFooter({ text: `${boxLabel}  •  Box ${boxIndex + 1} / ${boxes.length}  •  Net Worth: ${EconomyService.format(totalValue)} coins` })
        .setTimestamp();

      // Badge row only on page 1
      if (boxIndex === 0) {
        const badges = AnimalService.calculateBadges(userData.stats?.totalAnimalsFound || 0, totalValue, userAnimals);
        if (badges.length > 0) {
          embed.addFields({ name: '🏅 Badges', value: badges.join('  |  '), inline: false });
        }
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('zoo_prev')
          .setLabel('◀  Prev')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(boxIndex === 0),
        new ButtonBuilder()
          .setCustomId('zoo_next')
          .setLabel('Next  ▶')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(boxIndex === boxes.length - 1),
      );

      const files = [new AttachmentBuilder(imgPath, { name: 'pc-box.png' })];
      const components = boxes.length > 1 ? [row] : [];
      return { embed, files, components, imgPath };
    };

    const payload = await generatePCMessage(currentBox);
    const msg = await message.reply({ embeds: [payload.embed], files: payload.files, components: payload.components });
    if (payload.imgPath) fs.unlink(payload.imgPath, () => { });

    if (boxes.length > 1) {
      const collector = msg.createMessageComponentCollector({ time: 120_000 });

      collector.on('collect', async (i) => {
        if (i.user.id !== message.author.id) {
          return i.reply({ content: "Hands off, darling! (っ˘ω˘ς) This PC belongs to someone else!", flags: [MessageFlags.Ephemeral] });
        }
        if (i.customId === 'zoo_prev' && currentBox > 0) currentBox--;
        else if (i.customId === 'zoo_next' && currentBox < boxes.length - 1) currentBox++;

        await i.deferUpdate();
        const newPayload = await generatePCMessage(currentBox);
        await msg.edit({ embeds: [newPayload.embed], files: newPayload.files, components: newPayload.components });
        if (newPayload.imgPath) fs.unlink(newPayload.imgPath, () => { });
      });

      collector.on('end', () => msg.edit({ components: [] }).catch(() => { }));
    }

    await database.updateStats(message.author.id, 'command');
  },
};
