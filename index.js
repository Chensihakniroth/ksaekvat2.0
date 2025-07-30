const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config/config.js');
const logger = require('./utils/logger.js');
const database = require('./utils/database.js');
const cron = require('node-cron');

// =================================
// MULTIPLE INSTANCE PREVENTION
// =================================
const pidFile = './bot.pid';

// Check if bot is already running
if (fs.existsSync(pidFile)) {
    const pid = fs.readFileSync(pidFile, 'utf8').trim();

    try {
        // Check if process is actually running
        process.kill(pid, 0); // This doesn't kill, just checks if process exists
        console.log('❌ Bot is already running!');
        console.log(`❌ PID: ${pid}`);
        console.log('❌ Please stop the existing bot first or delete bot.pid file');
        process.exit(1);
    } catch (error) {
        // Process doesn't exist, remove stale PID file
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

// =================================
// DISCORD BOT SETUP
// =================================

// Create Discord client with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ]
});

// Initialize collections for commands and cooldowns
client.commands = new Collection();
client.cooldowns = new Collection();

// Load command and event handlers
console.log('🔧 Loading commandHandler...');
require('./handlers/commandHandler.js')(client);
console.log(`🔧 Commands loaded. Total commands: ${client.commands.size}`);

console.log('🔧 Loading eventHandler...');
require('./handlers/eventHandler.js')(client);
console.log('🔧 Events loaded successfully');

// Schedule daily reset for daily rewards
cron.schedule('0 0 * * *', () => {
    logger.info('Resetting daily rewards for all users');
    const users = database.getAllUsers();
    users.forEach(user => {
        user.dailyClaimed = false;
        database.saveUser(user);
    });
    logger.info(`Reset daily rewards for ${users.length} users`);
});

// Schedule weekly reset for weekly rewards
cron.schedule('0 0 * * 0', () => {
    logger.info('Resetting weekly rewards for all users');
    const users = database.getAllUsers();
    users.forEach(user => {
        user.weeklyClaimed = false;
        database.saveUser(user);
    });
    logger.info(`Reset weekly rewards for ${users.length} users`);
});

// Schedule booster expiration check every hour
cron.schedule('0 * * * *', () => {
    const users = database.getAllUsers();
    let expiredCount = 0;
    
    users.forEach(user => {
        if (user.boosters) {
            // Check money booster
            if (user.boosters.money && user.boosters.money.expiresAt < Date.now()) {
                delete user.boosters.money;
                expiredCount++;
            }
            // Check exp booster
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

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    cleanup();
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    logger.error('Unhandled Rejection:', error);
});

// Login to Discord
const token = process.env.DISCORD_TOKEN || config.token;
if (!token || token === 'YOUR_BOT_TOKEN_HERE') {
    logger.error('❌ No valid Discord token found! Please set DISCORD_TOKEN environment variable.');
    cleanup();
    process.exit(1);
}

logger.info('🔗 Attempting to connect to Discord...');
logger.info(`🔑 Token length: ${token.length} characters`);
logger.info(`🔑 Token starts with: ${token.substring(0, 24)}...`);

client.login(token)
    .then(() => {
        logger.info('✅ Bot login successful!');
        console.log(`🎉 Bot is ready! PID: ${process.pid}`);
        console.log(`🎯 Loaded ${client.commands.size} commands`);
    })
    .catch(error => {
        logger.error('❌ Failed to start bot:', error);
        logger.error('❌ Error code:', error.code);
        logger.error('❌ Error message:', error.message);

        if (error.code === 'TokenInvalid') {
            logger.error('❌ Invalid Discord token! Please check your DISCORD_TOKEN environment variable.');
            logger.error('❌ Make sure the token:');
            logger.error('   1. Is copied correctly from Discord Developer Portal');
            logger.error('   2. Belongs to a bot (not a user token)');
            logger.error('   3. Has proper permissions enabled');
        } else if (error.code === 'DisallowedIntents') {
            logger.error('❌ Bot is missing required intents. Please enable them in Discord Developer Portal.');
        }

        cleanup();
        process.exit(1);
    });

// Add ready event for better logging
client.once('ready', () => {
    console.log(`🚀 ${client.user.tag} is online!`);
    console.log(`📊 Serving ${client.guilds.cache.size} servers`);
    console.log(`👥 Watching ${client.users.cache.size} users`);
    console.log('='.repeat(50));
    console.log('🎰 Bot is ready to receive commands!');
    console.log('='.repeat(50));
});
