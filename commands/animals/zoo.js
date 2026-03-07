const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const AnimalService = require('../../services/AnimalService.js');
const EconomyService = require('../../services/EconomyService.js');

module.exports = {
    name: 'zoo',
    aliases: ['collection', 'animals'],
    description: 'View your animal collection with their rarity and values',
    usage: 'zoo [@user]',
    async execute(message, args, client) {
        let target = message.author;
        if (message.mentions.users.size > 0) target = message.mentions.users.first();
        else if (args.length > 0) {
            const userId = args[0];
            const foundUser = client.users.cache.get(userId);
            if (foundUser) target = foundUser;
        }

        const userData = await database.getUser(target.id, target.username);
        const animalsData = await database.loadAnimals();
        const userAnimals = userData.animals || {};
        
        // --- CALCULATE STATS (Using Service) ---
        const { totalAnimals, totalValue, rarityStats } = AnimalService.calculateZooStats(userAnimals, animalsData);

        const embed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle(`(◕‿◕✿) ${target.username}'s Cozy Sanctuary`)
            .setThumbnail(target.displayAvatarURL())
            .setDescription(`**Owner:** ${target.username}\n**Total Value, sweetie:** ${EconomyService.format(totalValue)} ${config.economy.currency}\n**Little Friends:** ${totalAnimals} animals`)
            .addFields({ name: '\u200b', value: '\u200b' });

        if (totalAnimals > 0) {
            // 1. Rarest Finds
            const topRarities = Object.entries(rarityStats)
                .filter(([r, d]) => d.count > 0 && ['priceless', 'mythical', 'legendary', 'epic'].includes(r))
                .sort((a, b) => config.hunting.rarities[a[0]].weight - config.hunting.rarities[b[0]].weight)
                .slice(0, 3);

            if (topRarities.length > 0) {
                const rareList = topRarities.map(([rarity, _]) => {
                    const info = config.hunting.rarities[rarity];
                    const animals = userAnimals[rarity];
                    const animalEntries = animals instanceof Map ? animals.entries() : Object.entries(animals || {});
                    
                    const animalsList = Array.from(animalEntries)
                        .map(([key, count]) => {
                            const animal = animalsData[rarity][key];
                            return `${animal.emoji} \`x${count}\``;
                        }).join(' ');
                    return `**${info.name}**\n${animalsList}`;
                }).join('\n\n');
                
                embed.addFields(
                    { name: '✨ **Our Rarest Treasures**', value: rareList, inline: false },
                    { name: '\u200b', value: '\u200b' }
                );
            }

            // 2. Rarity Distribution
            const breakdown = Object.entries(rarityStats)
                .filter(([_, d]) => d.count > 0)
                .map(([rarity, d]) => {
                    const info = config.hunting.rarities[rarity];
                    return `\`${info.name.padEnd(10)}\` : **${d.count}**`;
                }).join('\n');

            embed.addFields({ name: '📊 **Sanctuary Report**', value: breakdown, inline: true });

            // 3. Badges (Using Service)
            const badges = AnimalService.calculateBadges(userData.stats?.totalAnimalsFound || 0, totalValue, userAnimals);

            if (badges.length > 0) {
                embed.addFields({ name: '🏅 **Your Achievements**', value: badges.join('\n'), inline: true });
            }
        } else {
            embed.setDescription("Oh no, darling! (｡•́︿•̀｡) Your sanctuary is empty... Why not use `Khunt` to find some little friends for us?");
        }

        embed.setFooter({ text: `Little ones found: ${userData.stats?.totalAnimalsFound || 0}` });
        
        await database.updateStats(message.author.id, 'command');
        message.reply({ embeds: [embed] });
    }
};
