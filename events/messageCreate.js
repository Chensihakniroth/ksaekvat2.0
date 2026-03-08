const config = require('../config/config.js');
const logger = require('../utils/logger.js');
const cooldowns = require('../utils/cooldowns.js');
const database = require('../utils/database.js');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

// Memory storage for conversation history (Channel-based)
const conversationMemory = new Map();
const MAX_MEMORY = 20;

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        // Ignore messages from bots
        if (message.author.bot) return;

        // === 1. FAST COMMAND DETECTION (PRIORITY) ===
        let prefix = null;
        let commandName = null;
        let args = [];

        // Check main prefixes (K, k)
        for (const p of config.prefix) {
            if (message.content.startsWith(p)) {
                const tempArgs = message.content.slice(p.length).trim().split(/ +/);
                const tempName = tempArgs.shift().toLowerCase();
                
                if (client.commands.has(tempName)) {
                    prefix = p;
                    commandName = tempName;
                    args = tempArgs;
                    break;
                }
            }
        }

        // Check short prefixes (Optimized)
        if (!commandName) {
            const contentLower = message.content.toLowerCase();
            for (const [shortPrefix, fullCommand] of Object.entries(config.shortPrefixes)) {
                const spLower = shortPrefix.toLowerCase();
                let found = false;
                
                if (contentLower.startsWith(spLower + ' ') || contentLower === spLower) {
                    prefix = message.content.slice(0, shortPrefix.length);
                    found = true;
                } else {
                    for (const p of config.prefix) {
                        const pLower = p.toLowerCase();
                        if (contentLower.startsWith(pLower + spLower)) {
                            const nextChar = contentLower.charAt(pLower.length + spLower.length);
                            if (nextChar === '' || nextChar === ' ') {
                                prefix = message.content.slice(0, p.length + shortPrefix.length);
                                found = true;
                                break;
                            }
                        }
                    }
                }

                if (found) {
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

        // If it's a valid command, process it IMMEDIATELY
        if (commandName) {
            const command = client.commands.get(commandName);
            if (command) {
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
                    await command.execute(message, args, client);
                    logger.info(`${message.author.tag} used command: ${commandName} in ${message.guild ? message.guild.name : 'DM'}`);
                    
                    // After command, run listeners in background (don't await)
                    handleMessageListening(message, client).catch(e => logger.error("Background listener error", e));
                    return; 
                } catch (error) {
                    logger.error(`Error executing command ${commandName}:`, error);
                    return message.reply({
                        embeds: [{
                            color: parseInt(config.colors.error.slice(1), 16),
                            title: '❌ Oh no, an error! (｡•́︿•̀｡)',
                            description: 'Something went wrong, sweetie. Mommy will try to fix it soon! (っ˘ω˘ς)',
                            timestamp: new Date()
                        }]
                    });
                }
            }
        }

        // === 2. BACKGROUND/SECONDARY FUNCTIONALITY ===
        // Only run these if NO command was detected
        
        // Listen functionality (Background)
        handleMessageListening(message, client).catch(e => logger.error("Background listener error", e));

        // Chatbot functionality
        if (message.mentions.has(client.user) && !message.mentions.everyone) {
            await handleChatbot(message);
            return;
        }

        // DM Forwarding functionality
        if (message.channel.type === 1) { // DM Channel
            await handleDMForwarding(message, client);
            return;
        }
    }
};

// Handle message listening functionality
async function handleMessageListening(message, client) {
    // Fetch listeners from DB
    const listeners = await database.getListeners();
    
    // Check if any admin is listening to this user
    for (const [adminId, targetUserId] of Object.entries(listeners)) {
        if (message.author.id === targetUserId) {
            try {
                const admin = client.users.cache.get(adminId) || await client.users.fetch(adminId);
                
                if (!admin) {
                    logger.warn(`Could not find admin user ${adminId} for listening.`);
                    continue; 
                }

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
    const talkTargets = await database.getTalkTargets();
    const adminTarget = talkTargets[message.author.id];
    
    if (!adminTarget) return;
    
    try {
        const channel = client.channels.cache.get(adminTarget.channelId) || await client.channels.fetch(adminTarget.channelId);
        
        if (!channel) {
            logger.warn(`Could not find channel ${adminTarget.channelId} for DM forwarding.`);
            return;
        }

        if (message.content) {
            await channel.send(message.content);
        }
        
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
    
    if (!conversationMemory.has(channelId)) {
        conversationMemory.set(channelId, []);
    }
    const history = conversationMemory.get(channelId);

    logger.info(`AI Chatbot input from ${message.author.tag}: "${text}"`);
    
    try {
        await message.channel.sendTyping();
    } catch (e) {
        logger.warn('Failed to send typing indicator');
    }

    try {
        const { baseUrl, model, systemPrompt: configPrompt } = config.aiConfig;
        
        // Fetch character card from DB
        const charCard = await database.getCharacterCard();

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
                if (error.response?.status === 429 && !useFlash) {
                    logger.warn(`Gemini 2.5 Pro Limited. Falling back to 2.5 Flash...`);
                    return callGemini(0, true);
                }
                
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
            if (geminiError.response?.status !== 429) {
                logger.error(`Gemini processing failed: ${geminiError.message}`);
            }
            processedUserMessage = text;
        }

        const url = `${baseUrl}/chat/completions`;
        
        let finalSystemPrompt = configPrompt;
        if (charCard) {
            finalSystemPrompt = `Name: ${charCard.name}. Style: ${charCard.style}. Personality: ${charCard.personality}. Rules: Respond ONLY in English. No Khmer script. Keep it short, sweet, and nurturing like a mommy anime waifu. Use kaomojis (ﾉ´ヮ\`)ﾉ*:･ﾟ✧. ${charCard.rules || ''}`;
        }

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
            timeout: 60000,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.seaLionApiKey}`
            }
        });

        if (response.data && response.data.choices && response.data.choices[0]) {
            let botMsg = response.data.choices[0].message.content;
            
            if (charCard) {
                const namePrefix = new RegExp(`^${charCard.name}:\\s*`, 'i');
                botMsg = botMsg.replace(namePrefix, '').replace(/^<BOT>:\s*/i, '').replace(/^<USER>:\s*.*/s, '').trim();
            }
            const finalMsg = botMsg.length > 2000 ? botMsg.substring(0, 1997) + '...' : botMsg;
            
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
