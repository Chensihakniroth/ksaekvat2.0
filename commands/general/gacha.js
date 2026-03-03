const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const fs = require('fs');
const path = require('path');
const GachaService = require('../../services/GachaService.js');
const EconomyService = require('../../services/EconomyService.js');

const POOL_FILE = path.join(__dirname, '../../data/character_pool.json');
const PULL_COST = 10000;

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
                return message.reply(`💸 Oh no, sweetie! Your free pull is already used, and you need **${EconomyService.format(PULL_COST)}** riel to wish again. (｡•́︿•̀｡)`);
            }
            await database.removeBalance(message.author.id, PULL_COST);
        }

        const fullPool = JSON.parse(fs.readFileSync(POOL_FILE, 'utf8'));
        const pool = fullPool[gameKey];
        
        if (!pool) {
            return message.reply('❌ Oopsie! I couldn\'t find that game pool. (っ˘ω˘ς)');
        }

        // --- PERFORM PULLS (Using Service) ---
        const { results: rawResults, pity5, pity4 } = GachaService.performMultiPull(userData, pool);
        
        // Update user pity and daily status
        userData.pity = pity5;
        userData.pity4 = pity4;
        if (!usedExtra) userData.dailyPulls++;
        
        // Add items to database and hydrate them
        const results = [];
        for (const item of rawResults) {
            const added = await database.addGachaItem(message.author.id, item.name);
            results.push(added);
        }

        await database.saveUser(userData);

        // --- RENDER UI ---
        const hasFiveStar = results.some(r => r.rarity === 5);
        const bannerGif = hasFiveStar 
            ? 'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExb2FoZ2Rid3E4MnduY245eWhzaDNpczNwcmZmczY1eWtsdGU5YjlubCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/d6NUYe7RL9UyZA8yQg/giphy.gif' 
            : 'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExamRjeTA2Zm1sdXdpZTR5MHY0OGh3bnR2a3Fpa3JnczI4MHpybndvYSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/lEHPEcGSmREHCqtqDw/giphy.gif';

        const initialEmbed = new EmbedBuilder()
            .setColor('#2F3136')
            .setTitle(`✨ Manifesting in ${gameKey.toUpperCase()}...`)
            .setImage(bannerGif);

        const gameMsg = await message.reply({ embeds: [initialEmbed] });

        const waitTime = hasFiveStar ? 9000 : 4900;
        await new Promise(r => setTimeout(r, waitTime));

        const resultText = results.map(r => {
            const starIcon = r.rarity === 5 ? '🔶' : (r.rarity === 4 ? '🔷' : '⚪');
            return `${starIcon} ${r.emoji} **${r.name}**`;
        }).join('\n');

        let footerParts = [];
        if (usedExtra) footerParts.push(`Used Promo Pull (${userData.extraPulls} left)`);
        else if (isFree) footerParts.push('Daily Free Pull used!');
        else footerParts.push(`Paid Pull (${EconomyService.format(PULL_COST)} riel)`);
        
        footerParts.push(`Pity: ${userData.pity}/90`);

        const finalEmbed = new EmbedBuilder()
            .setColor(hasFiveStar ? '#FFB13F' : '#A256FF')
            .setTitle(`✨ Manifestation Confirmed [${gameKey.toUpperCase()}]`)
            .setDescription(`**Results:**\n${resultText}`)
            .setFooter({ text: footerParts.join(' | ') });

        await gameMsg.edit({ embeds: [finalEmbed] });
    }
};
