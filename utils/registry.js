const fs = require('fs');
const path = require('path');

/**
 * REGISTRY UTILITY (Gold Standard)
 * Acts as the Single Source of Truth for all Gacha items.
 * Prevents data redundancy and ensures consistent stats across the bot.
 */

const POOL_PATH = path.join(__dirname, '../data/character_pool.json');
let characterRegistry = {};
let weaponRegistry = {};

// Load and index the registry once on startup
function initializeRegistry() {
    const data = JSON.parse(fs.readFileSync(POOL_PATH, 'utf8'));
    
    for (const [game, rarities] of Object.entries(data)) {
        for (const [rarity, items] of Object.entries(rarities)) {
            items.forEach(item => {
                const itemData = {
                    ...item,
                    rarity: parseInt(rarity),
                    game: game,
                    type: rarity === "3" ? "weapon" : "character"
                };

                if (itemData.type === "character") {
                    characterRegistry[item.name] = itemData;
                } else {
                    weaponRegistry[item.name] = itemData;
                }
            });
        }
    }
}

initializeRegistry();

module.exports = {
    getItem: (name) => characterRegistry[name] || weaponRegistry[name],
    getCharacter: (name) => characterRegistry[name],
    getWeapon: (name) => weaponRegistry[name],
    getAllCharacters: () => Object.values(characterRegistry),
    getAllWeapons: () => Object.values(weaponRegistry)
};