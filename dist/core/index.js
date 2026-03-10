"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const config = require('../config/config.js');
const logger = require('../utils/logger.js');
const database = require('../services/DatabaseService');
const cron = require('node-cron');
const express = require('express');
const mongoose = require('mongoose');
const { env, getMongoURI } = require('../utils/env.js');
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
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.DirectMessages,
        discord_js_1.GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [discord_js_1.Partials.Message, discord_js_1.Partials.Channel, discord_js_1.Partials.Reaction],
    allowedMentions: {
        parse: ['users', 'roles'],
        repliedUser: true,
    }
});
client.commands = new discord_js_1.Collection();
client.slashCommands = new discord_js_1.Collection();
// Auto-deploy slash commands
async function deployCommands() {
    const { REST, Routes } = require('discord.js');
    logger.section('Slash Deployment');
    const prog = logger.loader('Preparing slash commands');
    try {
        const commands = [];
        const commandsPath = path.join(__dirname, '../commands/slash');
        if (!fs.existsSync(commandsPath)) {
            prog.fail('Folder missing');
            return;
        }
        const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
        for (const file of commandFiles) {
            try {
                delete require.cache[require.resolve(`../commands/slash/${file}`)];
                const command = require(`../commands/slash/${file}`);
                if (command.data) {
                    commands.push(command.data.toJSON());
                }
            }
            catch (error) {
                logger.warn(`Error loading ${file}: ${error.message}`);
            }
        }
        if (commands.length === 0) {
            prog.fail('No commands found');
            return;
        }
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN || '');
        await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
        prog.done();
        logger.item('Deployed', commands.length, '\x1b[32m');
    }
    catch (error) {
        prog.fail(error.message);
    }
}
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
    }
    catch (err) {
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
        await client.login(env.DISCORD_TOKEN);
        prog.done();
    }
    catch (err) {
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
