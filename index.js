const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config/config.js');
const logger = require('./utils/logger.js');
const database = require('./utils/database.js');
const cron = require('node-cron');
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

// === LOGGING BANNER ===
logger.blank();
logger.ascii(`
 ██╗  ██╗███████╗ █████╗ ███████╗██╗  ██╗██╗   ██╗ █████╗ ████████╗
 ██║ ██╔╝██╔════╝██╔══██╗██╔════╝██║ ██╔╝██║   ██║██╔══██╗╚══██╔══╝
 █████╔╝ ███████╗███████║█████╗  █████╔╝ ██║   ██║███████║   ██║   
 ██╔═██╗ ╚════██║██╔══██║██╔══╝  ██╔═██╗ ╚██╗ ██╔╝██╔══██║   ██║   
 ██║  ██╗███████║██║  ██║███████╗██║  ██╗ ╚████╔╝ ██║  ██║   ██║   
 ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚═╝  ╚═╝   ╚═╝   
                                            REVAMP EDITION v2.0
`, '\x1b[36m');

logger.header('System Boot Sequence');

// Initialize Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.commands = new Collection();
client.slashCommands = new Collection();

// Auto-deploy slash commands
async function deployCommands() {
  const { REST, Routes } = require("discord.js");
  logger.section('Slash Deployment');
  const prog = logger.loader('Preparing slash commands');

  try {
    const commands = [];
    const commandsPath = path.join(__dirname, "commands/slash");
    
    if (!fs.existsSync(commandsPath)) {
      prog.fail('Folder missing');
      return;
    }
    
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

    for (const file of commandFiles) {
      try {
        delete require.cache[require.resolve(`./commands/slash/${file}`)];
        const command = require(`./commands/slash/${file}`);
        if (command.data) {
          commands.push(command.data.toJSON());
        }
      } catch (error) {
        logger.warn(`Error loading ${file}: ${error.message}`);
      }
    }

    if (commands.length === 0) {
      prog.fail('No commands found');
      return;
    }

    const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
    prog.done();
    logger.item('Deployed', commands.length, '\x1b[32m');

  } catch (error) {
    prog.fail(error.message);
  }
}

// Database Connection
async function connectDB() {
  logger.section('Database');
  const prog = logger.loader('Connecting to MongoDB');
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ksae_bot';
    await mongoose.connect(uri);
    prog.done();
    logger.item('Status', 'Connected', '\x1b[32m');
    logger.item('Host', mongoose.connection.host);
  } catch (err) {
    prog.fail(err.message);
    process.exit(1);
  }
}

// Start Server & Bot
async function bootstrap() {
  // 1. Database
  await connectDB();

  // 2. Load Handlers
  require('./handlers/commandHandler.js')(client);
  require('./handlers/eventHandler.js')(client);

  // 3. Deploy Slash
  await deployCommands();

  // 4. HTTP Health Check
  logger.section('Web Server');
  const app = express();
  app.get('/', (req, res) => res.send('OK'));
  const port = process.env.PORT || 8080;
  app.listen(port, '0.0.0.0', () => {
    logger.success(`Health check listener active on port ${port}`);
  });

  // 5. Login
  logger.section('Discord Authentication');
  const prog = logger.loader('Establishing gateway connection');
  try {
    await client.login(process.env.DISCORD_TOKEN);
    prog.done();
  } catch (err) {
    prog.fail(err.message);
    process.exit(1);
  }
}

// Global Error Handling
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', err);
});

// Run
bootstrap();

// Cron jobs (Keeping logic but wrapping in logger)
cron.schedule('0 0 * * *', async () => {
  logger.debug('Running daily reset cron...');
  const users = await database.getAllUsers();
  for (const u of users) {
    u.dailyClaimed = false;
    await database.saveUser(u);
  }
});

module.exports = client;
