import User from '../models/User';
import type { IUser } from '../models/User';
import Listener from '../models/Listener';
import TalkTarget from '../models/TalkTarget';
import CharacterCard from '../models/CharacterCard';
import AnimalRegistry from '../models/AnimalRegistry';
import Character from '../models/Character'; // Changed from GachaItem
const registry = require('../utils/registry.js');
const logger = require('../utils/logger.js');

/**
 * DATABASE UTILITY (Gold Standard - MongoDB Edition)
 * Replaces JSON-based storage with high-performance MongoDB queries.
 */

class DatabaseService {
  async getUser(userId: string, username: string | null = null): Promise<any> {
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

  async saveUser(user: any) {
    try {
      await user.save();
    } catch (err) {
      logger.error(`MongoDB saveUser error:`, err);
    }
  }

  async saveUserUpdate(userId: string, updatePayload: any) {
    try {
      return await User.findOneAndUpdate({ id: userId }, updatePayload, { returnDocument: 'after' });
    } catch (err) {
      logger.error(`MongoDB saveUserUpdate error:`, err);
      return null;
    }
  }

  async getAllUsers() {
    return await User.find({});
  }

  async addExperience(userId: string, amount: number) {
    // ── First atomic XP boost ───────────────────────────────────────────
    const user = await User.findOneAndUpdate(
      { id: userId },
      { $inc: { experience: amount } },
      { returnDocument: 'after', upsert: true }
    );

    let leveledUp = false;
    const getReq = (lvl: number) =>
      lvl < 5
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

  async addBalance(userId: string, amount: number) {
    return await User.findOneAndUpdate(
      { id: userId },
      { $inc: { balance: amount } },
      { returnDocument: 'after', upsert: true }
    );
  }

  async addPokeball(userId: string, type: string, amount = 1) {
    const field = type === 'pokeball' ? 'pokeballs' : type === 'ultraball' ? 'ultraballs' : 'masterballs';
    return await User.findOneAndUpdate(
      { id: userId },
      { $inc: { [field]: amount } },
      { returnDocument: 'after', upsert: true }
    );
  }

  async setPokeball(userId: string, type: string) {
    const user = await this.getUser(userId);
    const field = type === 'pokeball' ? 'pokeballs' : type === 'ultraball' ? 'ultraballs' : 'masterballs';
    
    if (!user[field as keyof IUser] || (user[field as keyof IUser] as number) <= 0) {
      return { success: false, message: `You don't have any ${type}s, darling! (｡•́︿•̀｡)` };
    }

    // Consume 1 ball
    (user[field as keyof IUser] as number)--;

    if (!user.boosters) user.boosters = new Map();
    
    // Set one-time-use flag
    user.boosters.set(type, {
      active: true,
      oneTime: true
    });

    user.markModified('boosters');
    await this.saveUser(user);
    return { success: true };
  }

  async clearOneTimeBall(userId: string, type: string) {
    return await User.findOneAndUpdate(
      { id: userId },
      { $unset: { [`boosters.${type}`]: "" } },
      { returnDocument: 'after' }
    );
  }

  async addItem(userId: string, itemName: string, amount = 1) {
    const user = await this.getUser(userId);
    if (!user.inventory) user.inventory = [];

    const existing = user.inventory.find((i: any) => i.name === itemName);
    if (existing) {
      existing.count += amount;
    } else {
      user.inventory.push({ name: itemName, count: amount });
    }

    user.markModified('inventory');
    await this.saveUser(user);
  }

  async unlockTheme(userId: string, themeId: string) {
    const user = await this.getUser(userId);
    if (!user.unlockedThemes) user.unlockedThemes = ['default'];
    
    if (!user.unlockedThemes.includes(themeId)) {
      user.unlockedThemes.push(themeId);
      user.markModified('unlockedThemes');
      await this.saveUser(user);
      return true;
    }
    return false;
  }

  async setTheme(userId: string, themeId: string) {
    const user = await this.getUser(userId);
    if (user.unlockedThemes && user.unlockedThemes.includes(themeId)) {
      user.profileTheme = themeId;
      await this.saveUser(user);
      return true;
    }
    return false;
  }

  async removeBalance(userId: string, amount: number) {
    return await User.findOneAndUpdate(
      { id: userId },
      { $inc: { balance: -amount } },
      { returnDocument: 'after' }
    );
  }

  async removeStarDust(userId: string, amount: number) {
    return await User.findOneAndUpdate(
      { id: userId },
      { $inc: { star_dust: -amount } },
      { returnDocument: 'after' }
    );
  }

  async hasBalance(userId: string, amount: number) {
    const user = await this.getUser(userId);
    return user.balance >= amount;
  }

  async updateStats(userId: string, type: string, amount = 1) {
    const update: any = {};
    if (type === 'won') update['stats.totalWon'] = 1;
    else if (type === 'lost') update['stats.totalLost'] = 1;
    else if (type === 'command') update['stats.commandsUsed'] = 1;
    else update[`stats.${type}`] = amount;

    await User.findOneAndUpdate({ id: userId }, { $inc: update });
  }

  async removeGachaItem(userId: string, itemName: string) {
    const user = await this.getUser(userId);
    const existing = user.gacha_inventory.find((i: any) => i.name === itemName);
    if (existing) {
      existing.count--;
      if (existing.count <= 0) {
        user.gacha_inventory = user.gacha_inventory.filter((i: any) => i.name !== itemName);
      }
      await this.saveUser(user);
    }
  }

  async removeAnimal(userId: string, animalKey: string, rarity: string) {
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

  async addGachaItem(userId: string, itemName: string) {
    const user = await this.getUser(userId);
    const item = registry.getItem(itemName);
    if (!item) return null;

    let existing = user.gacha_inventory.find((i: any) => i.name === itemName);

    if (item.type === 'item') {
      if (itemName === 'Star Dust') {
        user.star_dust = (user.star_dust || 0) + 1;
      } else if (itemName === 'Pokeball') {
        user.pokeballs = (user.pokeballs || 0) + 1;
      } else if (itemName === 'Ultraball') {
        user.ultraballs = (user.ultraballs || 0) + 1;
      } else if (itemName === 'Master Ball') {
        user.masterballs = (user.masterballs || 0) + 1;
      }
      
      // Items are now stored in dedicated fields, but we still return the item info
      await this.saveUser(user);
      return { ...item, count: 1, isNew: true };
    } else {
      // Characters only! (｡♥‿♥｡)
      if (existing) {
        existing.count = (existing.count || 1) + 1;
      } else {
        user.gacha_inventory.push({ name: itemName, type: 'character', ascension: 0, count: 1 });
      }
    }

    await this.saveUser(user);
    const updated = user.gacha_inventory.find((i: any) => i.name === itemName);
    return { ...item, ...updated.toObject(), isNew: !existing };
  }

  async getHydratedInventory(userId: string) {
    const user = await this.getUser(userId);
    return (user.gacha_inventory || [])
      .map((slim: any) => {
        const staticData = registry.getItem(slim.name);
        return staticData ? { ...staticData, ...slim.toObject() } : null;
      })
      .filter(Boolean);
  }

  async loadAnimals() {
    try {
      const animals = await AnimalRegistry.find({});
      const animalsData: any = {};
      animals.forEach((a: any) => {
        if (!animalsData[a.rarity]) animalsData[a.rarity] = {};
        animalsData[a.rarity][a.key] = {
          name: a.name,
          emoji: a.emoji,
          value: a.value,
        };
      });
      return animalsData;
    } catch (error) {
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
      const animals = await AnimalRegistry.find({});
      const registry: any = {};
      animals.forEach((a: any) => {
        registry[a.key] = {
          name: a.name,
          emoji: a.emoji,
          value: a.value,
          rarity: a.rarity
        };
      });
      return registry;
    } catch (error) {
      logger.error('Error loading flat animal registry:', error);
      return {};
    }
  }

  async addAnimal(userId: string, animalKey: string, rarity: string) {
    // ── ATOMIC INCREMENT FIX (｡♥‿♥｡) ──────────────────────────────────
    // Uses Mongoose dot notation to $inc deep in the Map.
    // This ensures no race conditions overwrite the data!
    const updatePath = `animals.${rarity}.${animalKey}`;
    return await User.findOneAndUpdate(
      { id: userId },
      { 
        $inc: { 
          [updatePath]: 1,
          'stats.totalAnimalsFound': 1 
        } 
      },
      { upsert: true, returnDocument: 'after' }
    );
  }

  async getUserAnimals(userId: string) {
    const user = await this.getUser(userId);
    return user.animals;
  }

  async addBooster(userId: string, type: string, multiplier: number, duration: number) {
    const user = await this.getUser(userId);
    if (!user.boosters) user.boosters = new Map();

    user.boosters.set(type, {
      multiplier: multiplier,
      expiresAt: Date.now() + duration,
    });

    user.markModified('boosters');
    await this.saveUser(user);
  }


  async getActiveBooster(userId: string, type: string) {
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
    const map: any = {};
    listeners.forEach((l: any) => (map[l.adminId] = l.targetUserId));
    return map;
  }

  async saveListener(adminId: string, targetUserId: string) {
    if (!targetUserId) {
      await Listener.deleteOne({ adminId });
    } else {
      await Listener.findOneAndUpdate({ adminId }, { adminId, targetUserId }, { upsert: true });
    }
  }

  async getTalkTargets() {
    const targets = await TalkTarget.find({});
    const map: any = {};
    targets.forEach((t: any) => {
      map[t.adminId] = {
        channelId: t.channelId,
        serverId: t.serverId,
        setAt: t.setAt,
      };
    });
    return map;
  }

  async saveTalkTarget(adminId: string, channelId: string, serverId = 'DM') {
    if (!channelId) {
      await TalkTarget.deleteOne({ adminId });
    } else {
      await TalkTarget.findOneAndUpdate(
        { adminId },
        {
          adminId,
          channelId,
          serverId,
          setAt: new Date(),
        },
        { upsert: true }
      );
    }
  }

  async getCharacterCard() {
    return await CharacterCard.findOne({ id: 'default' });
  }

  async updateCharacterCard(data: any) {
    return await CharacterCard.findOneAndUpdate(
      { id: 'default' },
      { ...data, updatedAt: new Date() },
      { upsert: true, returnDocument: 'after' }
    );
  }

  async getGachaPool() {
    // Registry now returns both characters and items in getAllCharacters! (｡♥‿♥｡)
    const items = registry.getAllCharacters();

    const pool: any = {};
    const commonPool: any = { 3: [], 4: [], 5: [] };

    items.forEach((item: any) => {
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
      } else {
        if (!pool[item.game]) pool[item.game] = { 3: [], 4: [], 5: [] };
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
}

module.exports = new DatabaseService();
