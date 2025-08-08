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
    process.kill(pid, 0);
    console.log('❌ Bot is already running!');
    console.log(`❌ PID: ${pid}`);
    console.log('❌ Please stop the existing bot first or delete bot.pid file');
    process.exit(1);
  } catch {
    console.log('🧹 Removing stale PID file...');
    fs.unlinkSync(pidFile);
  }
}
fs.writeFileSync(pidFile, process.pid.toString());
console.log(`🤖 Bot starting with PID: ${process.pid}`);
const cleanup = () => {
  if (fs.existsSync(pidFile)) {
    console.log('🧹 Cleaning up PID file...');
    fs.unlinkSync(pidFile);
  }
};
process.on('exit', cleanup);
process.on('SIGINT', () => { console.log('\n🛑 SIGINT'); cleanup(); process.exit(0); });
process.on('SIGTERM', () => { console.log('\n🛑 SIGTERM'); cleanup(); process.exit(0); });

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

// Listen/talk state
let listeningUserId = null;
let talkGuildId = null;
let talkChannelId = null;

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
        console.warn(`[WARN] Skipped ${file}: Missing data.name or execute`);
      }
    } catch (error) {
      console.warn(`[WARN] Failed to load ${file}: ${error.message}`);
    }
  }
}

// Load handlers
console.log('🔧 Loading commandHandler...');
require('./handlers/commandHandler.js')(client);
console.log(`🔧 Commands loaded: ${client.commands.size}`);
console.log('🔧 Loading eventHandler...');
require('./handlers/eventHandler.js')(client);
console.log('🔧 Events loaded successfully');

// Cron jobs
cron.schedule('0 0 * * *', () => {
  logger.info('Resetting daily rewards');
  const users = database.getAllUsers();
  users.forEach(u => { u.dailyClaimed = false; database.saveUser(u); });
  logger.info(`Reset for ${users.length} users`);
});
cron.schedule('0 0 * * 0', () => {
  logger.info('Resetting weekly rewards');
  const users = database.getAllUsers();
  users.forEach(u => { u.weeklyClaimed = false; database.saveUser(u); });
  logger.info(`Reset for ${users.length} users`);
});
cron.schedule('0 * * * *', () => {
  const users = database.getAllUsers();
  let expired = 0;
  users.forEach(u => {
    if (u.boosters) {
      if (u.boosters.money && u.boosters.money.expiresAt < Date.now()) {
        delete u.boosters.money; expired++;
      }
      if (u.boosters.exp && u.boosters.exp.expiresAt < Date.now()) {
        delete u.boosters.exp; expired++;
      }
      database.saveUser(u);
    }
  });
  if (expired > 0) logger.info(`Expired ${expired} boosters`);
});

// Error handling
process.on('uncaughtException', err => logger.error('Uncaught Exception:', err));
process.on('unhandledRejection', err => logger.error('Unhandled Rejection:', err));

// Message listener for /listen and /talk
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // LISTEN MODE — track one user's messages everywhere
  if (listeningUserId && message.author.id === listeningUserId) {
    const serverName = message.guild ? message.guild.name : 'DM';
    const serverId = message.guild ? message.guild.id : 'DM';
    const channelName = message.channel?.name || 'DM';
    const channelId = message.channel?.id || 'DM';

    const logMsg =
      `📥 Message from ${message.author.tag} (${message.author.id})\n` +
      `Server: ${serverName} (${serverId})\n` +
      `Channel: ${channelName} (${channelId})\n` +
      `Content: ${message.content || '[No text]'}`;

    logger.info(logMsg);
    const admin = await client.users.fetch(process.env.ADMIN_ID).catch(() => null);
    if (admin) admin.send(logMsg).catch(() => {});
  }

  // TALK MODE — admin sends DM to bot, bot posts to target
  if (talkGuildId && talkChannelId && message.author.id === process.env.ADMIN_ID) {
    if (message.channel.type === 1) { // DM
      const guild = client.guilds.cache.get(talkGuildId);
      if (!guild) return;
      const channel = guild.channels.cache.get(talkChannelId);
      if (!channel) return;
      channel.send(message.content).catch(() => {});
    }
  }
});

// Slash command handler
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // /listen — start listening to a user
  if (interaction.commandName === 'listen') {
    if (interaction.user.id !== process.env.ADMIN_ID) {
      return interaction.reply({ content: '❌ Not authorized.', ephemeral: true });
    }
    listeningUserId = interaction.options.getString('userid');
    return interaction.reply(`✅ Now listening to <@${listeningUserId}>`);
  }

  // /stoplis — stop listening
  if (interaction.commandName === 'stoplis') {
    if (interaction.user.id !== process.env.ADMIN_ID) {
      return interaction.reply({ content: '❌ Not authorized.', ephemeral: true });
    }
    listeningUserId = null;
    return interaction.reply(`🛑 Stopped listening.`);
  }

  // /talk — set talk target
  if (interaction.commandName === 'talk') {
    if (interaction.user.id !== process.env.ADMIN_ID) {
      return interaction.reply({ content: '❌ Not authorized.', ephemeral: true });
    }
    talkGuildId = interaction.options.getString('serverid');
    talkChannelId = interaction.options.getString('channelid');
    return interaction.reply(`✅ Ready to talk in Guild ${talkGuildId}, Channel ${talkChannelId}`);
  }

  // /stopt — stop talking
  if (interaction.commandName === 'stopt') {
    if (interaction.user.id !== process.env.ADMIN_ID) {
      return interaction.reply({ content: '❌ Not authorized.', ephemeral: true });
    }
    talkGuildId = null;
    talkChannelId = null;
    return interaction.reply(`🛑 Stopped talking.`);
  }

  // Other commands
  const command = client.slashCommands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (error) {
    logger.error(`Error executing ${interaction.commandName}:`, error);
    const msg = { content: '❌ Error executing command.', ephemeral: true };
    if (interaction.replied || interaction.deferred) await interaction.followUp(msg);
    else await interaction.reply(msg);
  }
});

// Login
const token = process.env.DISCORD_TOKEN;
if (!token) {
  logger.error('❌ No token found!');
  cleanup();
  process.exit(1);
}
logger.info('🔗 Connecting...');
client.login(token)
  .then(() => {
    logger.info('✅ Logged in!');
    console.log(`🎉 Bot ready! PID: ${process.pid}`);
  })
  .catch(err => {
    logger.error('❌ Failed to login:', err);
    cleanup();
    process.exit(1);
  });

// Ready event
client.once('ready', () => {
  console.log(`🚀 ${client.user.tag} is online!`);
  console.log(`📊 Serving ${client.guilds.cache.size} servers`);
});

// Reaction events
client.on('messageReactionAdd', (reaction, user) => {
  console.log(`🔥 Reaction added: ${reaction.emoji.name} by ${user.username}`);
});
client.on('messageReactionRemove', (reaction, user) => {
  console.log(`❌ Reaction removed: ${reaction.emoji.name} by ${user.username}`);
});
