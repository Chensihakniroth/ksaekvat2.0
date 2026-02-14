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
        
        // Check if user mentioned someone or provided a user ID
        if (message.mentions.users.size > 0) {
            target = message.mentions.users.first();
        } else if (args.length > 0) {
            const userId = args[0];
            const foundUser = client.users.cache.get(userId);
            if (foundUser) target = foundUser;
        }

        const userData = database.getUser(target.id);
        const animalsData = database.loadAnimals();
        const userAnimals = userData.animals || {};
        
        // Calculate total animals and value
        let totalAnimals = 0;
        let totalValue = 0;
        let rarityStats = {};
        
        // Initialize rarity stats
        for (const rarity of Object.keys(config.hunting.rarities)) {
            rarityStats[rarity] = { count: 0, value: 0 };
        }
        
        // Count animals by rarity
        for (const [rarity, animals] of Object.entries(userAnimals)) {
            if (animalsData[rarity]) {
                for (const [animalKey, count] of Object.entries(animals)) {
                    if (animalsData[rarity][animalKey]) {
                        const animalValue = animalsData[rarity][animalKey].value * count;
                        totalAnimals += count;
                        totalValue += animalValue;
                        rarityStats[rarity].count += count;
                        rarityStats[rarity].value += animalValue;
                    }
                }
            }
        }

        const embed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle(`🏛️ ${target.username}'s Zoo Collection`)
            .setThumbnail(target.displayAvatarURL())
            .setDescription(`**Collection Overview**\n🐾 **Total:** ${totalAnimals} animals\n💰 **Value:** ${totalValue.toLocaleString()} ${config.economy.currency}`)
            .addFields(
                {
                    name: '📊 Rarity Status',
                    value: totalAnimals > 0 ? 
                        Object.entries(rarityStats)
                            .filter(([_, data]) => data.count > 0)
                            .map(([rarity, data]) => {
                                const info = config.hunting.rarities[rarity];
                                return `\`${info.name.padEnd(10)}\` **${data.count.toString().padStart(3)}** animals`;
                            }).join('\n') :
                        'No animals found yet! Use `Khunt` to start.',
                    inline: false
                }
            );

        // Show rarest animals in a clean way
        if (totalAnimals > 0) {
            const topRarities = Object.entries(rarityStats)
                .filter(([rarity, data]) => data.count > 0 && ['priceless', 'mythical', 'legendary', 'epic'].includes(rarity))
                .sort((a, b) => config.hunting.rarities[a[0]].weight - config.hunting.rarities[b[0]].weight)
                .slice(0, 2);

            for (const [rarity, _] of topRarities) {
                const info = config.hunting.rarities[rarity];
                const animalList = Object.entries(userAnimals[rarity] || {})
                    .map(([key, count]) => {
                        const animal = animalsData[rarity][key];
                        return `${animal.emoji} \`x${count}\``;
                    }).join(' ');

                if (animalList) {
                    embed.addFields({
                        name: `⭐ ${info.name} Collection`,
                        value: animalList,
                        inline: false
                    });
                }
            }

            // Other animals summary
            const otherRarities = Object.entries(rarityStats)
                .filter(([rarity, data]) => data.count > 0 && !['priceless', 'mythical', 'legendary', 'epic'].includes(rarity));
            
            if (otherRarities.length > 0) {
                const otherList = otherRarities.map(([rarity, data]) => {
                    const info = config.hunting.rarities[rarity];
                    return `**${info.name}:** ${data.count}`;
                }).join(' • ');
                
                embed.addFields({
                    name: '📦 Common Species',
                    value: otherList,
                    inline: false
                });
            }
        }

        // Simple Achievements
        const badges = [];
        if (userData.totalAnimalsFound >= 100) badges.push('🏆 Hunter');
        if (totalValue >= 100000) badges.push('💰 Rich');
        if (userAnimals.priceless) badges.push('⭐ Star');

        if (badges.length > 0) {
            embed.addFields({
                name: '🏅 Badges',
                value: badges.join(' • '),
                inline: false
            });
        }

        // Update command usage statistics
        database.updateStats(message.author.id, 'command');

        message.reply({ embeds: [embed] });
    }
};




