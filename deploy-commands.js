const { REST, Routes } = require("discord.js");
const { token, clientId } = require("./config/config.js");
const fs = require("fs");
const path = require("path");

const commands = [];
const commandsPath = path.join(__dirname, "commands/slash");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    try {
        const command = require(`./commands/slash/${file}`);
        
        // Skip commands not meant for DMs
        if (!command.dmPermission) continue;
        
        const commandJSON = command.data.toJSON();
        commandJSON.dm_permission = true; // Explicitly enable for DMs
        commandJSON.default_member_permissions = '0'; // Admin-only
        
        // Add [Admin] prefix if not present
        if (!commandJSON.description.includes('[Admin]')) {
            commandJSON.description = `[Admin] ${commandJSON.description}`;
        }
        
        commands.push(commandJSON);
        console.log(`✅ Loaded DM command: ${commandJSON.name}`);
    } catch (error) {
        console.error(`❌ Failed to load ${file}:`, error.message);
    }
}

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
    try {
        console.log(`🔒 Registering ${commands.length} admin-only DM commands...`);
        
        const data = await rest.put(
            Routes.applicationCommands(clientId), 
            { body: commands }
        );
        
        console.log(`🤖 Success! Registered ${data.length} DM commands.`);
        console.log('ℹ️ These commands will only work in DMs with the bot.');
        
    } catch (error) {
        console.error("💥 Failed to register DM commands:", error);
    }
})();