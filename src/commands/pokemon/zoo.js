const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, MessageFlags } = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const AnimalService = require('../../services/AnimalService.js').default || require('../../services/AnimalService.js');
const EconomyService = require('../../services/EconomyService').default || require('../../services/EconomyService');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const logger = require('../../utils/logger.js');
const sharp = require('sharp');

const TEMP_DIR = path.join(__dirname, '..', '..', '.tmp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// ─── Rarity theme map ─────────────────────────────────────────────────────────
const RARITY_COLORS = {
  priceless:  { hex: '#FFD700', r: 255, g: 215, b: 0 },
  mythical:   { hex: '#FF4FB0', r: 255, g: 79,  b: 176 },
  legendary:  { hex: '#FF8C00', r: 255, g: 140, b: 0 },
  epic:       { hex: '#9932CC', r: 153, g: 50,  b: 204 },
  rare:       { hex: '#0099FF', r: 0,   g: 153, b: 255 },
  uncommon:   { hex: '#00CC66', r: 0,   g: 204, b: 102 },
  common:     { hex: '#888888', r: 136, g: 136, b: 136 },
};

const RARITY_ORDER = ['priceless', 'mythical', 'legendary', 'epic', 'rare', 'uncommon', 'common'];

function getRarityColor(rarity) {
  return RARITY_COLORS[rarity] || RARITY_COLORS.common;
}

// ─── PC Box image builder (space theme + pixel scaling) ───────────────────────
async function createPCBoxImage(boxName, boxPokemons) {
  if (!boxPokemons || boxPokemons.length === 0) return null;

  const cols = 6;
  const rows = 5;
  const cellSize = 124; // Bigger cells for HUGE sprites!
  const padding = 18;
  const headerHeight = 72;
  const canvasWidth = padding * 2 + cols * cellSize;
  const canvasHeight = headerHeight + padding + rows * cellSize + padding;

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
    <rect width="${canvasWidth}" height="${canvasHeight}" rx="16" ry="16" fill="url(#bg)"/>
    <rect x="2" y="2" width="${canvasWidth - 4}" height="${canvasHeight - 4}" rx="14" ry="14" fill="none" stroke="#3a5fc8" stroke-width="2" opacity="0.7"/>
    <rect x="12" y="10" width="${canvasWidth - 24}" height="50" rx="10" ry="10" fill="url(#hdr)"/>
    <text x="${canvasWidth / 2}" y="43" font-family="'Courier New',monospace" font-size="20" font-weight="bold" fill="#88aaff" text-anchor="middle" letter-spacing="4">${boxName}</text>
    <text x="30" y="44" font-family="sans-serif" font-size="22" fill="#5577cc">💻</text>
    ${Array.from({ length: rows }).map((_, r) =>
      Array.from({ length: cols }).map((_, c) => {
        const cx = padding + c * cellSize;
        const cy = headerHeight + padding + r * cellSize;
        return `<rect x="${cx + 3}" y="${cy + 3}" width="${cellSize - 6}" height="${cellSize - 6}" rx="10" ry="10" fill="#111827" stroke="#1e2d4a" stroke-width="1.5" opacity="0.9"/>`;
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
      <rect x="0" y="0" width="${cellSize - 6}" height="${cellSize - 6}" rx="10" ry="10" fill="none" stroke="rgb(${rc.r},${rc.g},${rc.b})" stroke-width="2" opacity="0.55"/>
    </svg>`);
    composites.push({ input: glowSvg, top: cy + 3, left: cx + 3 });

    try {
      const spriteUrl = await AnimalService.getPokemonSprite(pkmn.key);
      if (spriteUrl) {
        const resp = await axios.get(spriteUrl, { 
          responseType: 'arraybuffer', 
          timeout: 5000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://pokemon.fandom.com/'
          }
        });
        const imgBuffer = Buffer.from(resp.data);
        const SPRITE_SIZE = cellSize - 6; // Huge, fills the cell

        const resized = await sharp(imgBuffer)
          .resize(SPRITE_SIZE, SPRITE_SIZE, { 
            fit: 'contain', 
            background: { r: 0, g: 0, b: 0, alpha: 0 },
            kernel: 'nearest' // CRITICAL for sharp pixel scaling
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

        composites.push({ input: layer, top: cy + 5, left: cx + 5 });
      }
    } catch (e) {
      console.warn('PC Sprite scale failed:', pkmn.key, e.message);
    }

    if (pkmn.count > 1) {
      const badge = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cellSize - 6}" height="${cellSize - 6}">
        <rect x="${cellSize - 36}" y="${cellSize - 28}" width="30" height="18" rx="6" ry="6" fill="#e63946"/>
        <text x="${cellSize - 21}" y="${cellSize - 16}" font-family="sans-serif" font-size="11" font-weight="bold" fill="#fff" text-anchor="middle">×${pkmn.count}</text>
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

function buildRarityBreakdown(allCaught) {
  const counts = {};
  for (const p of allCaught) counts[p.rarity] = (counts[p.rarity] || 0) + 1;
  const emojiMap = { priceless: '✨', mythical: '🌸', legendary: '🔥', epic: '💜', rare: '💙', uncommon: '💚', common: '⬜' };
  return RARITY_ORDER.filter(r => counts[r]).map(r => `${emojiMap[r]} **${counts[r]}** ${r.charAt(0).toUpperCase() + r.slice(1)}`).join('  •  ');
}

function pickEmbedColor(allCaught) {
  for (const r of RARITY_ORDER) {
    if (allCaught.some(p => p.rarity === r)) return getRarityColor(r).hex;
  }
  return '#3a5fc8';
}

module.exports = {
  name: 'zoo',
  aliases: ['collection', 'animals', 'pokemon', 'pc', 'box'],
  description: 'Access your Pokémon PC Storage 💻✨',
  usage: 'zoo [@user]',
  async execute(message, args, client) {
    logger.info(`[Command: zoo] User: ${message.author.tag}, Args: ${args.join(' ')}`);
    try {
      let target = message.author;
      if (message.mentions.users.size > 0) target = message.mentions.users.first();
      else if (args.length > 0) {
        const userId = args[0].replace(/[<@!>]/g, '');
        const found = client.users.cache.get(userId);
        if (found) target = found;
      }

      try { await message.channel.sendTyping(); } catch (_) {}

      const userDoc = await database.getUser(target.id, target.username);
      const animalsData = await database.loadAnimals();
      const flatRegistry = await database.getAnimalRegistry();
      
      const userData = userDoc.toObject();
      const animalsObj = userData.animals || {};

      const { totalAnimals, totalValue } = AnimalService.calculateZooStats(animalsObj, animalsData);

      if (totalAnimals === 0) {
        return message.reply({ embeds: [new EmbedBuilder().setColor(colors.warning).setDescription(`Oh darling~ (｡•́︿•̀｡)\n**${target.username}** hasn't caught any Pokémon yet! Use \`Khunt\` to start your collection!`)] });
      }

      const allCaught = [];
      const rarityEntries = animalsObj instanceof Map ? animalsObj.entries() : Object.entries(animalsObj);
      for (const [rarity, animalCounts] of rarityEntries) {
        const animalEntries = animalCounts instanceof Map ? animalCounts.entries() : Object.entries(animalCounts || {});
        for (const [key, count] of animalEntries) {
          // Priority 1: Check the stored rarity bucket
          // Priority 2: Check the flat registry (handles rarity changes!)
          const def = animalsData[rarity]?.[key] || flatRegistry[key];
          
          if (Number(count) > 0 && def) {
            allCaught.push({ 
              key, 
              name: def.name, 
              rarity: def.rarity || rarity, 
              weight: config.hunting.rarities[def.rarity || rarity]?.weight ?? 50, 
              val: def.value, 
              count: Number(count) 
            });
          }
        }
      }

      allCaught.sort((a, b) => a.weight - b.weight || a.name.localeCompare(b.name));
      const boxes = Array.from({ length: Math.ceil(allCaught.length / 30) }, (_, i) => allCaught.slice(i * 30, i * 30 + 30));

      const embedColor = pickEmbedColor(allCaught);
      const rarityBreakdown = buildRarityBreakdown(allCaught);
      let currentBox = 0;

      const generatePCMessage = async (boxIndex) => {
        const boxLabel = `PC BOX ${boxIndex + 1}`;
        const imgPath = await createPCBoxImage(boxLabel, boxes[boxIndex]);
        const embed = new EmbedBuilder()
          .setColor(embedColor)
          .setTitle(`💻  Pokémon PC Storage  —  ${target.username}`)
          .setDescription(`📦 **Pokémon Caught:** ${allCaught.length}  •  🔢 **Total Copies:** ${totalAnimals}\n\n${rarityBreakdown}`)
          .setImage('attachment://pc-box.png')
          .setFooter({ text: `${boxLabel}  •  Box ${boxIndex + 1} / ${boxes.length}  •  Net Worth: ${EconomyService.format(totalValue)} coins` })
          .setTimestamp();

        if (boxIndex === 0) {
          const badges = AnimalService.calculateBadges(userDoc.stats?.totalAnimalsFound || 0, totalValue, animalsObj);
          if (badges.length > 0) embed.addFields({ name: '🏅 Badges', value: badges.join('  |  ') });
        }

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('zoo_prev').setLabel('◀  Prev').setStyle(ButtonStyle.Secondary).setDisabled(boxIndex === 0),
          new ButtonBuilder().setCustomId('zoo_next').setLabel('Next  ▶').setStyle(ButtonStyle.Secondary).setDisabled(boxIndex === boxes.length - 1),
        );

        return { embed, files: [new AttachmentBuilder(imgPath, { name: 'pc-box.png' })], components: boxes.length > 1 ? [row] : [], imgPath };
      };

      const payload = await generatePCMessage(currentBox);
      const msg = await message.reply({ embeds: [payload.embed], files: payload.files, components: payload.components });
      if (payload.imgPath) fs.unlink(payload.imgPath, () => {});

      if (boxes.length > 1) {
        const collector = msg.createMessageComponentCollector({ time: 60_000 });
        collector.on('collect', async (i) => {
          if (i.user.id !== message.author.id) return i.reply({ content: "That's not yours, sweetheart! (っ˘ω˘ς)", flags: [MessageFlags.Ephemeral] });
          if (i.customId === 'zoo_prev' && currentBox > 0) currentBox--;
          else if (i.customId === 'zoo_next' && currentBox < boxes.length - 1) currentBox++;
          await i.deferUpdate();
          const next = await generatePCMessage(currentBox);
          await msg.edit({ embeds: [next.embed], files: next.files, components: next.components });
          if (next.imgPath) fs.unlink(next.imgPath, () => {});
        });
        collector.on('end', () => msg.edit({ components: [] }).catch(() => {}));
      }
      await database.updateStats(message.author.id, 'command');
    } catch (error) {
      logger.error('Zoo command failed', { error: error.message, stack: error.stack });
      message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.error)
            .setTitle('(｡•́︿•̀｡) Oopsie!')
            .setDescription("Something went wrong while trying to open your PC box, sweetie. Mommy's looking into it! (っ˘ω˘ς)"),
        ],
      });
    }
  },
};
