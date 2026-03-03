const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');

module.exports = {
    name: 'setlvl',
    aliases: ['setlevel'],
    description: 'Set a user\'s level (Admin only)',
    usage: 'setlvl <@user> <level>',
    adminOnly: true,
    async execute(message, args, client) {
        // Check arguments
        if (args.length < 2) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ Invalid Usage',
                    description: 'Please provide a user and level.\n**Usage:** `Ksetlvl @user <level>`\n**Example:** `Ksetlvl @user 25`'
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

        // Parse level
        const level = parseInt(args[1]);
        if (isNaN(level) || level < 1) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '❌ Invalid Level',
                    description: 'Please provide a valid level (minimum 1).'
                }]
            });
        }

        // Check maximum level to prevent abuse
        const maxLevel = 500;
        if (level > maxLevel) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '⚠️ Level Too High',
                    description: `Maximum allowed level is ${maxLevel}.`
                }]
            });
        }

        // Get user data and previous level
        const userData = await database.getUser(target.id, target.username);
        const previousLevel = userData.level;
        const previousExperience = userData.experience;

        // Set new level and experience
        userData.level = level;
        userData.experience = (level - 1) * 100; // Set experience to match the level
        await database.saveUser(userData);

        const embed = new EmbedBuilder()
            .setColor(colors.success)
            .setTitle('⭐ Level Updated')
            .setDescription(`Successfully updated **${target.username}**'s level!`)
            .addFields(
                {
                    name: '👤 Target User',
                    value: [
                        `**Username:** ${target.username}`,
                        `**User ID:** ${target.id}`,
                        `**Account Age:** ${Math.floor((Date.now() - userData.joinedAt) / (1000 * 60 * 60 * 24))} days`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '📊 Level Changes',
                    value: [
                        `**Previous Level:** ${previousLevel}`,
                        `**New Level:** ${level}`,
                        `**Level Difference:** ${level >= previousLevel ? '+' : ''}${level - previousLevel}`,
                        `**New Experience:** ${userData.experience} XP`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🔧 Admin Action',
                    value: [
                        `**Admin:** ${message.author.username}`,
                        `**Action:** Set Level`,
                        ].join('\n'),
                    inline: false
                }
            );

        // Add level benefits information
        embed.addFields({
            name: '🎯 Level Benefits',
            value: [
                `**Work Bonus:** +${level * 2} per work`,
                `**Daily Bonus:** +${level * 10} per daily`,
                `**Battle Attack:** ~${level * 10}`,
                `**Battle Defense:** ~${level * 8}`,
                `**Battle Health:** ~${level * 15 + 100}`
            ].join('\n'),
            inline: false
        });

        embed.setThumbnail(target.displayAvatarURL())
            
            

        message.reply({ embeds: [embed] });

        // Log the admin action
        console.log(`[ADMIN] ${message.author.tag} set ${target.tag}'s level to ${level} (was ${previousLevel})`);

        // Try to DM the user about the level change
        try {
            const dmEmbed = new EmbedBuilder()
                .setColor(colors.primary)
                .setTitle('⭐ Level Updated')
                .setDescription(`An administrator has updated your level.`)
                .addFields(
                    {
                        name: 'New Level',
                        value: `Level ${level}`,
                        inline: true
                    },
                    {
                        name: 'Experience',
                        value: `${userData.experience} XP`,
                        inline: true
                    }
                )
                
                

            target.send({ embeds: [dmEmbed] }).catch(() => {
                // User has DMs disabled, ignore
            });
        } catch (error) {
            // Ignore DM errors
        }
    }
};




