"use strict";
const { EmbedBuilder } = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const EconomyService = require('../../services/EconomyService').default || require('../../services/EconomyService.js');
module.exports = {
    name: 'coinflip',
    aliases: ['cf', 'flip'],
    description: 'Bet your balance on a coin flip.',
    usage: 'coinflip <amount/all> [heads/tails]',
    cooldown: 3000, // 3 seconds
    async execute(message, args, client) {
        // Check arguments
        if (args.length < 1) {
            return message.reply({
                embeds: [
                    {
                        color: colors.error,
                        title: '❌ Invalid Amount',
                        description: 'Please specify a valid amount to bet.\n**Usage:** `Kcoinflip <amount/all> [heads/tails]`',
                    },
                ],
            });
        }
        const userData = await database.getUser(message.author.id, message.author.username);
        const { minBet, maxBet } = config.gambling.coinflip;
        const betAmount = EconomyService.parseBet(args[0], userData.balance, minBet, maxBet);
        let isAllBet = args[0]?.toLowerCase() === 'all';
        if (betAmount <= 0) {
            if (args[0]?.toLowerCase() === 'all' && userData.balance <= 0) {
                return message.reply({
                    embeds: [
                        {
                            color: colors.error,
                            title: '💸 No Funds',
                            description: `You don't have any balance to bet.`,
                        },
                    ],
                });
            }
            return message.reply({
                embeds: [
                    {
                        color: colors.error,
                        title: '❌ Invalid Amount',
                        description: 'Please provide a valid number.',
                    },
                ],
            });
        }
        // If user tries to bet "all" but it would exceed maxBet, use maxBet instead
        if (isAllBet && betAmount > maxBet) {
            betAmount = maxBet;
        }
        if (betAmount < minBet) {
            return message.reply({
                embeds: [
                    {
                        color: colors.warning,
                        title: '💸 Bet Too Low',
                        description: `Minimum bet is **${minBet.toLocaleString()}** ${config.economy.currency}.`,
                    },
                ],
            });
        }
        if (!(await database.hasBalance(message.author.id, betAmount))) {
            return message.reply({
                embeds: [
                    {
                        color: colors.error,
                        title: '💸 Insufficient Funds',
                        description: `You don't have enough balance for this bet.\n**Current Balance:** ${userData.balance.toLocaleString()} ${config.economy.currency}`,
                    },
                ],
            });
        }
        let userChoice = 'heads';
        const choiceArgIndex = 1;
        if (args.length > choiceArgIndex) {
            const choice = args[choiceArgIndex].toLowerCase();
            if (choice === 'tails' || choice === 't') {
                userChoice = 'tails';
            }
            else if (choice === 'heads' || choice === 'h') {
                userChoice = 'heads';
            }
        }
        await database.removeBalance(message.author.id, betAmount);
        await database.updateStats(message.author.id, 'gambled', betAmount);
        const frames = ['🪙', '⚪', '🪙', '⚪', '🪙', '⚪', '🪙'];
        let frameIndex = 0;
        const betTypeText = isAllBet ? ` (Going All In!)` : '';
        const embed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle('🪙 Coin Flip')
            .setDescription(`**Bet:** ${betAmount.toLocaleString()} ${config.economy.currency}${betTypeText}\n**Choice:** ${userChoice === 'heads' ? 'Heads' : 'Tails'}\n\n${frames[0]} *Flipping coin...*`);
        message
            .reply({ embeds: [embed] })
            .then(async (sentMessage) => {
            for (let i = 0; i < 6; i++) {
                await new Promise((resolve) => setTimeout(resolve, 150));
                frameIndex = (frameIndex + 1) % frames.length;
                const animationEmbed = new EmbedBuilder()
                    .setColor(colors.primary)
                    .setTitle('🪙 Coin Flip')
                    .setDescription(`**Bet:** ${betAmount.toLocaleString()} ${config.economy.currency}${betTypeText}\n**Choice:** ${userChoice === 'heads' ? 'Heads' : 'Tails'}\n\n${frames[frameIndex]} *Flipping coin...*`);
                try {
                    await sentMessage.edit({ embeds: [animationEmbed] });
                }
                catch (error) {
                    return;
                }
            }
            const coinResult = Math.random() < 0.5 ? 'heads' : 'tails';
            const won = coinResult === userChoice;
            const resultEmoji = coinResult === 'heads' ? '🟡' : '⚪';
            let finalEmbed;
            if (won) {
                const winAmount = betAmount * 2;
                const userUpdate = await database.addBalance(message.author.id, winAmount);
                const newBalance = userUpdate.balance;
                await database.updateStats(message.author.id, 'won', betAmount);
                await database.updateStats(message.author.id, 'coinflip_win', 1);
                const expGain = await database.addExperience(message.author.id, 20);
                finalEmbed = new EmbedBuilder()
                    .setColor(colors.success)
                    .setTitle('🎉 You Won!')
                    .setDescription(`${resultEmoji} The coin landed on **${coinResult === 'heads' ? 'Heads' : 'Tails'}**!`)
                    .addFields({
                    name: '💰 Winnings',
                    value: `**+${winAmount.toLocaleString()}** ${config.economy.currency}`,
                    inline: true,
                }, {
                    name: '💳 New Balance',
                    value: `${newBalance.toLocaleString()} ${config.economy.currency}`,
                    inline: true,
                }, {
                    name: '⭐ XP Gained',
                    value: '+20 XP',
                    inline: true,
                });
                if (expGain.leveledUp) {
                    finalEmbed.addFields({
                        name: '🎉 Level Up!',
                        value: `You have reached level **${expGain.newLevel}**!`,
                        inline: false,
                    });
                }
            }
            else {
                const currentUserData = await database.getUser(message.author.id, message.author.username);
                await database.updateStats(message.author.id, 'lost', betAmount);
                finalEmbed = new EmbedBuilder()
                    .setColor(colors.error)
                    .setTitle('💥 You Lost')
                    .setDescription(`${resultEmoji} The coin landed on **${coinResult === 'heads' ? 'Heads' : 'Tails'}**.`)
                    .addFields({
                    name: '💸 Loss',
                    value: `-${betAmount.toLocaleString()} ${config.economy.currency}`,
                    inline: true,
                }, {
                    name: '💳 Balance',
                    value: `${currentUserData.balance.toLocaleString()} ${config.economy.currency}`,
                    inline: true,
                }, {
                    name: '🎯 Odds',
                    value: '50/50',
                    inline: true,
                });
            }
            finalEmbed
                .setFooter({
                text: `Game over | You picked: ${userChoice}`,
                iconURL: message.author.displayAvatarURL(),
            })
                .setTimestamp();
            await database.updateStats(message.author.id, 'command');
            try {
                await sentMessage.edit({ embeds: [finalEmbed] });
            }
            catch (error) {
                message.channel.send({ embeds: [finalEmbed] });
            }
            // Update Quest Progress! (｡♥‿♥｡)
            const QuestService = require('../../services/QuestService').default || require('../../services/QuestService');
            await QuestService.updateProgress(message.author.id, 'COINFLIP', 1);
            await QuestService.updateWeeklyProgress(message.author.id, 'COINFLIP', 1);
        })
            .catch((error) => {
            console.error('Error in coinflip animation:', error);
        });
    },
};
