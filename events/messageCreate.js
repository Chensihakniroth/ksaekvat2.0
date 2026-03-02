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
const MAX_MEMORY = 20; // Increased to 20 messages (10 turns) for much better context retention

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
                const tempArgs = message.content.slice(p.length).trim().split(/ +/);
                const tempName = tempArgs.shift().toLowerCase();
                
                // Only accept if the command actually exists
                if (client.commands.has(tempName)) {
                    prefix = p;
                    commandName = tempName;
                    args = tempArgs;
                    break;
                }
            }
        }

        // Check short prefixes if no main prefix found OR command not found in main check
        if (!commandName) {
            for (const [shortPrefix, fullCommand] of Object.entries(config.shortPrefixes)) {
                // Check for standalone short prefix (e.g., 'rps') OR short prefix attached to main prefix (e.g., 'Krps')
                let found = false;
                if (message.content.startsWith(shortPrefix + ' ') || message.content === shortPrefix) {
                    prefix = shortPrefix;
                    found = true;
                } else {
                    // Check if it starts with any main prefix followed by the short prefix (e.g., 'Krps')
                    for (const p of config.prefix) {
                        const pattern = new RegExp(`^${p}${shortPrefix}(\\s|$)`, 'i');
                        if (pattern.test(message.content)) {
                            prefix = p + shortPrefix;
                            found = true;
                            break;
                        }
                    }
                }

                if (found) {
                    // Handle special cases for head/tail
                    if (fullCommand.includes(' ')) {
                        const commandParts = fullCommand.split(' ');
                        commandName = commandParts[0];
                        args = [commandParts[1], ...message.content.slice(prefix.length).trim().split(/ +/)];
                        if (args[args.length - 1] === '') args.pop(); 
                    } else {
                        commandName = fullCommand;
                        args = message.content.slice(prefix.length).trim().split(/ +/);
                        if (args[0] === '') args.shift();
                    }
                    break;
                }
            }
        }

        // If no valid prefix found, return
        if (!prefix || !commandName) return;

        // Get the command
        const command = client.commands.get(commandName);
        if (!command) return;

        // Check if user is admin for admin-only commands
        if (command.adminOnly && !config.adminIds.includes(message.author.id)) {
            return message.reply({
                embeds: [{
                    color: parseInt(config.colors.error.slice(1), 16),
                    title: '🚫 Access Denied, sweetie (｡•́︿•̀｡)',
                    description: 'I\'m sorry, darling, but this command is only for Mommy\'s special helpers! (◕‿◕✿)',
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
                        title: '⏳ Wait a moment, darling (｡♥‿♥｡)',
                        description: `You're going a bit too fast, sweetie! Please wait **${Math.ceil(timeLeft / 1000)}s** more. Mommy needs a little break too! (っ˘ω˘ς)`,
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
                    title: '❌ Oh no, an error! (｡•́︿•̀｡)',
                    description: 'Something went wrong, sweetie. Mommy will try to fix it soon! (っ˘ω˘ς)',
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
    if (!text) return message.reply('Hello there, sweetie! (◕‿◕✿) Is there something you wanted to talk to Mommy about? (｡♥‿♥｡)');

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

        // --- STEP 1: Understanding with Gemini ---
        let processedUserMessage = text;
        
        async function callGemini(retryCount = 0, useFlash = false) {
            const modelName = useFlash ? "gemini-2.5-flash" : "gemini-2.5-pro";
            try {
                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${config.googleApiKey}`;
                const geminiResponse = await axios.post(geminiUrl, {
                    contents: [{
                        parts: [{
                            text: `Analyze this message and fix any typos or slang for better understanding. Respond ONLY with the corrected English text. Message: "${text}"`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 200
                    }
                }, { timeout: 10000 });

                if (geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                    return geminiResponse.data.candidates[0].content.parts[0].text.trim();
                }
            } catch (error) {
                // If 429 and we haven't tried Flash yet, try Flash immediately
                if (error.response?.status === 429 && !useFlash) {
                    logger.warn(`Gemini 2.5 Pro Limited. Falling back to 2.5 Flash...`);
                    return callGemini(0, true);
                }
                
                // If still 429, perform standard backoff
                if (error.response?.status === 429 && retryCount < 2) {
                    const delay = Math.pow(2, retryCount) * 1000;
                    logger.warn(`Gemini ${modelName} Rate Limited. Retrying in ${delay}ms...`);
                    await new Promise(r => setTimeout(r, delay));
                    return callGemini(retryCount + 1, useFlash);
                }
                throw error;
            }
            return text;
        }

        try {
            processedUserMessage = await callGemini();
            if (processedUserMessage !== text) {
                logger.info(`Gemini Understood: "${text}" -> "${processedUserMessage}"`);
            }
        } catch (geminiError) {
            // Silently fall back to original text without heavy error logging if it's just a rate limit
            if (geminiError.response?.status !== 429) {
                logger.error(`Gemini processing failed: ${geminiError.message}`);
            }
            processedUserMessage = text;
        }

        // --- STEP 2: Response generation with Sea Lion ---
        const url = `${baseUrl}/chat/completions`;
        
        // Compact System Prompt for faster processing and better caching
        let finalSystemPrompt = configPrompt;
        if (charCard) {
            finalSystemPrompt = `Name: ${charCard.name}. Style: ${charCard.style}. Personality: ${charCard.personality}. Rules: Respond ONLY in English. No Khmer script. Keep it short, sweet, and nurturing like a mommy anime waifu. Use kaomojis (ﾉ´ヮ\`)ﾉ*:･ﾟ✧.`;
        }

        // Prepare messages array
        const messages = [
            { role: 'system', content: finalSystemPrompt },
            ...history,
            { role: 'user', content: processedUserMessage }
        ];

        logger.info(`AI Request -> Channel: ${channelId} | History: ${history.length/2} turns`);

        const response = await axios.post(url, {
            model: model,
            messages: messages,
            max_completion_tokens: 150, 
            temperature: 0.7, 
            top_p: 0.9,
            presence_penalty: 0.6
        }, {
            timeout: 60000, // 1 minute is usually enough for cloud APIs
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.seaLionApiKey}`
            }
        });

        if (response.data && response.data.choices && response.data.choices[0]) {
            let botMsg = response.data.choices[0].message.content;
            
            // Post-process cleanup
            if (charCard) {
                const namePrefix = new RegExp(`^${charCard.name}:\\s*`, 'i');
                botMsg = botMsg.replace(namePrefix, '').replace(/^<BOT>:\s*/i, '').replace(/^<USER>:\s*.*/s, '').trim();
            }
            const finalMsg = botMsg.length > 2000 ? botMsg.substring(0, 1997) + '...' : botMsg;
            
            // Save to memory (Channel history)
            history.push({ role: 'user', content: processedUserMessage });
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
            message.reply('I\'m sorry, sweetie, but Mommy didn\'t quite understand that. (っ˘ω˘ς)');
        }
    } catch (error) {
        if (error.code === 'ENOTFOUND') {
            logger.error(`DNS Error: Could not find host ${baseUrl}.`);
        } else if (error.code === 'ECONNREFUSED') {
            logger.error(`Connection Refused: Port 11434 is closed on ${baseUrl}.`);
        } else {
            logger.error(`AI Error (${error.code || 'UNKNOWN'}): ${error.message}`);
        }
        message.reply(`I'm sorry, darling, but Mommy is feeling a bit tired right now (Error: ${error.code || 'TIMEOUT'}). Let's talk again in a little while! (◕‿◕✿)`);
    }
}