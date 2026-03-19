const { REST, Routes } = require('discord.js');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

// Fix paths
const configPath = path.join(__dirname, '../config/config.js');
const loggerPath = path.join(__dirname, '../utils/logger.js');

const config = require(configPath);
const logger = require(loggerPath);

const { token, clientId, guildId } = config;

logger.header('Command Deployment System');

const commands = [];
const commandsPath = path.join(__dirname, '../commands/slash');

if (!fs.existsSync(commandsPath)) {
  logger.error('Slash commands directory not found!');
  process.exit(1);
}

const loadProg = logger.loader('Preparing commands');

try {
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
  const tableRows = [];

  for (const file of commandFiles) {
    try {
      const command = require(path.join(commandsPath, file));
      if (!command.data) continue;
      
      const cmdData = command.data.toJSON();

      // Fix: dm_permission is deprecated in favor of contexts in newer discord.js versions
      // We'll remove it to avoid the warning, as it defaults to true for global commands
      // or we can use contexts if we want to be explicit.
      const processedCommand = {
        ...cmdData,
        // Removed dm_permission: true to fix deprecation warning
        default_member_permissions: '0', // Restricted to Admins by default
      };

      commands.push(processedCommand);
      tableRows.push([command.data.name, command.data.description || 'No description']);
    } catch (error) {
      logger.warn(`Failed to process ${file}: ${error.message}`);
    }
  }

  loadProg.done();
  
  if (tableRows.length > 0) {
    logger.section('Command List');
    logger.table(['Command', 'Description'], tableRows);
  }

  logger.item('Total Prepared', commands.length, '\x1b[32m');

  if (commands.length === 0) {
    logger.warn('No commands found to deploy! Make sure you have files in src/commands/slash/');
    process.exit(0);
  }

} catch (error) {
  loadProg.fail(error.message);
  logger.error('Error loading command files', error);
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  const isGlobal = process.argv.includes('--global');
  const deployType = isGlobal ? 'GLOBAL' : 'GUILD';
  const deployProg = logger.loader(`Pushing ${deployType} update to Discord`);

  try {
    let route;
    if (isGlobal) {
      route = Routes.applicationCommands(clientId);
    } else {
      if (!guildId) {
        throw new Error('GUILD_ID not found in config/env for guild deployment');
      }
      route = Routes.applicationGuildCommands(clientId, guildId);
    }

    await rest.put(route, { body: commands });
    deployProg.done();

    logger.blank();
    logger.box(
      `SUCCESSFUL ${deployType} DEPLOYMENT\n` +
      `- Mode: ${isGlobal ? 'Global (can take 1h)' : 'Guild (Instant)'}\n` +
      '- Restricted to Admins (default_member_permissions: 0)\n' +
      '- Available in DMs (default)',
      '\x1b[32m'
    );

    if (!isGlobal) {
      logger.info('Tip: Use --global flag to deploy globally');
    }
  } catch (error) {
    deployProg.fail(error.message);
    logger.error('Deployment failed', error);
  }
})();
