const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
    name: 'hunt',
    aliases: ['hunting'],
    description: 'Hunt for animals. Chance for Loot Boxes!',
    usage: 'hunt',
    cooldown: 10000,
    async execute(message, args, client) {
        const userData = await database.getUser(message.author.id, message.author.username);
        const animalsData = await database.loadAnimals();
        
        if (Math.random() < config.hunting.distractionChance) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor(colors.warning)
                    .setTitle('😅 Distracted!')
                    .setDescription('hg got distracted and found nothing!')]
            });
        }

        // --- RARITY LOGIC ---
        const rarities = config.hunting.rarities;
        const isBoosted = userData.hunt_boost > 0;
        
        let totalWeight = 0;
        for (const [key, r] of Object.entries(rarities)) {
            // Apply 5x multiplier to non-common rarities if boosted
            const weightMult = (isBoosted && key !== 'common') ? 5 : 1;
            totalWeight += r.weight * weightMult;
        }

        const random = Math.random() * totalWeight;
        let currentWeight = 0;
        let selectedRarity = 'common';

        for (const [key, r] of Object.entries(rarities)) {
            const weightMult = (isBoosted && key !== 'common') ? 5 : 1;
            currentWeight += r.weight * weightMult;
            if (random <= currentWeight) {
                selectedRarity = key;
                break;
            }
        }

        const available = animalsData[selectedRarity];
        if (!available || Object.keys(available).length === 0) {
            return message.reply("❌ Error: No animals found for this rarity. Please check the animal data.");
        }
        const animalKey = Object.keys(available)[Math.floor(Math.random() * Object.keys(available).length)];
        const animal = available[animalKey];

        // --- REWARDS ---
        await database.addAnimal(message.author.id, animalKey, selectedRarity);
        const expReward = Math.floor(rarities[selectedRarity].value / 25) + 5;
        const expRes = await database.addExperience(message.author.id, expReward);

        // Loot Box Chance (25%)
        let gotLootBox = false;
        if (Math.random() < 0.25) {
            userData.lootbox = (userData.lootbox || 0) + 1;
            gotLootBox = true;
        }

        // Consume Boost Turn
        if (isBoosted) {
            userData.hunt_boost--;
        }
        await database.saveUser(userData);

        const embed = new EmbedBuilder()
            .setColor(parseInt(rarities[selectedRarity].color.slice(1), 16))
            .setTitle(`${animal.emoji} Hunt Success!`)
            .setDescription(`hg khernh **${animal.name}**!\n*${rarities[selectedRarity].name} Rarity*`)
            .addFields(
                { name: '⭐ Rank Exp', value: `+${expReward} XP`, inline: true },
                { name: '✨ Status', value: isBoosted ? `🔥 **BOOSTED** (${userData.hunt_boost} left)` : 'Normal', inline: true }
            );

        if (gotLootBox) {
            embed.addFields({ name: '🎁 Special Find!', value: 'hg khernh **Loot Box** 1! Open it in `Krpginv`!' });
        }

        if (expRes.leveledUp) embed.setFooter({ text: `🎉 Level Up! You are now Rank ${expRes.newLevel}` });

        await database.updateStats(message.author.id, 'command');
        await database.updateStats(message.author.id, 'hunt_success', 1);
        message.reply({ embeds: [embed] });
    }
};