const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
    name: 'work',
    aliases: ['job'],
    description: 'ធ្វើការរកលុយមកចិញ្ចឹមអូន',
    usage: 'work',
    cooldown: 30000, // 30 seconds cooldown
    execute(message, args, client) {
        const userData = database.getUser(message.author.id);

        // Array of work scenarios
        const workScenarios = [
            { job: 'អ្នកលក់ការ៉េម', action: 'ញ៉ាំការ៉េមបងទៅ ធានាថាផ្អែមដល់បេះដូង', emoji: '🍦' }, 
            { job: 'អ្នករត់ PassApp', action: 'ទីងៗ! ឡើងមកអូនចាំបងឌុបទៅដល់ឋានសួគ៌', emoji: '🛺' }, 
            { job: 'អ្នកលក់អីវ៉ាន់អនឡាញ', action: 'ជួយទិញមួយទៅអូនសម្លាញ់ ចាំបងថែមស្នាមញញឹមឱ្យ', emoji: '💻' }, 
            { job: 'អ្នកលក់ទឹកកក', action: 'ទឹកកកបងត្រជាក់ តែបេះដូងបងកក់ក្ដៅណាស់ណា', emoji: '🧊' }, 
            { job: 'អ្នកលក់ខ្ចៅ', action: 'ខ្ចៅស្ងោរឆ្ងាញ់ដូចអ្នកលក់ដែរហ្នឹង', emoji: '🐚' }, 
            { job: 'អ្នកលាងចាន', action: 'លាងចានសងថ្លៃបាយ តែចង់បានអូនមកលាងបេះដូងឱ្យវិញ', emoji: '🧼' }, 
            { job: 'អ្នកលក់ផ្លែឈើ', action: 'ផ្លែឈើបងផ្អែម តែមិនទាន់ផ្អែមស្មើបបូរមាត់អូនទេ', emoji: '🍎' }, 
            { job: 'អ្នកដឹកជញ្ជូន', action: 'ឥវ៉ាន់ដល់ហើយ ចេញមកយកទៅអូន ម្ចាស់ឥវ៉ាន់សង្ហាណាស់', emoji: '📦' }, 
            { job: 'អ្នកចាំផ្ទះ', action: 'នៅផ្ទះម្នាក់ឯងអផ្សុក ចង់បានអ្នកមកនៅក្បែរដល់ហើយ', emoji: '🏠' }
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
            .setTitle(`${scenario.emoji} ធ្វើការហើយហើយម្ចាស់ថ្លៃ!`)
            .setDescription(`បងធ្វើជា **${scenario.job}** ចុះ ${scenario.action}!`)
            .addFields(
                {
                    name: `💵 លុយចិញ្ចឹមអូន`,
                    value: `**+${finalReward.toLocaleString()}** ${config.economy.currency}`,
                    inline: true
                },
                {
                    name: '💰 លុយក្នុងហោប៉ៅ',
                    value: `**${newBalance.toLocaleString()}** ${config.economy.currency}`,
                    inline: true
                },
                {
                    name: '⭐ XP ឡើងបាន',
                    value: '+15 XP',
                    inline: true
                }
            );

        // Show tip if applicable
        if (tip > 0) {
            embed.addFields({
                name: '🧧 គេឱ្យធីបបងដែរតើ',
                value: `**+${tip.toLocaleString()}** ${config.economy.currency}`,
                inline: true
            });
        }

        // Add level up notification if applicable
        if (expGain.leveledUp) {
            embed.addFields({
                name: '🎉 ឡើងស័កហើយ!',
                value: `កប់ស៊េរី! បងឡើងដល់កម្រិតទី **${expGain.newLevel}** ហើយណាអូន!`,
                inline: false
            });
        }

        // Update command usage statistics
        database.updateStats(message.author.id, 'command');

        message.reply({ embeds: [embed] });
    }
};