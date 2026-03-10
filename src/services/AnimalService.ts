/**
 * ANIMAL SERVICE (Professional TypeScript Edition)
 * Centralized logic for animal collections, rarity checks, and net worth calculations.
 * (｡♥‿♥｡) Now with type-safety to ensure every animal is perfectly counted!
 */

import config from '../config/config.js';
import Pokedex from 'pokedex-promise-v2';

// Due to how some TS/node environments resolve default exports from commonjs
// packages, we might need `.default` if it's nested.
const PokedexClass = (Pokedex as any).default || Pokedex;
const P = new PokedexClass(); // Includes built-in auto-caching


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
   * Fetch Pokémon images using Pokedex Promise v2 (Auto-cached)
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
        return null;
      }

      // Automatically cached by pokedex-promise-v2!
      const pokemon = await P.getPokemonByName(lookup as any);
      
      let imageUrl: string | null = null;
      if (isShiny) {
        imageUrl = (pokemon.sprites?.other?.['official-artwork']?.front_shiny as string | undefined) || (pokemon.sprites?.front_shiny as string | undefined) || null;
      } else {
        imageUrl = (pokemon.sprites?.other?.['official-artwork']?.front_default as string | undefined) || (pokemon.sprites?.front_default as string | undefined) || null;
      }

      if (imageUrl) {
        this.imageCache.set(key, imageUrl);
      }
      return imageUrl;
    } catch (error: any) {
      console.error(`Pokedex Promise v2 error for ${key}:`, error.message);
      return null;
    }
  }

  private spriteCache: Map<string, string> = new Map();

  /**
   * Fetch Pokémon tiny pixel sprite for PC Box style UI (Auto-cached)
   */
  public async getPokemonSprite(key: string): Promise<string | null> {
    if (this.spriteCache.has(key)) return this.spriteCache.get(key) || null;

    try {
      let lookup = key.toLowerCase();
      let isShiny = false;

      if (lookup === 'shinycharizard') {
        lookup = 'charizard';
        isShiny = true;
      }
      if (lookup === 'missingno') {
         return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/25.png'; // tiny placeholder
      }

      const pokemon = await P.getPokemonByName(lookup as any);
      
      let spriteUrl: string | null = null;
      if (isShiny) {
         spriteUrl = pokemon.sprites?.front_shiny as string | undefined || null;
      } else {
         // Prefer gen8 icons for the literal perfectly sized PC Box icons, fallback to standard front_default 
         const gen8icons = pokemon.sprites?.versions?.['generation-viii']?.icons;
         spriteUrl = (gen8icons?.front_default as string | undefined) || (pokemon.sprites?.front_default as string | undefined) || null;
      }

      if (spriteUrl) {
        this.spriteCache.set(key, spriteUrl);
      }
      return spriteUrl;
    } catch (error: any) {
      console.error(`Pokedex Promise v2 sprite error for ${key}:`, error.message);
      return null;
    }
  }

  private kantoDexCache: Set<string> | null = null;

  /**
   * Fetch Kanto (Red/Blue Version) Pokedex entries.
   * Caches results so it only hits the API once.
   */
  public async getKantoPokedexEntries(): Promise<Set<string>> {
    if (this.kantoDexCache) return this.kantoDexCache;

    try {
      // id 2 is the classic Kanto pokedex used in Red/Blue
      const dex = await P.getPokedexByName('kanto');
      const kantoNames = new Set<string>();
      
      if (dex && dex.pokemon_entries) {
        for (const entry of dex.pokemon_entries) {
          if (entry.pokemon_species && entry.pokemon_species.name) {
            kantoNames.add(entry.pokemon_species.name.toLowerCase());
          }
        }
      }
      
      // Also add known manual overrides just in case (e.g. charizard being shiny)
      kantoNames.add('shinycharizard');
      kantoNames.add('missingno');

      this.kantoDexCache = kantoNames;
      return kantoNames;
    } catch (error: any) {
      console.error('Failed to load Kanto Pokedex:', error.message);
      return new Set();
    }
  }
}

const instance = new AnimalService();
export default instance;
