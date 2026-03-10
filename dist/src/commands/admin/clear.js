"use strict";
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const colors = require('../../utils/colors.js');
module.exports = {
    name: 'clear',
    aliases: ['purge', 'delete'],
    description: 'Clear messages from the channel (Admin only)',
    usage: 'clear <amount> [@user]',
    adminOnly: true,
    execute(message, args, client) {
        // Check if bot has manage messages permissions
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.reply({
                embeds: [
                    {
                        color: colors.error,
                        title: '(｡•́︿•̀｡) Oh no, darling...',
                        description: "Mommy doesn't have permission to manage messages in this server. (っ˘ω˘ς)",
                    },
                ],
            });
        }
        // Check arguments
        if (args.length < 1) {
            return message.reply({
                embeds: [
                    {
                        color: colors.error,
                        title: '(◕‸ ◕✿) Sweetie, you forgot something!',
                        description: 'Please tell Mommy how many messages to clear. (｡•́︿•̀｡)\n**Usage:** `Kclear <amount> [@user]`\n**Examples:**\n`Kclear 10` - Clear 10 messages\n`Kclear 5 @user` - Clear 5 messages from specific user',
                    },
                ],
            });
        }
        // Parse amount
        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount <= 0 || amount > 100) {
            return message.reply({
                embeds: [
                    {
                        color: colors.error,
                        title: "(｡•́︿•̀｡) That's not right, darling",
                        description: 'Please provide a number between 1 and 100 so Mommy can help you. (◕‿◕✿)',
                    },
                ],
            });
        }
        // Get target user if specified
        let targetUser = null;
        if (message.mentions.users.size > 0) {
            targetUser = message.mentions.users.first();
        }
        else if (args.length > 1) {
            const userId = args[1];
            targetUser = client.users.cache.get(userId);
        }
        // Delete the command message first
        message.delete().catch(() => {
            // Ignore if already deleted
        });
        // Fetch messages
        message.channel.messages
            .fetch({ limit: Math.min(amount + 10, 100) })
            .then((messages) => {
            let messagesToDelete = messages;
            // Filter by user if specified
            if (targetUser) {
                messagesToDelete = messages.filter((msg) => msg.author.id === targetUser.id);
                if (messagesToDelete.size === 0) {
                    return message.channel
                        .send({
                        embeds: [
                            {
                                color: colors.warning,
                                title: "(っ˘ω˘ς) I couldn't find anything...",
                                description: `No messages from **${targetUser.username}** found in the recent messages, sweetie. (◕‿◕✿)`,
                            },
                        ],
                    })
                        .then((msg) => {
                        setTimeout(() => msg.delete().catch(() => { }), 5000);
                    });
                }
            }
            // Limit to requested amount
            messagesToDelete = messagesToDelete.first(amount);
            // Filter out messages older than 14 days (Discord limitation)
            const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
            const recentMessages = messagesToDelete.filter((msg) => msg.createdTimestamp > twoWeeksAgo);
            const oldMessages = messagesToDelete.filter((msg) => msg.createdTimestamp <= twoWeeksAgo);
            if (recentMessages.size === 0) {
                return message.channel
                    .send({
                    embeds: [
                        {
                            color: colors.warning,
                            title: '(｡•́︿•̀｡) These are too old, darling',
                            description: "All targeted messages are older than 14 days and Mommy can't bulk delete them. (っ˘ω˘ς)",
                        },
                    ],
                })
                    .then((msg) => {
                    setTimeout(() => msg.delete().catch(() => { }), 5000);
                });
            }
            // Bulk delete recent messages
            message.channel
                .bulkDelete(recentMessages, true)
                .then((deletedMessages) => {
                const deletedCount = deletedMessages.size;
                let description = `Mommy successfully cleaned up **${deletedCount}** messages for you! ヽ(>∀<☆)ノ`;
                if (targetUser) {
                    description = `Mommy successfully cleaned up **${deletedCount}** messages from **${targetUser.username}**! (｡♥‿♥｡)`;
                }
                if (oldMessages.size > 0) {
                    description += `\n\n(っ˘ω˘ς) **${oldMessages.size}** messages were too old for Mommy to delete (older than 14 days).`;
                }
                const successEmbed = new EmbedBuilder()
                    .setColor(colors.success)
                    .setTitle('ヽ(>∀<☆)ノ All Cleaned Up!')
                    .setDescription(description)
                    .addFields({
                    name: '(◕‿◕✿) Summary',
                    value: [
                        `**Requested:** ${amount} messages`,
                        `**Deleted:** ${deletedCount} messages`,
                        targetUser
                            ? `**Target User:** ${targetUser.username}`
                            : '**Target:** All users',
                        `**Channel:** ${message.channel.name}`,
                        `**Cleared by:** ${message.author.username}`,
                    ].join('\n'),
                    inline: true,
                }, {
                    name: '(｡♥‿♥｡) Admin Action',
                    value: [
                        `**Admin:** ${message.author.username}`,
                        `**Action:** Clear Messages`,
                    ].join('\n'),
                    inline: true,
                });
                // Send confirmation message and delete it after 10 seconds
                message.channel.send({ embeds: [successEmbed] }).then((confirmMsg) => {
                    setTimeout(() => {
                        confirmMsg.delete().catch(() => { });
                    }, 10000);
                });
                // Log the clear action
                console.log(`[CLEAR] ${message.author.tag} cleared ${deletedCount} messages in #${message.channel.name} ${targetUser ? `from ${targetUser.tag}` : ''}`);
                // Delete old messages individually if any (slower but necessary)
                if (oldMessages.size > 0) {
                    oldMessages.forEach((msg) => {
                        setTimeout(() => {
                            msg.delete().catch(() => { });
                        }, Math.random() * 1000);
                    });
                }
            })
                .catch((error) => {
                console.error('Error bulk deleting messages:', error);
                message.channel
                    .send({
                    embeds: [
                        {
                            color: colors.error,
                            title: '(｡•́︿•̀｡) Mommy failed you...',
                            description: `Failed to clear messages: ${error.message} (っ˘ω˘ς)`,
                        },
                    ],
                })
                    .then((msg) => {
                    setTimeout(() => msg.delete().catch(() => { }), 10000);
                });
            });
        })
            .catch((error) => {
            console.error('Error fetching messages:', error);
            message.channel
                .send({
                embeds: [
                    {
                        color: colors.error,
                        title: '(｡•́︿•̀｡) Something went wrong...',
                        description: `Failed to fetch messages: ${error.message} (っ˘ω˘ς)`,
                    },
                ],
            })
                .then((msg) => {
                setTimeout(() => msg.delete().catch(() => { }), 10000);
            });
        });
    },
};
