const { AttachmentBuilder, MessageFlags, EmbedBuilder } = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const EconomyService = require('../../services/EconomyService').default || require('../../services/EconomyService');
const sharp = require('sharp');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const logger = require('../../utils/logger.js');

const TEMP_DIR = path.join(__dirname, '..', '..', '.tmp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

function getRarestPokemon(rarityCount) {
  const rarityOrder = ['priceless', 'mythical', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
  for (const rarity of rarityOrder) {
    if (rarityCount[rarity] > 0) {
      return config.hunting.rarities[rarity].name;
    }
  }
  return 'None';
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, function (c) {
      switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\'': return '&apos;';
          case '"': return '&quot;';
      }
  });
}

module.exports = {
  name: 'profile',
  aliases: ['p', 'stats', 'me', 'trainer'],
  description: "View your or another user's Trainer profile!",
  usage: 'profile [@user]',
  async execute(message, args, client) {
    let target = message.author;

    if (message.mentions.users.size > 0) {
      target = message.mentions.users.first();
    } else if (args.length > 0) {
      const userId = args[0].replace(/[<@!>]/g, '');
      const foundUser = client.users.cache.get(userId);
      if (foundUser) target = foundUser;
    }

    try { await message.channel.sendTyping(); } catch (_) {}

    const userData = await database.getUser(target.id, target.username);
    const animalsData = await database.loadAnimals();
    const flatRegistry = await database.getAnimalRegistry();

    // Theme logic! (｡♥‿♥｡)
    const shopConfig = require('../../config/shopConfig.js');
    let embedColor = colors.primary;
    let backgroundUrl = null;

    if (userData.profileTheme && userData.profileTheme !== 'default') {
      const theme = shopConfig.categories.themes.items.find(t => t.id === userData.profileTheme);
      if (theme) {
        embedColor = theme.color;
        backgroundUrl = theme.image;
      }
    }

    // Calculate essential stats
    const accountAge = Math.floor((Date.now() - (userData.joinedAt || Date.now())) / (1000 * 60 * 60 * 24));
    const expToNextLevel = userData.level * 100 - userData.experience;

    // Calculate pokemon collection
    let totalPokemonValue = 0;
    let totalPokemonOwned = 0;
    let rarityCount = {};

    for (const rarity of Object.keys(config.hunting.rarities)) {
      rarityCount[rarity] = 0;
    }

    if (userData.animals) {
      const rarityEntries = userData.animals instanceof Map ? userData.animals.entries() : Object.entries(userData.animals);
      for (const [rarity, animals] of rarityEntries) {
        const animalEntries = animals instanceof Map ? animals.entries() : Object.entries(animals);
        for (const [animalKey, count] of animalEntries) {
          const animal = animalsData[rarity]?.[animalKey] || flatRegistry[animalKey];
          if (animal && count > 0) {
            const baseValue = animal.value || config.hunting.rarities[rarity]?.value || 100;
            totalPokemonValue += baseValue * count;
            totalPokemonOwned += count;
            if (rarityCount[rarity] !== undefined) {
              rarityCount[rarity] += count;
            }
          }
        }
      }
    }

    // Marriage Info
    let spouseTextPlain = 'None';
    if (userData.spouse && userData.spouse.name) {
        spouseTextPlain = `${userData.spouse.name} (Lv. ${Math.floor(userData.spouse.affinity / 100) + 1})`;
    }

    // Calculate gambling stats
    const stats = userData.stats || {};
    const totalGambled = stats.totalGambled || 0;
    const totalWon = stats.totalWon || 0;
    const totalLost = stats.totalLost || 0;
    
    const winRate = totalGambled > 0 ? ((totalWon / totalGambled) * 100).toFixed(1) : '0.0';
    const rarest = getRarestPokemon(rarityCount);

    const canvasWidth = 800;
    const canvasHeight = 450;
    const safeUsername = escapeXml(target.username);
    const safeSpouse = escapeXml(spouseTextPlain);

    // Build the SVG overlay
    const bgSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0d101e"/>
          <stop offset="100%" stop-color="#060912"/>
        </linearGradient>
        <linearGradient id="hdr" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="${embedColor}" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="${embedColor}" stop-opacity="0.3"/>
        </linearGradient>
      </defs>
      
      <!-- Base Background (Only if no theme image is equipped) -->
      ${!backgroundUrl ? `<rect width="${canvasWidth}" height="${canvasHeight}" rx="20" ry="20" fill="url(#bg)"/>` : ''}
      
      <!-- Content overlay (glassmorphic dark layer to make text readable over the background image) -->
      ${backgroundUrl ? `<rect x="0" y="0" width="${canvasWidth}" height="${canvasHeight}" rx="20" ry="20" fill="#000000" opacity="0.6"/>` : ''}
      
      <rect x="2" y="2" width="${canvasWidth - 4}" height="${canvasHeight - 4}" rx="18" ry="18" fill="none" stroke="${embedColor}" stroke-width="3" opacity="0.8"/>
      
      <!-- Header box -->
      <rect x="20" y="20" width="${canvasWidth - 40}" height="160" rx="16" ry="16" fill="url(#hdr)" stroke="${embedColor}" stroke-width="1.5" opacity="0.9"/>
      
      <!-- Avatar border -->
      <circle cx="100" cy="100" r="64" fill="none" stroke="${embedColor}" stroke-width="4" opacity="1"/>

      <!-- Texts -->
      <text x="190" y="80" font-family="sans-serif" font-size="42" font-weight="bold" fill="#ffffff" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.8))">${safeUsername}</text>
      
      <text x="190" y="125" font-family="sans-serif" font-size="24" font-weight="bold" fill="#ffffff" filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.8))">LV. ${userData.level}</text>
      <text x="740" y="125" font-family="sans-serif" font-size="18" font-weight="bold" fill="#eeeeee" text-anchor="end" filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.8))">${userData.experience} / ${userData.level * 100} XP</text>

      <!-- XP Bar Background -->
      <rect x="190" y="140" width="550" height="16" rx="8" ry="8" fill="#000000" opacity="0.6"/>
      <!-- XP Bar Fill -->
      <rect x="190" y="140" width="${Math.min(550, Math.max(16, (userData.experience / (userData.level * 100)) * 550))}" height="16" rx="8" ry="8" fill="${embedColor}" opacity="1"/>

      <!-- Info Grid Boxes -->
      <!-- Left Box -->
      <rect x="20" y="200" width="370" height="230" rx="16" ry="16" fill="#111827" stroke="${embedColor}" stroke-width="1.5" opacity="0.85"/>
      <text x="205" y="235" font-family="sans-serif" font-size="20" font-weight="bold" fill="${embedColor}" text-anchor="middle" letter-spacing="2">TRAINING PROGRESS</text>
      <path d="M 40 245 L 370 245" stroke="${embedColor}" stroke-width="1" opacity="0.4"/>
      
      <text x="40" y="280" font-family="sans-serif" font-size="20" font-weight="bold" fill="#aaaaaa">Balance</text>
      <text x="370" y="280" font-family="sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="end">${EconomyService.format(userData.balance)} Coins</text>
      
      <text x="40" y="325" font-family="sans-serif" font-size="20" font-weight="bold" fill="#aaaaaa">Pokémon</text>
      <text x="370" y="325" font-family="sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="end">${totalPokemonOwned}</text>
      
      <text x="40" y="370" font-family="sans-serif" font-size="20" font-weight="bold" fill="#aaaaaa">Total Worth</text>
      <text x="370" y="370" font-family="sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="end">${EconomyService.format(totalPokemonValue)}</text>
      
      <text x="40" y="415" font-family="sans-serif" font-size="20" font-weight="bold" fill="#aaaaaa">Peak Rarity</text>
      <text x="370" y="415" font-family="sans-serif" font-size="22" font-weight="bold" fill="${embedColor}" text-anchor="end">${rarest}</text>

      <!-- Right Box -->
      <rect x="410" y="200" width="370" height="230" rx="16" ry="16" fill="#111827" stroke="${embedColor}" stroke-width="1.5" opacity="0.85"/>
      <text x="595" y="235" font-family="sans-serif" font-size="20" font-weight="bold" fill="${embedColor}" text-anchor="middle" letter-spacing="2">ACTIVITY LOG</text>
      <path d="M 430 245 L 760 245" stroke="${embedColor}" stroke-width="1" opacity="0.4"/>

      <text x="430" y="280" font-family="sans-serif" font-size="20" font-weight="bold" fill="#aaaaaa">Total Gambled</text>
      <text x="760" y="280" font-family="sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="end">${EconomyService.format(totalGambled)}</text>
      
      <text x="430" y="325" font-family="sans-serif" font-size="20" font-weight="bold" fill="#aaaaaa">Win Rate</text>
      <text x="760" y="325" font-family="sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="end">${winRate}%</text>

      <text x="430" y="370" font-family="sans-serif" font-size="20" font-weight="bold" fill="#aaaaaa">Spouse</text>
      <text x="760" y="370" font-family="sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="end">${safeSpouse}</text>
      
      <text x="430" y="415" font-family="sans-serif" font-size="20" font-weight="bold" fill="#aaaaaa">Days Active</text>
      <text x="760" y="415" font-family="sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="end">${accountAge}d</text>

    </svg>`);

    const composites = [];

    // 1. Base Layer (Theme Background)
    if (backgroundUrl) {
      try {
        const bgRes = await axios.get(backgroundUrl, { responseType: 'arraybuffer' });
        const bgBuffer = await sharp(bgRes.data)
          .resize(canvasWidth, canvasHeight, { fit: 'cover' })
          .toBuffer();
        composites.push({ input: bgBuffer, top: 0, left: 0 });
      } catch (e) {
        logger.error('Failed to load background image for profile', e);
      }
    }

    // 2. SVG Overlay
    composites.push({ input: bgSvg, top: 0, left: 0 });

    // 3. Avatar Overlay
    try {
      const avatarUrl = target.displayAvatarURL({ extension: 'png', size: 256 });
      const avatarRes = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
      const avatarBuffer = await sharp(avatarRes.data)
        .resize(120, 120)
        .composite([{
          input: Buffer.from(`<svg><circle cx="60" cy="60" r="60" fill="white"/></svg>`),
          blend: 'dest-in'
        }])
        .png()
        .toBuffer();
      composites.push({ input: avatarBuffer, top: 40, left: 40 });
    } catch (e) {
      logger.error('Failed to load avatar for profile', e);
    }

    const outPath = path.join(TEMP_DIR, `profile-${Date.now()}-${Math.floor(Math.random() * 9999)}.png`);
    
    // Generate Final Image
    await sharp({
      create: { width: canvasWidth, height: canvasHeight, channels: 4, background: { r: 13, g: 16, b: 30, alpha: 1 } }
    })
      .composite(composites)
      .png()
      .toFile(outPath);

    await message.reply({ 
      files: [new AttachmentBuilder(outPath, { name: 'profile.png' })]
    });

    // Cleanup
    fs.unlink(outPath, () => {});

    // Update command usage statistics
    await database.updateStats(message.author.id, 'command');
  },
};

