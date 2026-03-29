import { Client, GatewayIntentBits, Collection, Partials } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
const config = require('../config/config.js');
const logger = require('../utils/logger.js');
const database = require('../services/DatabaseService');
const cron = require('node-cron');
const express = require('express');
const mongoose = require('mongoose');
const { env, getMongoURI } = require('../utils/env.js');

// === LOGGING BANNER ===
logger.blank();
logger.ascii(
  `
 ██╗  ██╗███████╗ █████╗ ███████╗██╗  ██╗██╗   ██╗ █████╗ ████████╗
 ██║ ██╔╝██╔════╝██╔══██╗██╔════╝██║ ██╔╝██║   ██║██╔══██╗╚══██╔══╝
 █████╔╝ ███████╗███████║█████╗  █████╔╝ ██║   ██║███████║   ██║   
 ██╔═██╗ ╚════██║██╔══██║██╔══╝  ██╔═██╗ ╚██╗ ██╔╝██╔══██║   ██║   
 ██║  ██╗███████║██║  ██║███████╗██║  ██╗ ╚████╔╝ ██║  ██║   ██║   
 ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚═╝  ╚═╝   ╚═╝   
                                            REVAMP EDITION v2.0
`,
  '\x1b[36m'
);

logger.header('System Boot Sequence');

// Initialize Client
export interface ExtendedClient extends Client {
  commands: Collection<string, any>;
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  allowedMentions: {
    parse: ['users', 'roles'],
    repliedUser: true,
  }
}) as ExtendedClient;

client.commands = new Collection();

// Database Connection
async function connectDB() {
  logger.section('Database');
  const prog = logger.loader('Connecting to MongoDB');
  try {
    const uri = getMongoURI();
    await mongoose.connect(uri);
    prog.done();
    logger.item('Status', 'Connected', '\x1b[32m');
    logger.item('Host', mongoose.connection.host);

    // Initialize Registry after DB connection
    const registry = require('../utils/registry.js');
    await registry.initializeRegistry();
  } catch (err: any) {
    prog.fail(err.message);
    process.exit(1);
  }
}

// Start Server & Bot
async function bootstrap() {
  // 1. Database
  await connectDB();

  // 2. Load Handlers
  require('../handlers/commandHandler.js')(client);
  require('../handlers/eventHandler.js')(client);

  // 4. HTTP server + API + Dashboard
  logger.section('Web Server');
  const app = express();
  app.use(express.json({ limit: '15mb' }));
  
  const cookieParser = require('cookie-parser');
  app.use(cookieParser());

  // Static assets
  app.use('/assets', express.static(path.join(__dirname, '../../assets')));

  // API Routes
  app.use('/api', require('../api/index'));

  // Serve dashboard static build
  const dashboardDist = path.join(__dirname, '../../dashboard/dist');
  if (fs.existsSync(dashboardDist)) {
    app.use(express.static(dashboardDist));
    // SPA fallback: serve index.html for all non-API routes
    app.get(/^(?!\/api).*/, (_req: any, res: any) => {
      res.sendFile(path.join(dashboardDist, 'index.html'));
    });
    logger.success('Dashboard static files served from dashboard/dist');
  } else {
    app.get('/', (_req: any, res: any) => res.send('KSAEKVAT Bot API — dashboard not built yet.'));
    logger.warn('dashboard/dist not found. Run: cd dashboard && npm run build');
  }

  const port = env.PORT || 8080;
  app.listen(port, '0.0.0.0', () => {
    logger.success(`Server active on port ${port}`);
  });

  // 5. Login
  logger.section('Discord Authentication');
  const prog = logger.loader('Establishing gateway connection');
  try {
    await client.login(env.DISCORD_TOKEN);
    prog.done();
  } catch (err: any) {
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
  const QuestService = require('../services/QuestService').default || require('../services/QuestService');
  
  for (const u of users) {
    u.dailyClaimed = false;
    // Generate new quests for everyone! (｡♥‿♥｡)
    await QuestService.generateDailyQuests(u.id);
    await QuestService.generateWeeklyQuests(u.id);
    await database.saveUser(u);
  }
});

module.exports = client;
