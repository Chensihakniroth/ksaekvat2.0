const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const GachaService = require('../../services/GachaService.js');
const EconomyService = require('../../services/EconomyService');
const gachaConfig = require('../../config/gachaConfig.js');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const sharp = require('sharp');

const PULL_COST = 10000;
const TEMP_DIR = path.join(__dirname, '..', '..', '.tmp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

async function createGachaResultImage(results) {
  if (!results || results.length === 0) return null;

  const cardWidth = 360;
  const cardHeight = 520;
  const padding = 20;

  const cols = Math.min(results.length, 5);
  const rows = Math.ceil(results.length / cols);

  const canvasWidth = padding + cols * (cardWidth + padding);
  const canvasHeight = padding + rows * (cardHeight + padding);

  const compositePromises = results.map(async (item, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const x = padding + col * (cardWidth + padding);
    const y = padding + row * (cardHeight + padding);

    let processedCard;
    const isSpecialAspectRatio = ['hsr', 'zzz'].includes(item.game?.toLowerCase());

    try {
      const response = await axios.get(item.image_url, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(response.data);
      const game = item.game?.toLowerCase();
      const useCover = ['genshin', 'wuwa', 'hsr'].includes(game);

      let cardImage = sharp(imageBuffer).resize(cardWidth, cardHeight, {
        fit: useCover ? 'cover' : 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      });

      if (useCover) {
        // For Genshin/WuWa, just flatten and return
        processedCard = await cardImage
          .flatten({ background: { r: 0, g: 0, b: 0 } })
          .png()
          .toBuffer();
      } else {
        // For others (HSR/ZZZ), place the contained image onto a solid background card
        processedCard = await sharp({
          create: {
            width: cardWidth,
            height: cardHeight,
            channels: 4,
            background: '#1c1d21',
          },
        })
          .composite([{ input: await cardImage.toBuffer() }])
          .png()
          .toBuffer();
      }
    } catch (error) {
      console.error(
        `Failed to load/process image for ${item.name} from URL ${item.image_url}: ${error.message}`
      );
      // Create a fallback placeholder card
      processedCard = await sharp({
        create: { width: cardWidth, height: cardHeight, channels: 4, background: '#1c1d21' },
      })
        .composite([
          {
            input: Buffer.from(
              `<svg width="${cardWidth}" height="${cardHeight}">
                        <text x="50%" y="50%" font-family="sans-serif" font-size="30" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${item.name || 'Unknown'}</text>
                    </svg>`
            ),
            blend: 'over',
          },
        ])
        .png()
        .toBuffer();
    }

    return { input: processedCard, top: y, left: x };
  });

  const composites = await Promise.all(compositePromises);
  const outputPath = path.join(TEMP_DIR, `gacha-result-${Date.now()}.png`);

  await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 47, g: 49, b: 54, alpha: 1 },
    },
  })
    .composite(composites)
    .png()
    .toFile(outputPath);

  return outputPath;
}

