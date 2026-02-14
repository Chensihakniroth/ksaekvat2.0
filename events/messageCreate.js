const config = require('../config/config.js');
const logger = require('../utils/logger.js');
const cooldowns = require('../utils/cooldowns.js');
const database = require('../utils/database.js');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// File paths for persistent storage
const LISTENERS_FILE = path.join(__dirname, '../data/listeners.json');
const TALK_TARGETS_FILE = path.join(__dirname, '../data/talktargets.json');

function loadListeners() {
    try {
        if (!fs.existsSync(LISTENERS_FILE)) return {};
        return JSON.parse(fs.readFileSync(LISTENERS_FILE, 'utf8'));
    } catch (error) {
        return {};
    }
}

function loadTalkTargets() {
    try {
        if (!fs.existsSync(TALK_TARGETS_FILE)) return {};
        return JSON.parse(fs.readFileSync(TALK_TARGETS_FILE, 'utf8'));
    } catch (error) {
        return {};
    }
}

module.exports = {
    name: 'messageCreate',
    execute(message, client) {
        // Ignore messages from bots
        if (message.author.bot) return;

        // === LISTEN FUNCTIONALITY ===
        handleMessageListening(message, client);

        // === CHATBOT FUNCTIONALITY ===
        if (message.mentions.has(client.user) && !message.mentions.everyone) {
            handleChatbot(message);
            return;
        }

        // === DM FORWARDING FUNCTIONALITY ===
        if (message.channel.type === 1) { // DM Channel
            handleDMForwarding(message, client);
            return; // Don't process DMs as regular commands
        }

        // === REGULAR COMMAND PROCESSING ===
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
                    title: '🚫 Ot mean sithi teh ah pov',
                    description: 'hg ot mean dak ban teh ah pov, command nis ban tae Admin Only teh!',
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
                        title: '⏳ Jam tic mer ah chlery',
                        description: `hg jam tic mer, jam **${Math.ceil(timeLeft / 1000)}s** teat jam execute ban!`,
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

// Handle message listening functionality
async function handleMessageListening(message, client) {
    const listeners = loadListeners();
    
    // Check if any admin is listening to this user
    for (const [adminId, targetUserId] of Object.entries(listeners)) {
        if (message.author.id === targetUserId) {
            try {
                const admin = await client.users.fetch(adminId);
                
                const serverName = message.guild ? message.guild.name : 'Direct Message';
                const channelName = message.channel.name || 'DM';
                
                const embed = new EmbedBuilder()
                    .setTitle('👀 Message Intercepted')
                    .setColor(0x3498db)
                    .addFields([
                        { name: '👤 User', value: `${message.author.tag} (${message.author.id})`, inline: true },
                        { name: '🏠 Server', value: serverName, inline: true },
                        { name: '📍 Channel', value: `#${channelName}`, inline: true },
                        { name: '💬 Message', value: message.content || '*[No text content]*', inline: false }
                    ])
                    .setTimestamp()
                    .setThumbnail(message.author.displayAvatarURL());
                
                // Include attachments if any
                if (message.attachments.size > 0) {
                    const attachments = message.attachments.map(att => att.url).join('\n');
                    embed.addFields([
                        { name: '📎 Attachments', value: attachments, inline: false }
                    ]);
                }
                
                await admin.send({ embeds: [embed] });
                
            } catch (error) {
                console.error(`Failed to send listen notification to admin ${adminId}:`, error);
            }
        }
    }
}

// Handle DM forwarding functionality
async function handleDMForwarding(message, client) {
    const talkTargets = loadTalkTargets();
    const adminTarget = talkTargets[message.author.id];
    
    if (!adminTarget) return;
    
    try {
        const channel = await client.channels.fetch(adminTarget.channelId);
        
        if (!channel) return;

        // Send the message content directly as the bot
        if (message.content) {
            await channel.send(message.content);
        }
        
        // Forward attachments if any
        if (message.attachments.size > 0) {
            for (const attachment of message.attachments.values()) {
                await channel.send({ files: [attachment.url] });
            }
        }
        
    } catch (error) {
        console.error(`Failed to send DM message from admin ${message.author.id}:`, error);
        try {
            await message.author.send('❌ Failed to send your message. Please check if the target channel still exists and the bot has permissions.');
        } catch (dmError) {
            console.error('Failed to notify admin about sending failure:', dmError);
        }
    }
}

async function handleChatbot(message) {
    // Remove the mention from the text
    const text = message.content.replace(/<@!?[0-9]+>/g, '').trim();
    
    // If only mentioned without text, give a greeting
    if (!text) {
        return message.reply('Suesdey! mean kar ey men? (Mention knhom rouch dak peak ey mork)');
    }

    try {
        // Show typing indicator
        await message.channel.sendTyping();
        
        // Call SimSimi API
        // Using api.simsimi.net/v2/ as it's a common endpoint for this key type
        const response = await axios.get('https://api.simsimi.net/v2/', {
            params: {
                text: text,
                lc: 'kh',
                key: config.simsimiApiKey
            }
        });
        
        if (response.data && response.data.success) {
            message.reply(response.data.success);
        } else {
            // Try with English if Khmer fails
            const enResponse = await axios.get('https://api.simsimi.net/v2/', {
                params: {
                    text: text,
                    lc: 'en',
                    key: config.simsimiApiKey
                }
            });
            
            if (enResponse.data && enResponse.data.success) {
                message.reply(enResponse.data.success);
            } else {
                message.reply('Sry ah pov, knhom ot yol hg niyeay ey teh.');
            }
        }
    } catch (error) {
        logger.error('SimSimi API Error:', error.message);
        
        // Try fallback to a simpler response if API fails
        message.reply('Zzz... knhom nget ngui nas, jam knhom skor ban chlery teat.');
    }
}