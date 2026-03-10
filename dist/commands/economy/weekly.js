"use strict";
const { EmbedBuilder } = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
module.exports = {
    name: 'weekly',
    aliases: ['w'],
    description: 'Claim your weekly reward',
    usage: 'weekly',
    async execute(message, args, client) {
        const userData = await database.getUser(message.author.id, message.author.username);
        // Check if user has already claimed weekly reward
        const now = new Date();
        const lastWeekly = userData.lastWeekly ? new Date(userData.lastWeekly) : null;
        // Check if it's been 7 days since last claim
        if (lastWeekly && now - lastWeekly < 7 * 24 * 60 * 60 * 1000) {
            const timeLeft = 7 * 24 * 60 * 60 * 1000 - (now - lastWeekly);
            const daysLeft = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
            const hoursLeft = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
            return message.reply({
                embeds: [
                    {
                        color: colors.warning,
                        title: '⏰ Weekly Already Claimed',
                        description: `You've already claimed your weekly reward! Come back in **${daysLeft}d ${hoursLeft}h**.`,
                        thumbnail: { url: message.author.displayAvatarURL() },
                    },
                ],
            });
        }
        // Generate random reward amount
        const { min, max } = config.economy.weeklyReward;
        const baseReward = Math.floor(Math.random() * (max - min + 1)) + min;
        // Apply money booster if active
        let finalReward = baseReward;
        const moneyBooster = await database.getActiveBooster(message.author.id, 'money');
        if (moneyBooster) {
            finalReward = Math.floor(baseReward * moneyBooster.multiplier);
        }
        // Add bonus based on level
        const levelBonus = Math.floor(userData.level * 50);
        finalReward += levelBonus;
        // Update user data
        userData.balance += finalReward;
        userData.lastWeekly = now.toISOString();
        userData.weeklyClaimed = true;
        await database.saveUser(userData);
        // Add some experience
        await database.addExperience(message.author.id, 100);
        const embed = new EmbedBuilder()
            .setColor(colors.success)
            .setTitle('🌟 Weekly Reward Claimed!')
            .setThumbnail('https://cdn.discordapp.com/emojis/987654321.gif') // Placeholder for big gift
            .addFields({
            name: `${config.economy.currencySymbol} Reward`,
            value: `**+${finalReward.toLocaleString()}** ${config.economy.currency}`,
            inline: true,
        }, {
            name: '💰 New Balance',
            value: `**${userData.balance.toLocaleString()}** ${config.economy.currency}`,
            inline: true,
        }, {
            name: '⭐ Bonus XP',
            value: '+100 XP',
            inline: true,
        });
        // Show breakdown if there are bonuses
        let breakdownText = [`Base: ${baseReward.toLocaleString()} ${config.economy.currency}`];
        if (levelBonus > 0) {
            breakdownText.push(`Level Bonus: +${levelBonus.toLocaleString()} ${config.economy.currency}`);
        }
        if (moneyBooster) {
            breakdownText.push(`Money Booster (x${moneyBooster.multiplier}): Applied`);
        }
        embed.addFields({
            name: '📊 Breakdown',
            value: breakdownText.join('\n'),
            inline: false,
        });
        embed.setDescription('🎊 **Congratulations!** See you again next week for more rewards!');
        // Update command usage statistics
        await database.updateStats(message.author.id, 'command');
        message.reply({ embeds: [embed] });
    },
};
