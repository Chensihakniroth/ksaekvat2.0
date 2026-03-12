"use strict";
const Character = require('../models/Character').default || require('../models/Character');
const logger = require('./logger.js');
/**
 * REGISTRY UTILITY (Gold Standard)
 * Acts as the Single Source of Truth for all Gacha items.
 * Prevents data redundancy and ensures consistent stats across the bot.
 * Now loads from MongoDB on startup (Collection: characters).
 */
let characterRegistry = {};
// Load and index the registry once on startup (Async)
async function initializeRegistry() {
    try {
        const items = await Character.find({});
        // Reset registries
        characterRegistry = {};
        items.forEach((item) => {
            const itemData = {
                name: item.name,
                game: item.game,
                rarity: parseInt(item.rarity),
                emoji: item.emoji,
                type: item.type,
                element: item.element,
                role: item.role,
                image_url: item.image_url,
            };
            // Only characters and items are allowed now! Weapons are retired~ (｡♥‿♥｡)
            if (itemData.type === 'character' || itemData.type === 'item') {
                characterRegistry[item.name] = itemData;
            }
        });
        logger.debug(`Registry initialized with ${items.length} items from MongoDB (characters collection).`);
    }
    catch (error) {
        logger.error('Failed to initialize registry from MongoDB:', error);
    }
}
module.exports = {
    initializeRegistry,
    getItem: (name) => characterRegistry[name],
    getCharacter: (name) => characterRegistry[name],
    getWeapon: (name) => null, // Weapon system is OFF
    getAllCharacters: () => Object.values(characterRegistry),
    getAllWeapons: () => [], // Empty armory~
};
