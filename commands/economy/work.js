const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
    name: 'work',
    aliases: ['job'],
    description: 'Work to earn some coins',
    usage: 'work',
    cooldown: 30000, // 30 seconds cooldown
    execute(message, args, client) {
        const userData = database.getUser(message.author.id);
        
        // Array of work scenarios
        const workScenarios = [
            { job: 'jinh chork', action: 'jinh chork ban somrach', emoji: '🍦' },
            { job: 'Rut passapp', action: 'tren tren tren ban ma moy', emoji: '🛺' },
            { job: 'luk jab houy', action: 'jouy tinh sin hei bong', emoji: '🖥️' },
            { job: 'luk tnam', action: 'yor ah domlai marn ?', emoji: '🍢' },
            { job: 'luk k\'cha', action: 'ah ng ma derm dg tahbek morng', emoji: '🚜' },
            { job: 'Leang Jan', action: 'leang jan dory sa c bay ot oy luy ke', emoji: '🧼' },
            { job: 'jinh b\'lorn', action: 'p\'lorn teas ouknha', emoji: '🎟️' },
            { job: 'derk Grab', action: 'dak mhub oy pheav 1', emoji: '📦' },
            { job: 'jing bong', action: ' thom thom os ai kur yul', emoji: '🛡️' }
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
            .setTitle(`${scenario.emoji} Tver ka hz ah pov!`)
            .setDescription(`hg tver chea **${scenario.job}** hz ${scenario.action}!`)
            .addFields(
                {
                    name: `💵 Earned`,
                    value: `**+${finalReward.toLocaleString()}** ${config.economy.currency}`,
                    inline: true
                },
                {
                    name: '💰 Luy knong khao',
                    value: `**${newBalance.toLocaleString()}** ${config.economy.currency}`,
                    inline: true
                },
                {
                    name: '⭐ XP Gained',
                    value: '+15 XP',
                    inline: true
                }
            );

        // Show breakdown if there are bonuses
        let breakdownText = [`Base Pay: ${baseReward.toLocaleString()} ${config.economy.currency}`];
        
        if (levelBonus > 0) {
            breakdownText.push(`Level Bonus: +${levelBonus.toLocaleString()} ${config.economy.currency}`);
        }
        
        if (tip > 0) {
            breakdownText.push(`Ke oy tip hg: +${tip.toLocaleString()} ${config.economy.currency} 🧧`);
        }
        
        if (moneyBooster) {
            breakdownText.push(`Money Booster (x${moneyBooster.multiplier}): Applied`);
        }

        embed.addFields({
            name: '📊 Payment Breakdown',
            value: breakdownText.join('\n'),
            inline: false
        });

        // Add level up notification if applicable
        if (expGain.leveledUp) {
            embed.addFields({
                name: '🎉 Level Up!',
                value: `kop sari ! hg lerng sak hz tov Level **${expGain.newLevel}**!`,
                inline: false
            });
        }

        // Update command usage statistics
        database.updateStats(message.author.id, 'command');

        message.reply({ embeds: [embed] });
    }
};




