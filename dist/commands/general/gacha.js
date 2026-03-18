"use strict";
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const database = require('../../services/DatabaseService');
const GachaService = require('../../services/GachaService').default || require('../../services/GachaService');
const EconomyService = require('../../services/EconomyService').default || require('../../services/EconomyService');
const gachaConfig = require('../../config/gachaConfig.js');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const sharp = require('sharp');
const { getItemEmoji, getRarityEmoji, getElementEmoji, getRoleEmoji } = require('../../utils/images.js');
const PULL_COST = 10000;
const TEMP_DIR = path.join(__dirname, '..', '..', '.tmp');
// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}
async function createGachaResultImage(results) {
    if (!results || results.length === 0)
        return null;
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
            let imageBuffer;
            if (item.image_url && item.image_url.startsWith('http')) {
                const response = await axios.get(item.image_url, {
                    responseType: 'arraybuffer',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
                        'Referer': 'https://pokemon.fandom.com/'
                    }
                });
                imageBuffer = Buffer.from(response.data);
            }
            else if (item.image_url) {
                // Handle local paths! (｡♥‿♥｡)
                const fullPath = path.isAbsolute(item.image_url) ? item.image_url : path.join(process.cwd(), item.image_url);
                if (fs.existsSync(fullPath)) {
                    imageBuffer = fs.readFileSync(fullPath);
                }
                else {
                    throw new Error(`Local file not found: ${fullPath}`);
                }
            }
            else {
                throw new Error('No image_url provided');
            }
            const game = item.game?.toLowerCase();
            const useCover = ['genshin', 'wuwa', 'hsr'].includes(game);
            // Mommy's rarity colors! (｡♥‿♥｡)
            const rarityColors = {
                5: '#FFB13F', // Gold
                4: '#A256FF', // Purple
                3: '#51A0FF' // Blue
            };
            const bgColor = rarityColors[item.rarity] || '#1c1d21';
            let cardImage = sharp(imageBuffer).resize(cardWidth, cardHeight, {
                fit: useCover ? 'cover' : 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            });
            if (useCover) {
                // For Genshin/WuWa/HSR, flatten with rarity background
                processedCard = await cardImage
                    .flatten({ background: bgColor })
                    .png()
                    .toBuffer();
            }
            else {
                // For others (ZZZ, Common items), place the image onto a card with rarity background and a nice border! (｡♥‿♥｡)
                const borderSize = 14;
                const innerCard = await sharp({
                    create: {
                        width: cardWidth - borderSize * 2,
                        height: cardHeight - borderSize * 2,
                        channels: 4,
                        background: bgColor,
                    },
                })
                    .composite([{
                        input: await cardImage.resize(cardWidth - 80, cardHeight - 120, { fit: 'contain' }).toBuffer(),
                        blend: 'over'
                    }])
                    .png()
                    .toBuffer();
                processedCard = await sharp({
                    create: {
                        width: cardWidth,
                        height: cardHeight,
                        channels: 4,
                        background: '#ffffff', // Clean white border! (｡♥‿♥｡)
                    },
                })
                    .composite([{ input: innerCard, top: borderSize, left: borderSize }])
                    .png()
                    .toBuffer();
            }
        }
        catch (error) {
            console.error(`Failed to load/process image for ${item.name} from URL ${item.image_url}: ${error.message}`);
            // Create a fallback placeholder card
            processedCard = await sharp({
                create: { width: cardWidth, height: cardHeight, channels: 4, background: '#1c1d21' },
            })
                .composite([
                {
                    input: Buffer.from(`<svg width="${cardWidth}" height="${cardHeight}">
                        <text x="50%" y="50%" font-family="sans-serif" font-size="30" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${item.name || 'Unknown'}</text>
                    </svg>`),
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
    aliases: ['pull', 'wish', 'roll', 'kw'],
    description: 'Daily free 10-pull, or buy more for 10k <:coin:1480551418464305163>! ✨',
    usage: 'gacha <gs/hsr/wuwa/zzz>',
    cooldown: 5000,
    async execute(message, args, client) {
        const gameArg = args.join(' ').toLowerCase();
        let gameKey = '';
        if (gameArg.includes('genshin') || gameArg === 'gs')
            gameKey = 'genshin';
        else if (gameArg.includes('hsr') || gameArg.includes('honkai') || gameArg.includes('star rail'))
            gameKey = 'hsr';
        else if (gameArg.includes('wuwa') || gameArg.includes('wuthering') || gameArg.includes('waves'))
            gameKey = 'wuwa';
        else if (gameArg.includes('zzz') || gameArg.includes('zenless') || gameArg.includes('zero'))
            gameKey = 'zzz';
        if (!gameKey) {
            return message.reply('✨ Please specify a game! Example: `kwish gs`, `kwish hsr`, `kwish wuwa`, or `kwish zzz` (ﾉ´ヮ`)ﾉ*:･ﾟ✧');
        }
        const userData = await database.getUser(message.author.id, message.author.username);
        const now = new Date();
        const lastReset = userData.lastGachaReset ? new Date(userData.lastGachaReset) : null;
        if (!lastReset ||
            lastReset.getDate() !== now.getDate() ||
            lastReset.getMonth() !== now.getMonth()) {
            userData.dailyPulls = 0;
            userData.lastGachaReset = now.toISOString();
        }
        let isFree = false;
        let usedExtra = false;
        if (userData.extraPulls > 0) {
            userData.extraPulls--;
            usedExtra = true;
            isFree = true;
        }
        else if (userData.dailyPulls === 0) {
            isFree = true;
        }
        if (!isFree) {
            if (!(await database.hasBalance(message.author.id, PULL_COST))) {
                return message.reply(`💸 Oh no, sweetie! Your free pull is already used, and you need **${EconomyService.format(PULL_COST)}** <:coin:1480551418464305163> to wish again. (｡•́︿•̀｡)`);
            }
            await database.removeBalance(message.author.id, PULL_COST);
        }
        const fullPool = await database.getGachaPool();
        const pool = fullPool[gameKey];
        if (!pool)
            return message.reply("❌ Oopsie! I couldn't find that game pool. (っ˘ω˘ς)");
        const { results, pity5, pity4 } = GachaService.performMultiPull(userData, pool);
        userData.pity = pity5;
        userData.pity4 = pity4;
        if (!usedExtra)
            userData.dailyPulls++;
        let bonusMasterball = false;
        // Check for 5-star characters specifically to grant the bonus
        const hasFiveStarCharacter = results.some((r) => r.rarity === 5 && (r.type === 'character' || !r.type));
        if (hasFiveStarCharacter) {
            // 25% chance to get a bonus master ball! (｡♥‿♥｡)
            if (Math.random() < 0.25) {
                bonusMasterball = true;
                await database.addGachaItem(message.author.id, 'Master Ball');
            }
        }
        const hasFiveStar = results.some((r) => r.rarity === 5);
        const hasFourStar = results.some((r) => r.rarity >= 4); // Use >= 4 to correctly trigger the 4-star animation if a 5-star is also present
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
            const rarityEmoji = getRarityEmoji(item.rarity, client, item);
            const charEmoji = getItemEmoji(item, client);
            const name = item.name || 'Unknown Item';
            return `${rarityEmoji} ${charEmoji} **${name}**`;
        })
            .join('\n');
        let finalDescription = description;
        if (bonusMasterball) {
            finalDescription += `\n\n**BONUS!** You also found a 🟣 **Master Ball**! (｡♥‿♥｡)`;
        }
        let footerParts = [];
        if (usedExtra)
            footerParts.push(`Promo Pull (${userData.extraPulls} left)`);
        else if (isFree)
            footerParts.push('Daily Free Pull');
        else
            footerParts.push('Paid Pull');
        footerParts.push(`Pity: ${userData.pity}/90`);
        const finalEmbed = new EmbedBuilder()
            .setColor(hasFiveStar ? '#FFB13F' : '#A256FF')
            .setDescription(finalDescription)
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
            if (gameKey === 'genshin')
                waitTime = 4200;
            else if (gameKey === 'hsr')
                waitTime = hasFiveStar ? 4200 : 3200;
            else if (gameKey === 'wuwa')
                waitTime = hasFiveStar ? 3200 : 3000;
            else if (gameKey === 'zzz')
                waitTime = hasFiveStar ? 3200 : 3000;
        }
        await new Promise((r) => setTimeout(r, waitTime));
        const messagePayload = { embeds: [finalEmbed], files: files };
        try {
            if (mainMessage) {
                await mainMessage.edit(messagePayload);
            }
            else {
                await message.reply(messagePayload);
            }
        }
        catch (err) {
            console.error(`Failed to deliver gacha results (message might be deleted):`, err.message);
        }
        // --- STEP 4: Cleanup and save ---
        if (imagePath) {
            fs.unlink(imagePath, (err) => {
                if (err)
                    console.error(`Failed to delete temp image: ${imagePath}`, err);
            });
        }
        for (const item of results)
            await database.addGachaItem(message.author.id, item.name);
        // Update Quest Progress! (｡♥‿♥｡)
        const QuestService = require('../../services/QuestService').default || require('../../services/QuestService');
        await QuestService.updateProgress(message.author.id, 'GACHA', results.length);
        await database.saveUser(userData);
    },
};