module.exports = {
  name: 'gacha',
  aliases: ['pull', 'wish', 'roll'],
  description: 'Daily free 10-pull, or buy more for 10k riel! ✨',
  usage: 'gacha <gs/hsr/wuwa/zzz>',
  cooldown: 5000,
  async execute(message, args, client) {
    const gameArg = args.join(' ').toLowerCase();
    let gameKey = '';

    if (gameArg.includes('genshin') || gameArg === 'gs') gameKey = 'genshin';
    else if (gameArg.includes('hsr') || gameArg.includes('honkai') || gameArg.includes('star rail'))
      gameKey = 'hsr';
    else if (gameArg.includes('wuwa') || gameArg.includes('wuthering') || gameArg.includes('waves'))
      gameKey = 'wuwa';
    else if (gameArg.includes('zzz') || gameArg.includes('zenless') || gameArg.includes('zero'))
      gameKey = 'zzz';

    if (!gameKey) {
      return message.reply(
        '✨ Please specify a game! Example: `kwish gs`, `kwish hsr`, `kwish wuwa`, or `kwish zzz` (ﾉ´ヮ`)ﾉ*:･ﾟ✧'
      );
    }

    const userData = await database.getUser(message.author.id, message.author.username);
    const now = new Date();
    const lastReset = userData.lastGachaReset ? new Date(userData.lastGachaReset) : null;

    if (
      !lastReset ||
      lastReset.getDate() !== now.getDate() ||
      lastReset.getMonth() !== now.getMonth()
    ) {
      userData.dailyPulls = 0;
      userData.lastGachaReset = now.toISOString();
    }

    let isFree = false;
    let usedExtra = false;
    if (userData.extraPulls > 0) {
      userData.extraPulls--;
      usedExtra = true;
      isFree = true;
    } else if (userData.dailyPulls === 0) {
      isFree = true;
    }

    if (!isFree) {
      if (!(await database.hasBalance(message.author.id, PULL_COST))) {
        return message.reply(
          `💸 Oh no, sweetie! Your free pull is already used, and you need **${EconomyService.format(PULL_COST)}** riel to wish again. (｡•́︿•̀｡)`
        );
      }
      await database.removeBalance(message.author.id, PULL_COST);
    }

    const fullPool = await database.getGachaPool();
    const pool = fullPool[gameKey];
    if (!pool) return message.reply("❌ Oopsie! I couldn't find that game pool. (っ˘ω˘ς)");

    const { results, pity5, pity4 } = GachaService.performMultiPull(userData, pool);
    userData.pity = pity5;
    userData.pity4 = pity4;
    if (!usedExtra) userData.dailyPulls++;

    const hasFiveStar = results.some((r) => r.rarity === 5);
    const hasFourStar = results.some((r) => r.rarity === 4);

    // --- STEP 1: Send the GIF message ---
    const gameData = gachaConfig.games[gameKey];
    let bannerGifUrl = hasFiveStar
      ? gameData.animation['5']
      : hasFourStar
        ? gameData.animation['4']
        : null;
    let mainMessage = null;

    if (bannerGifUrl) {
      const cachedGifUrl = `${bannerGifUrl}?v=mommy_v1`;
      const gifEmbed = new EmbedBuilder()
        .setColor(hasFiveStar ? '#FFB13F' : '#A256FF')
        .setImage(cachedGifUrl);
      mainMessage = await message.reply({ embeds: [gifEmbed] });
    }

    // --- STEP 2: Prepare final result data (Text for all, Image for high-rarity) ---
    const highRarityResults = results.filter((r) => r.rarity >= 4 && r.image_url);
    const imagePath = await createGachaResultImage(highRarityResults);

    const description = results
      .map((item) => {
        const rarityIcon = item.rarity === 5 ? '🟡' : item.rarity === 4 ? '🟣' : '🔵';
        const name = item.name || 'Unknown Item';
        const emoji = item.emoji || '❓';
        return `${emoji} **${name}** ${rarityIcon}`;
      })
      .join('\n');

    let footerParts = [];
    if (usedExtra) footerParts.push(`Used Promo Pull (${userData.extraPulls} left)`);
    else if (isFree) footerParts.push('Daily Free Pull used!');
    else footerParts.push(`Paid Pull (${EconomyService.format(PULL_COST)} riel)`);
    footerParts.push(`Pity: ${userData.pity}/90`);

    const finalEmbed = new EmbedBuilder()
      .setColor(hasFiveStar ? '#FFB13F' : '#A256FF')
      .setDescription(description)
      .setFooter({ text: footerParts.join(' | ') });

    const files = [];
    if (imagePath) {
      const resultImageAttachment = new AttachmentBuilder(imagePath, { name: 'gacha-result.png' });
      finalEmbed.setImage('attachment://gacha-result.png');
      files.push(resultImageAttachment);
    }

    // --- STEP 3: Wait for GIF to play, then edit the message ---
    let waitTime = 1000;
    if (bannerGifUrl) {
      // Only wait if a GIF was shown
      if (gameKey === 'genshin') waitTime = 4500;
      else if (gameKey === 'hsr') waitTime = hasFiveStar ? 4500 : 3500;
      else if (gameKey === 'wuwa') waitTime = hasFiveStar ? 3500 : 3000;
      else if (gameKey === 'zzz') waitTime = hasFiveStar ? 3200 : 3000;
    }
    await new Promise((r) => setTimeout(r, waitTime));

    const messagePayload = { embeds: [finalEmbed], files: files };
    if (mainMessage) {
      await mainMessage.edit(messagePayload);
    } else {
      await message.reply(messagePayload);
    }

    // --- STEP 4: Cleanup and save ---
    if (imagePath) {
      fs.unlink(imagePath, (err) => {
        if (err) console.error(`Failed to delete temp image: ${imagePath}`, err);
      });
    }

    for (const item of results) await database.addGachaItem(message.author.id, item.name);
    await database.saveUser(userData);
  },
};
