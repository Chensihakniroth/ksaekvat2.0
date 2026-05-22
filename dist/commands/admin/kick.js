"use strict";
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const colors = require('../../utils/colors.js');
module.exports = {
    name: 'kick',
    aliases: ['kickuser'],
    description: 'Kick a user from the server (Admin only)',
    usage: 'kick <@user> [reason]',
    adminOnly: true,
    execute(message, args, client) {
        // Check if bot has kick permissions
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return message.reply({
                embeds: [
                    {
                        color: colors.error,
                        title: '🚫 PERMISSION ERROR',
                        description: "System lack Kick permissions. (ಥ﹏ಥ) I can't boot them out if I don't have the clearance! (・_・ヾ",
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
                        title: '⚠️ ARGUMENT ERROR',
                        description: 'Who should I kick? (・_・ヾ Give me a name or ID!\n**Usage:** `Kkick @user [reason]`\n**Example:** `Kkick @user Breaking protocol`',
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
                        title: '🔍 TARGET NOT FOUND',
                        description: "I can't find that user in the server database. (・_・ヾ Please mention them or use a valid ID! (≧◡≦)",
                    },
                ],
            });
        }
        // Get reason
        const reason = args.slice(1).join(' ') || 'No reason provided';
        // Check if user is in the guild
        const member = message.guild.members.cache.get(target.id);
        if (!member) {
            return message.reply({
                embeds: [
                    {
                        color: colors.warning,
                        title: '📡 OFFLINE',
                        description: "That user isn't in this server sector! (・_・ヾ (◕‿◕✿)",
                    },
                ],
            });
        }
        // Prevent kicking yourself
        if (target.id === message.author.id) {
            return message.reply({
                embeds: [
                    {
                        color: colors.warning,
                        title: '⚠️ SELF-BOOT DETECTED',
                        description: "You can't kick yourself from the simulation! Silly. (≧◡≦)",
                    },
                ],
            });
        }
        // Prevent kicking the bot
        if (target.id === client.user.id) {
            return message.reply({
                embeds: [
                    {
                        color: colors.warning,
                        title: '🚫 SYSTEM PROTECTED',
                        description: "You're trying to kick ME? (¬‿¬) My source code is a bit too deep for that. (✧ω✧)",
                    },
                ],
            });
        }
        // Check if target is kickable
        if (!member.kickable) {
            return message.reply({
                embeds: [
                    {
                        color: colors.error,
                        title: '🛡️ TARGET PROTECTED',
                        description: 'System error: User is not kickable. They might have a higher clearance than me! (ಥ﹏ಥ)',
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
                        title: '⚡ HIERARCHY ERROR',
                        description: "I can't kick this user because their role rank is higher or equal to my current simulation privileges! (・_・ヾ",
                    },
                ],
            });
        }
        // Get member info before kicking
        const joinedAt = member.joinedTimestamp;
        const roles = member.roles.cache
            .filter((role) => role.id !== message.guild.id)
            .map((role) => role.name)
            .slice(0, 5);
        // Try to DM the user before kicking
        const dmEmbed = new EmbedBuilder()
            .setColor(colors.warning)
            .setTitle('🚪 SYSTEM BOOT')
            .setDescription(`You've been kicked from **${message.guild.name}**. Simulation concluded for you. (・_・ヾ`)
            .addFields({
            name: 'Reason',
            value: reason,
            inline: false,
        }, {
            name: 'Kicked By',
            value: message.author.tag,
            inline: true,
        }, {
            name: 'Server',
            value: message.guild.name,
            inline: true,
        });
        // Attempt to send DM (but don't let it fail the kick)
        target.send({ embeds: [dmEmbed] }).catch(() => {
            // User has DMs disabled or blocked the bot
        });
        member
            .kick(`${reason} | Purged by: ${message.author.tag}`)
            .then(() => {
            const successEmbed = new EmbedBuilder()
                .setColor(colors.success)
                .setTitle('🚀 USER BOOTED!')
                .setDescription(`**${target.tag}** has been removed from the server. Simulation optimized! (¬‿¬)`)
                .addFields({
                name: '(◕‿◕✿) Kicked User',
                value: [
                    `**Username:** ${target.username}`,
                    `**User ID:** ${target.id}`,
                    `**Joined Server:** <t:${Math.floor(joinedAt / 1000)}:R>`,
                    `**Account Created:** <t:${Math.floor(target.createdTimestamp / 1000)}:R>`,
                ].join('\n'),
                inline: true,
            }, {
                name: '(っ˘ω˘ς) Kick Details',
                value: [
                    `**Reason:** ${reason}`,
                    `**Kicked By:** ${message.author.tag}`,
                    `**Date:** <t:${Math.floor(Date.now() / 1000)}:F>`,
                ].join('\n'),
                inline: true,
            });
            if (roles.length > 0) {
                successEmbed.addFields({
                    name: '(◕‿◕✿) Previous Roles',
                    value: roles.join(', ') +
                        (member.roles.cache.size > 6 ? `, +${member.roles.cache.size - 6} more` : ''),
                    inline: false,
                });
            }
            successEmbed.setThumbnail(target.displayAvatarURL());
            message.reply({ embeds: [successEmbed] });
            // Log the kick
            console.log(`[KICK] ${message.author.tag} kicked ${target.tag} | Reason: ${reason}`);
        })
            .catch((error) => {
            console.error('Error kicking user:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(colors.error)
                .setTitle('(｡•́︿•̀｡) Oh no, it failed')
                .setDescription(`Mommy couldn't kick **${target.tag}**. Something went wrong... (っ˘ω˘ς)`)
                .addFields({
                name: 'Error',
                value: error.message || 'Unknown error occurred',
                inline: false,
            });
            message.reply({ embeds: [errorEmbed] });
        });
    },
};
