const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const fs = require('fs');
const path = require('path');

const POOL_FILE = path.join(__dirname, '../../data/character_pool.json');
const PULL_COST = 10000;

module.exports = {
    name: 'gacha',
    aliases: ['pull', 'wish', 'roll'],
    description: 'Daily free 10-pull, or buy more for 10k riel! (GS, HSR, WuWa)',
    usage: 'gacha <gs/hsr/wuwa>',
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

        const userData = await database.getUser(message.author.id);
        const now = new Date();
        const lastReset = userData.lastGachaReset ? new Date(userData.lastGachaReset) : null;

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

        if (!isFree) {
            if (!(await database.hasBalance(message.author.id, PULL_COST))) {
                return message.reply(`💸 Oh no, sweetie! Your free pull is already used, and you need **${PULL_COST.toLocaleString()}** riel to wish again. (｡•́︿•̀｡)`);
            }
            await database.removeBalance(message.author.id, PULL_COST);
        }

        const fullPool = JSON.parse(fs.readFileSync(POOL_FILE, 'utf8'));
        const pool = fullPool[gameKey];
        
        if (!pool) {
            return message.reply('❌ Oopsie! I couldn\'t find that game pool. (っ˘ω˘ς)');
        }

        let results = [];
        for (let i = 0; i < 10; i++) {
            let rarity;
            const rand = Math.random() * 100;
            const hasEpicPlus = results.some(r => r.rarity >= 4);
            
            if (i === 9 && !hasEpicPlus) {
                rarity = Math.random() < 0.1 ? "5" : "4"; 
            } else {
                if (rand < 0.6) rarity = "5";
                else if (rand < 5.7) rarity = "4";
                else rarity = "3";
            }
            
            const charList = pool[rarity];
            const item = charList[Math.floor(Math.random() * charList.length)];
            
            const addedItem = await database.addGachaItem(message.author.id, item.name);
            results.push(addedItem);
        }

        if (!usedExtra) {
            userData.dailyPulls++;
            await database.saveUser(userData);
        }
        
        await database.saveUser(userData);

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

        let footerText = `Paid Pull (${PULL_COST.toLocaleString()} riel)`;
        if (usedExtra) footerText = `Used Promo Pull (${userData.extraPulls} left)`;
        else if (isFree) footerText = 'Daily Free Pull used!';

        const finalEmbed = new EmbedBuilder()
            .setColor(hasFiveStar ? '#FFB13F' : '#A256FF')
            .setTitle(`✨ Manifestation Confirmed [${gameKey.toUpperCase()}]`)
            .setDescription(`**Results:**\n${resultText}`)
            .setFooter({ text: footerText });

        await gameMsg.edit({ embeds: [finalEmbed] });
    }
};