const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config/config.js');
const logger = require('./utils/logger.js');
const database = require('./utils/database.js');
const cron = require('node-cron');
const express = require('express');
require('dotenv').config();

// Auto-deploy slash commands
async function deployCommands() {
  const { REST, Routes } = require("discord.js");
  const fs = require("fs");
  const path = require("path");

  try {
    const commands = [];
    const commandsPath = path.join(__dirname, "commands/slash");
    
    if (!fs.existsSync(commandsPath)) {
      logger.warn('No slash commands directory found');
      return;
    }
    
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

    for (const file of commandFiles) {
      try {
        // Clear require cache to get fresh module
        delete require.cache[require.resolve(`./commands/slash/${file}`)];
        const command = require(`./commands/slash/${file}`);
        
        if (command.data && typeof command.data.toJSON === "function") {
          const commandJSON = command.data.toJSON();
          
          // If name is missing, try to extract from filename
          if (!commandJSON.name) {
            const nameFromFile = file.replace('.js', '');
            commandJSON.name = nameFromFile;
            logger.warn(`${file}: Using filename as command name`);
          }
          
          commands.push(commandJSON);
          logger.success(`Loaded command: ${commandJSON.name}`);
        } else {
          logger.warn(`Skipped ${file}: Invalid command structure`);
        }
      } catch (error) {
        logger.warn(`Failed to load ${file}: ${error.message}`);
      }
    }

    if (commands.length === 0) {
      logger.warn('No valid commands found to deploy');
      return;
    }

    const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
    const clientId = process.env.CLIENT_ID;

    logger.info(`Deploying ${commands.length} slash commands...`);

    await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });

    logger.success("Slash commands deployed successfully!");

  } catch (error) {
    logger.error("Error deploying commands:", error);
  }
}

// Deploy commands on startup
deployCommands();

// HTTP server for Railway health checks
const app = express();
app.get('/', (req, res) => res.status(200).send('Bot is running'));
app.listen(process.env.PORT || 8080, '0.0.0.0', () => {
  logger.box('HTTP Server', `Running on port ${process.env.PORT || 8080}`);
});

// Multiple instance prevention
const pidFile = './bot.pid';
if (fs.existsSync(pidFile)) {
  const pid = fs.readFileSync(pidFile, 'utf8').trim();
  try {
    process.kill(pid, 0);
    logger.warn('Removing stale PID file...');
    fs.unlinkSync(pidFile);
  } catch {
    fs.unlinkSync(pidFile);
  }
}
fs.writeFileSync(pidFile, process.pid.toString());
logger.header('Discord Bot Initializing');
logger.info(`Process ID: ${process.pid}`);
logger.divider('═');
logger.blank();

const cleanup = () => {
  if (fs.existsSync(pidFile)) {
    logger.info('Cleaning up PID file...');
    fs.unlinkSync(pidFile);
  }
};
process.on('exit', cleanup);
process.on('SIGINT', () => { logger.warn('SIGINT Received - Shutting down'); cleanup(); process.exit(0); });
process.on('SIGTERM', () => { logger.warn('SIGTERM Received - Shutting down'); cleanup(); process.exit(0); });

// Discord bot setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Channel, Partials.Message]
});

// Initialize collections
client.commands = new Collection();
client.slashCommands = new Collection();
client.cooldowns = new Collection();

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

// Slash command handler
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

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

// Message command handler removed - handled by events/messageCreate.js

// Login
const token = process.env.DISCORD_TOKEN;
if (!token) {
  logger.error('No token found!');
  cleanup();
  process.exit(1);
}
logger.section('Connecting to Discord');
client.login(token)
  .then(() => {
    logger.success('Successfully authenticated with Discord');
  })
  .catch(err => {
    logger.error('Failed to login:', err);
    cleanup();
    process.exit(1);
  });

// Ready event
client.once('clientReady', () => {
  logger.blank();
  logger.header('Bot Connected');
  logger.section('Status');
  logger.table(
    [
      [client.user.tag, '✓ Online'],
      [client.guilds.cache.size.toString(), 'Servers'],
      [new Date().toLocaleString(), 'Started']
    ],
    ['Property', 'Value']
  );
  logger.blank();
});

// Reaction events
client.on('messageReactionAdd', (reaction, user) => {
  logger.debug(`Reaction added: ${reaction.emoji.name} by ${user.username}`);
});
client.on('messageReactionRemove', (reaction, user) => {
  logger.debug(`Reaction removed: ${reaction.emoji.name} by ${user.username}`);
});