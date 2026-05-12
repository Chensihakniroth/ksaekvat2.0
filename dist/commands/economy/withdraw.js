"use strict";
const { EmbedBuilder } = require('discord.js');
const database = require('../../services/DatabaseService');
const economy = require('../../services/EconomyService').default || require('../../services/EconomyService.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
module.exports = {
    name: 'withdraw',
    aliases: ['with', 'take'],
    description: 'Withdraw your funds from the bank storage back into your wallet. (≧◡≦)',
    usage: 'withdraw <amount/all>',
    category: 'economy',
    async execute(message, args, client) {
        const user = await database.getUser(message.author.id, message.author.username);
        if (args.length === 0) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(colors.error)
                        .setTitle('⚠️ TRANSACTION ERROR')
                        .setDescription('How much do you want to withdraw? (・_・ヾ\nUsage: `kwithdraw <amount/all>`')
                ]
            });
        }
        const amount = economy.parseBet(args[0], user.bank || 0, 1, user.bank || 0);
        if (amount <= 0) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(colors.error)
                        .setTitle('❌ INVALID AMOUNT')
                        .setDescription("You can't withdraw that! (・_・ヾ Your bank vault seems a bit empty. (ಥ﹏ಥ)")
                ]
            });
        }
        if ((user.bank || 0) < amount) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(colors.error)
                        .setTitle('🚫 INSUFFICIENT BANK FUNDS')
                        .setDescription(`You only have **${(user.bank || 0).toLocaleString()}** ${config.economy.currencySymbol} in your bank! (・_0)`)
                ]
            });
        }
        // Perform atomic withdrawal
        const updatedUser = await database.withdraw(message.author.id, amount);
        const embed = new EmbedBuilder()
            .setColor(colors.success)
            .setTitle('🏦 WITHDRAWAL SUCCESS')
            .setDescription(`Transferred **${amount.toLocaleString()}** ${config.economy.currencySymbol} back to your wallet! (¬‿¬)`)
            .addFields({ name: '💵 Wallet', value: `**${updatedUser.balance.toLocaleString()}** ${config.economy.currencySymbol}`, inline: true }, { name: '🏦 Bank', value: `**${updatedUser.bank.toLocaleString()}** ${config.economy.currencySymbol}`, inline: true })
            .setThumbnail(message.author.displayAvatarURL())
            .setTimestamp();
        // Update command usage stats
        await database.updateStats(message.author.id, 'command');
        message.reply({ embeds: [embed] });
    },
};
