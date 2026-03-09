"use strict";
const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
module.exports = {
    name: 'setbal',
    aliases: ['setbalance'],
    description: "Set a user's balance (Admin only)",
    usage: 'setbal <@user> <amount>',
    adminOnly: true,
    async execute(message, args, client) {
        // Check arguments
        if (args.length < 2) {
            return message.reply({
                embeds: [
                    {
                        color: colors.error,
                        title: '(◕‸ ◕✿) Sweetie, you forgot something!',
                        description: 'Please tell Mommy who to give money to and how much. (｡•́︿•̀｡)\n**Usage:** `Ksetbal @user <amount>`\n**Example:** `Ksetbal @user 10000`',
                    },
                ],
            });
        }
        // Get target user
        let target = null;
        if (message.mentions.users.size > 0) {
            target = message.mentions.users.first();
        }
        else {
            const userId = args[0];
            target = client.users.cache.get(userId);
        }
        if (!target) {
            return message.reply({
                embeds: [
                    {
                        color: colors.error,
                        title: "(｡•́︿•̀｡) I can't find them, darling",
                        description: 'Please mention a valid user or provide their user ID so Mommy can find them. (◕‿◕✿)',
                    },
                ],
            });
        }
        // Parse amount
        const amount = parseInt(args[1]);
        if (isNaN(amount) || amount < 0) {
            return message.reply({
                embeds: [
                    {
                        color: colors.error,
                        title: "(｡•́︿•̀｡) That's not right, darling",
                        description: 'Please provide a valid positive number for Mommy. (っ˘ω˘ς)',
                    },
                ],
            });
        }
        // Check maximum amount to prevent abuse
        const maxAmount = 9999999999999999999999; // Set a reasonable maximum balance limit
        if (amount > maxAmount) {
            return message.reply({
                embeds: [
                    {
                        color: colors.warning,
                        title: "(◕‸ ◕✿) That's too much, darling!",
                        description: `Mommy can't handle more than ${maxAmount.toLocaleString()} ${config.economy.currency}. (っ˘ω˘ς)`,
                    },
                ],
            });
        }
        // Get user data and previous balance
        const userData = await database.getUser(target.id, target.username);
        const previousBalance = userData.balance || 0;
        // Set new balance
        userData.balance = amount;
        await database.saveUser(userData);
        const embed = new EmbedBuilder()
            .setColor(colors.success)
            .setTitle('(｡♥‿♥｡) Balance Updated!')
            .setDescription(`Mommy successfully adjusted **${target.username}**'s balance! ヽ(>∀<☆)ノ`)
            .addFields({
            name: '(◕‿◕✿) Target User',
            value: [
                `**Username:** ${target.username}`,
                `**User ID:** ${target.id}`,
                `**Account Age:** ${Math.floor((Date.now() - userData.joinedAt) / (1000 * 60 * 60 * 24))} days`,
            ].join('\n'),
            inline: true,
        }, {
            name: '(っ˘ω˘ς) Balance Changes',
            value: [
                `**Previous:** ${previousBalance.toLocaleString()} ${config.economy.currency}`,
                `**New:** ${amount.toLocaleString()} ${config.economy.currency}`,
                `**Difference:** ${amount >= previousBalance ? '+' : ''}${(amount - previousBalance).toLocaleString()} ${config.economy.currency}`,
            ].join('\n'),
            inline: true,
        }, {
            name: '(｡♥‿♥｡) Admin Action',
            value: [`**Admin:** ${message.author.username}`, `**Action:** Set Balance`].join('\n'),
            inline: false,
        })
            .setThumbnail(target.displayAvatarURL());
        message.reply({ embeds: [embed] });
        // Log the admin action
        console.log(`[ADMIN] ${message.author.tag} set ${target.tag}'s balance to ${amount} (was ${previousBalance})`);
    },
};
