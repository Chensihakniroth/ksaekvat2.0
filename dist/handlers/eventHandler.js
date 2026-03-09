"use strict";
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger.js');
module.exports = (client) => {
    const eventsPath = path.join(__dirname, '..', 'events');
    let loadedCount = 0;
    logger.section('Event Loader');
    const loadProgress = logger.loader('Registering event listeners');
    try {
        if (fs.existsSync(eventsPath)) {
            const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.js'));
            for (const file of eventFiles) {
                const filePath = path.join(eventsPath, file);
                const event = require(filePath);
                if (event.name && event.execute) {
                    if (event.once) {
                        client.once(event.name, (...args) => event.execute(...args, client));
                    }
                    else {
                        client.on(event.name, (...args) => event.execute(...args, client));
                    }
                    loadedCount++;
                }
                else {
                    logger.warn(`Skipped event ${file}: Missing name/execute`);
                }
            }
            loadProgress.done();
            logger.item('Total Events', loadedCount, '\x1b[32m');
        }
        else {
            loadProgress.fail('Directory not found');
        }
    }
    catch (error) {
        loadProgress.fail(error.message);
    }
};
