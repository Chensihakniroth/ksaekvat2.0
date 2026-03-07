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
                embeds: [{
                    color: colors.error,
                    title: '(｡•́︿•̀｡) Oh no, darling...',
                    description: 'Mommy doesn\'t have permission to kick members in this server. (っ˘ω˘ς)'
                }]
            });
        }

        // Check arguments
        if (args.length < 1) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '(◕‸ ◕✿) Sweetie, you forgot something!',
                    description: 'Please tell Mommy who to kick. (｡•́︿•̀｡)\n**Usage:** `Kkick @user [reason]`\n**Example:** `Kkick @user Breaking rules`'
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
                    title: '(｡•́︿•̀｡) I can\'t find them, darling',
                    description: 'Please mention a valid user or provide their user ID so Mommy can find them. (◕‿◕✿)'
                }]
            });
        }

        // Get reason
        const reason = args.slice(1).join(' ') || 'No reason provided';

        // Check if user is in the guild
        const member = message.guild.members.cache.get(target.id);
        
        if (!member) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '(っ˘ω˘ς) They aren\'t here, sweetie',
                    description: 'This user is not a member of this server. (◕‿◕✿)'
                }]
            });
        }

        // Prevent kicking yourself
        if (target.id === message.author.id) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '(◕‸ ◕✿) Silly little one!',
                    description: 'You cannot kick yourself! Mommy wouldn\'t want that. (っ˘ω˘ς)'
                }]
            });
        }

        // Prevent kicking the bot
        if (target.id === client.user.id) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '(｡♥‿♥｡) Oh, sweetie...',
                    description: 'I cannot kick myself! Who would take care of you? (ﾉ´ヮ`)ﾉ*:･ﾟ✧'
                }]
            });
        }

        // Check if target is kickable
        if (!member.kickable) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '(｡•́︿•̀｡) I\'m sorry, darling',
                    description: 'Mommy cannot kick this user. They might be too powerful for me. (っ˘ω˘ς)'
                }]
            });
        }

        // Check role hierarchy
        if (member.roles.highest.position >= message.guild.members.me.roles.highest.position) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '(｡•́︿•̀｡) It\'s not working...',
                    description: 'I cannot kick this user as they have a role equal to or higher than Mommy\'s. (◕‸ ◕✿)'
                }]
            });
        }

        // Get member info before kicking
        const joinedAt = member.joinedTimestamp;
        const roles = member.roles.cache.filter(role => role.id !== message.guild.id).map(role => role.name).slice(0, 5);

        // Try to DM the user before kicking
        const dmEmbed = new EmbedBuilder()
            .setColor(colors.warning)
            .setTitle('(｡•́︿•̀｡) Time to go, little one')
            .setDescription(`You have been kicked from **${message.guild.name}**. Mommy hopes you'll be better next time. (っ˘ω˘ς)`)
            .addFields(
                {
                    name: 'Reason',
                    value: reason,
                    inline: false
                },
                {
                    name: 'Kicked By',
                    value: message.author.tag,
                    inline: true
                },
                {
                    name: 'Server',
                    value: message.guild.name,
                    inline: true
                }
            )
            
            

        // Attempt to send DM (but don't let it fail the kick)
        target.send({ embeds: [dmEmbed] }).catch(() => {
            // User has DMs disabled or blocked the bot
        });

        // Kick the user
        member.kick(`${reason} | Kicked by: ${message.author.tag}`).then(() => {
            const successEmbed = new EmbedBuilder()
                .setColor(colors.success)
                .setTitle('ヽ(>∀<☆)ノ User Kicked Successfully!')
                .setDescription(`**${target.tag}** has been sent away for a bit. Mommy hopes they learn. (｡♥‿♥｡)`)
                .addFields(
                    {
                        name: '(◕‿◕✿) Kicked User',
                        value: [
                            `**Username:** ${target.username}`,
                            `**User ID:** ${target.id}`,
                            `**Joined Server:** <t:${Math.floor(joinedAt / 1000)}:R>`,
                            `**Account Created:** <t:${Math.floor(target.createdTimestamp / 1000)}:R>`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '(っ˘ω˘ς) Kick Details',
                        value: [
                            `**Reason:** ${reason}`,
                            `**Kicked By:** ${message.author.tag}`,
                            `**Date:** <t:${Math.floor(Date.now() / 1000)}:F>`
                        ].join('\n'),
                        inline: true
                    }
                );

            if (roles.length > 0) {
                successEmbed.addFields({
                    name: '(◕‿◕✿) Previous Roles',
                    value: roles.join(', ') + (member.roles.cache.size > 6 ? `, +${member.roles.cache.size - 6} more` : ''),
                    inline: false
                });
            }

            successEmbed.setThumbnail(target.displayAvatarURL())
                
                

            message.reply({ embeds: [successEmbed] });

            // Log the kick
            console.log(`[KICK] ${message.author.tag} kicked ${target.tag} | Reason: ${reason}`);

        }).catch(error => {
            console.error('Error kicking user:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(colors.error)
                .setTitle('(｡•́︿•̀｡) Oh no, it failed')
                .setDescription(`Mommy couldn't kick **${target.tag}**. Something went wrong... (っ˘ω˘ς)`)
                .addFields({
                    name: 'Error',
                    value: error.message || 'Unknown error occurred',
                    inline: false
                })
                

            message.reply({ embeds: [errorEmbed] });
        });
    }
};
