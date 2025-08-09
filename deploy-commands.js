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
    if (command.data && typeof command.data.toJSON === "function") {
      const commandJSON = command.data.toJSON();
      commands.push(commandJSON);
      console.log(`✅ Loaded command: ${commandJSON.name} from ${file}`);
    } else if (command.data) {
      // Check if it has name in the data object directly
      console.log(`[DEBUG] Command data structure for ${file}:`, Object.keys(command.data));
      console.warn(`[WARN] Skipped ${file}: Missing toJSON method`);
    } else {
      console.warn(`[WARN] Skipped ${file}: Missing data property`);
    }
  } catch (error) {
    console.warn(`[WARN] Failed to load ${file}: ${error.message}`);
  }
}

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    console.log(`🔄 Registering ${commands.length} global (user) commands...`);

    // Register commands globally (user commands, takes up to 1 hour to propagate)
    await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });
    console.log("🌐 Global commands registered successfully (may take up to 1 hour to update).");

  } catch (error) {
    console.error("❌ Error registering commands:", error);
  }
})();

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    console.log(`🔄 Registering ${commands.length} global (user) commands...`);

    // Register commands globally (user commands, takes up to 1 hour to propagate)
    await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });
    console.log("🌐 Global commands registered successfully (may take up to 1 hour to update).");

  } catch (error) {
    console.error("❌ Error registering commands:", error);
  }
})();