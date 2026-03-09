"use strict";
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const EconomyService = require('../../services/EconomyService.js');
module.exports = {
    name: 'rps',
    aliases: ['rockpaperscissors'],
    description: 'Play Rock Paper Scissors with Mommy! (◕‿◕✿)',
    usage: 'rps <amount/all>',
    cooldown: 5000,
    async execute(message, args, client) {
        if (args.length < 1) {
            return message.reply({
                embeds: [
                    {
                        color: colors.error,
                        title: '❌ Missing amount',
                        description: "Please specify how much you'd like to bet, sweetie. (｡♥‿♥｡) \n**Usage:** `Krps <amount/all>`",
                    },
                ],
            });
        }
        const userData = await database.getUser(message.author.id, message.author.username);
        const { minBet, maxBet } = config.gambling.rps;
        const betAmount = EconomyService.parseBet(args[0], userData.balance, minBet, maxBet);
        let isAllBet = args[0]?.toLowerCase() === 'all';
        if (betAmount <= 0) {
            if (args[0]?.toLowerCase() === 'all' && userData.balance <= 0) {
                return message.reply({ embeds: [{ color: colors.error, title: '💸 No funds found!', description: `You don't have any money to play right now, sweetie. (◕‿◕✿)` }] });
            }
            return message.reply({ embeds: [{ color: colors.error, title: '❌ Invalid amount', description: 'Please use a proper number, sweetie. (｡•́︿•̀｡)' }] });
        }
        if (betAmount < minBet) {
            return message.reply({ embeds: [{ color: colors.warning, title: '💸 Bet too low', description: `You need at least **${minBet.toLocaleString()}** ${config.economy.currency} to play. (｡♥‿♥｡)` }] });
        }
        if (!(await database.hasBalance(message.author.id, betAmount))) {
            return message.reply({
                embeds: [
                    {
                        color: colors.error,
                        title: '💸 Insufficient funds',
                        description: "You don't have enough money to play RPS right now. (っ˘ω˘ς)",
                    },
                ],
            });
        }
        await database.removeBalance(message.author.id, betAmount);
        await database.updateStats(message.author.id, 'gambled', betAmount);
        const choices = [
            { name: 'Rock', emoji: '🪨', beats: 'Scissors' },
            { name: 'Paper', emoji: '📜', beats: 'Rock' },
            { name: 'Scissors', emoji: '✂️', beats: 'Paper' },
        ];
        const embed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle('✊ Rock Paper Scissors')
            .setDescription(`**Bet:** ${betAmount.toLocaleString()} ${config.economy.currency}\n\nChoose your weapon below, darling! (｡♥‿♥｡)`)
            .setFooter({ text: 'You have 30 seconds to choose.' });
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder()
            .setCustomId('Rock')
            .setLabel('Rock')
            .setEmoji('🪨')
            .setStyle(ButtonStyle.Primary), new ButtonBuilder()
            .setCustomId('Paper')
            .setLabel('Paper')
            .setEmoji('📜')
            .setStyle(ButtonStyle.Primary), new ButtonBuilder()
            .setCustomId('Scissors')
            .setLabel('Scissors')
            .setEmoji('✂️')
            .setStyle(ButtonStyle.Primary));
        const gameMsg = await message.reply({ embeds: [embed], components: [row] });
        const collector = gameMsg.createMessageComponentCollector({
            filter: (i) => i.user.id === message.author.id,
            time: 30000,
            max: 1,
        });
        collector.on('collect', async (i) => {
            const userChoice = choices.find((c) => c.name === i.customId);
            // Win Rate Logic: 1 out of 4 (25%)
            const forcedWin = Math.random() < 0.25;
            let botChoice;
            if (forcedWin) {
                // Bot must lose
                botChoice = choices.find((c) => c.name === userChoice.beats);
            }
            else {
                // Bot will likely win or draw
                if (Math.random() < 0.5) {
                    // Bot wins
                    botChoice = choices.find((c) => c.beats === userChoice.name);
                }
                else {
                    // Draw or Random (still low win rate for player)
                    botChoice = choices[Math.floor(Math.random() * choices.length)];
                }
            }
            let result;
            let winMultiplier = 0;
            if (userChoice.name === botChoice.name) {
                result = "It's a Draw! 🤝";
                winMultiplier = 1;
            }
            else if (userChoice.beats === botChoice.name) {
                result = 'You Won! 🎉';
                winMultiplier = 2;
            }
            else {
                result = 'You Lost! 💀';
                winMultiplier = 0;
            }
            if (winMultiplier > 0) {
                await database.addBalance(message.author.id, Math.floor(betAmount * winMultiplier));
                if (winMultiplier > 1) {
                    await database.updateStats(message.author.id, 'won', betAmount);
                    await database.updateStats(message.author.id, 'rps_win', 1);
                }
            }
            else {
                await database.updateStats(message.author.id, 'lost', betAmount);
            }
            const finalEmbed = new EmbedBuilder()
                .setColor(winMultiplier > 1 ? colors.success : winMultiplier === 1 ? colors.warning : colors.error)
                .setTitle('✊ Rock Paper Scissors Result')
                .setDescription(`**${result}**\n\n**You:** ${userChoice.emoji} ${userChoice.name}\n**Mommy:** ${botChoice.emoji} ${botChoice.name}\n\n${winMultiplier > 1 ? 'Mommy is so proud of you! (｡♥‿♥｡)' : winMultiplier === 1 ? 'A draw! Mommy will give your money back (◕‿◕✿)' : "Don't be sad, darling! (っ˘ω˘ς)"}`)
                .addFields({
                name: 'Loot',
                value: winMultiplier > 1
                    ? `+${betAmount.toLocaleString()} <:coin:1480551418464305163>`
                    : winMultiplier === 1
                        ? '0 <:coin:1480551418464305163> (Refunded)'
                        : `-${betAmount.toLocaleString()} <:coin:1480551418464305163>`,
            });
            await i.update({ embeds: [finalEmbed], components: [] });
        });
        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                await gameMsg.edit({
                    content: '⌛ Time expired! Mommy waited for you, sweetie. Bet lost. (｡•́︿•̀｡)',
                    embeds: [],
                    components: [],
                });
            }
        });
    },
};
