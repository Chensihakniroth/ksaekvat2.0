/**
 * ANIMAL SERVICE (Professional TypeScript Edition)
 * Centralized logic for animal collections, rarity checks, and net worth calculations.
 * (｡♥‿♥｡) Now with type-safety to ensure every animal is perfectly counted!
 */

import config from '../config/config.js';

interface ZooStats {
  totalAnimals: number;
  totalValue: number;
  rarityStats: Record<string, { count: number; value: number }>;
}

class AnimalService {
  /**
   * Calculate comprehensive stats for a user's animal collection.
   */
  public calculateZooStats(userAnimals: any, animalsData: any): ZooStats {
    let totalAnimals = 0;
    let totalValue = 0;
    let rarityStats: Record<string, { count: number; value: number }> = {};

    for (const rarity of Object.keys(config.hunting.rarities)) {
      rarityStats[rarity] = { count: 0, value: 0 };
    }

    const rarityEntries = userAnimals instanceof Map ? userAnimals.entries() : Object.entries(userAnimals);

    for (const [rarity, animals] of rarityEntries) {
      if (animalsData[rarity] && rarityStats[rarity]) {
        const animalEntries = animals instanceof Map ? animals.entries() : Object.entries(animals);
        for (const [animalKey, count] of animalEntries) {
          if (animalsData[rarity][animalKey]) {
            const val = animalsData[rarity][animalKey].value * (count as number);
            totalAnimals += (count as number);
            totalValue += val;
            rarityStats[rarity].count += (count as number);
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
  public calculateBadges(totalAnimalsFound: number, totalValue: number, userAnimals: any): string[] {
    const badges: string[] = [];
    if (totalAnimalsFound >= 100) badges.push('🦁 **Hunter**');
    if (totalAnimalsFound >= 500) badges.push('👑 **Master**');
    if (totalValue >= 1000000) badges.push('💰 **Tycoon**');

    const hasPriceless =
      userAnimals instanceof Map ? userAnimals.has('priceless') : userAnimals.priceless;
    if (hasPriceless) badges.push('🌟 **Legend**');

    const uniqueCount =
      userAnimals instanceof Map ? userAnimals.size : Object.keys(userAnimals).length;
    if (uniqueCount >= 10) badges.push('🌈 **Collector**');

    return badges;
  }
  private imageCache: Map<string, string> = new Map();

  /**
   * Fetch Pokémon images from PokeAPI.
   */
  public async getPokemonImage(key: string): Promise<string | null> {
    if (this.imageCache.has(key)) return this.imageCache.get(key) || null;

    try {
      let lookup = key.toLowerCase();
      let isShiny = false;

      if (lookup === 'shinycharizard') {
        lookup = 'charizard';
        isShiny = true;
      }
      if (lookup === 'missingno') {
        const url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/25.png'; // Pikachu back as placeholder or keep null
        return null; // Better to return null if no good MissingNo
      }

      // We have to use require('axios') inline or top-level. 
      // Top level is safer, but we can do it here for brevity if it's imported.
      const axios = require('axios');
      const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${lookup}`);
      
      let imageUrl = null;
      if (isShiny) {
        imageUrl = res.data?.sprites?.other?.['official-artwork']?.front_shiny || res.data?.sprites?.front_shiny || null;
      } else {
        imageUrl = res.data?.sprites?.other?.['official-artwork']?.front_default || res.data?.sprites?.front_default || null;
      }

      if (imageUrl) {
        this.imageCache.set(key, imageUrl);
      }
      return imageUrl;
    } catch (error: any) {
      console.error(`PokeAPI error for ${key}:`, error.message);
      return null;
    }
  }
}

const instance = new AnimalService();
export default instance;
