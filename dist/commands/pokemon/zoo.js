"use strict";
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, MessageFlags } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const AnimalService = require('../../services/AnimalService.js');
const EconomyService = require('../../services/EconomyService');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const sharp = require('sharp');
const TEMP_DIR = path.join(__dirname, '..', '..', '.tmp');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}
async function createPCBoxImage(boxName, boxPokemons) {
    const cols = 6;
    const rows = 5;
    const cellSize = 90;
    const padding = 20;
    const headerHeight = 80;
    const canvasWidth = padding * 2 + cols * cellSize;
    const canvasHeight = headerHeight + padding + rows * cellSize;
    // Colors for a modern sleek PC Box style
    const bgSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}">
      <!-- Background -->
      <rect width="${canvasWidth}" height="${canvasHeight}" rx="15" ry="15" fill="#f0ebd8" />
      <rect x="10" y="10" width="${canvasWidth - 20}" height="${canvasHeight - 20}" rx="10" ry="10" fill="none" stroke="#77aaff" stroke-width="4" />
      
      <!-- Header -->
      <rect x="20" y="20" width="${canvasWidth - 40}" height="45" rx="5" ry="5" fill="#4fa4ff" />
      <text x="${canvasWidth / 2}" y="50" font-family="sans-serif" font-size="24" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">${boxName}</text>
      
      <!-- Grid -->
      ${Array.from({ length: rows }).map((_, r) => Array.from({ length: cols }).map((_, c) => `<rect x="${padding + c * cellSize + 5}" y="${headerHeight + r * cellSize + 5}" width="${cellSize - 10}" height="${cellSize - 10}" rx="10" ry="10" fill="#ffffff" stroke="#c9e0ff" stroke-width="2"/>`).join('')).join('')}
    </svg>`);
    const composites = [{ input: bgSvg, top: 0, left: 0 }];
    // Fetch all images for the given array of up to 30 pokemon
    // We'll map them by index
    for (let i = 0; i < Math.min(boxPokemons.length, 30); i++) {
        const pkmn = boxPokemons[i];
        if (!pkmn)
            continue;
        const r = Math.floor(i / cols);
        const c = i % cols;
        const x = padding + c * cellSize + 5;
        const y = headerHeight + r * cellSize + 5;
        try {
            const spriteUrl = await AnimalService.getPokemonSprite(pkmn.key);
            if (spriteUrl) {
                const resp = await axios.get(spriteUrl, { responseType: 'arraybuffer', timeout: 3000 });
                const imgBuffer = Buffer.from(resp.data);
                const charLayer = await sharp(imgBuffer)
                    // Resize to fit nicely within the cell
                    .resize(cellSize - 25, cellSize - 25, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                    .toBuffer();
                // Render the sprite in the cell
                composites.push({ input: charLayer, top: y + 8, left: x + 8 });
            }
            // Render count badge if they have > 1
            if (pkmn.count > 1) {
                const badgeSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cellSize - 10}" height="${cellSize - 10}">
             <rect x="${cellSize - 38}" y="${cellSize - 30}" width="26" height="18" rx="5" ry="5" fill="#e63946"/>
             <text x="${cellSize - 25}" y="${cellSize - 18}" font-family="sans-serif" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">x${pkmn.count}</text>
          </svg>`);
                composites.push({ input: badgeSvg, top: y, left: x });
            }
        }
        catch (e) {
            console.warn('Failed to load sprite for PC Box:', pkmn.key, e.message);
        }
    }
    const outPath = path.join(TEMP_DIR, `box-${Date.now()}-${Math.floor(Math.random() * 1000)}.png`);
    await sharp({
        create: { width: canvasWidth, height: canvasHeight, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
    }).composite(composites).png().toFile(outPath);
    return outPath;
}
module.exports = {
    name: 'zoo',
    aliases: ['collection', 'animals', 'pokemon', 'pokedex', 'box', 'pc'],
    description: 'Access your Pokémon Storage System (PC Box) 💻✨',
    usage: 'zoo [@user]',
    async execute(message, args, client) {
        let target = message.author;
        if (message.mentions.users.size > 0)
            target = message.mentions.users.first();
        else if (args.length > 0) {
            const userId = args[0].replace(/[<@!>]/g, '');
            const foundUser = client.users.cache.get(userId);
            if (foundUser)
                target = foundUser;
        }
        try {
            await message.channel.sendTyping();
        }
        catch (e) { }
        const userData = await database.getUser(target.id, target.username);
        const animalsData = await database.loadAnimals();
        const userAnimals = userData.animals || {};
        const { totalAnimals, totalValue, rarityStats } = AnimalService.calculateZooStats(userAnimals, animalsData);
        if (totalAnimals === 0) {
            return message.reply({
                embeds: [
                    new EmbedBuilder().setColor(colors.warning).setDescription(`Oh darling, (｡•́︿•̀｡)\n**${target.username}** doesn't have any Pokémon to put in the PC! Use \`Khunt\` to catch some!`)
                ]
            });
        }
        const kantoDexEntryNames = await AnimalService.getKantoPokedexEntries();
        // Flatten all caught pokemon into an array
        const allCaught = [];
        const rarityEntries = userAnimals instanceof Map ? userAnimals.entries() : Object.entries(userAnimals);
        for (const [rarity, animalsMap] of rarityEntries) {
            const entries = animalsMap instanceof Map ? animalsMap.entries() : Object.entries(animalsMap);
            for (const [key, count] of entries) {
                const def = animalsData[rarity]?.[key];
                // Ensure they have it caught, it exists, AND it's a valid Kanto Pokemon! (Or a custom local override)
                if (count > 0 && def && kantoDexEntryNames.has(key.toLowerCase())) {
                    allCaught.push({
                        key: key,
                        name: def.name,
                        rarity: rarity,
                        weight: config.hunting.rarities[rarity]?.weight || 50,
                        val: def.value,
                        count: Number(count)
                    });
                }
            }
        }
        // Sort heavily by rarity first, then alphabetically
        allCaught.sort((a, b) => a.weight - b.weight || a.name.localeCompare(b.name));
        const chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));
        const boxes = chunk(allCaught, 30);
        let currentBox = 0;
        const generatePCMessage = async (boxIndex) => {
            const boxName = `PC BOX ${boxIndex + 1}`;
            const imgPath = await createPCBoxImage(boxName, boxes[boxIndex]);
            const embed = new EmbedBuilder()
                .setColor('#ff4a4a') // Official Red Version color
                .setTitle(`💻 PKMN PC System `)
                .setDescription(`Accessing Bill's PC... (◕‿◕✿)\n**User:** ${target.username}\n**Kanto Pokémon:** ${allCaught.length}/151`)
                .setImage('attachment://pc-box.png')
                .setFooter({ text: `${boxName} | Box ${boxIndex + 1} of ${boxes.length} | Net Worth: ${EconomyService.format(totalValue)}` })
                .setTimestamp();
            const files = [new AttachmentBuilder(imgPath, { name: 'pc-box.png' })];
            const row = new ActionRowBuilder();
            row.addComponents(new ButtonBuilder()
                .setCustomId('zoo_prev')
                .setEmoji('◀️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(boxIndex === 0), new ButtonBuilder()
                .setCustomId('zoo_next')
                .setEmoji('▶️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(boxIndex === boxes.length - 1));
            // Add extra quick stats if page 1
            if (boxIndex === 0 && boxes.length > 0) {
                const badges = AnimalService.calculateBadges(userData.stats?.totalAnimalsFound || 0, totalValue, userAnimals);
                if (badges.length > 0) {
                    embed.addFields({ name: '🏅 Badges', value: badges.join(' | ') });
                }
            }
            return { embed, files, components: boxes.length > 1 ? [row] : [], imgPath };
        };
        const payload = await generatePCMessage(currentBox);
        const msg = await message.reply({ embeds: [payload.embed], files: payload.files, components: payload.components });
        // Cleanup first image
        if (payload.imgPath)
            fs.unlink(payload.imgPath, () => { });
        if (boxes.length > 1) {
            const collector = msg.createMessageComponentCollector({ time: 120000 });
            collector.on('collect', async (i) => {
                if (i.user.id !== message.author.id) {
                    return i.reply({ content: "Please don't touch mommy's PC terminal unless it's yours! (っ˘ω˘ς)", flags: [MessageFlags.Ephemeral] });
                }
                if (i.customId === 'zoo_prev' && currentBox > 0)
                    currentBox--;
                else if (i.customId === 'zoo_next' && currentBox < boxes.length - 1)
                    currentBox++;
                await i.deferUpdate();
                const newPayload = await generatePCMessage(currentBox);
                await msg.edit({ embeds: [newPayload.embed], files: newPayload.files, components: newPayload.components });
                if (newPayload.imgPath)
                    fs.unlink(newPayload.imgPath, () => { });
            });
            collector.on('end', () => {
                msg.edit({ components: [] }).catch(() => { });
            });
        }
        await database.updateStats(message.author.id, 'command');
    }
};
