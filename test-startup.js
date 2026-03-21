const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();
client.slashCommands = new Collection();
client.aliases = new Collection();

try {
    // Test requiring core services
    const db = require('./dist/services/DatabaseService');
    const imgGen = require('./dist/services/ImageGenerationService');

    // Test loading commands
    const commandsPath = path.join(__dirname, 'dist', 'commands');
    const commandFolders = fs.readdirSync(commandsPath);
    let loaded = 0;

    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        if (!fs.statSync(folderPath).isDirectory()) continue;

        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = path.join(folderPath, file);
            const command = require(filePath);
            if ('name' in command && 'execute' in command) {
                loaded++;
            }
        }
    }

    console.log(`PASS: Required core services and successfully loaded ${loaded} command files with no missing dependencies!`);
    process.exit(0);
} catch (e) {
    console.error("FAIL: Startup generated an exception:");
    console.error(e);
    process.exit(1);
}
