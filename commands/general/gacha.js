const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const fs = require('fs');
const path = require('path');

const POOL_FILE = path.join(__dirname, '../../data/character_pool.json');
const PULL_COST = 1000000;

module.exports = {
    name: 'gacha',
    aliases: ['pull', 'wish', 'roll'],
    description: 'Daily free 10-pull, or buy more for 1M riel!',
    usage: 'gacha',
    cooldown: 5000,
    async execute(message, args, client) {
        const userData = database.getUser(message.author.id);
        const now = new Date();
        const lastReset = userData.lastGachaReset ? new Date(userData.lastGachaReset) : null;

        if (!lastReset || lastReset.getDate() !== now.getDate() || lastReset.getMonth() !== now.getMonth()) {
            userData.dailyPulls = 0;
            userData.lastGachaReset = now.toISOString();
        }

        let isFree = userData.dailyPulls === 0;
        if (!isFree) {
            if (!database.hasBalance(message.author.id, PULL_COST)) {
                return message.reply(`💸 hg bat pull free hz! Trov ka **${PULL_COST.toLocaleString()}** riel teat.`);
            }
            database.removeBalance(message.author.id, PULL_COST);
        }

        const pool = JSON.parse(fs.readFileSync(POOL_FILE, 'utf8'));
        let results = [];
        for (let i = 0; i < 10; i++) {
            let rarity;
            const rand = Math.random() * 100;
            const hasEpicPlus = results.some(r => r.rarity >= 4);
            if (i === 9 && !hasEpicPlus) rarity = Math.random() < 0.1 ? "5" : "4"; 
            else {
                if (rand < 0.6) rarity = "5";
                else if (rand < 5.7) rarity = "4";
                else rarity = "3";
            }
            const char = pool[rarity][Math.floor(Math.random() * pool[rarity].length)];
            results.push({ ...char, rarity: parseInt(rarity) });
        }

        userData.gacha_inventory = userData.gacha_inventory || [];
        userData.gacha_inventory.push(...results);
        userData.dailyPulls++;
        database.saveUser(userData);

        const hasFiveStar = results.some(r => r.rarity === 5);
        const bannerGif = hasFiveStar 
            ? 'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExb2FoZ2Rid3E4MnduY245eWhzaDNpczNwcmZmczY1eWtsdGU5YjlubCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/d6NUYe7RL9UyZA8yQg/giphy.gif' 
            : 'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExamRjeTA2Zm1sdXdpZTR5MHY0OGh3bnR2a3Fpa3JnczI4MHpybndvYSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/lEHPEcGSmREHCqtqDw/giphy.gif';

        // 1. Send Cinematic Initial Embed (No color, just GIF)
        const initialEmbed = new EmbedBuilder()
            .setColor('#2F3136') // Dark grey / invisible-ish color
            .setTitle('✨ Manifesting...')
            .setImage(bannerGif);

        const gameMsg = await message.reply({ embeds: [initialEmbed] });

        // 2. Dynamic Wait: 4.9s for 4-star, 9s for 5-star
        const waitTime = hasFiveStar ? 9000 : 4900;
        await new Promise(r => setTimeout(r, waitTime));

        // 3. Reveal Results
        const resultText = results.map(r => {
            const starIcon = r.rarity === 5 ? '🔶' : (r.rarity === 4 ? '🔷' : '⚪');
            return `${starIcon} **${r.name}** \`[${r.game}]\``;
        }).join('\n');

        const finalEmbed = new EmbedBuilder()
            .setColor(hasFiveStar ? '#FFB13F' : '#A256FF')
            .setTitle(`✨ Manifestation Confirmed`)
            .setDescription(`**Results:**\n${resultText}`)
            .setFooter({ text: isFree ? 'Daily Free Pull used!' : `Paid Pull (${PULL_COST.toLocaleString()} riel)` });

        await gameMsg.edit({ embeds: [finalEmbed] });
    }
};