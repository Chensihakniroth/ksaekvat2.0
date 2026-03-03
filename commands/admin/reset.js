const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const AdminService = require('../../services/AdminService.js');
const EconomyService = require('../../services/EconomyService.js');

module.exports = {
    name: 'reset',
    aliases: ['resetuser'],
    description: 'Reset a user\'s data completely (Admin only)',
    usage: 'reset <@user>',
    adminOnly: true,
    async execute(message, args, client) {
        // Check arguments
        if (args.length < 1) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ Invalid Usage',
                    description: 'Please provide a user to reset.\n**Usage:** `Kreset @user`\n**Warning:** This will delete ALL user data!'
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

        // Prevent resetting admin accounts
        if (config.adminIds.includes(target.id)) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '🛡️ Cannot Reset Admin',
                    description: 'You cannot reset another admin\'s account for security reasons.'
                }]
            });
        }

        // Get current user data for backup info
        const userData = await database.getUser(target.id, target.username);
        const backupData = {
            balance: userData.balance || 0,
            level: userData.level || 1,
            experience: userData.experience || 0,
            totalAnimalsFound: userData.stats?.totalAnimalsFound || 0,
            commandsUsed: userData.stats?.commandsUsed || 0,
            animalCount: Object.keys(userData.animals || {}).reduce((total, rarity) => 
                total + Object.keys(userData.animals[rarity] || {}).length, 0)
        };

        // Create confirmation embed
        const confirmEmbed = new EmbedBuilder()
            .setColor(colors.warning)
            .setTitle('⚠️ CONFIRM USER RESET')
            .setDescription(`Are you sure you want to **COMPLETELY RESET** ${target.username}'s account?\n\n**THIS ACTION CANNOT BE UNDONE!**`)
            .addFields(
                {
                    name: '👤 Target User',
                    value: [
                        `**Username:** ${target.username}`,
                        `**User ID:** ${target.id}`,
                        `**Account Age:** ${Math.floor((Date.now() - (userData.joinedAt || Date.now())) / (1000 * 60 * 60 * 24))} days`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '📊 Current Data (WILL BE LOST)',
                    value: [
                        `**Balance:** ${EconomyService.format(backupData.balance)} ${config.economy.currency}`,
                        `**Level:** ${backupData.level} (${backupData.experience} XP)`,
                        `**Animals Found:** ${backupData.totalAnimalsFound}`,
                        `**Unique Animals:** ${backupData.animalCount}`,
                        `**Commands Used:** ${backupData.commandsUsed}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🚨 WARNING',
                    value: [
                        '• All progress will be deleted',
                        '• All animals will be lost',
                        '• All statistics will be reset',
                        '• Balance will reset to 1000',
                        '• Level will reset to 1',
                        '• This action is IRREVERSIBLE'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '📋 How to Confirm',
                    value: '✅ React with ✅ to confirm reset\n❌ React with ❌ to cancel',
                    inline: false
                }
            );

        message.reply({ embeds: [confirmEmbed] }).then(async (sentMessage) => {
            // Add reaction options
            await sentMessage.react('✅');
            await sentMessage.react('❌');

            // Create reaction collector
            const filter = (reaction, user) => {
                return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
            };

            const collector = sentMessage.createReactionCollector({ filter, time: 30000, max: 1 });

            collector.on('collect', async (reaction, user) => {
                if (reaction.emoji.name === '✅') {
                    // Reset confirmed - using Service
                    AdminService.resetUser(userData);
                    await database.saveUser(userData);

                    const resetEmbed = new EmbedBuilder()
                        .setColor(colors.success)
                        .setTitle('✅ User Reset Complete')
                        .setDescription(`**${target.username}**'s account has been completely reset.`)
                        .addFields(
                            {
                                name: '🔄 Reset Summary',
                                value: [
                                    `**User:** ${target.username} (${target.id})`,
                                    `**Reset by:** ${message.author.username}`,
                                    `**Reset time:** <t:${Math.floor(Date.now() / 1000)}:F>`,
                                    `**Previous balance:** ${EconomyService.format(backupData.balance)} ${config.economy.currency}`,
                                    `**Previous level:** ${backupData.level}`
                                ].join('\n'),
                                inline: false
                            },
                            {
                                name: '📊 New Account State',
                                value: [
                                    `**Balance:** 1,000 ${config.economy.currency}`,
                                    `**Level:** 1 (0 XP)`,
                                    `**Animals:** None`,
                                    `**Statistics:** All reset to 0`
                                ].join('\n'),
                                inline: false
                            }
                        )
                        .setThumbnail(target.displayAvatarURL());

                    await sentMessage.edit({ embeds: [resetEmbed] });
                    await sentMessage.reactions.removeAll();

                    // Log the admin action
                    console.log(`[ADMIN] ${message.author.tag} RESET ${target.tag}'s account completely`);

                    // Try to DM the user
                    try {
                        const dmEmbed = new EmbedBuilder()
                            .setColor(colors.warning)
                            .setTitle('🔄 Account Reset')
                            .setDescription('Your account has been reset by an administrator.')
                            .addFields({
                                name: 'What happened?',
                                value: 'All your progress, animals, and statistics have been reset to default values.',
                                inline: false
                            });

                        target.send({ embeds: [dmEmbed] }).catch(() => {});
                    } catch (error) {}

                } else {
                    // Reset cancelled
                    const cancelEmbed = new EmbedBuilder()
                        .setColor(colors.secondary)
                        .setTitle('❌ Reset Cancelled')
                        .setDescription(`Reset operation for **${target.username}** has been cancelled.\n\nNo data was modified.`);

                    await sentMessage.edit({ embeds: [cancelEmbed] });
                    await sentMessage.reactions.removeAll();
                }
            });

            collector.on('end', async (collected) => {
                if (collected.size === 0) {
                    const timeoutEmbed = new EmbedBuilder()
                        .setColor(colors.warning)
                        .setTitle('⏰ Reset Timeout')
                        .setDescription(`Reset confirmation timed out for **${target.username}**.\n\nNo action was taken.`);

                    await sentMessage.edit({ embeds: [timeoutEmbed] });
                    await sentMessage.reactions.removeAll();
                }
            });
        });
    }
};
