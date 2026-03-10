"use strict";
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const colors = require('../../utils/colors.js');
module.exports = {
    name: 'ban',
    aliases: ['banuser'],
    description: 'Ban a user from the server (Admin only)',
    usage: 'ban <@user> [reason]',
    adminOnly: true,
    async execute(message, args, client) {
        // Check if bot has ban permissions
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return message.reply({
                embeds: [
                    {
                        color: colors.error,
                        title: '(｡•́︿•̀｡) Oh no, darling...',
                        description: "Mommy doesn't have permission to ban members in this server. (っ˘ω˘ς)",
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
                        description: 'Please provide a user for Mommy to ban. (｡•́︿•̀｡)\n**Usage:** `Kban @user [reason]`\n**Example:** `Kban @user Breaking rules`',
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
            try {
                target = await client.users.fetch(userId);
            }
            catch (error) {
                target = null;
            }
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
        // Get reason
        const reason = args.slice(1).join(' ') || 'No reason provided';
        // Check if user is in the guild
        const member = message.guild.members.cache.get(target.id);
        if (member) {
            // Prevent banning yourself
            if (target.id === message.author.id) {
                return message.reply({
                    embeds: [
                        {
                            color: colors.warning,
                            title: '(◕‸ ◕✿) Silly little one!',
                            description: "You cannot ban yourself! Mommy wouldn't want that. (っ˘ω˘ς)",
                        },
                    ],
                });
            }
            // Prevent banning the bot
            if (target.id === client.user.id) {
                return message.reply({
                    embeds: [
                        {
                            color: colors.warning,
                            title: '(｡♥‿♥｡) Oh, sweetie...',
                            description: 'I cannot ban myself! Who would take care of you? (ﾉ´ヮ`)ﾉ*:･ﾟ✧',
                        },
                    ],
                });
            }
            // Check if target is bannable
            if (!member.bannable) {
                return message.reply({
                    embeds: [
                        {
                            color: colors.error,
                            title: "(｡•́︿•̀｡) I'm sorry, darling",
                            description: 'Mommy cannot ban this user. They might be too powerful for me. (っ˘ω˘ς)',
                        },
                    ],
                });
            }
            // Check role hierarchy
            if (member.roles.highest.position >= message.guild.members.me.roles.highest.position) {
                return message.reply({
                    embeds: [
                        {
                            color: colors.error,
                            title: "(｡•́︿•̀｡) It's not working...",
                            description: "I cannot ban this user as they have a role equal to or higher than Mommy's. (◕‸ ◕✿)",
                        },
                    ],
                });
            }
        }
        // Try to DM the user before banning
        const dmEmbed = new EmbedBuilder()
            .setColor(colors.error)
            .setTitle('(｡•́︿•̀｡) Goodbye, little one')
            .setDescription(`You have been banned from **${message.guild.name}**. Mommy hopes you learn from this. (っ˘ω˘ς)`)
            .addFields({
            name: 'Reason',
            value: reason,
            inline: false,
        }, {
            name: 'Banned By',
            value: message.author.tag,
            inline: true,
        }, {
            name: 'Server',
            value: message.guild.name,
            inline: true,
        });
        // Attempt to send DM
        await target.send({ embeds: [dmEmbed] }).catch(() => {
            // User has DMs disabled
        });
        // Ban the user
        message.guild.members
            .ban(target, { reason: `${reason} | Banned by: ${message.author.tag}` })
            .then(() => {
            const successEmbed = new EmbedBuilder()
                .setColor(colors.success)
                .setTitle('ヽ(>∀<☆)ノ User Banned Successfully!')
                .setDescription(`**${target.tag}** has been sent away. Mommy did it for the server! (｡♥‿♥｡)`)
                .addFields({
                name: '(◕‿◕✿) Banned User',
                value: [
                    `**Username:** ${target.username}`,
                    `**User ID:** ${target.id}`,
                    `**Account Created:** <t:${Math.floor(target.createdTimestamp / 1000)}:R>`,
                ].join('\n'),
                inline: true,
            }, {
                name: '(っ˘ω˘ς) Ban Details',
                value: [
                    `**Reason:** ${reason}`,
                    `**Banned By:** ${message.author.tag}`,
                    `**Date:** <t:${Math.floor(Date.now() / 1000)}:F>`,
                ].join('\n'),
                inline: true,
            })
                .setThumbnail(target.displayAvatarURL());
            message.reply({ embeds: [successEmbed] });
            // Log the ban
            console.log(`[BAN] ${message.author.tag} banned ${target.tag} | Reason: ${reason}`);
        })
            .catch((error) => {
            console.error('Error banning user:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(colors.error)
                .setTitle('(｡•́︿•̀｡) Oh no, it failed')
                .setDescription(`Mommy couldn't ban **${target.tag}**. Something went wrong... (っ˘ω˘ς)`)
                .addFields({
                name: 'Error',
                value: error.message || 'Unknown error occurred',
                inline: false,
            });
            message.reply({ embeds: [errorEmbed] });
        });
    },
};
