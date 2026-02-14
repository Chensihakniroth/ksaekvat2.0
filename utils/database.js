const fs = require('fs');
const path = require('path');
const logger = require('./logger.js');

// Data file paths
const usersDataPath = path.join(__dirname, '..', 'data', 'users.json');
const animalsDataPath = path.join(__dirname, '..', 'data', 'animals.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize data files if they don't exist
if (!fs.existsSync(usersDataPath)) {
    fs.writeFileSync(usersDataPath, JSON.stringify({}));
}

if (!fs.existsSync(animalsDataPath)) {
    // Load default animals data
    const defaultAnimals = require('../data/animals.json');
    fs.writeFileSync(animalsDataPath, JSON.stringify(defaultAnimals, null, 2));
}

// Load data from files
function loadUsers() {
    try {
        const data = fs.readFileSync(usersDataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        logger.error('Error loading users data:', error);
        return {};
    }
}

function loadAnimals() {
    try {
        const data = fs.readFileSync(animalsDataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        logger.error('Error loading animals data:', error);
        return {};
    }
}

// Save data to files
function saveUsers(users) {
    try {
        fs.writeFileSync(usersDataPath, JSON.stringify(users, null, 2));
    } catch (error) {
        logger.error('Error saving users data:', error);
    }
}

// User management functions
function getUser(userId) {
    const users = loadUsers();

    if (!users[userId]) {
        // Create new user with default values
        users[userId] = {
            id: userId,
            balance: 1000,
            level: 1,
            worldLevel: 1,
            experience: 0,
            dailyClaimed: false,
            weeklyClaimed: false,
            lastDaily: null,
            lastWeekly: null,
            lastHunt: null,
            hunt_boost: 0, // Number of boosted turns left
            lootbox: 0,    // Number of lootboxes owned
            gacha_inventory: [], // Characters pulled
            lastGachaReset: null, // For daily free 10-pull
            dailyPulls: 0,      // Number of pulls today
            animals: {},
            boosters: {},
            inventory: [],
            equipped: {},
            totalAnimalsFound: 0,
            totalGambled: 0,
            totalWon: 0,
            totalLost: 0,
            commandsUsed: 0,
            joinedAt: Date.now()
        };
        saveUsers(users);
    }

    return users[userId];
}

function saveUser(userData) {
    const users = loadUsers();
    users[userData.id] = userData;
    saveUsers(users);
}

function getAllUsers() {
    const users = loadUsers();
    return Object.values(users);
}

// Experience and level functions (Genshin-style curve)
function getRequiredExp(level) {
    // Level 1-5: Very fast
    if (level < 5) return level * 100;
    // Level 5-15: Moderate
    if (level < 15) return Math.floor(500 * Math.pow(1.2, level - 5));
    // Level 15+: Exponentially harder
    return Math.floor(3000 * Math.pow(1.15, level - 15) + (level * 200));
}

function addExperience(userId, amount) {
    const user = getUser(userId);

    // Apply exp booster if active
    if (user.boosters && user.boosters.exp && user.boosters.exp.expiresAt > Date.now()) {
        amount *= user.boosters.exp.multiplier;
    }

    user.experience += amount;

    let leveledUp = false;
    let currentLevel = user.level;

    // Check for level up using the curve
    while (user.experience >= getRequiredExp(currentLevel)) {
        user.experience -= getRequiredExp(currentLevel);
        currentLevel++;
        leveledUp = true;
    }

    if (leveledUp) {
        user.level = currentLevel;
    }

    saveUser(user);
    return { leveledUp, newLevel: currentLevel, currentExp: user.experience, nextExp: getRequiredExp(currentLevel) };
}

// Balance functions
function addBalance(userId, amount) {
    const user = getUser(userId);

    // Apply money booster if active
    if (user.boosters.money && user.boosters.money.expiresAt > Date.now()) {
        amount *= user.boosters.money.multiplier;
    }

    user.balance += amount;
    saveUser(user);
    return user.balance;
}

function removeBalance(userId, amount) {
    const user = getUser(userId);
    user.balance = Math.max(0, user.balance - amount);
    saveUser(user);
    return user.balance;
}

function hasBalance(userId, amount) {
    const user = getUser(userId);
    return user.balance >= amount;
}

// Animal functions
function addAnimal(userId, animalKey, rarity) {
    const user = getUser(userId);

    if (!user.animals[rarity]) {
        user.animals[rarity] = {};
    }

    if (!user.animals[rarity][animalKey]) {
        user.animals[rarity][animalKey] = 0;
    }

    user.animals[rarity][animalKey]++;
    user.totalAnimalsFound++;

    saveUser(user);
}

function getUserAnimals(userId) {
    const user = getUser(userId);
    return user.animals;
}

// Booster functions
function addBooster(userId, type, multiplier, duration) {
    const user = getUser(userId);

    if (!user.boosters) {
        user.boosters = {};
    }

    user.boosters[type] = {
        multiplier: multiplier,
        expiresAt: Date.now() + duration
    };

    saveUser(user);
}

function getActiveBooster(userId, type) {
    const user = getUser(userId);

    if (user.boosters && user.boosters[type] && user.boosters[type].expiresAt > Date.now()) {
        return user.boosters[type];
    }

    return null;
}

// Statistics functions
function updateStats(userId, type, amount = 1) {
    const user = getUser(userId);

    if (!user.stats) user.stats = {};

    switch (type) {
        case 'gambled':
            user.totalGambled += amount;
            break;
        case 'won':
            user.totalWon += amount;
            break;
        case 'lost':
            user.totalLost += amount;
            break;
        case 'command':
            user.commandsUsed += amount;
            break;
        default:
            // Generic stat tracking
            user.stats[type] = (user.stats[type] || 0) + amount;
    }

    saveUser(user);
}

module.exports = {
    getUser,
    saveUser,
    getAllUsers,
    addExperience,
    addBalance,
    removeBalance,
    hasBalance,
    addAnimal,
    getUserAnimals,
    addBooster,
    getActiveBooster,
    updateStats,
    loadAnimals
};