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
const { getCharacterIcon } = require('../../utils/images.js');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const sharp = require('sharp');

const TEMP_DIR = path.join(__dirname, '..', '..', '.tmp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

async function createTeamImage(teamCharacters) {
  if (!teamCharacters || teamCharacters.length === 0) return null;

  const cardWidth = 360;
  const cardHeight = 520;
  const padding = 15;

  const cols = teamCharacters.length;
  const canvasWidth = padding + cols * (cardWidth + padding);
  const canvasHeight = padding * 2 + cardHeight;

  const compositePromises = teamCharacters.map(async (item, index) => {
    const x = padding + index * (cardWidth + padding);
    const y = padding;

    let processedCard;
    try {
      let imageUrl = item.image_url;
      const game = item.game?.toLowerCase();
      let useCover = ['genshin', 'wuwa'].includes(game);

      // Mommy's special touch for Genshin icons! (｡♥‿♥｡)
      if (game === 'genshin') {
        const apiId = item.name.toLowerCase().replace(/ /g, '-');
        imageUrl = `https://genshin.jmp.blue/characters/${apiId}/icon-big`;
        useCover = false; // We want to contain the icon, not cover with it
      } else if (game === 'hsr') {
        try {
          const formattedName = item.name;
          const fileName = `File:Character ${formattedName} Icon.png`;
          const apiUrl = `https://honkai-star-rail.fandom.com/api.php?action=query&titles=${encodeURIComponent(
            fileName
          )}&prop=imageinfo&iiprop=url&format=json`;

          const wikiResponse = await axios.get(apiUrl);
          const pages = wikiResponse.data.query.pages;
          const pageId = Object.keys(pages)[0];

          if (pageId !== '-1' && pages[pageId].imageinfo) {
            imageUrl = pages[pageId].imageinfo[0].url;
          } else {
            throw new Error(`Could not find wiki image URL for ${item.name}`);
          }
          useCover = false;
        } catch (wikiError) {
          console.error(`HSR Wiki API error for ${item.name}: ${wikiError.message}`);
          throw wikiError; // Re-throw to be caught by the outer block
        }
      } else if (game === 'wuwa') {
        try {
          const formattedName = item.name;
          const fileName = `File:Resonator ${formattedName}.png`;
          const apiUrl = `https://wutheringwaves.fandom.com/api.php?action=query&titles=${encodeURIComponent(
            fileName
          )}&prop=imageinfo&iiprop=url&format=json`;

          const wikiResponse = await axios.get(apiUrl);
          const pages = wikiResponse.data.query.pages;
          const pageId = Object.keys(pages)[0];

          if (pageId !== '-1' && pages[pageId].imageinfo) {
            imageUrl = pages[pageId].imageinfo[0].url;
          } else {
            throw new Error(`Could not find wiki image URL for ${item.name}`);
          }
          useCover = false;
        } catch (wikiError) {
          console.error(`WuWa Wiki API error for ${item.name}: ${wikiError.message}`);
          throw wikiError; // Re-throw to be caught by the outer block
        }
      } else if (game === 'zzz') {
        try {
          const formattedName = item.name;
          const fileName = `File:Agent ${formattedName} Icon.png`;
          const apiUrl = `https://zenless-zone-zero.fandom.com/api.php?action=query&titles=${encodeURIComponent(
            fileName
          )}&prop=imageinfo&iiprop=url&format=json`;

          const wikiResponse = await axios.get(apiUrl);
          const pages = wikiResponse.data.query.pages;
          const pageId = Object.keys(pages)[0];

          if (pageId !== '-1' && pages[pageId].imageinfo) {
            imageUrl = pages[pageId].imageinfo[0].url;
          } else {
            throw new Error(`Could not find wiki image URL for ${item.name}`);
          }
          useCover = false;
        } catch (wikiError) {
          console.error(`ZZZ Wiki API error for ${item.name}: ${wikiError.message}`);
          throw wikiError; // Re-throw to be caught by the outer block
        }
      }

      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(response.data);

      // Mommy's special HSR zoom! (｡♥‿♥｡)
      if (game === 'hsr') {
        const zoomedSize = Math.floor(cardWidth * 1.3);
        const icon = await sharp(imageBuffer)
          .resize(zoomedSize, zoomedSize, { fit: 'inside' })
          .toBuffer();

        processedCard = await sharp({
          create: { width: cardWidth, height: cardHeight, channels: 4, background: '#1c1d21' },
        })
          .composite([{ input: icon, gravity: 'center' }])
          .png()
          .toBuffer();
      } else {
        let cardImage = sharp(imageBuffer).resize(cardWidth, cardHeight, {
          fit: useCover ? 'cover' : 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        });

        if (useCover) {
          processedCard = await cardImage
            .flatten({ background: { r: 0, g: 0, b: 0 } })
            .png()
            .toBuffer();
        } else {
          processedCard = await sharp({
            create: { width: cardWidth, height: cardHeight, channels: 4, background: '#1c1d21' },
          })
            .composite([{ input: await cardImage.toBuffer() }])
            .png()
            .toBuffer();
        }
      }
    } catch (error) {
      console.error(`Failed to load team image for ${item.name}: ${error.message}`);
      processedCard = await sharp({
        create: { width: cardWidth, height: cardHeight, channels: 4, background: '#1c1d21' },
      })
        .composite([
          {
            input: Buffer.from(
              `<svg width="${cardWidth}" height="${cardHeight}"><text x="50%" y="50%" font-family="sans-serif" font-size="30" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${item.name || 'Unknown'}</text></svg>`
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
  const outputPath = path.join(TEMP_DIR, `team-${Date.now()}.png`);

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
  name: 'team',
  aliases: ['kteam', 'squad'],
  description: 'Manage your battle team! (4 Slots) ✨',
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
        return message.reply('🚫 Team is full! Remove someone first. (っ˘ω˘ς)');

      const found = await findCharacter(charName);
      if (!found) return message.reply(`❌ You don't have **${charName}** in your collection!`);
      if (userData.team.includes(found.name)) return message.reply('🚫 Already in team! (◕‿◕✿)');

      userData.team.push(found.name);
      await database.saveUser(userData);
      return message.reply(
        `✅ Added **${found.name}** to Slot ${userData.team.length}! (ﾉ´ヮ\`)ﾉ*:･ﾟ✧`
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
    const inventory = await database.getHydratedInventory(message.author.id);
    const characters = inventory.filter((i) => i.type === 'character' || !i.type);
    const teamCharacters = userData.team
      .map((name) => characters.find((c) => c.name === name))
      .filter(Boolean);

    const imagePath = await createTeamImage(teamCharacters);

    const createEmbed = () => {
      const embed = new EmbedBuilder()
        .setColor(colors.primary)
        .setTitle(`🛡️ ${message.author.username}'s Battle Team`)
        .setDescription('Manage your squad composition below! (｡♥‿♥｡)');

      for (let i = 0; i < 4; i++) {
        const charName = userData.team[i];
        const charData = charName ? characters.find((c) => c.name === charName) : null;
        const star = charData ? (charData.rarity === 5 ? '🟡' : '🟣') : '';

        embed.addFields({
          name: `Slot ${i + 1}`,
          value: charName ? `${star} **${charName}**` : '*Empty Slot*',
          inline: true,
        });
      }

      if (imagePath) {
        embed.setImage('attachment://team-display.png');
      } else if (userData.team.length > 0) {
        const firstChar = characters.find((c) => c.name === userData.team[0]);
        if (firstChar) embed.setThumbnail(getCharacterIcon(firstChar));
      }

      return embed;
    };

    const createButtons = () => {
      const row = new ActionRowBuilder();
      for (let i = 0; i < 4; i++) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`remove_${i + 1}`)
            .setLabel(`Clear Slot ${i + 1}`)
            .setStyle(ButtonStyle.Danger)
            .setDisabled(!userData.team[i])
        );
      }
      return [row];
    };

    const files = [];
    if (imagePath) {
      files.push(new AttachmentBuilder(imagePath, { name: 'team-display.png' }));
    }

    const msg = await message.reply({
      embeds: [createEmbed()],
      components: userData.team.length > 0 ? createButtons() : [],
      files: files,
    });

    if (imagePath) {
      fs.unlink(imagePath, (err) => {
        if (err) console.error(`Failed to delete temp image: ${imagePath}`, err);
      });
    }

    if (userData.team.length > 0) {
      const collector = msg.createMessageComponentCollector({ time: 60000 });

      collector.on('collect', async (i) => {
        if (i.user.id !== message.author.id)
          return i.reply({
            content: "This isn't your squad, darling! (っ˘ω˘ς)",
            flags: [MessageFlags.Ephemeral],
          });

        const slot = parseInt(i.customId.split('_')[1]);
        userData.team.splice(slot - 1, 1);
        await database.saveUser(userData);

        const newTeamChars = userData.team
          .map((name) => characters.find((c) => c.name === name))
          .filter(Boolean);
        const newImagePath = await createTeamImage(newTeamChars);
        const newFiles = [];
        if (newImagePath) {
          newFiles.push(new AttachmentBuilder(newImagePath, { name: 'team-display.png' }));
        }

        await i.update({
          embeds: [createEmbed()],
          components: userData.team.length > 0 ? createButtons() : [],
          files: newFiles,
        });

        if (newImagePath) {
          fs.unlink(newImagePath, (err) => {
            if (err) console.error(`Failed to delete temp image: ${newImagePath}`, err);
          });
        }
      });

      collector.on('end', () => {
        msg.edit({ components: [] }).catch(() => {});
      });
    }
  },
};
