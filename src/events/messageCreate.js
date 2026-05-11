const config = require('../config/config.js');
const logger = require('../utils/logger.js');
const cooldowns = require('../utils/cooldowns.js');
const database = require('../services/DatabaseService');
const { EmbedBuilder, MessageFlags } = require('discord.js');
const axios = require('axios');

// Memory storage for conversation history (Channel-based)
const conversationMemory = new Map();
const MAX_MEMORY = 20;

// Track active command requests to prevent spam/overlap! (｡♥‿♥｡)
const activeRequests = new Set();

// Progressive spam penalty tracking! (ᗒᗣᗕ)
const spamStrikes = new Map();

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    // Ignore messages from bots
    if (message.author.bot) return;

    // === 1. FAST COMMAND DETECTION (PRIORITY) ===
    let prefix = null;
    let commandName = null;
    let args = [];

    // Load user's custom prefix (if set)
    let userMainPrefixes = [...config.prefix]; // default: ['k','K']
    let userSubPrefixes = config.shortPrefixes;  // default global short prefixes

    try {
      const userData = await database.getUser(message.author.id, message.author.username);
      if (userData?.customPrefix) {
        // Replace global prefix with user's personal one
        userMainPrefixes = [userData.customPrefix, userData.customPrefix.toLowerCase(), userData.customPrefix.toUpperCase()]
          .filter((v, i, a) => a.indexOf(v) === i); // deduplicate
      }
      // subprefix override is applied globally; per-user sub handled via customSubPrefix field (for display only for now)
    } catch (_) { }

    // Check main prefixes (user or global)
    for (const p of userMainPrefixes) {
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
      for (const [shortPrefix, fullCommand] of Object.entries(userSubPrefixes)) {
        const spLower = shortPrefix.toLowerCase();
        let found = false;

        // Require main prefix for all short prefixes (including 'w' for weekly)
        for (const p of userMainPrefixes) {
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
        const userId = message.author.id;
        const now = Date.now();

        // --- 2.3 SPAM PENALTY ENGINE (Mommy's Mood) ---
        let strikeData = spamStrikes.get(userId) || { count: 0, lastSpam: 0 };
        
        // Reset strikes if they've been good for 30 seconds
        if (now - strikeData.lastSpam > 30000) {
          strikeData = { count: 0, lastSpam: now };
        }

        const handleSpam = (penaltyTime, title, desc) => {
          const timeLeft = cooldowns.getTimeLeft(`GLOBAL-${userId}`, penaltyTime);
          const unixTime = Math.floor((Date.now() + timeLeft) / 1000);

          // Only reply if it's the first few strikes to avoid bot-spamming-about-spam
          if (strikeData.count < 4) {
            message.reply({
              embeds: [{
                color: parseInt(config.colors.warning.slice(1), 16),
                title: title,
                description: desc + `\n\n**Wait time: <t:${unixTime}:R>**`,
                timestamp: new Date(),
              }],
              flags: [MessageFlags.Ephemeral]
            }).catch(() => {});
          }

          strikeData.count++;
          strikeData.lastSpam = now;
          spamStrikes.set(userId, strikeData);
          cooldowns.setCooldown(`GLOBAL-${userId}`);
          return true;
        };
        // 1. Check Concurrency Lock
        if (activeRequests.has(userId)) {
          cooldowns.setCooldown(`GLOBAL-${userId}`);
          return; 
        }

        // 2. Check Strikes
        const GLOBAL_3S = 3000;
        const GLOBAL_8S = 8000;
        const GLOBAL_20S = 20000;
        const GLOBAL_60S = 60000;

        if (strikeData.count >= 3 && cooldowns.isOnCooldown(`GLOBAL-${userId}`, GLOBAL_60S)) {
          return handleSpam(GLOBAL_60S, '🚫 System Timeout', 'Spam detected. Access has been restricted for **60 seconds**.');
        } else if (strikeData.count === 2 && cooldowns.isOnCooldown(`GLOBAL-${userId}`, GLOBAL_20S)) {
          return handleSpam(GLOBAL_20S, '⏳ Command Throttled', "You're sending commands too quickly. Please wait **20 seconds**.");
        } else if (strikeData.count === 1 && cooldowns.isOnCooldown(`GLOBAL-${userId}`, GLOBAL_8S)) {
          return handleSpam(GLOBAL_8S, '⏳ Slow Down', "Rate limit exceeded. Please wait **8 seconds** before your next request.");
        } else if (cooldowns.isOnCooldown(`GLOBAL-${userId}`, GLOBAL_3S)) {
          // Strike 0 -> 1
          strikeData.count = 1;
          strikeData.lastSpam = now;
          spamStrikes.set(userId, strikeData);
          const timeLeft = cooldowns.getTimeLeft(`GLOBAL-${userId}`, GLOBAL_3S);
          const unixTime = Math.floor((Date.now() + timeLeft) / 1000);
          message.reply({
            embeds: [{
              color: parseInt(config.colors.warning.slice(1), 16),
              title: '⏳ Cooldown Active',
              description: `System is processing. Please wait until <t:${unixTime}:R> before your next command.`,      
              timestamp: new Date(),
            }],
            flags: [MessageFlags.Ephemeral]
          }).catch(() => {});
          return;
        }
        // 3. Clear to go!
        cooldowns.setCooldown(`GLOBAL-${userId}`);
        activeRequests.add(userId);

        // Check if user is admin for admin-only commands
        if (command.adminOnly && !config.adminIds.includes(message.author.id)) {
          activeRequests.delete(userId); // Important: clean up if denied!
          message.reply({
            embeds: [
              {
                color: parseInt(config.colors.error.slice(1), 16),
                title: '🚫 Access Denied',
                description:
                  "This command is restricted to authorized personnel only.",      
                timestamp: new Date(),
              },
            ],
            flags: [MessageFlags.Ephemeral]
          }).catch(() => {});
          return;
        }
        // Check cooldowns
        if (command.cooldown) {
          const cooldownKey = `${message.author.id}-${commandName}`;
          if (cooldowns.isOnCooldown(cooldownKey, command.cooldown)) {
            activeRequests.delete(userId); // Clean up
            const timeLeft = cooldowns.getTimeLeft(cooldownKey, command.cooldown);
            const unixTime = Math.floor((Date.now() + timeLeft) / 1000);

            message.reply({
              embeds: [
                {
                  color: parseInt(config.colors.warning.slice(1), 16),
                  title: '⏳ Cooldown Active',
                  description: `Command is on cooldown. You can use it again <t:${unixTime}:R>.`,
                  timestamp: new Date(),
                },
              ],
              flags: [MessageFlags.Ephemeral]
            }).catch(() => {});
            return;
          }
          cooldowns.setCooldown(cooldownKey);
        }

        // Execute the command
        try {
          await command.execute(message, args, client);
          logger.info(
            `${message.author.tag} used command: ${commandName} in ${message.guild ? message.guild.name : 'DM'}`
          );

          // After command, run listeners in background (don't await)
          handleMessageListening(message, client).catch((e) =>
            logger.error('Background listener error', e)
          );
        } catch (error) {
          logger.error(`Error executing command ${commandName}:`, error);
          message.reply({
            embeds: [
              {
                color: parseInt(config.colors.error.slice(1), 16),
                title: '❌ Execution Error',
                description:
                  'An unexpected error occurred while processing your request.',
                timestamp: new Date(),
              },
            ],
            flags: [MessageFlags.Ephemeral]
          }).catch(() => {});
        } finally {
          activeRequests.delete(userId);
        }
        return;
      }
    }

    // === 2. BACKGROUND/SECONDARY FUNCTIONALITY ===
    // Only run these if NO command was detected

    // Listen functionality (Background)
    handleMessageListening(message, client).catch((e) =>
      logger.error('Background listener error', e)
    );

    // Chatbot functionality is now moved to the 'ai' command.
    /*
    if (message.mentions.has(client.user) && !message.mentions.everyone) {
      await handleChatbot(message);
      return;
    }
    */

    // DM Forwarding functionality
    if (message.channel.type === 1) {
      // DM Channel
      await handleDMForwarding(message, client);
      return;
    }
  },
};

