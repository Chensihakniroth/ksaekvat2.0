"use strict";
const { EmbedBuilder } = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
module.exports = {
    name: 'setlvl',
    aliases: ['setlevel'],
    description: "Set a user's level (Admin only)",
    usage: 'setlvl <@user> <level>',
    adminOnly: true,
    async execute(message, args, client) {
        // Check arguments
        if (args.length < 2) {
            return message.reply({
                embeds: [
                    {
                        color: colors.error,
                        title: '(◕‸ ◕✿) Sweetie, you forgot something!',
                        description: 'Please tell Mommy who to level up and what level they should be. (｡•́︿•̀｡)\n**Usage:** `Ksetlvl @user <level>`\n**Example:** `Ksetlvl @user 25`',
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
        // Parse level
        const level = parseInt(args[1]);
        if (isNaN(level) || level < 1) {
            return message.reply({
                embeds: [
                    {
                        color: colors.error,
                        title: "(｡•́︿•̀｡) That's not right, darling",
                        description: 'Please provide a valid level for Mommy (minimum 1). (っ˘ω˘ς)',
                    },
                ],
            });
        }
        // Check maximum level to prevent abuse
        const maxLevel = 500;
        if (level > maxLevel) {
            return message.reply({
                embeds: [
                    {
                        color: colors.warning,
                        title: "(◕‸ ◕✿) That's too high, darling!",
                        description: `Mommy can't handle a level higher than ${maxLevel}. (っ˘ω˘ς)`,
                    },
                ],
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
            .setTitle('(｡♥‿♥｡) Level Updated!')
            .setDescription(`Mommy successfully adjusted **${target.username}**'s level! ヽ(>∀<☆)ノ`)
            .addFields({
            name: '(◕‿◕✿) Target User',
            value: [
                `**Username:** ${target.username}`,
                `**User ID:** ${target.id}`,
                `**Account Age:** ${Math.floor((Date.now() - userData.joinedAt) / (1000 * 60 * 60 * 24))} days`,
            ].join('\n'),
            inline: true,
        }, {
            name: '(っ˘ω˘ς) Level Changes',
            value: [
                `**Previous Level:** ${previousLevel}`,
                `**New Level:** ${level}`,
                `**Level Difference:** ${level >= previousLevel ? '+' : ''}${level - previousLevel}`,
                `**New Experience:** ${userData.experience} XP`,
            ].join('\n'),
            inline: true,
        }, {
            name: '(｡♥‿♥｡) Admin Action',
            value: [`**Admin:** ${message.author.username}`, `**Action:** Set Level`].join('\n'),
            inline: false,
        });
        // Add level benefits information
        embed.addFields({
            name: '(◕‿◕✿) Level Benefits',
            value: [
                `**Work Bonus:** +${level * 2} per work`,
                `**Daily Bonus:** +${level * 10} per daily`,
                `**Battle Attack:** ~${level * 10}`,
                `**Battle Defense:** ~${level * 8}`,
                `**Battle Health:** ~${level * 15 + 100}`,
            ].join('\n'),
            inline: false,
        });
        embed.setThumbnail(target.displayAvatarURL());
        message.reply({ embeds: [embed] });
        // Log the admin action
        console.log(`[ADMIN] ${message.author.tag} set ${target.tag}'s level to ${level} (was ${previousLevel})`);
        // Try to DM the user about the level change
        try {
            const dmEmbed = new EmbedBuilder()
                .setColor(colors.primary)
                .setTitle("(｡♥‿♥｡) You've Grown So Much!")
                .setDescription(`An administrator has updated your level, sweetie! ヽ(>∀<☆)ノ`)
                .addFields({
                name: '(◕‿◕✿) New Level',
                value: `Level ${level}`,
                inline: true,
            }, {
                name: '(っ˘ω˘ς) Experience',
                value: `${userData.experience} XP`,
                inline: true,
            });
            target.send({ embeds: [dmEmbed] }).catch(() => {
                // User has DMs disabled, ignore
            });
        }
        catch (error) {
            // Ignore DM errors
        }
    },
};
