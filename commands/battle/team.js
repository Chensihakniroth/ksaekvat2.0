const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  AttachmentBuilder,
} = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const { getCharacterIcon, getItemEmoji, getRarityEmoji, getElementEmoji } = require('../../utils/images.js');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const sharp = require('sharp');

const TEMP_DIR = path.join(__dirname, '..', '..', '.tmp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Checks magic bytes to confirm a buffer contains a supported image format.
 * Prevents Sharp from crashing on HTML error pages or other non-image data.
 */
function isValidImageBuffer(buf) {
  if (!buf || buf.length < 12) return false;
  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return true;
  // JPEG: FF D8 FF
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return true;
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return true;
  // GIF: 47 49 46 38
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return true;
  return false;
}

// ─────────────────────────────────────────────────────────────────
// BEAUTIFUL TEAM IMAGE GENERATOR
// ─────────────────────────────────────────────────────────────────

async function createTeamImage(userData, teamCharacters) {
  const cardWidth = 280;
  const cardHeight = 420;
  const padding = 25;
  const cols = 4;

  // Header height
  const headerHeight = 100;

  const canvasWidth = padding + cols * (cardWidth + padding);
  const canvasHeight = headerHeight + cardHeight + padding * 2;

  try {
    const composites = [];

    // 1. Sleek Background for the canvas (Text removed to prevent Fontconfig crashes)
    const bgSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}">
        <defs>
          <radialGradient id="grad1" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
            <stop offset="0%" stop-color="#2a2d3ab3" />
            <stop offset="100%" stop-color="#121318" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="${canvasWidth}" height="${canvasHeight}" fill="url(#grad1)" rx="30" ry="30"/>
        <pattern id="pattern-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="none" stroke="#ffffff" stroke-opacity="0.03" stroke-width="1"/>
        </pattern>
        <rect width="${canvasWidth}" height="${canvasHeight}" fill="url(#pattern-grid)" rx="30" ry="30" />
        
        <path d="M 0 60 L 200 60 L 250 80 L ${canvasWidth - 250} 80 L ${canvasWidth - 200} 60 L ${canvasWidth} 60" fill="none" stroke="#ffffff" stroke-opacity="0.05" stroke-width="2"/>
        <path d="M 230 80 L 280 100 L ${canvasWidth - 280} 100 L ${canvasWidth - 230} 80" fill="none" stroke="#ffffff" stroke-opacity="0.1" stroke-width="1"/>
      </svg>`);

    composites.push({ input: bgSvg, top: 0, left: 0 });

    const rarityColors = {
      5: '#FFD700', // Gold
      4: '#B366FF', // Purple
      3: '#4DA6FF'  // Blue
    };

    const rarityGradients = {
      5: ['#FFF0B3', '#D4AF37'],
      4: ['#D9B3FF', '#8A2BE2'],
      3: ['#B3D9FF', '#1E90FF']
    };

    for (let i = 0; i < 4; i++) {
      const x = padding + i * (cardWidth + padding);
      const y = headerHeight + padding;

      let charName = null;
      if (userData && userData.team && userData.team.length > i) {
        charName = userData.team[i];
      }
      const item = charName && teamCharacters ? teamCharacters.find(c => c.name === charName) : null;

      let slotBuffer;

      const cardMask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cardWidth}" height="${cardHeight}"><rect x="0" y="0" width="${cardWidth}" height="${cardHeight}" rx="24" ry="24" fill="#fff" /></svg>`);

      if (item) {
        try {
          let imageUrl = item.image_url;
          const game = item.game?.toLowerCase();
          let imageBuffer = null;
          let useCover = ['genshin', 'wuwa'].includes(game);

          if (game === 'genshin') {
            let apiId = item.name.toLowerCase().trim().replace(/ /g, '-');

            // Custom Overrides for jmp.blue Genshin API
            const genshinOverrides = {
              'kamisato-ayato': 'ayato',
              'kamisato-ayaka': 'ayaka',
              'sangonomiya-kokomi': 'kokomi',
              'kaedehara-kazuha': 'kazuha',
              'shikanoin-heizou': 'heizou',
              'kuki-shinobu': 'shinobu',
              'kujou-sara': 'sara',
              'arataki-itto': 'itto',
              'tartaglia': 'childe'
            };
            if (genshinOverrides[apiId]) apiId = genshinOverrides[apiId];

            imageUrl = `https://genshin.jmp.blue/characters/${apiId}/icon-big`;
            try {
              const jmpRes = await axios.get(imageUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, responseType: 'arraybuffer', timeout: 8000 });
              const jmpBuf = Buffer.from(jmpRes.data);
              if (jmpRes.headers['content-type']?.includes('image/') && isValidImageBuffer(jmpBuf)) {
                imageBuffer = jmpBuf;
              } else {
                throw new Error(`jmp.blue returned non-image (content-type: ${jmpRes.headers['content-type']})`);
              }
            } catch (e) {
              console.warn(`jmp.blue failed for ${item.name}: ${e.message}, trying Fandom wiki fallback...`);
              const fileName = `File:${item.name.trim()} Icon.png`;
              const apiUrl = `https://genshin-impact.fandom.com/api.php?action=query&titles=${encodeURIComponent(fileName)}&prop=imageinfo&iiprop=url&format=json`;
              const res = await axios.get(apiUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }, timeout: 8000 });
              const pages = res.data.query.pages;
              const pageId = Object.keys(pages)[0];
              if (pageId !== '-1' && pages[pageId].imageinfo) {
                const wikiImageUrl = pages[pageId].imageinfo[0].url;
                const wikiRes = await axios.get(wikiImageUrl, {
                  responseType: 'arraybuffer',
                  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                  timeout: 8000
                });
                const wikiBuf = Buffer.from(wikiRes.data);
                if (isValidImageBuffer(wikiBuf)) {
                  imageBuffer = wikiBuf;
                } else {
                  throw new Error(`Fandom wiki returned non-image data for ${item.name}`);
                }
              } else {
                throw new Error(`Fandom wiki: no image found for ${item.name}`);
              }
            }
            useCover = false;
          } else if (game === 'hsr') {
            const fileName = `File:Character ${item.name.trim()} Icon.png`;
            const apiUrl = `https://honkai-star-rail.fandom.com/api.php?action=query&titles=${encodeURIComponent(fileName)}&prop=imageinfo&iiprop=url&format=json`;
            const res = await axios.get(apiUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }, timeout: 8000 });
            const pages = res.data.query.pages;
            const pageId = Object.keys(pages)[0];
            if (pageId !== '-1' && pages[pageId].imageinfo) {
              const wikiRes = await axios.get(pages[pageId].imageinfo[0].url, {
                responseType: 'arraybuffer',
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                timeout: 8000
              });
              const hsrBuf = Buffer.from(wikiRes.data);
              if (isValidImageBuffer(hsrBuf)) imageBuffer = hsrBuf;
              else throw new Error(`HSR Fandom wiki returned non-image data for ${item.name}`);
            }
            useCover = false;
          } else if (game === 'wuwa') {
            const fileName = `File:Resonator ${item.name.trim()}.png`;
            const apiUrl = `https://wutheringwaves.fandom.com/api.php?action=query&titles=${encodeURIComponent(fileName)}&prop=imageinfo&iiprop=url&format=json`;
            const res = await axios.get(apiUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }, timeout: 8000 });
            const pages = res.data.query.pages;
            const pageId = Object.keys(pages)[0];
            if (pageId !== '-1' && pages[pageId].imageinfo) {
              const wikiRes = await axios.get(pages[pageId].imageinfo[0].url, {
                responseType: 'arraybuffer',
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                timeout: 8000
              });
              const wuwaBuf = Buffer.from(wikiRes.data);
              if (isValidImageBuffer(wuwaBuf)) imageBuffer = wuwaBuf;
              else throw new Error(`WuWa Fandom wiki returned non-image data for ${item.name}`);
            }
            useCover = false;
          } else if (game === 'zzz') {
            const fileName = `File:Agent ${item.name.trim()} Icon.png`;
            const apiUrl = `https://zenless-zone-zero.fandom.com/api.php?action=query&titles=${encodeURIComponent(fileName)}&prop=imageinfo&iiprop=url&format=json`;
            const res = await axios.get(apiUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }, timeout: 8000 });
            const pages = res.data.query.pages;
            const pageId = Object.keys(pages)[0];
            if (pageId !== '-1' && pages[pageId].imageinfo) {
              const wikiRes = await axios.get(pages[pageId].imageinfo[0].url, {
                responseType: 'arraybuffer',
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                timeout: 8000
              });
              const zzzBuf = Buffer.from(wikiRes.data);
              if (isValidImageBuffer(zzzBuf)) imageBuffer = zzzBuf;
              else throw new Error(`ZZZ Fandom wiki returned non-image data for ${item.name}`);
            }
            useCover = false;
          }

          if (!imageBuffer && imageUrl) {
            const fallbackRes = await axios.get(imageUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
              responseType: 'arraybuffer',
              timeout: 8000
            });
            const fallbackBuf = Buffer.from(fallbackRes.data);
            if (isValidImageBuffer(fallbackBuf)) {
              imageBuffer = fallbackBuf;
            } else {
              throw new Error(`image_url fallback returned non-image data for ${item.name}`);
            }
          }

          const rColor = rarityColors[item.rarity] || '#ffffff';
          const rGrad = rarityGradients[item.rarity] || ['#777', '#444'];

          const cardBg = await sharp({
            create: { width: cardWidth, height: cardHeight, channels: 4, background: '#181a20' },
          }).toBuffer();

          let charLayer = sharp(imageBuffer);
          const metadata = await charLayer.metadata();

          charLayer = charLayer.resize(cardWidth, cardHeight, {
            fit: useCover ? 'cover' : 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          });

          const overlaySvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cardWidth}" height="${cardHeight}">
            <defs>
              <linearGradient id="fade" x1="0" y1="0.4" x2="0" y2="1">
                <stop offset="0%" stop-color="#000" stop-opacity="0" />
                <stop offset="60%" stop-color="#000" stop-opacity="0.85" />
                <stop offset="100%" stop-color="#000" stop-opacity="1" />
              </linearGradient>
              <linearGradient id="borderGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="${rGrad[0]}" />
                <stop offset="100%" stop-color="${rGrad[1]}" />
              </linearGradient>
              <linearGradient id="roleGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="${rGrad[1]}" stop-opacity="0.8" />
                <stop offset="100%" stop-color="#000" stop-opacity="0" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <rect width="${cardWidth}" height="${cardHeight}" fill="url(#fade)" />
        
        <polygon points="0,0 120,0 90,30 0,30" fill="url(#roleGrad)" />
        
        <!-- Frame border inside the mask -->
        <rect x="2" y="2" width="${cardWidth - 4}" height="${cardHeight - 4}" rx="22" ry="22" fill="none" stroke="url(#borderGrad)" stroke-width="4" stroke-opacity="0.8" />
      </svg>`);

          slotBuffer = await sharp(cardBg)
            .composite([
              { input: await charLayer.toBuffer(), blend: 'over' },
              { input: overlaySvg, blend: 'over' }
            ])
            .png()
            .toBuffer();

          // Mask the final card to give rounded corners
          slotBuffer = await sharp(slotBuffer)
            .composite([{ input: cardMask, blend: 'dest-in' }])
            .png()
            .toBuffer();

        } catch (err) {
          console.error(`Error generating card for ${item?.name || 'Unknown'}:`, err.message);
          try {
            slotBuffer = await sharp({ create: { width: cardWidth, height: cardHeight, channels: 4, background: '#20222b' } })
              .composite([
                { input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cardWidth}" height="${cardHeight}"><rect x="0" y="0" width="${cardWidth}" height="${cardHeight}" rx="24" ry="24" fill="none" stroke="#555" stroke-width="4"/></svg>`), blend: 'over' },
                { input: cardMask, blend: 'dest-in' }
              ])
              .png()
              .toBuffer();
          } catch (fallbackErr) {
            slotBuffer = await sharp({ create: { width: cardWidth, height: cardHeight, channels: 4, background: '#ff0000' } }).png().toBuffer();
          }
        }
      } else {
        // Empty Slot
        slotBuffer = await sharp({ create: { width: cardWidth, height: cardHeight, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0 } } })
          .composite([
            {
              input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cardWidth}" height="${cardHeight}">
              <rect x="0" y="0" width="${cardWidth}" height="${cardHeight}" rx="24" ry="24" fill="#181a20" fill-opacity="0.5"/>
              <rect x="4" y="4" width="${cardWidth - 8}" height="${cardHeight - 8}" rx="20" ry="20" fill="none" stroke="#333745" stroke-width="4" stroke-dasharray="12 12"/>
              
              <!-- Crosshair graphic -->
              <path d="M ${cardWidth / 2 - 25} ${cardHeight / 2} L ${cardWidth / 2 + 25} ${cardHeight / 2} M ${cardWidth / 2} ${cardHeight / 2 - 25} L ${cardWidth / 2} ${cardHeight / 2 + 25}" stroke="#4f5469" stroke-width="6" stroke-linecap="round"/>
              <circle cx="${cardWidth / 2}" cy="${cardHeight / 2}" r="15" fill="none" stroke="#4f5469" stroke-width="4"/>
            </svg>`),
              blend: 'over'
            }
          ])
          .png()
          .toBuffer();
      }

      composites.push({ input: slotBuffer, top: y, left: x });
    }

    const outputPath = path.join(TEMP_DIR, `team-banner-${Date.now()}.png`);

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
      .toFile(outputPath);

    return outputPath;
  } catch (globalErr) {
    console.error('CRITICAL GENERATOR ERROR:', globalErr);
    return null;
  }
}

module.exports = {
  name: 'team',
  aliases: ['kteam', 'squad'],
  description: 'Manage your beautiful battle team! (4 Slots) ✨',
  usage: 'team [add <name> | remove <slot>]',
  async execute(message, args, client) {
    let userData = await database.getUser(message.author.id, message.author.username);
    if (!userData.team) userData.team = [];

    const sub = args[0]?.toLowerCase();

    // Helper to find a character in inventory
    const findCharacter = async (name) => {
      const inventory = await database.getHydratedInventory(message.author.id);
      return inventory.find(
        (c) =>
          (c.type === 'character' || !c.type) && c.name.toLowerCase().includes(name.toLowerCase())
      );
    };

    // --- SUBCOMMAND: ADD ---
    if (sub === 'add') {
      const charName = args.slice(1).join(' ');
      if (!charName)
        return message.reply('❓ Who should Mommy add? Example: `kteam add Raiden` (｡♥‿♥｡)');

      if (userData.team.length >= 4)
        return message.reply('🚫 Your squad is already full! Remove someone first. (っ˘ω˘ς)');

      const found = await findCharacter(charName);
      if (!found) return message.reply(`❌ You don't have **${charName}** in your collection yet!`);
      if (userData.team.includes(found.name)) return message.reply('🚫 They are already in your team! (◕‿◕✿)');

      userData.team.push(found.name);
      await database.saveUser(userData);
      return message.reply(
        `✅ Added **${found.name}** to your squad! (ﾉ´ヮ\`)ﾉ*:･ﾟ✧`
      );
    }

    // --- SUBCOMMAND: REMOVE ---
    if (sub === 'remove') {
      const slot = parseInt(args[1]);
      if (isNaN(slot) || slot < 1 || slot > 4)
        return message.reply(`❓ Which slot should Mommy clear? (1-4)`);
      if (slot > userData.team.length)
        return message.reply('🚫 That slot is already empty! (｡•́︿•̀｡)');

      const removed = userData.team.splice(slot - 1, 1);
      await database.saveUser(userData);
      return message.reply(`✅ Removed **${removed[0]}** from your team! (っ˘ω˘ς)`);
    }

    // --- DEFAULT: INTERACTIVE DISPLAY ---
    message.channel.sendTyping();

    const inventory = await database.getHydratedInventory(message.author.id);
    const characters = inventory.filter((i) => i.type === 'character' || !i.type);
    const teamCharacters = userData.team
      .map((name) => characters.find((c) => c.name === name))
      .filter(Boolean);

    const imagePath = await createTeamImage(userData, teamCharacters);

    const createEmbed = () => {
      const filledSlots = userData.team.length;

      const embed = new EmbedBuilder()
        .setColor(colors.primary)
        .setTitle(`🛡️ ${message.author.username}'s Elite Squad`)
        .setDescription(`**Team Status:** ${filledSlots}/4 Slots Deployed\n*Manage your battlefield composition below!* (｡♥‿♥｡)`)
        .setFooter({ text: 'Use buttons below to easily manage your team slots!' });

      let compText = '';
      for (let i = 0; i < 4; i++) {
        const charName = userData.team[i];
        const charData = charName ? characters.find((c) => c.name === charName) : null;

        if (charData) {
          const charEmoji = getItemEmoji(charData, client);
          const elementEmoji = getElementEmoji(charData, client);
          compText += `**Slot ${i + 1}:** ${elementEmoji} ${charEmoji} **${charName}**\n`;
        } else {
          compText += `**Slot ${i + 1}:** \`[ Empty Slot ]\`\n`;
        }
      }

      embed.addFields({
        name: '❖ Squad Composition',
        value: compText,
        inline: false,
      });

      if (imagePath) {
        embed.setImage('attachment://squad-banner.png');
      }

      return embed;
    };

    const createButtons = () => {
      const btns = [];
      const row = new ActionRowBuilder();

      const filledSlots = userData.team.length;
      for (let i = 0; i < 4; i++) {
        const emojiNum = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'][i];
        const isSlotFilled = i < filledSlots && !!userData.team[i];

        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`team_pop_${i + 1}`)
            .setLabel(isSlotFilled ? `Clear Slot ${i + 1}` : `Slot ${i + 1} Empty`)
            .setEmoji(emojiNum)
            .setStyle(isSlotFilled ? ButtonStyle.Danger : ButtonStyle.Secondary)
            .setDisabled(!isSlotFilled)
        );
      }
      btns.push(row);

      // Add a helpful button
      const helpRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('team_help_btn')
          .setLabel('How to Add Characters')
          .setEmoji('ℹ️')
          .setStyle(ButtonStyle.Primary)
      );
      btns.push(helpRow);

      return btns;
    };

    const files = [];
    if (imagePath) {
      files.push(new AttachmentBuilder(imagePath, { name: 'squad-banner.png' }));
    }

    const msg = await message.reply({
      embeds: [createEmbed()],
      components: createButtons(),
      files: files,
    });

    if (imagePath) {
      setTimeout(() => {
        fs.unlink(imagePath, (err) => {
          if (err) console.error(`Failed to delete temp image: ${imagePath}`, err);
        });
      }, 5000); // Wait a bit before cleanup so Discord attachments send first
    }

    const collector = msg.createMessageComponentCollector({ time: 60000 });

    collector.on('collect', async (i) => {
      if (i.user.id !== message.author.id)
        return i.reply({
          content: "This isn't your squad, darling! (っ˘ω˘ς)",
          flags: [MessageFlags.Ephemeral],
        });

      if (i.customId === 'team_help_btn') {
        return i.reply({
          content: "**(◕‿◕✿) Mommy's Team Guide:**\nTo add someone to an empty slot, just use the command: \`kteam add <name>\`\nExample: \`kteam add Raiden\`\n\nYou can only have 4 characters in your squad!",
          flags: [MessageFlags.Ephemeral]
        });
      }

      if (i.customId.startsWith('team_pop_')) {
        const slot = parseInt(i.customId.replace('team_pop_', ''));

        if (slot > userData.team.length || !userData.team[slot - 1]) {
          return i.reply({ content: "That slot is already empty!", flags: [MessageFlags.Ephemeral] });
        }

        const remName = userData.team[slot - 1];
        userData.team.splice(slot - 1, 1);
        await database.saveUser(userData);

        const newTeamChars = userData.team
          .map((name) => characters.find((c) => c.name === name))
          .filter(Boolean);

        const newImagePath = await createTeamImage(userData, newTeamChars);

        const newFiles = [];
        if (newImagePath) {
          newFiles.push(new AttachmentBuilder(newImagePath, { name: 'squad-banner.png' }));
        }

        await i.update({
          embeds: [createEmbed()],
          components: createButtons(),
          files: newFiles,
        });

        if (newImagePath) {
          setTimeout(() => {
            fs.unlink(newImagePath, (err) => {
              if (err) console.error(`Failed to delete temp image: ${newImagePath}`, err);
            });
          }, 5000);
        }

        // Send notification message of removal
        message.channel.send(`Removed **${remName}** from the squad!`);
      }
    });

    collector.on('end', () => {
      msg.edit({ components: [] }).catch(() => { });
    });
  },
};
