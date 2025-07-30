const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
    name: 'balance',
    aliases: ['bal', 'money', 'coins'],
    description: 'Check your or another user\'s balance',
    usage: 'balance [@user]',
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
        
        // Get active boosters
        const moneyBooster = database.getActiveBooster(target.id, 'money');
        const expBooster = database.getActiveBooster(target.id, 'exp');

        const embed = new EmbedBuilder()
            .setColor(colors.success)
            .setTitle(`💰 ${target.username}'s Balance`)
            .setThumbnail(target.displayAvatarURL())
            .addFields(
                {
                    name: `${config.economy.currencySymbol} Balance`,
                    value: `**${userData.balance.toLocaleString()}** ${config.economy.currency}`,
                    inline: true
                },
                {
                    name: '📊 Level',
                    value: `**${userData.level}** (${userData.experience} XP)`,
                    inline: true
                },
                {
                    name: '🎯 Next Level',
                    value: `${userData.level * 100 - userData.experience} XP needed`,
                    inline: true
                }
            );

        // Add booster information if active
        if (moneyBooster || expBooster) {
            let boosterText = [];
            
            if (moneyBooster) {
                const timeLeft = Math.ceil((moneyBooster.expiresAt - Date.now()) / 1000 / 60);
                boosterText.push(`💰 Money x${moneyBooster.multiplier} (${timeLeft}m left)`);
            }
            
            if (expBooster) {
                const timeLeft = Math.ceil((expBooster.expiresAt - Date.now()) / 1000 / 60);
                boosterText.push(`⭐ Experience x${expBooster.multiplier} (${timeLeft}m left)`);
            }
            
            embed.addFields({
                name: '🚀 Active Boosters',
                value: boosterText.join('\n'),
                inline: false
            });
        }

        // Add statistics
        embed.addFields(
            {
                name: '📈 Statistics',
                value: [
                    `**Animals Found:** ${userData.totalAnimalsFound}`,
                    `**Commands Used:** ${userData.commandsUsed}`,
                    `**Total Gambled:** ${userData.totalGambled.toLocaleString()} ${config.economy.currency}`,
                    `**Total Won:** ${userData.totalWon.toLocaleString()} ${config.economy.currency}`,
                    `**Total Lost:** ${userData.totalLost.toLocaleString()} ${config.economy.currency}`
                ].join('\n'),
                inline: false
            }
        );

        embed.setFooter({ 
            text: `Account created: ${new Date(userData.joinedAt).toLocaleDateString()}`,
            iconURL: target.displayAvatarURL()
        }).setTimestamp();

        // Update command usage statistics
        database.updateStats(message.author.id, 'command');

        message.reply({ embeds: [embed] });
    }
};
