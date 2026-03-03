/**
 * ANIMAL SERVICE
 * Centralized logic for animal collections, rarity checks, and net worth calculations.
 */

const config = require('../config/config.js');

class AnimalService {
    /**
     * Calculate comprehensive stats for a user's animal collection.
     */
    calculateZooStats(userAnimals, animalsData) {
        let totalAnimals = 0;
        let totalValue = 0;
        let rarityStats = {};
        
        for (const rarity of Object.keys(config.hunting.rarities)) {
            rarityStats[rarity] = { count: 0, value: 0 };
        }
        
        for (const [rarity, animals] of Object.entries(userAnimals)) {
            if (animalsData[rarity]) {
                const animalEntries = animals instanceof Map ? animals.entries() : Object.entries(animals);
                for (const [animalKey, count] of animalEntries) {
                    if (animalsData[rarity][animalKey]) {
                        const val = animalsData[rarity][animalKey].value * count;
                        totalAnimals += count;
                        totalValue += val;
                        rarityStats[rarity].count += count;
                        rarityStats[rarity].value += val;
                    }
                }
            }
        }

        return { totalAnimals, totalValue, rarityStats };
    }

    /**
     * Determine badges based on collection status.
     */
    calculateBadges(totalAnimalsFound, totalValue, userAnimals) {
        const badges = [];
        if (totalAnimalsFound >= 100) badges.push('🦁 **Hunter**');
        if (totalAnimalsFound >= 500) badges.push('👑 **Master**');
        if (totalValue >= 1000000) badges.push('💰 **Tycoon**');
        
        const hasPriceless = userAnimals instanceof Map ? userAnimals.has('priceless') : userAnimals.priceless;
        if (hasPriceless) badges.push('🌟 **Legend**');
        
        const uniqueCount = userAnimals instanceof Map ? userAnimals.size : Object.keys(userAnimals).length;
        if (uniqueCount >= 10) badges.push('🌈 **Collector**');

        return badges;
    }
}

module.exports = new AnimalService();
