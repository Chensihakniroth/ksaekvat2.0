"use strict";
/**
 * GACHA SERVICE (Professional TypeScript Edition)
 * Centralized logic for roll rates, pity mechanics, and pool selection.
 * Now with type-safety to ensure every wish is perfect! (｡♥‿♥｡)
 */
Object.defineProperty(exports, "__esModule", { value: true });
class GachaService {
    BASE_RATE_5 = 0.6;
    SOFT_PITY_START = 75;
    HARD_PITY_5 = 90;
    HARD_PITY_4 = 10;
    /**
     * Determine the rarity of a single pull based on current pity.
     * Updates pity values in the returned object.
     */
    rollRarity(currentPity5, currentPity4) {
        let pity5 = currentPity5 + 1;
        let pity4 = currentPity4 + 1;
        let rarity;
        let currentRate5 = this.BASE_RATE_5;
        if (pity5 >= this.SOFT_PITY_START) {
            currentRate5 += (pity5 - this.SOFT_PITY_START + 1) * 6;
        }
        const rand = Math.random() * 100;
        if (pity5 >= this.HARD_PITY_5 || rand < currentRate5) {
            rarity = '5';
            pity5 = 0;
        }
        else if (pity4 >= this.HARD_PITY_4 || rand < currentRate5 + 5.1) {
            rarity = '4';
            pity4 = 0;
        }
        else {
            rarity = '3';
        }
        return { rarity, pity5, pity4 };
    }
    /**
     * Perform a multi-pull (usually 10).
     */
    performMultiPull(userData, pool) {
        const results = [];
        let { pity: pity5, pity4 } = userData;
        let hasHighRarity = false;
        for (let i = 0; i < 10; i++) {
            const roll = this.rollRarity(pity5, pity4);
            pity5 = roll.pity5;
            pity4 = roll.pity4;
            if (roll.rarity === '4' || roll.rarity === '5') {
                hasHighRarity = true;
            }
            const charList = pool[roll.rarity];
            const item = charList[Math.floor(Math.random() * charList.length)];
            results.push({ ...item, rarity: parseInt(roll.rarity) });
        }
        // Mommy's Guarantee! Ensures at least one 4-star or better per 10-pull. (｡♥‿♥｡)
        if (!hasHighRarity) {
            // Find a 3-star to replace
            const replacementIndex = results.findIndex(r => r.rarity === 3);
            if (replacementIndex !== -1) {
                const fourStarPool = pool['4'];
                if (fourStarPool && fourStarPool.length > 0) {
                    const newItem = fourStarPool[Math.floor(Math.random() * fourStarPool.length)];
                    results[replacementIndex] = { ...newItem, rarity: 4 };
                }
            }
        }
        return { results, pity5, pity4 };
    }
}
const instance = new GachaService();
exports.default = instance;
