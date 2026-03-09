const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger.js');

module.exports = (client) => {
  const commandsPath = path.join(__dirname, '..', 'commands');
  let loadedCount = 0;
  let errorCount = 0;

  logger.section('Command Loader');
  const loadProgress = logger.loader('Indexing command files');

  function loadCommands(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const itemPath = path.join(dir, item.name);

      if (item.isDirectory()) {
        if (item.name === 'slash') continue;
        loadCommands(itemPath);
      } else if (item.isFile() && item.name.endsWith('.js')) {
        try {
          const command = require(itemPath);
          if (!command.name || !command.execute) {
            logger.warn(`Skipped ${item.name}: Missing name/execute`);
            errorCount++;
            continue;
          }

          if (!command.category) command.category = path.basename(dir);
          client.commands.set(command.name, command);

          if (command.aliases && Array.isArray(command.aliases)) {
            for (const alias of command.aliases) {
              client.commands.set(alias, command);
            }
          }
          loadedCount++;
        } catch (error) {
          logger.error(`Failed to load ${item.name}`, error);
          errorCount++;
        }
      }
    }
  }

  try {
    if (fs.existsSync(commandsPath)) {
      loadCommands(commandsPath);
      loadProgress.done();
      logger.item('Prefix Cmds', loadedCount, '\x1b[32m');
      if (errorCount > 0) logger.item('Failures', errorCount, '\x1b[31m');
    } else {
      loadProgress.fail('Directory not found');
    }
  } catch (error) {
    loadProgress.fail(error.message);
  }
};
