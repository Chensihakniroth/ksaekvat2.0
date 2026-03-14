"use strict";
const { EmbedBuilder } = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const EconomyService = require('../../services/EconomyService').default || require('../../services/EconomyService');
module.exports = {
    name: 'profile',
    aliases: ['p', 'stats', 'me', 'trainer'],
    description: "View your or another user's Trainer profile!",
    usage: 'profile [@user]',
    async execute(message, args, client) {
        let target = message.author;
        if (message.mentions.users.size > 0) {
            target = message.mentions.users.first();
        }
        else if (args.length > 0) {
            const userId = args[0];
            const foundUser = client.users.cache.get(userId);
            if (foundUser)
                target = foundUser;
        }
        const userData = await database.getUser(target.id, target.username);
        const animalsData = await database.loadAnimals();
        // Theme logic! (｡♥‿♥｡)
        const shopConfig = require('../../config/shopConfig.js');
        let embedColor = colors.primary;
        let backgroundUrl = null;
        if (userData.profileTheme && userData.profileTheme !== 'default') {
            const theme = shopConfig.categories.themes.items.find(t => t.id === userData.profileTheme);
            if (theme) {
                embedColor = theme.color;
                backgroundUrl = theme.image;
            }
        }
        // Calculate essential stats
        const accountAge = Math.floor((Date.now() - (userData.joinedAt || Date.now())) / (1000 * 60 * 60 * 24));
        const expToNextLevel = userData.level * 100 - userData.experience;
        // Calculate pokemon collection
        let totalPokemonValue = 0;
        let totalPokemonOwned = 0;
        let rarityCount = {};
        for (const rarity of Object.keys(config.hunting.rarities)) {
            rarityCount[rarity] = 0;
        }
        if (userData.animals) {
            const rarityEntries = userData.animals instanceof Map ? userData.animals.entries() : Object.entries(userData.animals);
            for (const [rarity, animals] of rarityEntries) {
                if (animalsData[rarity]) {
                    const animalEntries = animals instanceof Map ? animals.entries() : Object.entries(animals);
                    for (const [animalKey, count] of animalEntries) {
                        if (animalsData[rarity][animalKey]) {
                            totalPokemonValue += animalsData[rarity][animalKey].value * count;
                            totalPokemonOwned += count;
                            rarityCount[rarity] += count;
                        }
                    }
                }
            }
        }
        // Marriage Info!
        let spouseText = 'None';
        if (userData.spouse && userData.spouse.name) {
            const hearts = '❤️'.repeat(Math.min(5, Math.ceil(userData.spouse.affinity / 200)));
            spouseText = `💍 **${userData.spouse.name}**\n${hearts} (Lv. ${Math.floor(userData.spouse.affinity / 100) + 1})`;
        }
        // Calculate gambling stats
        const totalGambled = userData.totalGambled || 0;
        const netProfit = (userData.totalWon || 0) - (userData.totalLost || 0);
        const winRate = totalGambled > 0 ? ((userData.totalWon / totalGambled) * 100).toFixed(1) : '0.0';
        // Create compact embed
        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(`(◕‿◕✿) ${target.username}'s Trainer Card`)
            .setThumbnail(target.displayAvatarURL({ size: 256 }))
            .setDescription(`Welcome back, sweetie! Here is your progress so far. (｡♥‿♥｡)`)
            .addFields({
            name: '📊 Training Progress',
            value: [
                `**Level:** ${userData.level}`,
                `**XP:** ${userData.experience}/${userData.level * 100}`,
                `**Balance:** ${EconomyService.format(userData.balance)} ${config.economy.currency}`,
                `**Pokémon:** ${totalPokemonOwned} (${EconomyService.format(totalPokemonValue)} worth)`,
            ].join('\n'),
            inline: true,
        }, {
            name: '🎯 Activity Log',
            value: [
                `**Gambled:** ${EconomyService.format(totalGambled)}`,
                `**Win Rate:** ${winRate}%`,
                `**Spouse:** ${spouseText}`,
                `**Days Active:** ${accountAge}d`,
            ].join('\n'),
            inline: true,
        });
        if (backgroundUrl)
            embed.setImage(backgroundUrl);
        // Add rarest pokemon if available
        const rarest = getRarestPokemon(rarityCount);
        if (rarest !== 'None') {
            embed.addFields({
                name: '🌟 Peak Rarity',
                value: rarest,
                inline: true,
            });
        }
        embed.setFooter({ text: "Mommy's so proud of you! ヽ(>∀<☆)ノ" });
        message.reply({ embeds: [embed] });
        // Update command usage statistics
        await database.updateStats(message.author.id, 'command');
    },
};
function getRarestPokemon(rarityCount) {
    const rarityOrder = ['priceless', 'mythical', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
    for (const rarity of rarityOrder) {
        if (rarityCount[rarity] > 0) {
            return config.hunting.rarities[rarity].name;
        }
    }
    return 'None';
}
