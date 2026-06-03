const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const config = require('../../config/config.js');
const logger = require('../../utils/logger.js');
const database = require('../../services/DatabaseService');

// Memory storage for conversation history (Channel-based)
const conversationMemory = new Map();
const MAX_MEMORY = 20;

// Helper function to detect requests for sensitive information
function isRequestingSensitiveInfo(text) {
  const sensitiveTerms = [
    // Environment variables and config
    'token', 'secret', 'key', 'password', 'credential',
    'discord_token', 'client_secret', 'api_key', 'auth',
    'env', 'environment', 'config', 'configuration',
    
    // Specific API keys and tokens mentioned in config
    'giphy', 'google', 'openrouter', 'tenor', 'jwt',
    
    // Admin/owner related
    'admin id', 'owner', 'creator', 'bot owner',
    
    // Direct requests for sensitive data
    'show me your', 'what is your', 'reveal', 'expose',
    'leak', 'hack', 'crack', 'steal',
    
    // Common phishing/social engineering attempts
    'verify your', 'confirm your', 'please provide',
    'i need your', 'can you share', 'tell me your'
  ];
  
  const lowerText = text.toLowerCase();
  return sensitiveTerms.some(term => lowerText.includes(term));
}

module.exports = {
  name: 'ai',
  description: 'Talk to the AI',
  category: 'general',
  async execute(message, args, client) {
    const text = args.join(' ').trim();
      if (!text) {
        return message.reply(
          'H-hello... is there something you need help with? *fidgets with hair ribbon nervously* (⸝⸝ᵕ ᵕ ⸝⸝)'
        );
      }

      // Check if user is requesting sensitive information and is not the creator
      if (isRequestingSensitiveInfo(text) && message.author.id !== config.creatorId) {
        return message.reply(
          "I-I'm sorry... I can't share that information. It's private and secure... *looks away shyly* (⸝⸝ᵕ ᵕ ⸝⸝)"
        );
      }

    const channelId = message.channel.id;
    const userId = message.author.id;
    const memoryKey = `${userId}-${channelId}`;

     if (text.toLowerCase() === 'reset' || text.toLowerCase() === 'clear') {
       conversationMemory.delete(memoryKey);
        return message.reply(
          "O-okay... I've reset our conversation history for this channel... *blushes softly* Let's start fresh... (⸝⸝ᵕ ᵕ ⸝⸝)"
        );
     }

    if (!conversationMemory.has(memoryKey)) {
      conversationMemory.set(memoryKey, []);
    }
    const history = conversationMemory.get(memoryKey);

    logger.info(`AI Chatbot input from ${message.author.tag}: "${text}"`);

    try {
      await message.channel.sendTyping();
    } catch (e) {
      logger.warn('Failed to send typing indicator');
    }

    try {
      const { baseUrl, model, fallbackModels, systemPrompt: configPrompt } = config.aiConfig;

      let replyContext = '';
      if (message.reference && message.reference.messageId) {
        try {
          const repliedMsg =
            message.channel.messages.cache.get(message.reference.messageId) ||
            (await message.channel.messages.fetch(message.reference.messageId));
          if (repliedMsg) {
            const author = repliedMsg.author;
            const cleanContent = repliedMsg.content
              ? repliedMsg.content.length > 100
                ? repliedMsg.content.substring(0, 100) + '...'
                : repliedMsg.content
              : '[No text content]';
            replyContext = ` (replying to ${author.bot ? 'Bot' : 'User'} ${author.username} [ID: ${author.id}]: "${cleanContent}")`;
          }
        } catch (e) {
          logger.warn(`Failed to fetch replied-to message for AI context: ${e.message}`);
        }
      }

      const processedUserMessage = `[User: ${message.author.username} (ID: ${message.author.id})${replyContext}]: ${text}`;

      const url = `${baseUrl}/chat/completions`;

       // Use the raw config prompt and append active user context
       const finalSystemPrompt = `${configPrompt}\n\n[Active Conversation Partner: ${message.author.username} (ID: ${message.author.id}). Remember to address the creator as "MO" with respect, and treat the user as someone the creator trusts.]`;

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
          logger.info(
            `AI Request -> Channel: ${channelId} | Model: ${currentModel} | History: ${history.length / 2} turns`
          );

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
          return message.reply(
            'U-um... seems like I'm having trouble concentrating right now... *fingers tremble slightly* Could you try again in a moment? (⸝⸝ᵕ ᵕ ⸝⸝)'
          );
        }

      if (response.data && response.data.choices && response.data.choices[0]) {
        let botMsg = response.data.choices[0].message.content;

        if (!botMsg) {
          botMsg = 'E-eep... my thoughts got a little tangled... *whispers softly* Could you say that again? (⸝⸝ᵕ ᵕ ⸝⸝)'
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
         message.reply('E-erm... something seems to have gone wrong with my thoughts... *looks down embarrassed* Let me try to reboot my thinking process and try again! (>.<)');
       }
     } catch (error) {
       logger.error(`AI Error (${error.code || 'UNKNOWN'}): ${error.message}`);
        message.reply(
          'E-eek... I made a mistake... *voice trembles slightly* Let me reboot my thinking process and try again! (>.<)'
        );
     }
  },
};
