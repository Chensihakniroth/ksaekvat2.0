const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
    name: 'zoo',
    aliases: ['collection', 'animals'],
    description: 'View your animal collection with their rarity and values',
    usage: 'zoo [@user]',
    execute(message, args, client) {
        let target = message.author;
        if (message.mentions.users.size > 0) target = message.mentions.users.first();
        else if (args.length > 0) {
            const userId = args[0];
            const foundUser = client.users.cache.get(userId);
            if (foundUser) target = foundUser;
        }

        const userData = database.getUser(target.id);
        const animalsData = database.loadAnimals();
        const userAnimals = userData.animals || {};
        
        // Calculate Stats
        let totalAnimals = 0;
        let totalValue = 0;
        let rarityStats = {};
        for (const rarity of Object.keys(config.hunting.rarities)) {
            rarityStats[rarity] = { count: 0, value: 0 };
        }
        
        for (const [rarity, animals] of Object.entries(userAnimals)) {
            if (animalsData[rarity]) {
                for (const [animalKey, count] of Object.entries(animals)) {
                    if (animalsData[rarity][animalKey]) {
                        const val = animalsData[rarity][animalKey].value * count;
                        totalAnimals += count;
                        totalValue += val;
                        rarityStats[rarity].count += count;
                        rarityStats[rarity].value += val;
                    }
                }
            }
        }

        const embed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle(`🌿 ${target.username}'s Sanctuary`)
            .setThumbnail(target.displayAvatarURL())
            .setDescription(`**Owner:** ${target.username}\n**Net Worth:** ${totalValue.toLocaleString()} ${config.economy.currency}\n**Population:** ${totalAnimals} animals`)
            .addFields({ name: '\u200b', value: '\u200b' }); // Spacer

        if (totalAnimals > 0) {
            // 1. Rarest Finds (Top 3 Rarities)
            const topRarities = Object.entries(rarityStats)
                .filter(([r, d]) => d.count > 0 && ['priceless', 'mythical', 'legendary', 'epic'].includes(r))
                .sort((a, b) => config.hunting.rarities[a[0]].weight - config.hunting.rarities[b[0]].weight)
                .slice(0, 3);

            if (topRarities.length > 0) {
                const rareList = topRarities.map(([rarity, _]) => {
                    const info = config.hunting.rarities[rarity];
                    const animals = Object.entries(userAnimals[rarity] || {})
                        .map(([key, count]) => {
                            const animal = animalsData[rarity][key];
                            return `${animal.emoji} \`x${count}\``;
                        }).join(' ');
                    return `**${info.name}**\n${animals}`;
                }).join('\n\n');
                
                embed.addFields(
                    { name: '💎 **Crown Jewels**', value: rareList, inline: false },
                    { name: '\u200b', value: '\u200b' } // Spacer
                );
            }

            // 2. Rarity Distribution (Bar Chart style)
            const breakdown = Object.entries(rarityStats)
                .filter(([_, d]) => d.count > 0)
                .map(([rarity, d]) => {
                    const info = config.hunting.rarities[rarity];
                    return `\`${info.name.padEnd(10)}\` : **${d.count}**`;
                }).join('\n');

            embed.addFields(
                { name: '📊 **Census Data**', value: breakdown, inline: true }
            );

            // 3. Badges / Achievements
            const badges = [];
            if (userData.totalAnimalsFound >= 100) badges.push('🦁 **Hunter**');
            if (userData.totalAnimalsFound >= 500) badges.push('👑 **Master**');
            if (totalValue >= 1000000) badges.push('💰 **Tycoon**');
            if (userAnimals.priceless) badges.push('🌟 **Legend**');
            if (Object.keys(userAnimals).length >= 10) badges.push('🌈 **Collector**');

            if (badges.length > 0) {
                embed.addFields(
                    { name: '🏅 **Honors**', value: badges.join('\n'), inline: true }
                );
            }
        } else {
            embed.setDescription("This sanctuary is empty! Use `Khunt` to start your collection.");
        }

        embed.setFooter({ text: `Total Hunts: ${userData.totalAnimalsFound || 0}` });
        
        database.updateStats(message.author.id, 'command');
        message.reply({ embeds: [embed] });
    }
};