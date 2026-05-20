import User from '../models/User';
import type { IUser } from '../models/User';
import Listener from '../models/Listener';
import TalkTarget from '../models/TalkTarget';
import CharacterCard from '../models/CharacterCard';
import AnimalRegistry from '../models/AnimalRegistry';
import Character from '../models/Character'; 
import GachaHistory from '../models/GachaHistory';
import UserPokemon from '../models/UserPokemon';
import type { IUserPokemon } from '../models/UserPokemon';
import EconomyService from './EconomyService';
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
      throw err;
    }
  }

  async saveUser(user: any) {
    try {
      await user.save();
    } catch (err) {
      logger.error(`MongoDB saveUser error:`, err);
      throw err;
    }
  }

  async saveUserUpdate(userId: string, updatePayload: any) {
    try {
      return await User.findOneAndUpdate({ id: userId }, updatePayload, { returnDocument: 'after' });
    } catch (err) {
      logger.error(`MongoDB saveUserUpdate error:`, err);
      throw err;
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

    // Handle potential multi-level-up based on the now-incremented experience
    while (user.experience >= EconomyService.getLevelRequirement(user.level)) {
      user.experience -= EconomyService.getLevelRequirement(user.level);
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
      nextExp: EconomyService.getLevelRequirement(user.level),
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

  /**
   * Check if a user's level and experience are in sync with the current formula.
   * If they have enough XP to level up multiple times, it does so! (✧ω✧)
   */
  async syncLevel(userId: string) {
    const user = await User.findOne({ id: userId });
    if (!user) return null;

    let leveledUp = false;
    while (user.experience >= EconomyService.getLevelRequirement(user.level)) {
      user.experience -= EconomyService.getLevelRequirement(user.level);
      user.level++;
      leveledUp = true;
    }

    if (leveledUp) {
      await user.save();
    }
    return user;
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
    if (!user) return false;
    
    if (user.unlockedThemes && user.unlockedThemes.includes(themeId)) {
      if (!user.profileTheme) {
        user.profileTheme = { theme: themeId, favorites: [] };
      } else {
        user.profileTheme.theme = themeId;
      }
      user.markModified('profileTheme');
      await this.saveUser(user);
      return true;
    }
    return false;
  }

  async setFavorite(userId: string, type: 'character' | 'animal', name: string) {
    const user = await this.getUser(userId);
    if (!user) return false;

    if (!user.profileTheme) {
        user.profileTheme = { theme: 'default', favorites: [] };
    }
    
    if (!Array.isArray(user.profileTheme.favorites)) {
        user.profileTheme.favorites = [];
    }

    // Remove existing of same type to prevent duplicates (only 1 animal buddy allowed!)
    user.profileTheme.favorites = user.profileTheme.favorites.filter((f: any) => f.type !== type);
    
    // Add new one
    user.profileTheme.favorites.push({ type, name });
    
    user.markModified('profileTheme');
    await this.saveUser(user);
    return true;
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

  async hasBankBalance(userId: string, amount: number) {
    const user = await this.getUser(userId);
    return (user.bank || 0) >= amount;
  }

  async hasTotalBalance(userId: string, amount: number) {
    const user = await this.getUser(userId);
    return (user.balance || 0) + (user.bank || 0) >= amount;
  }

  async payWithAnyBalance(userId: string, amount: number) {
    const user = await User.findOne({ id: userId });
    if (!user) return false;
    
    if ((user.balance || 0) >= amount) {
      user.balance -= amount;
    } else {
      const remaining = amount - (user.balance || 0);
      user.balance = 0;
      user.bank = (user.bank || 0) - remaining;
    }
    await user.save();
    return true;
  }

  async deposit(userId: string, amount: number) {
    return await User.findOneAndUpdate(
      { id: userId },
      { 
        $inc: { 
          balance: -amount,
          bank: amount 
        } 
      },
      { returnDocument: 'after' }
    );
  }

  async withdraw(userId: string, amount: number) {
    return await User.findOneAndUpdate(
      { id: userId },
      { 
        $inc: { 
          balance: amount,
          bank: -amount 
        } 
      },
      { returnDocument: 'after' }
    );
  }

async updateStats(userId: string, type: string, amount = 1) {
     const update: any = {};
     if (type === 'won') update['stats.totalWon'] = amount;
     else if (type === 'lost') update['stats.totalLost'] = amount;
     else if (type === 'command') update['stats.commandsUsed'] = 1;
     else if (type === 'gambled') update['stats.totalGambled'] = amount;
     else update[`stats.${type}`] = amount;

    await User.findOneAndUpdate({ id: userId }, { $inc: update });
  }

  async logGachaPull(userId: string, username: string, itemName: string, game: string, rarity: number) {
    try {
      if (rarity < 4) return; // Only log high-rarity (4* and 5*) for the ticker! (｡♥‿♥｡)
      await GachaHistory.create({ userId, username, itemName, game, rarity });
    } catch (err) {
      logger.error(`MongoDB logGachaPull error:`, err);
    }
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

  // ─── POKÉMON BATTLE SYSTEM ───────────────────────────────────────────

  /**
   * Train a Pokémon from the Zoo — consumes 1 from Zoo count and creates
   * an individual UserPokemon document with Level 1. (✧ω✧)
   */
  async trainPokemon(userId: string, speciesKey: string): Promise<any> {
    try {
      const user = await this.getUser(userId);
      if (!user || !user.animals) return { success: false, message: "You don't have any Pokémon yet! Go hunt some first. (・_・ヾ" };

      // Find the species in any rarity tier
      let foundRarity: string | null = null;
      const animalsMap = user.animals instanceof Map ? user.animals : new Map(Object.entries(user.animals));

      for (const [rarity, animals] of animalsMap.entries()) {
        const animalMap = animals instanceof Map ? animals : new Map(Object.entries(animals as any));
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
      const pokemon = await UserPokemon.create({
        ownerId: userId,
        speciesKey: speciesKey,
        level: 1,
        exp: 0,
      });

      return { success: true, pokemon, rarity: foundRarity };
    } catch (err) {
      logger.error('trainPokemon error:', err);
      return { success: false, message: 'Something went wrong training that Pokémon... (ಥ﹏ಥ)' };
    }
  }

  /**
   * Get all individually trained Pokémon for a user.
   */
  async getTrainedPokemon(userId: string): Promise<IUserPokemon[]> {
    try {
      return await UserPokemon.find({ ownerId: userId }).sort({ level: -1 });
    } catch (err) {
      logger.error('getTrainedPokemon error:', err);
      return [];
    }
  }

  /**
   * Get the user's active Pokémon battle team (populated from refs).
   */
  async getPokemonTeam(userId: string): Promise<IUserPokemon[]> {
    try {
      const user = await User.findOne({ id: userId }).populate('pokemonTeam');
      if (!user || !user.pokemonTeam) return [];
      return user.pokemonTeam.filter(Boolean) as any[];
    } catch (err) {
      logger.error('getPokemonTeam error:', err);
      return [];
    }
  }

  /**
   * Set the user's Pokémon battle team (array of UserPokemon ObjectIds, max 3).
   */
  async setPokemonTeam(userId: string, pokemonIds: string[]): Promise<boolean> {
    try {
      const trimmed = pokemonIds.slice(0, 3);
      await User.findOneAndUpdate(
        { id: userId },
        { $set: { pokemonTeam: trimmed } }
      );
      return true;
    } catch (err) {
      logger.error('setPokemonTeam error:', err);
      return false;
    }
  }

  /**
   * Add XP to a specific UserPokemon and handle level-ups.
   * Level cap: 100.
   */
  async addPokemonExp(pokemonId: string, amount: number): Promise<{ leveledUp: boolean; newLevel: number; pokemon: IUserPokemon | null }> {
    try {
      const pokemon = await UserPokemon.findById(pokemonId);
      if (!pokemon) return { leveledUp: false, newLevel: 0, pokemon: null };

      pokemon.exp += amount;
      let leveledUp = false;

      const getReq = (lvl: number) => lvl * 50 + lvl * lvl * 5;

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
    } catch (err) {
      logger.error('addPokemonExp error:', err);
      return { leveledUp: false, newLevel: 0, pokemon: null };
    }
  }
}

module.exports = new DatabaseService();
