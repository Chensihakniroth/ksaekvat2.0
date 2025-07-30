const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
    name: 'pay',
    aliases: ['give', 'transfer'],
    description: 'Pay coins to another user',
    usage: 'pay <@user> <amount>',
    execute(message, args, client) {
        // Check if user provided enough arguments
        if (args.length < 2) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ Invalid Usage',
                    description: 'Please provide a user and amount to pay.\n**Usage:** `Kpay @user <amount>`',
                    timestamp: new Date()
                }]
            });
        }

        // Get target user
        let target = null;
        if (message.mentions.users.size > 0) {
            target = message.mentions.users.first();
        } else {
            // Try to find by ID
            const userId = args[0];
            target = client.users.cache.get(userId);
        }

        if (!target) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ User Not Found',
                    description: 'Please mention a valid user or provide their user ID.',
                    timestamp: new Date()
                }]
            });
        }

        // Can't pay yourself
        if (target.id === message.author.id) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '🤔 Self Payment',
                    description: 'You cannot pay yourself! That would be silly.',
                    timestamp: new Date()
                }]
            });
        }

        // Can't pay bots
        if (target.bot) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '🤖 Bot Payment',
                    description: 'You cannot pay bots. They don\'t need money!',
                    timestamp: new Date()
                }]
            });
        }

        // Parse amount
        let amount = parseInt(args[1]);
        
        if (isNaN(amount) || amount <= 0) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ Invalid Amount',
                    description: 'Please provide a valid positive number.',
                    timestamp: new Date()
                }]
            });
        }

        // Check minimum payment amount
        if (amount < 1) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '💸 Minimum Payment',
                    description: `Minimum payment amount is 1 ${config.economy.currency}.`,
                    timestamp: new Date()
                }]
            });
        }

        // Check if sender has enough balance
        const senderData = database.getUser(message.author.id);
        if (!database.hasBalance(message.author.id, amount)) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '💸 Insufficient Funds',
                    description: `You don't have enough ${config.economy.currency}!\n**Your Balance:** ${senderData.balance.toLocaleString()} ${config.economy.currency}\n**Required:** ${amount.toLocaleString()} ${config.economy.currency}`,
                    timestamp: new Date()
                }]
            });
        }

        // Check maximum payment limit (prevent abuse)
        const maxPayment = 1000000; // 1 million
        if (amount > maxPayment) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '💰 Payment Limit',
                    description: `Maximum payment amount is ${maxPayment.toLocaleString()} ${config.economy.currency} per transaction.`,
                    timestamp: new Date()
                }]
            });
        }

        // Process the payment
        const senderNewBalance = database.removeBalance(message.author.id, amount);
        const recipientNewBalance = database.addBalance(target.id, amount);
        
        // Get recipient data for display
        const recipientData = database.getUser(target.id);

        const embed = new EmbedBuilder()
            .setColor(colors.success)
            .setTitle('💸 Payment Successful!')
            .setDescription(`${message.author} paid **${amount.toLocaleString()}** ${config.economy.currency} to ${target}`)
            .addFields(
                {
                    name: '👤 Sender',
                    value: [
                        `**User:** ${message.author.username}`,
                        `**New Balance:** ${senderNewBalance.toLocaleString()} ${config.economy.currency}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🎯 Recipient',
                    value: [
                        `**User:** ${target.username}`,
                        `**New Balance:** ${recipientNewBalance.toLocaleString()} ${config.economy.currency}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '💰 Transaction',
                    value: [
                        `**Amount:** ${amount.toLocaleString()} ${config.economy.currency}`,
                        `**Transaction ID:** ${Date.now().toString(36).toUpperCase()}`
                    ].join('\n'),
                    inline: false
                }
            )
            .setThumbnail('https://cdn.discordapp.com/emojis/123456789.png') // Money transfer emoji
            .setFooter({ 
                text: `Payment processed successfully`,
                })
            .setTimestamp();

        // Add experience to sender for being generous
        const expGain = database.addExperience(message.author.id, 10);
        
        if (expGain.leveledUp) {
            embed.addFields({
                name: '🎉 Level Up!',
                value: `${message.author.username} reached level **${expGain.newLevel}** for being generous!`,
                inline: false
            });
        }

        // Update command usage statistics
        database.updateStats(message.author.id, 'command');

        message.reply({ embeds: [embed] });

        // Try to DM the recipient about the payment
        try {
            const dmEmbed = new EmbedBuilder()
                .setColor(colors.success)
                .setTitle('💰 You Received Money!')
                .setDescription(`**${message.author.username}** sent you **${amount.toLocaleString()}** ${config.economy.currency}!`)
                .addFields({
                    name: 'Your New Balance',
                    value: `${recipientNewBalance.toLocaleString()} ${config.economy.currency}`,
                    inline: true
                })
                .setFooter({ text: 'KsaekVat Bot Payment System' })
                .setTimestamp();

            target.send({ embeds: [dmEmbed] }).catch(() => {
                // Ignore if DM fails (user has DMs disabled)
            });
        } catch (error) {
            // Ignore DM errors
        }
    }
};
