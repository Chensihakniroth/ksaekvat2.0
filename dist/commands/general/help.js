"use strict";
const { EmbedBuilder } = require('discord.js');
const config = require('../../config/config.js');
const colors = require('../../utils/colors.js');
const database = require('../../services/DatabaseService');
module.exports = {
    name: 'help',
    aliases: ['hp', 'commands'],
    description: "Mommy's guide to all the fun things we can do together! (◕‿◕✿)",
    usage: 'help [command]',
    category: 'general',
    execute: async (message, args, client) => {
        const prefix = (config.prefix && config.prefix[0]) || 'K';
        if (args.length === 0) {
            // Get all unique commands (filter out aliases)
            const commands = [...new Set(client.commands.values())];
            // Category Mapping with Mommy flavor
            const categoryNames = {
                admin: "🔨 Mommy's Tools (Admin)",
                pokemon: '🦊 Our Catchable Friends (Pokémon)',
                battle: '⚔️ Protect Mommy (Battle)',
                economy: '💰 Your Allowance (Economy)',
                expressions: '😄 Expressions',
                gambling: "🎰 Let's Play (Gambling)",
                general: '📁 General Fun',
                meme: '🎭 Silliness (Meme)',
                profile: '👤 Your Info (Profile)',
                slash: '⚡ Slash Commands',
                nsfw: '🔞 Grown-up Stuff (NSFW)',
                special: '✨ Special Expressions'
            };
            // Organize commands by category
            const categories = {};
            commands.forEach((cmd) => {
                let category = cmd.category || 'general';
                if (category === 'expressions' && cmd.description && cmd.description.toLowerCase().includes('nsfw')) {
                    category = 'nsfw';
                }
                if (category === 'expressions' && ['amongustwerk', 'beksloy', 'kaskeavat'].includes(cmd.name)) {
                    category = 'special';
                }
                if (!categories[category])
                    categories[category] = [];
                categories[category].push(cmd);
            });
            // Add slash commands
            if (client.slashCommands && client.slashCommands.size > 0) {
                categories['slash'] = [...client.slashCommands.values()].map((cmd) => ({
                    name: cmd.data.name,
                    description: cmd.data.description,
                    isSlash: true,
                }));
            }
            const categoryOrder = [
                'general',
                'economy',
                'gambling',
                'pokemon',
                'battle',
                'profile',
                'expressions',
                'special',
                'nsfw',
                'meme',
                'admin',
                'slash',
            ];
            // Load user's custom prefix to show them
            let userPrefix = config.prefix[1]; // default 'K'
            try {
                const ud = await database.getUser(message.author.id, message.author.username);
                if (ud?.customPrefix)
                    userPrefix = ud.customPrefix;
            }
            catch (_) { }
            const embed = new EmbedBuilder()
                .setColor(colors.primary || '#7289da')
                .setTitle(`(｡♥‿♥｡) Mommy's Little Helper ~ ${config.botInfo.name}`)
                .setDescription(`Welcome sweetie! Here is everything we can do together. (ﾉ´ヮ\`)ﾉ*:･ﾟ✧\n\nYour current prefix: \`${userPrefix}\` — type \`${userPrefix}help [command]\` to learn more!\nChange your prefix anytime with \`${userPrefix}prefix\`! (◕‿◕✿)`)
                .setThumbnail(client.user.displayAvatarURL());
            // Add fields for each category in order
            categoryOrder.forEach((cat) => {
                if (categories[cat] && categories[cat].length > 0) {
                    const commandList = categories[cat]
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((cmd) => `\`${cmd.name}\``)
                        .join(', ');
                    embed.addFields({
                        name: categoryNames[cat] || `📦 ${cat.charAt(0).toUpperCase() + cat.slice(1)}`,
                        value: commandList,
                        inline: false,
                    });
                }
            });
            // Add Short Prefixes field
            if (config.shortPrefixes) {
                const shortPrefixList = Object.entries(config.shortPrefixes)
                    .map(([short, full]) => `\`${short}\` → \`${full}\``)
                    .join(' | ');
                embed.addFields({
                    name: "⌨️ Mommy's Shortcuts",
                    value: shortPrefixList,
                    inline: false,
                });
            }
            embed.setFooter({ text: 'Mommy is always here for you, darling ~ (っ˘ω˘ς)' });
            return message.reply({ embeds: [embed] });
        }
        // Detailed info for a specific command
        const search = args[0].toLowerCase();
        const command = client.commands.get(search) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(search));
        if (!command) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(colors.error || '#f04747')
                        .setTitle('❌ Oh no, darling...')
                        .setDescription(`Mommy couldn't find the \`${search}\` command. (｡•́︿•̀｡)\nUse \`${prefix}help\` to see everything Mommy can do!`),
                ],
            });
        }
        const embed = new EmbedBuilder()
            .setColor(colors.primary || '#7289da')
            .setTitle(`📖 Let Mommy explain: ${command.name}`)
            .setDescription(command.description || "Mommy hasn't written a description for this yet! (っ˘ω˘ς)")
            .addFields({
            name: 'How to play',
            value: `\`${prefix}${command.usage || command.name}\``,
            inline: true,
        });
        if (command.aliases && command.aliases.length > 0) {
            embed.addFields({
                name: 'Nicknames',
                value: command.aliases.map((a) => `\`${a}\``).join(', '),
                inline: true,
            });
        }
        if (command.cooldown) {
            embed.addFields({ name: 'Rest Time', value: `${command.cooldown / 1000}s`, inline: true });
        }
        if (command.adminOnly) {
            embed.addFields({ name: 'Permissions', value: '🛡️ Just for Mommy (Admin)', inline: true });
        }
        embed.setFooter({ text: "You're learning so fast, sweetie! ヽ(>∀<☆)ノ" });
        message.reply({ embeds: [embed] });
    },
};
