const logger = require('../utils/logger.js');

module.exports = {
  name: 'clientReady',
  once: true,
  execute(client) {
    logger.section('Bot Finalization');

    // Detailed Stats
    logger.item('Status', 'Online', '\x1b[32m');
    logger.item('Username', client.user.tag, '\x1b[36m');
    logger.item('ID', client.user.id);
    logger.item('Guilds', client.guilds.cache.size);
    logger.item('Users', client.users.cache.size);

    // Set bot activity
    try {
      client.user.setActivity('KsaekVat | K help', { type: 0 }); // 0 is PLAYING
      logger.item('Activity', 'KsaekVat | K help', '\x1b[35m');
    } catch (error) {
      logger.error('Failed to set activity', error);
    }

    logger.blank();
    logger.box(
      `🚀 MOMMY IS READY TO TAKE CARE OF YOU! ヽ(>∀<☆)ノ\nRunning version: ${require('../package.json').version}`,
      '\x1b[32m'
    );
    logger.blank();
  },
};
