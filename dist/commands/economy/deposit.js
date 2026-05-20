"use strict";
const { EmbedBuilder } = require('discord.js');
const database = require('../../services/DatabaseService');
const economy = require('../../services/EconomyService').default || require('../../services/EconomyService.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
module.exports = {
    name: 'deposit',
    aliases: ['dep', 'store'],
    description: 'Deposit your wallet balance into the secure bank storage. (¬‿¬)',
    usage: 'deposit <amount/all>',
    category: 'economy',
    async execute(message, args, client) {
        const user = await database.getUser(message.author.id, message.author.username);
        if (args.length === 0) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(colors.error)
                        .setTitle('⚠️ TRANSACTION ERROR')
                        .setDescription('How much do you want to deposit? (・_・ヾ\nUsage: `kdeposit <amount/all>`')
                ]
            });
        }
        const amount = economy.parseBet(args[0], user.balance, 1, user.balance);
        if (amount <= 0) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(colors.error)
                        .setTitle('❌ INVALID AMOUNT')
                        .setDescription("You can't deposit that! (・_・ヾ Check your wallet balance first. (≧◡≦)")
                ]
            });
        }
        if (user.balance < amount) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(colors.error)
                        .setTitle('🚫 INSUFFICIENT FUNDS')
                        .setDescription(`You only have **${user.balance.toLocaleString()}** ${config.economy.currencySymbol} in your wallet! (ಥ﹏ಥ)`)
                ]
            });
        }
        // Perform atomic deposit
        const updatedUser = await database.deposit(message.author.id, amount);
        const embed = new EmbedBuilder()
            .setColor(colors.success)
            .setTitle('🏦 DEPOSIT SUCCESS')
            .setDescription(`Transferred **${amount.toLocaleString()}** ${config.economy.currencySymbol} to your bank storage! (¬‿¬)`)
            .addFields({ name: '💵 Wallet', value: `**${updatedUser.balance.toLocaleString()}** ${config.economy.currencySymbol}`, inline: true }, { name: '🏦 Bank', value: `**${updatedUser.bank.toLocaleString()}** ${config.economy.currencySymbol}`, inline: true })
            .setThumbnail(message.author.displayAvatarURL())
            .setTimestamp();
        // Update command usage stats
        await database.updateStats(message.author.id, 'command');
        message.reply({ embeds: [embed] });
    },
};
