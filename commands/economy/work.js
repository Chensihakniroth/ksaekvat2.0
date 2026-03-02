const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
    name: 'work',
    aliases: ['job'],
    description: 'Work hard to make Mommy proud! (◕‿◕✿)',
    usage: 'work',
    cooldown: 30000, // 30 seconds cooldown
    execute(message, args, client) {
        const userData = database.getUser(message.author.id);

        // Array of work scenarios
        const workScenarios = [
            { job: 'Ice Cream Seller', action: 'Mommy loves seeing you sell such sweet treats! 🍦', emoji: '🍦' }, 
            { job: 'Delivery Driver', action: 'Be safe on the road, my hardworking little one! 📦', emoji: '📦' }, 
            { job: 'Online Seller', action: 'Mommy is your number one customer, sweetie! 💻', emoji: '💻' }, 
            { job: 'Baker', action: 'The bread smells as sweet as you do, darling! 🥖', emoji: '🥖' }, 
            { job: 'Gardener', action: 'Helping the flowers grow just like you\'re growing! 🌱', emoji: '🌱' }, 
            { job: 'Dishwasher', action: 'Hard work builds a strong character, little one! 🧼', emoji: '🧼' }, 
            { job: 'Fruit Seller', action: 'Fresh and sweet, just like your smile! 🍎', emoji: '🍎' }, 
            { job: 'House Sitter', action: 'Keeping everything tidy for Mommy? How sweet! 🏠', emoji: '🏠' }, 
            { job: 'Artist', action: 'Mommy will hang your beautiful painting on the wall! 🎨', emoji: '🎨' }
        ];

        // Select random work scenario
        const scenario = workScenarios[Math.floor(Math.random() * workScenarios.length)];

        // Generate random reward amount
        const { min, max } = config.economy.workReward;
        const baseReward = Math.floor(Math.random() * (max - min + 1)) + min;

        // Apply money booster if active
        let finalReward = baseReward;
        const moneyBooster = database.getActiveBooster(message.author.id, 'money');
        if (moneyBooster) {
            finalReward = Math.floor(baseReward * moneyBooster.multiplier);
        }

        // Small level bonus
        const levelBonus = Math.floor(userData.level * 2);
        finalReward += levelBonus;

        // Random chance for extra tip (10% chance)
        let tip = 0;
        if (Math.random() < 0.1) {
            tip = Math.floor(Math.random() * 200) + 50;
            finalReward += tip;
        }

        // Update user data
        const newBalance = database.addBalance(message.author.id, finalReward);

        // Add small experience
        const expGain = database.addExperience(message.author.id, 15);

        const embed = new EmbedBuilder()
            .setColor(colors.success)
            .setTitle(`${scenario.emoji} You worked so hard! (｡♥‿♥｡)`)
            .setDescription(`You worked as a **${scenario.job}**! ${scenario.action}`)
            .addFields(
                {
                    name: `💵 Earnings`,
                    value: `**+${finalReward.toLocaleString()}** ${config.economy.currency}`,
                    inline: true
                },
                {
                    name: '💰 New Balance',
                    value: `**${newBalance.toLocaleString()}** ${config.economy.currency}`,
                    inline: true
                },
                {
                    name: '⭐ XP Gained',
                    value: '+15 XP',
                    inline: true
                }
            );

        // Show tip if applicable
        if (tip > 0) {
            embed.addFields({
                name: '🧧 A little tip!',
                value: `**+${tip.toLocaleString()}** ${config.economy.currency}`,
                inline: true
            });
        }

        // Add level up notification if applicable
        if (expGain.leveledUp) {
            embed.addFields({
                name: '🎉 Level Up!',
                value: `Congratulations, sweetie! You've reached level **${expGain.newLevel}**! (◕‿◕✿)`,
                inline: false
            });
        }

        // Update command usage statistics
        database.updateStats(message.author.id, 'command');

        message.reply({ embeds: [embed] });
    }
};