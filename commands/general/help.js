const { EmbedBuilder } = require('discord.js');
const config = require('../../config/config.js');
const colors = require('../../utils/colors.js');

module.exports = {
    name: 'help',
    aliases: ['hp', 'commands'],
    description: 'Shows all available commands or detailed info about a specific command',
    usage: 'help [command]',
    execute(message, args, client) {
        const prefix = (config.prefix && config.prefix[0]) || 'K';

        if (args.length === 0) {
            // Get all unique commands (filter out aliases)
            const commands = [...new Set(client.commands.values())];
            
            // Category Mapping
            const categoryNames = {
                'admin': '🔨 Admin Only',
                'animals': '🦊 Animals',
                'battle': '⚔️ Battle',
                'economy': '💰 Economy',
                'expressions': '😄 Expressions',
                'gambling': '🎰 Gambling',
                'general': '📁 General',
                'meme': '🎭 Meme',
                'profile': '👤 Profile',
                'slash': '⚡ Slash Commands'
            };

            // Organize commands by category
            const categories = {};
            
            commands.forEach(cmd => {
                let category = cmd.category || 'general';
                
                // Special case: NSFW commands in expressions
                if (category === 'expressions' && cmd.description && cmd.description.toLowerCase().includes('nsfw')) {
                    category = 'nsfw';
                }
                
                // Special case: Special expressions
                if (category === 'expressions' && (cmd.name === 'amongustwerk' || cmd.name === 'beksloy' || cmd.name === 'ksaekvat')) {
                    category = 'special';
                }

                if (!categories[category]) {
                    categories[category] = [];
                }
                categories[category].push(cmd);
            });

            // Add slash commands
            if (client.slashCommands && client.slashCommands.size > 0) {
                categories['slash'] = [...client.slashCommands.values()].map(cmd => ({
                    name: cmd.data.name,
                    description: cmd.data.description,
                    isSlash: true
                }));
            }

            const categoryOrder = ['general', 'economy', 'gambling', 'animals', 'battle', 'profile', 'expressions', 'special', 'nsfw', 'meme', 'admin', 'slash'];
            const prettyCategoryNames = {
                ...categoryNames,
                'nsfw': '🔞 NSFW',
                'special': '✨ Special Expressions'
            };

            const embed = new EmbedBuilder()
                .setColor(colors.primary || 0x7289DA)
                .setTitle(`🎮 ${config.botInfo.name} Commands`)
                .setDescription(`Use \`${prefix}help [command]\` for detailed info on a specific command.\n\n**Main Prefix:** \`${prefix.toUpperCase()}\` or \`${prefix.toLowerCase()}\``)
                .setThumbnail(client.user.displayAvatarURL())
                .setTimestamp();

            // Add fields for each category in order
            categoryOrder.forEach(cat => {
                if (categories[cat] && categories[cat].length > 0) {
                    const commandList = categories[cat]
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(cmd => `\`${cmd.name}\``)
                        .join(', ');
                    
                    embed.addFields({
                        name: prettyCategoryNames[cat] || `📦 ${cat.charAt(0).toUpperCase() + cat.slice(1)}`,
                        value: commandList,
                        inline: false
                    });
                }
            });

            // Add Short Prefixes field
            if (config.shortPrefixes) {
                const shortPrefixList = Object.entries(config.shortPrefixes)
                    .map(([short, full]) => `\`${short}\` → \`${full}\``)
                    .join(' | ');
                
                embed.addFields({
                    name: '⌨️ Short Prefixes',
                    value: shortPrefixList,
                    inline: false
                });
            }

            embed.setFooter({ 
                text: `Total Commands: ${commands.length + (client.slashCommands ? client.slashCommands.size : 0)} | Requested by ${message.author.tag}`,
                iconURL: message.author.displayAvatarURL()
            });

            return message.reply({ embeds: [embed] });
        }

        // Detailed info for a specific command
        const search = args[0].toLowerCase();
        const command = client.commands.get(search);

        if (!command) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor(colors.error || 0xF04747)
                    .setTitle('❌ Command Not Found')
                    .setDescription(`Command \`${search}\` not found. Use \`${prefix}help\` to see all commands.`)
                ]
            });
        }

        const embed = new EmbedBuilder()
            .setColor(colors.primary || 0x7289DA)
            .setTitle(`📖 Command: ${command.name}`)
            .setDescription(command.description || 'No description available.')
            .addFields(
                { name: 'Usage', value: `\`${prefix}${command.usage || command.name}\``, inline: true }
            );

        if (command.aliases && command.aliases.length > 0) {
            embed.addFields({ name: 'Aliases', value: command.aliases.map(a => `\`${a}\``).join(', '), inline: true });
        }

        if (command.cooldown) {
            embed.addFields({ name: 'Cooldown', value: `${command.cooldown / 1000}s`, inline: true });
        }

        if (command.adminOnly) {
            embed.addFields({ name: 'Permissions', value: '🛡️ Admin Only', inline: true });
        }

        embed.setTimestamp()
            .setFooter({ text: `Category: ${command.category || 'General'}` });

        message.reply({ embeds: [embed] });
    }
};
