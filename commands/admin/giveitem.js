const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
    name: 'giveitem',
    aliases: ['additem'],
    description: 'Give an item to a user (Admin only)',
    usage: 'giveitem <@user> <item_type> [amount/duration]',
    adminOnly: true,
    async execute(message, args, client) {
        // Check arguments
        if (args.length < 2) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ Invalid Usage',
                    description: [
                        'Please provide a user and item type.',
                        '**Usage:** `Kgiveitem @user <item_type> [amount/duration]`',
                        '',
                        '**Available Items:**',
                        '• `money <amount>` - Give money',
                        '• `exp <amount>` - Give experience',
                        '• `money_booster [duration_minutes]` - Give money booster (default: 60 min)',
                        '• `exp_booster [duration_minutes]` - Give exp booster (default: 60 min)',
                        '',
                        '**Examples:**',
                        '`Kgiveitem @user money 10000`',
                        '`Kgiveitem @user exp 500`',
                        '`Kgiveitem @user money_booster 120`'
                    ].join('\n')
                }]
            });
        }

        // Get target user
        let target = null;
        if (message.mentions.users.size > 0) {
            target = message.mentions.users.first();
        } else {
            const userId = args[0];
            target = client.users.cache.get(userId);
        }

        if (!target) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ User Not Found',
                    description: 'Please mention a valid user or provide their user ID.'
                }]
            });
        }

        const itemType = args[1].toLowerCase();
        const amount = args[2] ? parseInt(args[2]) : null;

        // Get user data
        const userData = await database.getUser(target.id, target.username);

        let resultEmbed;
        let success = false;

        switch (itemType) {
            case 'money':
            case 'coins':
            case 'balance':
                if (!amount || amount <= 0) {
                    return message.reply({
                        embeds: [{
                            color: colors.error,
                            title: '❌ Invalid Amount',
                            description: 'Please provide a valid positive amount for money.'
                        }]
                    });
                }

                const userUpdate = await database.addBalance(target.id, amount);
                const newBalance = userUpdate.balance;
                
                resultEmbed = new EmbedBuilder()
                    .setColor(colors.success)
                    .setTitle('💰 Money Given')
                    .setDescription(`Successfully gave **${amount.toLocaleString()}** ${config.economy.currency} to **${target.username}**!`)
                    .addFields(
                        {
                            name: '💳 Balance Update',
                            value: [
                                `**Previous:** ${(newBalance - amount).toLocaleString()} ${config.economy.currency}`,
                                `**Added:** +${amount.toLocaleString()} ${config.economy.currency}`,
                                `**New Balance:** ${newBalance.toLocaleString()} ${config.economy.currency}`
                            ].join('\n'),
                            inline: true
                        }
                    );
                success = true;
                break;

            case 'exp':
            case 'experience':
            case 'xp':
                if (!amount || amount <= 0) {
                    return message.reply({
                        embeds: [{
                            color: colors.error,
                            title: '❌ Invalid Amount',
                            description: 'Please provide a valid positive amount for experience.'
                        }]
                    });
                }

                const previousLevel = userData.level;
                const expGain = await database.addExperience(target.id, amount);
                const updatedUser = await database.getUser(target.id, target.username);
                
                resultEmbed = new EmbedBuilder()
                    .setColor(colors.success)
                    .setTitle('⭐ Experience Given')
                    .setDescription(`Successfully gave **${amount}** XP to **${target.username}**!`)
                    .addFields(
                        {
                            name: '📊 Experience Update',
                            value: [
                                `**Added:** +${amount} XP`,
                                `**New Total:** ${updatedUser.experience} XP`,
                                expGain.leveledUp ? `🎉 **Level Up!** ${previousLevel} → ${expGain.newLevel}` : `**Current Level:** ${updatedUser.level}`
                            ].join('\n'),
                            inline: true
                        }
                    );
                success = true;
                break;

            case 'money_booster':
            case 'moneybooster':
                const moneyDuration = amount || 60; // Default 60 minutes
                if (moneyDuration <= 0 || moneyDuration > 1440) { // Max 24 hours
                    return message.reply({
                        embeds: [{
                            color: colors.error,
                            title: '❌ Invalid Duration',
                            description: 'Duration must be between 1 and 1440 minutes (24 hours).'
                        }]
                    });
                }

                await database.addBooster(target.id, 'money', 2, moneyDuration * 60 * 1000);
                
                resultEmbed = new EmbedBuilder()
                    .setColor(colors.success)
                    .setTitle('🚀 Money Booster Given')
                    .setDescription(`Successfully gave a **Money Booster x2** to **${target.username}**!`)
                    .addFields(
                        {
                            name: '⚡ Booster Details',
                            value: [
                                `**Type:** Money Booster`,
                                `**Multiplier:** x2`,
                                `**Duration:** ${moneyDuration} minutes`,
                                `**Effect:** Doubles all money gains`
                            ].join('\n'),
                            inline: true
                        }
                    );
                success = true;
                break;

            case 'exp_booster':
            case 'expbooster':
            case 'xp_booster':
                const expDuration = amount || 60; // Default 60 minutes
                if (expDuration <= 0 || expDuration > 1440) { // Max 24 hours
                    return message.reply({
                        embeds: [{
                            color: colors.error,
                            title: '❌ Invalid Duration',
                            description: 'Duration must be between 1 and 1440 minutes (24 hours).'
                        }]
                    });
                }

                await database.addBooster(target.id, 'exp', 2, expDuration * 60 * 1000);
                
                resultEmbed = new EmbedBuilder()
                    .setColor(colors.success)
                    .setTitle('⭐ Experience Booster Given')
                    .setDescription(`Successfully gave an **Experience Booster x2** to **${target.username}**!`)
                    .addFields(
                        {
                            name: '⚡ Booster Details',
                            value: [
                                `**Type:** Experience Booster`,
                                `**Multiplier:** x2`,
                                `**Duration:** ${expDuration} minutes`,
                                `**Effect:** Doubles all XP gains`
                            ].join('\n'),
                            inline: true
                        }
                    );
                success = true;
                break;

            default:
                return message.reply({
                    embeds: [{
                        color: colors.error,
                        title: '❌ Invalid Item Type',
                        description: [
                            'Available item types:',
                            '• `money` - Give money',
                            '• `exp` - Give experience',
                            '• `money_booster` - Give money booster',
                            '• `exp_booster` - Give experience booster'
                        ].join('\n')
                    }]
                });
        }

        if (success && resultEmbed) {
            // Add admin info to embed
            resultEmbed.addFields(
                {
                    name: '🔧 Admin Action',
                    value: [
                        `**Admin:** ${message.author.username}`,
                        `**Target:** ${target.username}`,
                        `**Item:** ${itemType}`,
                        ].join('\n'),
                    inline: true
                }
            );

            resultEmbed.setThumbnail(target.displayAvatarURL())
                
                

            message.reply({ embeds: [resultEmbed] });

            // Log the admin action
            console.log(`[ADMIN] ${message.author.tag} gave ${target.tag} ${itemType} ${amount || 'default'}`);

            // Try to DM the user about the gift
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(colors.primary)
                    .setTitle('🎁 You Received a Gift!')
                    .setDescription(`An administrator gave you a ${itemType}!`)
                    
                    

                target.send({ embeds: [dmEmbed] }).catch(() => {
                    // User has DMs disabled, ignore
                });
            } catch (error) {
                // Ignore DM errors
            }
        }
    }
};




