const logger = require('../utils/logger.js');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        logger.info(`Bot ${client.user.tag} is ready!`);
        logger.info(`Serving ${client.guilds.cache.size} guilds`);
        logger.info(`Watching ${client.users.cache.size} users`);
        
        // Set bot activity
        client.user.setActivity('KsaekVat | K help', { type: 'PLAYING' });
    }
};
