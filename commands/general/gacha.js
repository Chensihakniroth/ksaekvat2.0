const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const GachaService = require('../../services/GachaService.js');
const EconomyService = require('../../services/EconomyService.js');
const gachaConfig = require('../../config/gachaConfig.js');
const path = require('path');
const fs = require('fs');
const Jimp = require('jimp');
const axios = require('axios');

const POOL_FILE = path.join(__dirname, '../../data/character_pool.json');
const PULL_COST = 10000;
const TEMP_DIR = 'C:\\Users\\Niroth\\.gemini\\tmp\\ksaekvat-revamp';

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Load character pool once at startup
const FULL_POOL = JSON.parse(fs.readFileSync(POOL_FILE, 'utf8'));

// Load Jimp font once at startup
let loadedFont;
(async () => {
    loadedFont = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
})();


async function createGachaResultImage(results, gameKey) {
    const canvasWidth = 1280;
    const canvasHeight = 720;
    const cardWidth = 240;
    const cardHeight = 360;
    const padding = 10;
    const cols = 5;

    const canvas = await Jimp.create(canvasWidth, canvasHeight, '#2F3136');
    // Use the pre-loaded font
    const font = loadedFont;

    const star5Overlay = await Jimp.create(cardWidth, cardHeight, '#FFB13F40');
    const star4Overlay = await Jimp.create(cardWidth, cardHeight, '#A256FF40');

    // Parallelize image fetching
    const imagePromises = results.map(async (item) => {
        const imageName = gachaConfig.imagePaths[item.name];
        const gameData = gachaConfig.games[gameKey];
        let cardImage;

        if (imageName) {
            const imageUrl = `${gachaConfig.baseUrl}${gameData.imagePath}${imageName}`;
            try {
                const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                cardImage = await Jimp.read(response.data);
                cardImage.resize(cardWidth, Jimp.AUTO);

                const cardBackground = await Jimp.create(cardWidth, cardHeight, '#000000');
                const centerX = (cardWidth - cardImage.getWidth()) / 2;
                const centerY = (cardHeight - cardImage.getHeight()) / 2;
                cardBackground.composite(cardImage, centerX, centerY);
                cardImage = cardBackground;
            } catch (error) {
                console.error(`Failed to load image for ${item.name}: ${error.message}`);
                cardImage = await Jimp.create(cardWidth, cardHeight, '#5865F2');
                cardImage.print(font, 10, 10, item.name, cardWidth - 20);
            }
        } else {
            cardImage = await Jimp.create(cardWidth, cardHeight, '#36393F');
            cardImage.print(font, 10, 10, item.name, cardWidth - 20);
            const rarityText = `${item.rarity}-star`;
            cardImage.print(font, 10, 30, rarityText, cardWidth - 20);
        }

        if (item.rarity === 5) {
            cardImage.composite(star5Overlay, 0, 0);
        } else if (item.rarity === 4) {
            cardImage.composite(star4Overlay, 0, 0);
        }
        return cardImage;
    });

    const loadedCardImages = await Promise.all(imagePromises);

    for (let i = 0; i < loadedCardImages.length; i++) {
        const cardImage = loadedCardImages[i];
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = padding + col * (cardWidth + padding);
        const y = padding + row * (cardHeight + padding);
        canvas.composite(cardImage, x, y);
    }

    const outputPath = path.join(TEMP_DIR, `gacha-result-${Date.now()}.png`);
    await canvas.writeAsync(outputPath);
    return outputPath;
}


