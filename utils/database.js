const User = require('../models/User');
const registry = require('./registry.js');
const logger = require('./logger.js');
const fs = require('fs');
const path = require('path');

/**
 * DATABASE UTILITY (Gold Standard - MongoDB Edition)
 * Replaces JSON-based storage with high-performance MongoDB queries.
 */

// --- CORE ASYNC WRAPPERS ---

async function getUser(userId, username = null) {
    try {
        let user = await User.findOne({ id: userId });
        if (!user) {
            user = await User.create({ id: userId, username: username || 'Unknown Traveler' });
            logger.debug(`New MongoDB profile created for: ${username || userId}`);
        } else if (username && user.username !== username) {
            user.username = username;
            await user.save();
        }
        return user;
    } catch (err) {
        logger.error(`MongoDB getUser error:`, err);
        return null;
    }
}

async function saveUser(user) {
    try {
        await user.save();
    } catch (err) {
        logger.error(`MongoDB saveUser error:`, err);
    }
}

async function getAllUsers() {
    return await User.find({});
}

// --- ECONOMY & EXP (Async Logic) ---

async function addExperience(userId, amount) {
    const user = await getUser(userId);
    // EXP Logic
    user.experience += amount;
    let leveledUp = false;
    const getReq = (lvl) => lvl < 5 ? lvl * 100 : (lvl < 15 ? Math.floor(500 * Math.pow(1.2, lvl - 5)) : Math.floor(3000 * Math.pow(1.15, lvl - 15) + (lvl * 200)));
    
    while (user.experience >= getReq(user.level)) {
        user.experience -= getReq(user.level);
        user.level++;
        leveledUp = true;
    }
    await saveUser(user);
    return { leveledUp, newLevel: user.level, currentExp: user.experience, nextExp: getReq(user.level) };
}

async function addBalance(userId, amount) {
    return await User.findOneAndUpdate(
        { id: userId },
        { $inc: { balance: amount } },
        { new: true, upsert: true }
    );
}

async function removeBalance(userId, amount) {
    return await User.findOneAndUpdate(
        { id: userId },
        { $inc: { balance: -amount } },
        { new: true }
    );
}

async function hasBalance(userId, amount) {
    const user = await getUser(userId);
    return user.balance >= amount;
}

async function updateStats(userId, type, amount = 1) {
    const update = {};
    if (type === 'won') update['stats.totalWon'] = 1;
    else if (type === 'lost') update['stats.totalLost'] = 1;
    else if (type === 'command') update['stats.commandsUsed'] = 1;
    else update[`stats.${type}`] = amount;

    await User.findOneAndUpdate({ id: userId }, { $inc: update });
}

// --- GACHA HELPERS (Async Edition) ---

async function addGachaItem(userId, itemName) {
    const user = await getUser(userId);
    const item = registry.getItem(itemName);
    if (!item) return null;

    let existing = user.gacha_inventory.find(i => i.name === itemName);

    if (item.type === 'weapon') {
        if (existing) {
            existing.count = (existing.count || 1) + 1;
        } else {
            user.gacha_inventory.push({ name: itemName, type: 'weapon', refinement: 1, count: 1 });
        }
    } else {
        if (existing) {
            existing.count = (existing.count || 1) + 1;
        } else {
            user.gacha_inventory.push({ name: itemName, type: 'character', ascension: 0, count: 1 });
        }
    }

    await saveUser(user);
    const updated = user.gacha_inventory.find(i => i.name === itemName);
    return { ...item, ...updated.toObject(), isNew: !existing };
}

async function getHydratedInventory(userId) {
    const user = await getUser(userId);
    return (user.gacha_inventory || []).map(slim => {
        const staticData = registry.getItem(slim.name);
        return staticData ? { ...staticData, ...slim.toObject() } : null;
    }).filter(Boolean);
}

// --- ANIMAL FUNCTIONS ---

function loadAnimals() {
    try {
        const animalsDataPath = path.join(__dirname, '..', 'data', 'animals.json');
        const data = fs.readFileSync(animalsDataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        logger.error('Error loading animals data:', error);
        return {};
    }
}

async function addAnimal(userId, animalKey, rarity) {
    const user = await getUser(userId);
    if (!user.animals) user.animals = new Map();
    
    let rarityMap = user.animals.get(rarity);
    if (!rarityMap) {
        rarityMap = new Map();
        user.animals.set(rarity, rarityMap);
    }

    const currentCount = rarityMap.get(animalKey) || 0;
    rarityMap.set(animalKey, currentCount + 1);
    
    user.markModified('animals');
    await user.save();
}

async function getUserAnimals(userId) {
    const user = await getUser(userId);
    return user.animals;
}

// --- BOOSTER FUNCTIONS ---

async function addBooster(userId, type, multiplier, duration) {
    const user = await getUser(userId);
    if (!user.boosters) user.boosters = new Map();

    user.boosters.set(type, {
        multiplier: multiplier,
        expiresAt: Date.now() + duration
    });

    user.markModified('boosters');
    await user.save();
}

async function getActiveBooster(userId, type) {
    const user = await getUser(userId);
    if (user.boosters && user.boosters.has(type)) {
        const booster = user.boosters.get(type);
        if (booster.expiresAt > Date.now()) {
            return booster;
        }
    }
    return null;
}

module.exports = {
    getUser, saveUser, getAllUsers, addExperience, addBalance, removeBalance, hasBalance, 
    updateStats, addGachaItem, getHydratedInventory, loadAnimals, addAnimal, getUserAnimals,
    addBooster, getActiveBooster
};