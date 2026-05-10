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
    } catch (e) {
      logger.warn('Failed to send typing indicator');
    }

    try {
      const { baseUrl, model, fallbackModels, systemPrompt: configPrompt } = config.aiConfig;

      let processedUserMessage = text;

      const url = `${baseUrl}/chat/completions`;

      // Use the raw config prompt directly — no DB overrides, no filters
      const finalSystemPrompt = configPrompt;

      const messages = [
        { role: 'system', content: finalSystemPrompt },
        ...history,
        { role: 'user', content: processedUserMessage },
      ];

      // Build model priority list: primary first, then fallbacks
      const modelsToTry = [model, ...(fallbackModels || [])];

      let response = null;
      let usedModel = model;

      for (const currentModel of modelsToTry) {
        try {
          logger.info(`AI Request -> Channel: ${channelId} | Model: ${currentModel} | History: ${history.length / 2} turns`);

          response = await axios.post(
            url,
            {
              model: currentModel,
              messages: messages,
              max_completion_tokens: 500,
              temperature: 1.0,
              top_p: 0.95,
            },
            {
              timeout: 60000,
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.openRouterApiKey}`,
                'HTTP-Referer': 'https://github.com/discordjs/discord.js',
                'X-Title': config.botInfo?.name || 'Discord Bot',
              },
            }
          );
          usedModel = currentModel;
          break; // Success — stop trying
        } catch (err) {
          const status = err.response?.status;
          if (status === 429 || status === 404) {
            logger.warn(`Model ${currentModel} returned ${status}, trying next fallback...`);
            continue; // Try next model
          }
          throw err; // Non-retryable error
        }
      }

      if (!response) {
        return message.reply("All my connections are busy right now, darling... try again in a moment? (◕‿◕✿)");
      }

      if (response.data && response.data.choices && response.data.choices[0]) {
        let botMsg = response.data.choices[0].message.content;

        if (!botMsg) {
          botMsg = "Mmm~ cat got my tongue, darling... try again? (◕ヮ◕)";
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
        message.reply("Something went wrong, darling... (っ˘ω˘ς)");
      }
    } catch (error) {
      logger.error(`AI Error (${error.code || 'UNKNOWN'}): ${error.message}`);
      message.reply(
        `I'm feeling a little tired right now... Let's talk again in a bit, okay darling? (◕‿◕✿)`
      );
    }
  },
};