// Handle message listening functionality
async function handleMessageListening(message, client) {
  // Fetch listeners from DB
  const listeners = await database.getListeners();

  // Check if any admin is listening to this user
  for (const [adminId, targetUserId] of Object.entries(listeners)) {
    if (message.author.id === targetUserId) {
      try {
        const admin = client.users.cache.get(adminId) || (await client.users.fetch(adminId));

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
            {
              name: '👤 User',
              value: `${message.author.tag} (${message.author.id})`,
              inline: true,
            },
            { name: '🏠 Server', value: serverName, inline: true },
            { name: '📍 Channel', value: `#${channelName}`, inline: true },
            { name: '💬 Message', value: message.content || '*[No text content]*', inline: false },
          ])
          .setTimestamp()
          .setThumbnail(message.author.displayAvatarURL());

        if (message.attachments.size > 0) {
          const attachments = message.attachments.map((att) => att.url).join('\n');
          embed.addFields([{ name: '📎 Attachments', value: attachments, inline: false }]);
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
    const channel =
      client.channels.cache.get(adminTarget.channelId) ||
      (await client.channels.fetch(adminTarget.channelId));

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
      await message.author.send(
        '❌ Failed to send your message. Please check if the target channel still exists and the bot has permissions.'
      );
    } catch (dmError) {
      console.error('Failed to notify admin about sending failure:', dmError);
    }
  }
}

