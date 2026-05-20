"use strict";
const { EmbedBuilder } = require('discord.js');
const config = require('../../config/config.js');
const colors = require('../../utils/colors.js');
const database = require('../../services/DatabaseService');
module.exports = {
    name: 'help',
    aliases: ['hp', 'commands'],
    description: 'Displays a list of available commands and their usage.',
    usage: 'help [command]',
    category: 'general',
    execute: async (message, args, client) => {
        const prefix = (config.prefix && config.prefix[0]) || 'K';
        if (args.length === 0) {
            // Get all unique commands (filter out aliases)
            const commands = [...new Set(client.commands.values())].filter(cmd => !cmd.hidden);
            // Category Mapping
            const categoryNames = {
                admin: '🔨 Admin',
                pokemon: '🦊 Pokémon',
                battle: '⚔️ Battle',
                economy: '💰 Economy',
                expressions: '😄 Expressions',
                gambling: '🎰 Gambling',
                general: '📁 General',
                meme: '🎭 Meme',
                profile: '👤 Profile',
                slash: '⚡ Slash Commands',
                nsfw: '🔞 NSFW',
                special: '✨ Special'
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
                .setTitle(`Command List ~ ${config.botInfo.name}`)
                .setDescription(`**Prefix:** \`${userPrefix}\`\nType \`${userPrefix}help [command]\` to view specific details for a command.\nTo change your prefix, use \`${userPrefix}prefix\`.`)
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
                    name: '⌨️ Shortcuts',
                    value: shortPrefixList,
                    inline: false,
                });
            }
            embed.setFooter({ text: `Use ${userPrefix}help [command] for more info.` });
            return message.reply({ embeds: [embed] });
        }
        // Detailed info for a specific command
        const search = args[0].toLowerCase();
        const command = client.commands.get(search) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(search));
        if (!command || command.hidden) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(colors.error || '#f04747')
                        .setTitle('❌ Command Not Found')
                        .setDescription(`Could not find the \`${search}\` command.\nUse \`${prefix}help\` to see a list of all commands.`),
                ],
            });
        }
        const embed = new EmbedBuilder()
            .setColor(colors.primary || '#7289da')
            .setTitle(`📖 Command: ${command.name}`)
            .setDescription(command.description || "No description provided.")
            .addFields({
            name: 'Usage',
            value: `\`${prefix}${command.usage || command.name}\``,
            inline: true,
        });
        if (command.aliases && command.aliases.length > 0) {
            embed.addFields({
                name: 'Aliases',
                value: command.aliases.map((a) => `\`${a}\``).join(', '),
                inline: true,
            });
        }
        if (command.cooldown) {
            embed.addFields({ name: 'Cooldown', value: `${command.cooldown / 1000}s`, inline: true });
        }
        if (command.adminOnly) {
            embed.addFields({ name: 'Permissions', value: '🛡️ Admin Only', inline: true });
        }
        message.reply({ embeds: [embed] });
    },
};
