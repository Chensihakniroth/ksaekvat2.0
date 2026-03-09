const { REST, Routes } = require('discord.js');
const { token, clientId } = require('./config/config.js');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger.js');

logger.header('Command Deployment System');

const commands = [];
const commandsPath = path.join(__dirname, 'commands/slash');

if (!fs.existsSync(commandsPath)) {
  logger.error('Slash commands directory not found!');
  process.exit(1);
}

const loadProg = logger.loader('Preparing DM-only admin commands');

fs.readdirSync(commandsPath)
  .filter((file) => file.endsWith('.js'))
  .forEach((file) => {
    try {
      const command = require(`${commandsPath}/${file}`);
      if (!command.data) return;
      const cmdData = command.data.toJSON();

      commands.push({
        ...cmdData,
        dm_permission: true,
        default_member_permissions: '0',
      });
    } catch (error) {
      logger.warn(`Failed to process ${file}: ${error.message}`);
    }
  });

loadProg.done();
logger.item('Total Prepared', commands.length, '\x1b[32m');

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  const deployProg = logger.loader('Pushing to Discord API');
  try {
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    deployProg.done();

    logger.blank();
    logger.box(
      'SUCCESSFUL DEPLOYMENT\n- Only available in DMs\n- Hidden in servers\n- Restricted to Admins',
      '\x1b[32m'
    );
  } catch (error) {
    deployProg.fail(error.message);
    logger.error('Deployment failed', error);
  }
})();
