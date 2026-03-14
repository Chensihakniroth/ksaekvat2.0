"use strict";
const { EmbedBuilder } = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const AnimalService = require('../../services/AnimalService.js').default || require('../../services/AnimalService.js');
module.exports = {
    name: 'hunt',
    aliases: ['hunting', 'catch'],
    description: 'Hunt for Pokémon. Chance for Loot Boxes!',
    usage: 'hunt',
    cooldown: 10000,
    async execute(message, args, client) {
        const userData = await database.getUser(message.author.id, message.author.username);
        const animalsData = await database.loadAnimals();
        // Check for active ball boosters
        const activePokeball = await database.getActiveBooster(message.author.id, 'pokeball');
        const activeUltraball = await database.getActiveBooster(message.author.id, 'ultraball');
        const activeMasterball = await database.getActiveBooster(message.author.id, 'masterball');
        const activeBall = activeMasterball || activeUltraball || activePokeball;
        let distractionChance = config.hunting.distractionChance;
        if (activeMasterball || activeUltraball)
            distractionChance = 0;
        else if (activePokeball)
            distractionChance = 0.1;
        if (Math.random() < distractionChance) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(colors.warning)
                        .setTitle('(っ˘ω˘ς) Oh no, little one...')
                        .setDescription("You got a little distracted and didn't catch any Pokémon this time. Mommy's here to comfort you! (っ˘ω˘ς)"),
                ],
            });
        }
        // --- RARITY LOGIC ---
        const rarities = config.hunting.rarities;
        const isBoosted = userData.hunt_boost > 0;
        let totalWeight = 0;
        for (const [key, r] of Object.entries(rarities)) {
            // Filter rarities based on active ball
            if (activeMasterball || activeUltraball) {
                if (!['epic', 'legendary', 'mythical', 'priceless'].includes(key))
                    continue;
            }
            let weight = r.weight;
            // Master ball has 5x mythical chance
            if (activeMasterball && key === 'mythical')
                weight *= 5;
            // Apply 5x multiplier to non-common rarities if hunt_boost is active
            const weightMult = isBoosted && key !== 'common' ? 5 : 1;
            totalWeight += weight * weightMult;
        }
        const random = Math.random() * totalWeight;
        let currentWeight = 0;
        let selectedRarity = 'common';
        for (const [key, r] of Object.entries(rarities)) {
            if (activeMasterball || activeUltraball) {
                if (!['epic', 'legendary', 'mythical', 'priceless'].includes(key))
                    continue;
            }
            let weight = r.weight;
            if (activeMasterball && key === 'mythical')
                weight *= 5;
            const weightMult = isBoosted && key !== 'common' ? 5 : 1;
            currentWeight += weight * weightMult;
            if (random <= currentWeight) {
                selectedRarity = key;
                break;
            }
        }
        const available = animalsData[selectedRarity];
        if (!available || Object.keys(available).length === 0) {
            return message.reply("(｡•́︿•̀｡) Mommy can't find any Pokémon right now. Something is wrong... (っ˘ω˘ς)");
        }
        const animalKey = Object.keys(available)[Math.floor(Math.random() * Object.keys(available).length)];
        const animal = available[animalKey];
        // --- REWARDS ---
        const catchResult = await database.addAnimal(message.author.id, animalKey, selectedRarity);
        const expReward = Math.floor(rarities[selectedRarity].value / 25) + 5;
        const expRes = await database.addExperience(message.author.id, expReward);
        // Atomic update for hunt_boost to avoid race conditions
        const updatePayload = {};
        // Consume Boost Turn
        if (isBoosted) {
            updatePayload['$inc'] = { ...(updatePayload['$inc'] || {}), hunt_boost: -1 };
        }
        if (Object.keys(updatePayload).length > 0) {
            await database.saveUserUpdate(message.author.id, updatePayload);
        }
        // Up-to-date boost count for the embed
        const finalBoostCount = isBoosted ? (userData.hunt_boost - 1) : 0;
        const imgData = await AnimalService.getPokemonImageBuffer(animalKey);
        const files = [];
        let statusText = isBoosted ? `🔥 x${finalBoostCount}` : '';
        if (activeMasterball)
            statusText += ` | 🟣 ${Math.ceil((activeMasterball.expiresAt - Date.now()) / 60000)}m`;
        else if (activeUltraball)
            statusText += ` | 🟡 ${Math.ceil((activeUltraball.expiresAt - Date.now()) / 60000)}m`;
        else if (activePokeball)
            statusText += ` | ⚪ ${Math.ceil((activePokeball.expiresAt - Date.now()) / 60000)}m`;
        const { getRarityEmoji } = require('../../utils/images.js');
        const rarityEmoji = getRarityEmoji(selectedRarity, client);
        const embed = new EmbedBuilder()
            .setColor(parseInt(rarities[selectedRarity].color.slice(1), 16))
            .setTitle(`${rarityEmoji} ${animal.name}`)
            .setDescription(`*${rarities[selectedRarity].name} Rarity*`)
            .setFooter({ text: `+${expReward} XP${statusText}${expRes.leveledUp ? ` | 🎊 Rank Up: ${expRes.newLevel}!` : ''}` });
        if (imgData) {
            const attachment = new (require('discord.js').AttachmentBuilder)(imgData.buffer, { name: imgData.fileName });
            embed.setImage(`attachment://${imgData.fileName}`);
            files.push(attachment);
        }
        await database.updateStats(message.author.id, 'command');
        await database.updateStats(message.author.id, 'hunt_success', 1);
        // Update Quest Progress! (｡♥‿♥｡)
        const QuestService = require('../../services/QuestService').default || require('../../services/QuestService');
        await QuestService.updateProgress(message.author.id, 'HUNT', 1);
        message.reply({ embeds: [embed], files });
    },
};
