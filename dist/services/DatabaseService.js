"use strict";
const User = require('../models/User');
const Listener = require('../models/Listener');
const TalkTarget = require('../models/TalkTarget');
const CharacterCard = require('../models/CharacterCard');
const AnimalRegistry = require('../models/AnimalRegistry');
const Character = require('../models/Character'); // Changed from GachaItem
const registry = require('../utils/registry.js');
const logger = require('../utils/logger.js');
/**
 * DATABASE UTILITY (Gold Standard - MongoDB Edition)
 * Replaces JSON-based storage with high-performance MongoDB queries.
 */
class DatabaseService {
    async getUser(userId, username = null) {
        try {
            let user = await User.findOne({ id: userId });
            if (!user) {
                user = await User.create({ id: userId, username: username || 'Unknown Traveler' });
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
    async getAllUsers() {
        return await User.find({});
    }
    async addExperience(userId, amount) {
        const user = await this.getUser(userId);
        user.experience += amount;
        let leveledUp = false;
        const getReq = (lvl) => lvl < 5
            ? lvl * 100
            : lvl < 15
                ? Math.floor(500 * Math.pow(1.2, lvl - 5))
                : Math.floor(3000 * Math.pow(1.15, lvl - 15) + lvl * 200);
        while (user.experience >= getReq(user.level)) {
            user.experience -= getReq(user.level);
            user.level++;
            leveledUp = true;
        }
        await this.saveUser(user);
        return {
            leveledUp,
            newLevel: user.level,
            currentExp: user.experience,
            nextExp: getReq(user.level),
        };
    }
    async addBalance(userId, amount) {
        return await User.findOneAndUpdate({ id: userId }, { $inc: { balance: amount } }, { returnDocument: 'after', upsert: true });
    }
    async removeBalance(userId, amount) {
        return await User.findOneAndUpdate({ id: userId }, { $inc: { balance: -amount } }, { returnDocument: 'after' });
    }
    async hasBalance(userId, amount) {
        const user = await this.getUser(userId);
        return user.balance >= amount;
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
        await User.findOneAndUpdate({ id: userId }, { $inc: update });
    }
    async addGachaItem(userId, itemName) {
        const user = await this.getUser(userId);
        const item = registry.getItem(itemName);
        if (!item)
            return null;
        let existing = user.gacha_inventory.find((i) => i.name === itemName);
        if (item.type === 'weapon') {
            if (existing) {
                existing.count = (existing.count || 1) + 1;
            }
            else {
                user.gacha_inventory.push({ name: itemName, type: 'weapon', refinement: 1, count: 1 });
            }
        }
        else {
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
            const animals = await AnimalRegistry.find({});
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
    async addAnimal(userId, animalKey, rarity) {
        const user = await this.getUser(userId);
        if (!user.animals)
            user.animals = new Map();
        let rarityMap = user.animals.get(rarity);
        if (!rarityMap) {
            rarityMap = new Map();
            user.animals.set(rarity, rarityMap);
        }
        const currentCount = rarityMap.get(animalKey) || 0;
        rarityMap.set(animalKey, currentCount + 1);
        user.markModified('animals');
        await this.saveUser(user);
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
        const listeners = await Listener.find({});
        const map = {};
        listeners.forEach((l) => (map[l.adminId] = l.targetUserId));
        return map;
    }
    async saveListener(adminId, targetUserId) {
        if (!targetUserId) {
            await Listener.deleteOne({ adminId });
        }
        else {
            await Listener.findOneAndUpdate({ adminId }, { adminId, targetUserId }, { upsert: true });
        }
    }
    async getTalkTargets() {
        const targets = await TalkTarget.find({});
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
            await TalkTarget.deleteOne({ adminId });
        }
        else {
            await TalkTarget.findOneAndUpdate({ adminId }, {
                adminId,
                channelId,
                serverId,
                setAt: new Date(),
            }, { upsert: true });
        }
    }
    async getCharacterCard() {
        return await CharacterCard.findOne({ id: 'default' });
    }
    async updateCharacterCard(data) {
        return await CharacterCard.findOneAndUpdate({ id: 'default' }, { ...data, updatedAt: new Date() }, { upsert: true, new: true });
    }
    async getGachaPool() {
        const allChars = registry.getAllCharacters();
        const allWeapons = registry.getAllWeapons();
        const items = [...allChars, ...allWeapons];
        const pool = {};
        items.forEach((item) => {
            if (!pool[item.game])
                pool[item.game] = { 3: [], 4: [], 5: [] };
            const rarityStr = item.rarity.toString();
            if (pool[item.game][rarityStr]) {
                pool[item.game][rarityStr].push({
                    name: item.name,
                    game: item.game,
                    emoji: item.emoji,
                    image_url: item.image_url,
                });
            }
        });
        const genericWeapons = [
            { name: 'Sword', emoji: '⚔️', image_name: 'sword.webp' },
            { name: 'Claymore', emoji: '⚔️', image_name: 'claymore.webp' },
            { name: 'Bow', emoji: '🏹', image_name: 'bow.webp' },
            { name: 'Catalyst', emoji: '🔮', image_name: 'Catalyst.webp' },
            { name: 'Polearm', emoji: '⚔️', image_name: 'polearm.webp' },
        ];
        const gamesToAdd = ['genshin', 'hsr', 'wuwa'];
        const weaponBaseUrl = 'http://bucket-production-4ca0.up.railway.app/gacha-images/common';
        gamesToAdd.forEach((game) => {
            if (!pool[game]) {
                pool[game] = { 3: [], 4: [], 5: [] };
            }
            genericWeapons.forEach((weapon) => {
                const exists = pool[game]['3'].some((w) => w.name === weapon.name);
                if (!exists) {
                    pool[game]['3'].push({
                        name: weapon.name,
                        game: game,
                        rarity: 3,
                        emoji: weapon.emoji,
                        image_url: `${weaponBaseUrl}/${weapon.image_name}`,
                    });
                }
            });
        });
        return pool;
    }
}
module.exports = new DatabaseService();
