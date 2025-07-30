const config = require('../config/config.js');
const logger = require('../utils/logger.js');
const cooldowns = require('../utils/cooldowns.js');
const database = require('../utils/database.js');

module.exports = {
    name: 'messageCreate',
    execute(message, client) {
        // Ignore messages from bots
        if (message.author.bot) return;

        // Check if message starts with any valid prefix
        let prefix = null;
        let commandName = null;
        let args = [];

        // Check main prefixes (K, k)
        for (const p of config.prefix) {
            if (message.content.startsWith(p)) {
                prefix = p;
                args = message.content.slice(prefix.length).trim().split(/ +/);
                commandName = args.shift().toLowerCase();
                break;
            }
        }

        // Check short prefixes if no main prefix found
        if (!prefix) {
            for (const [shortPrefix, fullCommand] of Object.entries(config.shortPrefixes)) {
                if (message.content.startsWith(shortPrefix + ' ') || message.content === shortPrefix) {
                    prefix = shortPrefix;
                    // Handle special cases for head/tail
                    if (fullCommand.includes(' ')) {
                        const commandParts = fullCommand.split(' ');
                        commandName = commandParts[0];
                        args = [commandParts[1], ...message.content.slice(shortPrefix.length).trim().split(/ +/)];
                        if (args[args.length - 1] === '') args.pop(); // Remove empty last element
                    } else {
                        commandName = fullCommand;
                        args = message.content.slice(shortPrefix.length).trim().split(/ +/);
                        if (args[0] === '') args.shift(); // Remove empty first element
                    }
                    break;
                }
            }
        }

        // If no valid prefix found, return
        if (!prefix || !commandName) return;

        // Handle "all" betting prefix
        if (args.length > 0 && args[0].toLowerCase() === 'all') {
            const user = database.getUser(message.author.id);
            args[0] = Math.min(user.balance, 250000).toString(); // Bet everything up to the max
        }

        // Get the command
        const command = client.commands.get(commandName);
        if (!command) return;

        // Check if user is admin for admin-only commands
        if (command.adminOnly && !config.adminIds.includes(message.author.id)) {
            return message.reply({
                embeds: [{
                    color: parseInt(config.colors.error.slice(1), 16),
                    title: '❌ Access Denied',
                    description: 'This command is only available to administrators.',
                    timestamp: new Date()
                }]
            });
        }

        // Check cooldowns
        if (command.cooldown) {
            const cooldownKey = `${message.author.id}-${commandName}`;
            if (cooldowns.isOnCooldown(cooldownKey, command.cooldown)) {
                const timeLeft = cooldowns.getTimeLeft(cooldownKey, command.cooldown);
                return message.reply({
                    embeds: [{
                        color: parseInt(config.colors.warning.slice(1), 16),
                        title: '⏰ Cooldown Active',
                        description: `Please wait ${Math.ceil(timeLeft / 1000)} more seconds before using this command again.`,
                        timestamp: new Date()
                    }]
                });
            }
            cooldowns.setCooldown(cooldownKey);
        }

        // Execute the command
        try {
            command.execute(message, args, client);
            logger.info(`${message.author.tag} used command: ${commandName} in ${message.guild ? message.guild.name : 'DM'}`);
        } catch (error) {
            logger.error(`Error executing command ${commandName}:`, error);
            message.reply({
                embeds: [{
                    color: parseInt(config.colors.error.slice(1), 16),
                    title: '❌ Command Error',
                    description: 'There was an error executing this command. Please try again later.',
                    timestamp: new Date()
                }]
            });
        }
    }
};