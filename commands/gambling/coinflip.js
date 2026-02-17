const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
    name: 'coinflip',
    aliases: ['cf', 'flip'],
    description: 'បោះកាក់ផ្សងសំណាងជាមួយបង',
    usage: 'coinflip <ចំនួន/all> [ក្បាល/កន្ទុយ]',
    cooldown: 3000, // 3 seconds
    execute(message, args, client) {
        // Check arguments
        if (args.length < 1) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ ដាក់លុយខុសហើយអូនសម្លាញ់',
                    description: 'ដាក់លុយឱ្យត្រូវមើលម្ចាស់ថ្លៃ! \n**របៀបប្រើ:** `Kcoinflip <ចំនួន/all> [heads/tails]`\n**ឧទាហរណ៍:** `Kcf 1000 heads` ឬ `Kcf all tails`',
                }]
            });
        }

        let betAmount;
        let isAllBet = false;
        const userData = database.getUser(message.author.id);

        // Check if user wants to bet "all"
        if (args[0].toLowerCase() === 'all') {
            isAllBet = true;
            const { maxBet } = config.gambling.coinflip;
            betAmount = Math.min(userData.balance, maxBet);

            if (betAmount <= 0) {
                return message.reply({
                    embeds: [{
                        color: colors.error,
                        title: '💸 អត់មានលុយទេអូន',
                        description: `អូនអត់មានលុយក្នុងខ្លួនផង ចង់លេងល្បែងមិចកើត!`,
                    }]
                });
            }
        } else {
            betAmount = parseInt(args[0]);
            if (isNaN(betAmount) || betAmount <= 0) {
                return message.reply({
                    embeds: [{
                        color: colors.error,
                        title: '❌ ដាក់លុយឱ្យត្រូវមើលមាសស្ងួន',
                        description: 'ដាក់ជាលេខមកម្ចាស់ថ្លៃ កុំធ្វើឱ្យបងពិបាកចិត្តអី។',
                    }]
                });
            }
        }

        const { minBet, maxBet } = config.gambling.coinflip;
        if (betAmount < minBet) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '💸 លុយតិចពេកហើយអូន',
                    description: `យ៉ាងហោចណាស់ក៏ត្រូវមាន **${minBet.toLocaleString()}** ${config.economy.currency} ដែរណាម្ចាស់ស្នេហ៍។`,
                    timestamp: new Date()
                }]
            });
        }

        if (isAllBet && betAmount > maxBet) {
            betAmount = maxBet;
        }

        if (!database.hasBalance(message.author.id, betAmount)) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '💸 អត់លុយគ្រប់ទេអូនសម្លាញ់',
                    description: `លុយអូនអត់គ្រប់ចាក់ទេណា! \n**លុយអូនមាន:** ${userData.balance.toLocaleString()} ${config.economy.currency}\n**ត្រូវការ:** ${betAmount.toLocaleString()} ${config.economy.currency}`,
                }]
            });
        }

        let userChoice = 'heads'; 
        const choiceArgIndex = 1; 
        if (args.length > choiceArgIndex) {
            const choice = args[choiceArgIndex].toLowerCase();
            if (choice === 'tails' || choice === 't') {
                userChoice = 'tails';
            } else if (choice === 'heads' || choice === 'h') {
                userChoice = 'heads';
            }
        }

        database.removeBalance(message.author.id, betAmount);
        database.updateStats(message.author.id, 'gambled', betAmount);

        const frames = ['🪙', '⚪', '🪙', '⚪', '🪙', '⚪', '🪙'];
        let frameIndex = 0;

        const betTypeText = isAllBet ? ` (${betAmount >= maxBet ? 'ចាក់អស់ស៊ុប' : 'ចាក់ទាំងអស់'})` : '';

        const embed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle('🪙 បោះកាក់ផ្សងសំណាង')
            .setDescription(`**អូនចាក់ :** ${betAmount.toLocaleString()} ${config.economy.currency}${betTypeText}\n**អូនរើស :** ${userChoice === 'heads' ? 'ក្បាល (Heads)' : 'កន្ទុយ (Tails)'}\n\n${frames[0]} **ចាំបន្តិចណាម្ចាស់ថ្លៃ បងកំពុងបោះកាក់ឱ្យហើយ...**`)
        
        message.reply({ embeds: [embed] }).then(async (sentMessage) => {
            for (let i = 0; i < 6; i++) {
                await new Promise(resolve => setTimeout(resolve, 150));
                frameIndex = (frameIndex + 1) % frames.length;

                const animationEmbed = new EmbedBuilder()
                    .setColor(colors.primary)
                    .setTitle('🪙 បោះកាក់ផ្សងសំណាង')
                    .setDescription(`**អូនចាក់ :** ${betAmount.toLocaleString()} ${config.economy.currency}${betTypeText}\n**អូនរើស :** ${userChoice === 'heads' ? 'ក្បាល (Heads)' : 'កន្ទុយ (Tails)'}\n\n${frames[frameIndex]} **ចាំបន្តិចណាម្ចាស់ថ្លៃ បងកំពុងបោះកាក់ឱ្យហើយ...**`)
                try {
                    await sentMessage.edit({ embeds: [animationEmbed] });
                } catch (error) {
                    return;
                }
            }

            const coinResult = Math.random() < 0.5 ? 'heads' : 'tails';
            const won = coinResult === userChoice;
            const resultEmoji = coinResult === 'heads' ? '🟡' : '⚪';

            let finalEmbed;

            if (won) {
                const winAmount = betAmount * 2;
                const newBalance = database.addBalance(message.author.id, winAmount);
                database.updateStats(message.author.id, 'won', betAmount);
                database.updateStats(message.author.id, 'coinflip_win', 1);
                const expGain = database.addExperience(message.author.id, 20);

                finalEmbed = new EmbedBuilder()
                    .setColor(colors.success)
                    .setTitle('🎉 ហេងណាស់ម្ចាស់ស្នេហ៍បង!')
                    .setDescription(`${resultEmoji} កាក់ធ្លាក់ចំ **${coinResult === 'heads' ? 'ក្បាល' : 'កន្ទុយ'}** ហើយអូន!\nបងជូនសំណាងឱ្យហើយណាម្ចាស់ថ្លៃ។`)
                    .addFields(
                        {
                            name: '💰 លុយចូលហោប៉ៅ',
                            value: `**+${winAmount.toLocaleString()}** ${config.economy.currency}`,
                            inline: true
                        },
                        {
                            name: '💳 សរុបថ្មី',
                            value: `${newBalance.toLocaleString()} ${config.economy.currency}`,
                            inline: true
                        },
                        {
                            name: '⭐ XP កើនបាន',
                            value: '+20 XP',
                            inline: true
                        }
                    );

                if (expGain.leveledUp) {
                    finalEmbed.addFields({
                        name: '🎉 ឡើងស័កហើយ!',
                        value: `កប់ស៊េរី! អូនឡើងដល់កម្រិតទី **${expGain.newLevel}** ហើយណាម្ចាស់ថ្លៃ!`,
                        inline: false
                    });
                }
            } else {
                const currentUserData = database.getUser(message.author.id);
                database.updateStats(message.author.id, 'lost', betAmount);

                finalEmbed = new EmbedBuilder()
                    .setColor(colors.error)
                    .setTitle('💸 អស់លុយបាត់ហើយម្ចាស់ស្នេហ៍!')
                    .setDescription(`${resultEmoji} កាក់ធ្លាក់ចំ **${coinResult === 'heads' ? 'ក្បាល' : 'កន្ទុយ'}**។\nកុំតូចចិត្តអីអូនសម្លាញ់ ចាំបន្តិចទៀតសាកសំណាងជាមួយបងថ្មីណា។`)
                    .addFields(
                        {
                            name: '💸 បាត់បង់លុយ',
                            value: `-${betAmount.toLocaleString()} ${config.economy.currency}`,
                            inline: true
                        },
                        {
                            name: '💳 លុយនៅសល់',
                            value: `${currentUserData.balance.toLocaleString()} ${config.economy.currency}`,
                            inline: true
                        },
                        {
                            name: '🎯 ឱកាសឈ្នះ',
                            value: '50/50',
                            inline: true
                        }
                    );
            }

            finalEmbed.setFooter({ 
                text: `ល្បែងចប់ហើយ | អូនរើស: ${userChoice} | ស្នេហ៍ពិតមិនចាញ់ល្បែងទេ`,
                iconURL: message.author.displayAvatarURL()
            }).setTimestamp();

            database.updateStats(message.author.id, 'command');

            try {
                await sentMessage.edit({ embeds: [finalEmbed] });
            } catch (error) {
                message.channel.send({ embeds: [finalEmbed] });
            }
        }).catch(error => {
            console.error('Error in coinflip animation:', error); 
        });
    }
};