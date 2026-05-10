"use strict";
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const config = require('../../config/config.js');
const logger = require('../../utils/logger.js');
const database = require('../../services/DatabaseService');
// Memory storage for conversation history (Channel-based)
const conversationMemory = new Map();
const MAX_MEMORY = 20;
module.exports = {
    name: 'ai',
    description: 'Talk to the AI',
    category: 'general',
    cooldown: 5000,
    async execute(message, args, client) {
        const text = args.join(' ').trim();
        if (!text) {
            return message.reply('Did you need something, sweetie? Tell me what you want to talk about. (◕‿◕✿)');
        }
        const channelId = message.channel.id;
        if (!conversationMemory.has(channelId)) {
            conversationMemory.set(channelId, []);
        }
        const history = conversationMemory.get(channelId);
        logger.info(`AI Chatbot input from ${message.author.tag}: "${text}"`);
        try {
            await message.channel.sendTyping();
        }
        catch (e) {
            logger.warn('Failed to send typing indicator');
        }
        try {
            const { baseUrl, model, systemPrompt: configPrompt } = config.aiConfig;
            // Fetch character card from DB
            const charCard = await database.getCharacterCard();
            let processedUserMessage = text;
            const url = `${baseUrl}/chat/completions`;
            // Adjusted the AI prompt for a lowkey, supportive mommy persona
            // Prioritize the detailed configPrompt (Juicy.ai style) and optionally append DB charCard info
            let finalSystemPrompt = configPrompt;
            if (charCard) {
                finalSystemPrompt += `\n\n[Additional Database Context: Name: ${charCard.name}. Personality: ${charCard.personality}. Style: ${charCard.style}.]`;
            }
            const messages = [
                { role: 'system', content: finalSystemPrompt },
                ...history,
                { role: 'user', content: processedUserMessage },
            ];
            logger.info(`AI Request -> Channel: ${channelId} | History: ${history.length / 2} turns`);
            const response = await axios.post(url, {
                model: model,
                messages: messages,
                max_completion_tokens: 150,
                temperature: 0.7,
                top_p: 0.9,
                presence_penalty: 0.6,
            }, {
                timeout: 60000,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${config.openRouterApiKey}`,
                    'HTTP-Referer': 'https://github.com/discordjs/discord.js',
                    'X-Title': config.botInfo?.name || 'Discord Bot',
                },
            });
            if (response.data && response.data.choices && response.data.choices[0]) {
                let botMsg = response.data.choices[0].message.content;
                if (!botMsg) {
                    botMsg = "*blushes* I... I don't really know what to say to that, sweetie... (⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)";
                }
                if (charCard) {
                    const namePrefix = new RegExp(`^${charCard.name}:\\s*`, 'i');
                    botMsg = botMsg
                        .replace(namePrefix, '')
                        .replace(/^<BOT>:\s*/i, '')
                        .replace(/^<USER>:\s*.*/s, '')
                        .trim();
                }
                const finalMsg = botMsg.length > 2000 ? botMsg.substring(0, 1997) + '...' : botMsg;
                history.push({ role: 'user', content: processedUserMessage });
                history.push({ role: 'assistant', content: botMsg });
                if (history.length > MAX_MEMORY * 2) {
                    history.splice(0, 2);
                }
                try {
                    return await message.reply(finalMsg);
                }
                catch (replyError) {
                    return await message.channel.send(finalMsg);
                }
            }
            else {
                logger.error(`Invalid response structure: ${JSON.stringify(response.data)}`);
                message.reply("I'm sorry sweetie, I got a bit confused just now. (っ˘ω˘ς)");
            }
        }
        catch (error) {
            if (error.code === 'ENOTFOUND') {
                logger.error(`DNS Error: Could not find host ${baseUrl}.`);
            }
            else if (error.code === 'ECONNREFUSED') {
                logger.error(`Connection Refused: Port 11434 is closed on ${baseUrl}.`);
            }
            else {
                logger.error(`AI Error (${error.code || 'UNKNOWN'}): ${error.message}`);
            }
            message.reply(`I'm feeling a little tired right now (Error: ${error.code || 'TIMEOUT'}). Let's talk again in a bit, okay? (◕‿◕✿)`);
        }
    },
};
