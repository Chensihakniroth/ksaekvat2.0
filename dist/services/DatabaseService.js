"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = __importDefault(require("../models/User"));
const Listener_1 = __importDefault(require("../models/Listener"));
const TalkTarget_1 = __importDefault(require("../models/TalkTarget"));
const CharacterCard_1 = __importDefault(require("../models/CharacterCard"));
const AnimalRegistry_1 = __importDefault(require("../models/AnimalRegistry"));
const GachaHistory_1 = __importDefault(require("../models/GachaHistory"));
const UserPokemon_1 = __importDefault(require("../models/UserPokemon"));
const registry = require('../utils/registry.js');
const logger = require('../utils/logger.js');
/**
 * DATABASE UTILITY (Gold Standard - MongoDB Edition)
 * Replaces JSON-based storage with high-performance MongoDB queries.
 */
class DatabaseService {
    async getUser(userId, username = null) {
        try {
            let user = await User_1.default.findOne({ id: userId });
            if (!user) {
                user = await User_1.default.create({ id: userId, username: username || 'Unknown Traveler' });
                logger.debug(`New MongoDB profile created for: ${username || userId}`);
            }
            else if (username && user.username !== username) {
                user.username = username;
                await user.save();
            }
            return user;
        }
        catch (err) {
            logger.error(`MongoDB getUser error:`, err);
            return null;
        }
    }
    async saveUser(user) {
        try {
            await user.save();
        }
        catch (err) {
            logger.error(`MongoDB saveUser error:`, err);
        }
    }
    async saveUserUpdate(userId, updatePayload) {
        try {
            return await User_1.default.findOneAndUpdate({ id: userId }, updatePayload, { returnDocument: 'after' });
        }
        catch (err) {
            logger.error(`MongoDB saveUserUpdate error:`, err);
            return null;
        }
    }
    async getAllUsers() {
        return await User_1.default.find({});
    }
    async addExperience(userId, amount) {
        // ── First atomic XP boost ───────────────────────────────────────────
        const user = await User_1.default.findOneAndUpdate({ id: userId }, { $inc: { experience: amount } }, { returnDocument: 'after', upsert: true });
        let leveledUp = false;
        const getReq = (lvl) => lvl < 5
            ? lvl * 100
            : lvl < 15
                ? Math.floor(500 * Math.pow(1.2, lvl - 5))
                : Math.floor(3000 * Math.pow(1.15, lvl - 15) + lvl * 200);
        // Handle potential multi-level-up based on the now-incremented experience
        while (user.experience >= getReq(user.level)) {
            user.experience -= getReq(user.level);
            user.level++;
            leveledUp = true;
        }
        if (leveledUp) {
            await user.save(); // Only save if we actually modified level/remainder
        }
        return {
            leveledUp,
            newLevel: user.level,
            currentExp: user.experience,
            nextExp: getReq(user.level),
            updatedUser: user.toObject(),
        };
    }
    async addBalance(userId, amount) {
        return await User_1.default.findOneAndUpdate({ id: userId }, { $inc: { balance: amount } }, { returnDocument: 'after', upsert: true });
    }
    async addPokeball(userId, type, amount = 1) {
        const field = type === 'pokeball' ? 'pokeballs' : type === 'ultraball' ? 'ultraballs' : 'masterballs';
        return await User_1.default.findOneAndUpdate({ id: userId }, { $inc: { [field]: amount } }, { returnDocument: 'after', upsert: true });
    }
    async setPokeball(userId, type) {
        const user = await this.getUser(userId);
        const field = type === 'pokeball' ? 'pokeballs' : type === 'ultraball' ? 'ultraballs' : 'masterballs';
        if (!user[field] || user[field] <= 0) {
            return { success: false, message: `You don't have any ${type}s, darling! (｡•́︿•̀｡)` };
        }
        // Consume 1 ball
        user[field]--;
        if (!user.boosters)
            user.boosters = new Map();
        // Set one-time-use flag
        user.boosters.set(type, {
            active: true,
            oneTime: true
        });
        user.markModified('boosters');
        await this.saveUser(user);
        return { success: true };
    }
    async clearOneTimeBall(userId, type) {
        return await User_1.default.findOneAndUpdate({ id: userId }, { $unset: { [`boosters.${type}`]: "" } }, { returnDocument: 'after' });
    }
    async addItem(userId, itemName, amount = 1) {
        const user = await this.getUser(userId);
        if (!user.inventory)
            user.inventory = [];
        const existing = user.inventory.find((i) => i.name === itemName);
        if (existing) {
            existing.count += amount;
        }
        else {
            user.inventory.push({ name: itemName, count: amount });
        }
        user.markModified('inventory');
        await this.saveUser(user);
    }
    async unlockTheme(userId, themeId) {
        const user = await this.getUser(userId);
        if (!user.unlockedThemes)
            user.unlockedThemes = ['default'];
        if (!user.unlockedThemes.includes(themeId)) {
            user.unlockedThemes.push(themeId);
            user.markModified('unlockedThemes');
            await this.saveUser(user);
            return true;
        }
        return false;
    }
    async setTheme(userId, themeId) {
        const user = await this.getUser(userId);
        if (user.unlockedThemes && user.unlockedThemes.includes(themeId)) {
            user.profileTheme = themeId;
            await this.saveUser(user);
            return true;
        }
        return false;
    }
    async removeBalance(userId, amount) {
        return await User_1.default.findOneAndUpdate({ id: userId }, { $inc: { balance: -amount } }, { returnDocument: 'after' });
    }
    async removeStarDust(userId, amount) {
        return await User_1.default.findOneAndUpdate({ id: userId }, { $inc: { star_dust: -amount } }, { returnDocument: 'after' });
    }
    async hasBalance(userId, amount) {
        const user = await this.getUser(userId);
        return user.balance >= amount;
    }
    async hasBankBalance(userId, amount) {
        const user = await this.getUser(userId);
        return (user.bank || 0) >= amount;
    }
    async hasTotalBalance(userId, amount) {
        const user = await this.getUser(userId);
        return (user.balance || 0) + (user.bank || 0) >= amount;
    }
    async payWithAnyBalance(userId, amount) {
        const user = await User_1.default.findOne({ id: userId });
        if (!user)
            return false;
        if ((user.balance || 0) >= amount) {
            user.balance -= amount;
        }
        else {
            const remaining = amount - (user.balance || 0);
            user.balance = 0;
            user.bank = (user.bank || 0) - remaining;
        }
        await user.save();
        return true;
    }
    async deposit(userId, amount) {
        return await User_1.default.findOneAndUpdate({ id: userId }, {
            $inc: {
                balance: -amount,
                bank: amount
            }
        }, { returnDocument: 'after' });
    }
    async withdraw(userId, amount) {
        return await User_1.default.findOneAndUpdate({ id: userId }, {
            $inc: {
                balance: amount,
                bank: -amount
            }
        }, { returnDocument: 'after' });
    }
    async updateStats(userId, type, amount = 1) {
        const update = {};
        if (type === 'won')
            update['stats.totalWon'] = 1;
        else if (type === 'lost')
            update['stats.totalLost'] = 1;
        else if (type === 'command')
            update['stats.commandsUsed'] = 1;
        else
            update[`stats.${type}`] = amount;
        await User_1.default.findOneAndUpdate({ id: userId }, { $inc: update });
    }
    async logGachaPull(userId, username, itemName, game, rarity) {
        try {
            if (rarity < 4)
                return; // Only log high-rarity (4* and 5*) for the ticker! (｡♥‿♥｡)
            await GachaHistory_1.default.create({ userId, username, itemName, game, rarity });
        }
        catch (err) {
            logger.error(`MongoDB logGachaPull error:`, err);
        }
    }
    async removeGachaItem(userId, itemName) {
        const user = await this.getUser(userId);
        const existing = user.gacha_inventory.find((i) => i.name === itemName);
        if (existing) {
            existing.count--;
            if (existing.count <= 0) {
                user.gacha_inventory = user.gacha_inventory.filter((i) => i.name !== itemName);
            }
            await this.saveUser(user);
        }
    }
    async removeAnimal(userId, animalKey, rarity) {
        const user = await this.getUser(userId);
        const rarityMap = user.animals.get(rarity);
        if (rarityMap) {
            const count = rarityMap.get(animalKey);
            if (count && count > 0) {
                rarityMap.set(animalKey, count - 1);
                if (rarityMap.get(animalKey) <= 0) {
                    rarityMap.delete(animalKey);
                }
                user.markModified('animals');
                await this.saveUser(user);
            }
        }
    }
    async addGachaItem(userId, itemName) {
        const user = await this.getUser(userId);
        const item = registry.getItem(itemName);
        if (!item)
            return null;
        let existing = user.gacha_inventory.find((i) => i.name === itemName);
        if (item.type === 'item') {
            if (itemName === 'Star Dust') {
                user.star_dust = (user.star_dust || 0) + 1;
            }
            else if (itemName === 'Pokeball') {
                user.pokeballs = (user.pokeballs || 0) + 1;
            }
            else if (itemName === 'Ultraball') {
                user.ultraballs = (user.ultraballs || 0) + 1;
            }
            else if (itemName === 'Master Ball') {
                user.masterballs = (user.masterballs || 0) + 1;
            }
            // Items are now stored in dedicated fields, but we still return the item info
            await this.saveUser(user);
            return { ...item, count: 1, isNew: true };
        }
        else {
            // Characters only! (｡♥‿♥｡)
            if (existing) {
                existing.count = (existing.count || 1) + 1;
            }
            else {
                user.gacha_inventory.push({ name: itemName, type: 'character', ascension: 0, count: 1 });
            }
        }
        await this.saveUser(user);
        const updated = user.gacha_inventory.find((i) => i.name === itemName);
        return { ...item, ...updated.toObject(), isNew: !existing };
    }
    async getHydratedInventory(userId) {
        const user = await this.getUser(userId);
        return (user.gacha_inventory || [])
            .map((slim) => {
            const staticData = registry.getItem(slim.name);
            return staticData ? { ...staticData, ...slim.toObject() } : null;
        })
            .filter(Boolean);
    }
    async loadAnimals() {
        try {
            const animals = await AnimalRegistry_1.default.find({});
            const animalsData = {};
            animals.forEach((a) => {
                if (!animalsData[a.rarity])
                    animalsData[a.rarity] = {};
                animalsData[a.rarity][a.key] = {
                    name: a.name,
                    emoji: a.emoji,
                    value: a.value,
                };
            });
            return animalsData;
        }
        catch (error) {
            logger.error('Error loading animals data from MongoDB:', error);
            return {};
        }
    }
    /**
     * Returns a flat registry of all animals keyed by their unique key.
     * Perfect for finding animals whose rarity might have changed! (｡♥‿♥｡)
     */
    async getAnimalRegistry() {
        try {
            const animals = await AnimalRegistry_1.default.find({});
            const registry = {};
            animals.forEach((a) => {
                registry[a.key] = {
                    name: a.name,
                    emoji: a.emoji,
                    value: a.value,
                    rarity: a.rarity
                };
            });
            return registry;
        }
        catch (error) {
            logger.error('Error loading flat animal registry:', error);
            return {};
        }
    }
    async addAnimal(userId, animalKey, rarity) {
        // ── ATOMIC INCREMENT FIX (｡♥‿♥｡) ──────────────────────────────────
        // Uses Mongoose dot notation to $inc deep in the Map.
        // This ensures no race conditions overwrite the data!
        const updatePath = `animals.${rarity}.${animalKey}`;
        return await User_1.default.findOneAndUpdate({ id: userId }, {
            $inc: {
                [updatePath]: 1,
                'stats.totalAnimalsFound': 1
            }
        }, { upsert: true, returnDocument: 'after' });
    }
    async getUserAnimals(userId) {
        const user = await this.getUser(userId);
        return user.animals;
    }
    async addBooster(userId, type, multiplier, duration) {
        const user = await this.getUser(userId);
        if (!user.boosters)
            user.boosters = new Map();
        user.boosters.set(type, {
            multiplier: multiplier,
            expiresAt: Date.now() + duration,
        });
        user.markModified('boosters');
        await this.saveUser(user);
    }
    async getActiveBooster(userId, type) {
        const user = await this.getUser(userId);
        if (user.boosters && user.boosters.has(type)) {
            const booster = user.boosters.get(type);
            if (booster.expiresAt > Date.now()) {
                return booster;
            }
        }
        return null;
    }
    async getListeners() {
        const listeners = await Listener_1.default.find({});
        const map = {};
        listeners.forEach((l) => (map[l.adminId] = l.targetUserId));
        return map;
    }
    async saveListener(adminId, targetUserId) {
        if (!targetUserId) {
            await Listener_1.default.deleteOne({ adminId });
        }
        else {
            await Listener_1.default.findOneAndUpdate({ adminId }, { adminId, targetUserId }, { upsert: true });
        }
    }
    async getTalkTargets() {
        const targets = await TalkTarget_1.default.find({});
        const map = {};
        targets.forEach((t) => {
            map[t.adminId] = {
                channelId: t.channelId,
                serverId: t.serverId,
                setAt: t.setAt,
            };
        });
        return map;
    }
    async saveTalkTarget(adminId, channelId, serverId = 'DM') {
        if (!channelId) {
            await TalkTarget_1.default.deleteOne({ adminId });
        }
        else {
            await TalkTarget_1.default.findOneAndUpdate({ adminId }, {
                adminId,
                channelId,
                serverId,
                setAt: new Date(),
            }, { upsert: true });
        }
    }
    async getCharacterCard() {
        return await CharacterCard_1.default.findOne({ id: 'default' });
    }
    async updateCharacterCard(data) {
        return await CharacterCard_1.default.findOneAndUpdate({ id: 'default' }, { ...data, updatedAt: new Date() }, { upsert: true, returnDocument: 'after' });
    }
    async getGachaPool() {
        // Registry now returns both characters and items in getAllCharacters! (｡♥‿♥｡)
        const items = registry.getAllCharacters();
        const pool = {};
        const commonPool = { 3: [], 4: [], 5: [] };
        items.forEach((item) => {
            const rarityStr = item.rarity.toString();
            const itemPayload = {
                name: item.name,
                game: item.game,
                emoji: item.emoji,
                type: item.type,
                image_url: item.image_url,
            };
            if (item.game === 'common') {
                if (commonPool[rarityStr]) {
                    const isBoosted = item.name === 'Master Ball' || item.name === 'Ultraball';
                    const weight = isBoosted ? 20 : 1; // Super 20x boost! (｡♥‿♥｡)
                    for (let i = 0; i < weight; i++) {
                        commonPool[rarityStr].push(itemPayload);
                    }
                }
            }
            else {
                if (!pool[item.game])
                    pool[item.game] = { 3: [], 4: [], 5: [] };
                if (pool[item.game][rarityStr]) {
                    pool[item.game][rarityStr].push(itemPayload);
                }
            }
        });
        const gamesToAdd = ['genshin', 'hsr', 'wuwa', 'zzz'];
        gamesToAdd.forEach((game) => {
            if (!pool[game]) {
                pool[game] = { 3: [], 4: [], 5: [] };
            }
            // Add common items to this game's pool
            for (const rarity in commonPool) {
                pool[game][rarity].push(...commonPool[rarity]);
            }
        });
        return pool;
    }
    // ─── POKÉMON BATTLE SYSTEM ───────────────────────────────────────────
    /**
     * Train a Pokémon from the Zoo — consumes 1 from Zoo count and creates
     * an individual UserPokemon document with Level 1. (✧ω✧)
     */
    async trainPokemon(userId, speciesKey) {
        try {
            const user = await this.getUser(userId);
            if (!user || !user.animals)
                return { success: false, message: "You don't have any Pokémon yet! Go hunt some first. (・_・ヾ" };
            // Find the species in any rarity tier
            let foundRarity = null;
            const animalsMap = user.animals instanceof Map ? user.animals : new Map(Object.entries(user.animals));
            for (const [rarity, animals] of animalsMap.entries()) {
                const animalMap = animals instanceof Map ? animals : new Map(Object.entries(animals));
                const count = animalMap.get(speciesKey);
                if (count && count > 0) {
                    foundRarity = rarity;
                    break;
                }
            }
            if (!foundRarity) {
                return { success: false, message: `You don't have any **${speciesKey}** in your Zoo! (｡•́︿•̀｡)` };
            }
            // Consume 1 from Zoo count
            await this.removeAnimal(userId, speciesKey, foundRarity);
            // Create the individual UserPokemon document
            const pokemon = await UserPokemon_1.default.create({
                ownerId: userId,
                speciesKey: speciesKey,
                level: 1,
                exp: 0,
            });
            return { success: true, pokemon, rarity: foundRarity };
        }
        catch (err) {
            logger.error('trainPokemon error:', err);
            return { success: false, message: 'Something went wrong training that Pokémon... (ಥ﹏ಥ)' };
        }
    }
    /**
     * Get all individually trained Pokémon for a user.
     */
    async getTrainedPokemon(userId) {
        try {
            return await UserPokemon_1.default.find({ ownerId: userId }).sort({ level: -1 });
        }
        catch (err) {
            logger.error('getTrainedPokemon error:', err);
            return [];
        }
    }
    /**
     * Get the user's active Pokémon battle team (populated from refs).
     */
    async getPokemonTeam(userId) {
        try {
            const user = await User_1.default.findOne({ id: userId }).populate('pokemonTeam');
            if (!user || !user.pokemonTeam)
                return [];
            return user.pokemonTeam.filter(Boolean);
        }
        catch (err) {
            logger.error('getPokemonTeam error:', err);
            return [];
        }
    }
    /**
     * Set the user's Pokémon battle team (array of UserPokemon ObjectIds, max 3).
     */
    async setPokemonTeam(userId, pokemonIds) {
        try {
            const trimmed = pokemonIds.slice(0, 3);
            await User_1.default.findOneAndUpdate({ id: userId }, { $set: { pokemonTeam: trimmed } });
            return true;
        }
        catch (err) {
            logger.error('setPokemonTeam error:', err);
            return false;
        }
    }
    /**
     * Add XP to a specific UserPokemon and handle level-ups.
     * Level cap: 100.
     */
    async addPokemonExp(pokemonId, amount) {
        try {
            const pokemon = await UserPokemon_1.default.findById(pokemonId);
            if (!pokemon)
                return { leveledUp: false, newLevel: 0, pokemon: null };
            pokemon.exp += amount;
            let leveledUp = false;
            const getReq = (lvl) => lvl * 50 + lvl * lvl * 5;
            while (pokemon.level < 100 && pokemon.exp >= getReq(pokemon.level)) {
                pokemon.exp -= getReq(pokemon.level);
                pokemon.level++;
                leveledUp = true;
            }
            // Cap at level 100
            if (pokemon.level >= 100) {
                pokemon.level = 100;
                pokemon.exp = 0;
            }
            await pokemon.save();
            return { leveledUp, newLevel: pokemon.level, pokemon };
        }
        catch (err) {
            logger.error('addPokemonExp error:', err);
            return { leveledUp: false, newLevel: 0, pokemon: null };
        }
    }
}
module.exports = new DatabaseService();