module.exports = {
    name: 'gacha',
    aliases: ['pull', 'wish', 'roll'],
    description: 'Daily free 10-pull, or buy more for 10k riel! Includes PITY SYSTEM! ✨',
    usage: 'gacha <gs/hsr/wuwa/zzz>',
    cooldown: 5000,
    async execute(message, args, client) {
        const gameArg = args.join(' ').toLowerCase();
        let gameKey = '';

        if (gameArg.includes('genshin') || gameArg === 'gs') gameKey = 'genshin';
        else if (gameArg.includes('hsr') || gameArg.includes('honkai') || gameArg.includes('star rail')) gameKey = 'hsr';
        else if (gameArg.includes('wuwa') || gameArg.includes('wuthering') || gameArg.includes('waves')) gameKey = 'wuwa';
        else if (gameArg.includes('zzz') || gameArg.includes('zenless') || gameArg.includes('zero')) gameKey = 'zzz';

        if (!gameKey) {
            return message.reply('✨ Please specify a game! Example: `kwish gs`, `kwish hsr`, `kwish wuwa`, or `kwish zzz` (ﾉ´ヮ`)ﾉ*:･ﾟ✧');
        }
        
        // --- STEP 1: Acknowledge command immediately to improve perceived speed ---
        const initialMessage = await message.reply(`✨ **Manifesting in ${gameData.name}...** (｡♥‿♥｡)`);

        // --- STEP 2: Perform all database operations ---
        const userData = await database.getUser(message.author.id, message.author.username);
        const now = new Date();
        const lastReset = userData.lastGachaReset ? new Date(userData.lastGachaReset) : null;

        // Daily Reset Logic
        if (!lastReset || lastReset.getDate() !== now.getDate() || lastReset.getMonth() !== now.getMonth()) {
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

        // Balance Check for Paid Pulls
        if (!isFree) {
            if (!(await database.hasBalance(message.author.id, PULL_COST))) {
                return initialMessage.edit(`💸 Oh no, sweetie! Your free pull is already used, and you need **${EconomyService.format(PULL_COST)}** riel to wish again. (｡•́︿•̀｡)`);
            }
            await database.removeBalance(message.author.id, PULL_COST);
        }

        const pool = FULL_POOL[gameKey]; // Use pre-loaded pool
        
        if (!pool) {
            return initialMessage.edit('❌ Oopsie! I couldn\'t find that game pool. (っ˘ω˘ς)');
        }

        // --- STEP 3: Perform pulls (in-memory, fast) ---
        const { results: rawResults, pity5, pity4 } = GachaService.performMultiPull(userData, pool);
        
        // Update user pity and daily status
        userData.pity = pity5;
        userData.pity4 = pity4;
        if (!usedExtra) userData.dailyPulls++;
        
        const results = [];
        for (const item of rawResults) {
            results.push(item);
        }

        // --- STEP 4: Prepare and display the GIF ---
        const hasFiveStar = results.some(r => r.rarity === 5);
        const hasFourStar = results.some(r => r.rarity === 4);
        
        let bannerGifUrl = null;
        if (hasFiveStar) {
            bannerGifUrl = gameData.animation['5'];
        } else if (hasFourStar) {
            bannerGifUrl = gameData.animation['4'];
        }
        
        let gifAttachment = null;
        if (bannerGifUrl) {
            try {
                let gifData;
                if (bannerGifUrl.startsWith('http')) {
                    const response = await axios.get(bannerGifUrl, { responseType: 'arraybuffer' });
                    gifData = Buffer.from(response.data);
                } else {
                    const absolutePath = path.resolve(bannerGifUrl);
                    gifData = fs.readFileSync(absolutePath);
                }
                gifAttachment = new AttachmentBuilder(gifData, { name: 'gacha_animation.gif' });
            } catch (error) {
                console.error(`Failed to load GIF from ${bannerGifUrl}: ${error.message}`);
                bannerGifUrl = null; 
            }
        }

        // --- STEP 5: Show animation, then results ---
        let waitTime;
        if (gameKey === 'wuwa' && bannerGifUrl) {
            waitTime = 6000;
        } else {
            waitTime = hasFiveStar ? 2000 : 1000;
        }
        
        let footerParts = [];
        if (usedExtra) footerParts.push(`Used Promo Pull (${userData.extraPulls} left)`);
        else if (isFree) footerParts.push('Daily Free Pull used!');
        else footerParts.push(`Paid Pull (${EconomyService.format(PULL_COST)} riel)`);
        footerParts.push(`Pity: ${userData.pity}/90`);

        const finalEmbed = new EmbedBuilder()
            .setColor(hasFiveStar ? '#FFB13F' : '#A256FF')
            .setTitle(`✨ Manifestation Confirmed [${gameData.name}]`)
            .setFooter({ text: footerParts.join(' | ') });
            
        let filesToSend = [];

        // Now, edit the initial message to show the GIF, or show the final result directly
        if (bannerGifUrl && gifAttachment) {
            finalEmbed.setImage(`attachment://${gifAttachment.name}`);
            filesToSend.push(gifAttachment);
            await initialMessage.edit({ content: ' ', embeds: [finalEmbed], files: filesToSend });
            
            await new Promise(r => setTimeout(r, waitTime));

            const imagePath = await createGachaResultImage(results, gameKey);
            const resultImageAttachment = new AttachmentBuilder(imagePath, { name: 'gacha-result.png' });
            await message.channel.send({ files: [resultImageAttachment] });
            
            try {
                await initialMessage.delete();
            } catch (error) {
                console.error("Failed to delete GIF message, maybe it was already gone?", error);
            }
            
            fs.unlink(imagePath, (err) => {
                if (err) console.error(`Failed to delete temp image: ${imagePath}`, err);
            });

        } else { // No GIF, show results directly
            const imagePath = await createGachaResultImage(results, gameKey);
            const resultImageAttachment = new AttachmentBuilder(imagePath, { name: 'gacha-result.png' });
            finalEmbed.setImage('attachment://gacha-result.png');
            filesToSend.push(resultImageAttachment);
            await initialMessage.edit({ content: ' ', embeds: [finalEmbed], files: filesToSend });

            fs.unlink(imagePath, (err) => {
                if (err) console.error(`Failed to delete temp image: ${imagePath}`, err);
            });
        }
        
        // --- STEP 6: Save to database ---
        for (const item of results) {
            await database.addGachaItem(message.author.id, item.name);
        }
        await database.saveUser(userData);
    }
};
