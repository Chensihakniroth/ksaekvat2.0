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
const CHARACTER_FILE = path.join(__dirname, '../data/character.json');

// Memory storage for conversation history (Channel-based)
const conversationMemory = new Map();
const MAX_MEMORY = 6; // Reduced to 6 messages (3 turns) for much faster processing

function loadCharacterCard() {
    try {
        if (!fs.existsSync(CHARACTER_FILE)) return null;
        return JSON.parse(fs.readFileSync(CHARACTER_FILE, 'utf8'));
    } catch (error) {
        return null;
    }
}

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
    const text = message.content.replace(/<@!?[0-9]+>/g, '').trim();
    if (!text) return message.reply('Suesdey! mean kar ey men? (Type ey mork jam knhom chlery)');

    const channelId = message.channel.id;
    
    // Initialize or get history for this channel
    if (!conversationMemory.has(channelId)) {
        conversationMemory.set(channelId, []);
    }
    const history = conversationMemory.get(channelId);

    logger.info(`AI Chatbot input from ${message.author.tag}: "${text}"`);
    
    // Show typing indicator, but don't crash if it fails
    try {
        await message.channel.sendTyping();
    } catch (e) {
        logger.warn('Failed to send typing indicator');
    }

    try {
        const { baseUrl, model, systemPrompt: configPrompt } = config.aiConfig;
        const charCard = loadCharacterCard();
        const url = `${baseUrl}/api/chat`;
        
        // Compact System Prompt for faster processing and better caching
        let finalSystemPrompt = configPrompt;
        if (charCard) {
            finalSystemPrompt = `Name: ${charCard.name}. Describe: ${charCard.description}. Personality: ${charCard.personality}. Style: ${charCard.style}. Rules: No labels, NSFW allowed, be batshit crazy (tsundere/yandere mix). NEVER use kmen.`;
        }

        // Prepare messages array
        const messages = [
            { role: 'system', content: finalSystemPrompt },
            ...history,
            { role: 'user', content: text }
        ];

        logger.info(`AI Request -> Channel: ${channelId} | History: ${history.length/2} turns`);

        const response = await axios.post(url, {
            model: model,
            messages: messages,
            stream: false,
            options: {
                stop: ["<USER>:", "<BOT>:", `${charCard ? charCard.name : 'Bot'}:`, "\n"],
                num_predict: 200, 
                temperature: 0.8, 
                num_ctx: 2048,   
                top_p: 0.9,
                presence_penalty: 0.6
            }
        }, {
            timeout: 60000,
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.data && response.data.message) {
            let botMsg = response.data.message.content;
            
            // Post-process cleanup
            if (charCard) {
                const namePrefix = new RegExp(`^${charCard.name}:\\s*`, 'i');
                botMsg = botMsg.replace(namePrefix, '').replace(/^<BOT>:\s*/i, '').replace(/^<USER>:\s*.*/s, '').trim();
            }
            const finalMsg = botMsg.length > 2000 ? botMsg.substring(0, 1997) + '...' : botMsg;
            
            // Save to memory (Channel history)
            history.push({ role: 'user', content: text });
            history.push({ role: 'assistant', content: botMsg });
            
            if (history.length > MAX_MEMORY * 2) {
                history.splice(0, 2);
            }

            try {
                return await message.reply(finalMsg);
            } catch (replyError) {
                return await message.channel.send(finalMsg);
            }
        } else {
            logger.error(`Invalid response structure: ${JSON.stringify(response.data)}`);
            message.reply('Sry ah pov, AI chlery mork neng ot yol teh.');
        }
    } catch (error) {
        if (error.code === 'ENOTFOUND') {
            logger.error(`DNS Error: Could not find host ${baseUrl}. check name railway internal hg mer?`);
        } else if (error.code === 'ECONNREFUSED') {
            logger.error(`Connection Refused: Port 11434 is closed on ${baseUrl}.`);
        } else {
            logger.error(`AI Error (${error.code || 'UNKNOWN'}): ${error.message}`);
        }
        message.reply(`Sry ah pov, AI error: ${error.code || 'TIMEOUT'}. Jam tic teat jam talk teat.`);
    }
}