const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config/config.js');
const logger = require('./utils/logger.js');
const database = require('./utils/database.js');
const cron = require('node-cron');
const express = require('express');
require('dotenv').config();

// HTTP server for Railway health checks
const app = express();
app.get('/', (req, res) => res.status(200).send('Bot is running'));
app.listen(process.env.PORT || 8080, '0.0.0.0', () => {
  console.log(`Server on port ${process.env.PORT || 8080}`);
});

// Multiple instance prevention
const pidFile = './bot.pid';
if (fs.existsSync(pidFile)) {
  const pid = fs.readFileSync(pidFile, 'utf8').trim();
  try {
    process.kill(pid, 0); // Check if process exists
    console.log('❌ Bot is already running!');
    console.log(`❌ PID: ${pid}`);
    console.log('❌ Please stop the existing bot first or delete bot.pid file');
    process.exit(1);
  } catch (error) {
    console.log('🧹 Removing stale PID file...');
    fs.unlinkSync(pidFile);
  }
}

// Write current process ID
fs.writeFileSync(pidFile, process.pid.toString());
console.log(`🤖 Bot starting with PID: ${process.pid}`);

// Clean up PID file on exit
const cleanup = () => {
  if (fs.existsSync(pidFile)) {
    console.log('🧹 Cleaning up PID file...');
    fs.unlinkSync(pidFile);
  }
};

process.on('exit', cleanup);
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  cleanup();
  process.exit(0);
});
process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  cleanup();
  process.exit(0);
});

// Discord bot setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions
  ]
});

// Initialize collections
client.commands = new Collection();
client.slashCommands = new Collection();
client.cooldowns = new Collection();
client.listeningChannels = new Set();
client.talkingChannels = new Set();

// Load slash commands
const slashPath = path.join(__dirname, 'commands/slash');
if (fs.existsSync(slashPath)) {
  const slashFiles = fs.readdirSync(slashPath).filter(file => file.endsWith('.js'));
  for (const file of slashFiles) {
    try {
      const command = require(`./commands/slash/${file}`);
      if (command.data && command.data.name && command.execute) {
        client.slashCommands.set(command.data.name, command);
        console.log(`✅ Loaded slash command: ${command.data.name}`);
      } else {
        console.warn(`[WARN] Skipped ${file}: Missing data, data.name, or execute property`);
      }
    } catch (error) {
      console.warn(`[WARN] Failed to load ${file}: ${error.message}`);
    }
  }
}

// Load handlers
console.log('🔧 Loading commandHandler...');
require('./handlers/commandHandler.js')(client);
console.log(`🔧 Commands loaded. Total commands: ${client.commands.size}`);
console.log('🔧 Loading eventHandler...');
require('./handlers/eventHandler.js')(client);
console.log('🔧 Events loaded successfully');

// Cron jobs
cron.schedule('0 0 * * *', () => {
  logger.info('Resetting daily rewards for all users');
  const users = database.getAllUsers();
  users.forEach(user => {
    user.dailyClaimed = false;
    database.saveUser(user);
  });
  logger.info(`Reset daily rewards for ${users.length} users`);
});

cron.schedule('0 0 * * 0', () => {
  logger.info('Resetting weekly rewards for all users');
  const users = database.getAllUsers();
  users.forEach(user => {
    user.weeklyClaimed = false;
    database.saveUser(user);
  });
  logger.info(`Reset weekly rewards for ${users.length} users`);
});

cron.schedule('0 * * * *', () => {
  const users = database.getAllUsers();
  let expiredCount = 0;
  users.forEach(user => {
    if (user.boosters) {
      if (user.boosters.money && user.boosters.money.expiresAt < Date.now()) {
        delete user.boosters.money;
        expiredCount++;
      }
      if (user.boosters.exp && user.boosters.exp.expiresAt < Date.now()) {
        delete user.boosters.exp;
        expiredCount++;
      }
      database.saveUser(user);
    }
  });
  if (expiredCount > 0) {
    logger.info(`Expired ${expiredCount} boosters`);
  }
});

// Error handling
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
});
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
});

// Message listener
client.on('messageCreate', async (message) => {
  if (client.listeningChannels.has(message.channel.id)) {
    logger.info(`[${message.guild.name} - ${message.channel.name}] ${message.author.tag}: ${message.content}`);
  }
});

// Slash command handler
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.slashCommands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (error) {
    logger.error(`Error executing command ${interaction.commandName}:`, error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: '❌ There was an error executing the command.', ephemeral: true });
    } else {
      await interaction.reply({ content: '❌ There was an error executing the command.', ephemeral: true });
    }
  }
});

// Login
const token = process.env.DISCORD_TOKEN;
if (!token || token === 'YOUR_BOT_TOKEN_HERE') {
  logger.error('❌ No valid Discord token found! Please set DISCORD_TOKEN environment variable.');
  cleanup();
  process.exit(1);
}

logger.info('🔗 Attempting to connect to Discord...');
client.login(token)
  .then(() => {
    logger.info('✅ Bot login successful!');
    console.log(`🎉 Bot is ready! PID: ${process.pid}`);
    console.log(`🎯 Loaded ${client.commands.size} commands`);
  })
  .catch(error => {
    logger.error('❌ Failed to start bot:', error);
    cleanup();
    process.exit(1);
  });

// Ready event
client.once('ready', () => {
  console.log(`🚀 ${client.user.tag} is online!`);
  console.log(`📊 Serving ${client.guilds.cache.size} servers`);
  console.log(`👥 Watching ${client.users.cache.size} users`);
  console.log('='.repeat(50));
  console.log('🎰 Bot is ready to receive commands!');
  console.log('='.repeat(50));
});

// Reaction events
client.on('messageReactionAdd', (reaction, user) => {
  console.log(`🔥 Reaction added: ${reaction.emoji.name} by ${user.username}`);
});
client.on('messageReactionRemove', (reaction, user) => {
  console.log(`❌ Reaction removed: ${reaction.emoji.name} by ${user.username}`);
});