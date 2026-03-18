/**
 * ANIMAL SERVICE (Professional TypeScript Edition)
 * Centralized logic for animal collections, rarity checks, and net worth calculations.
 * (｡♥‿♥｡) Now with type-safety to ensure every animal is perfectly counted!
 */

import config from '../config/config.js';
import Pokedex from 'pokedex-promise-v2';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

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
   * Fetch Pokémon image buffer directly from PokeAPI GitHub (｡♥‿♥｡)
   * Includes local file caching to make Khunt and Kzoo super fast!
   */
  public async getPokemonImageBuffer(key: string): Promise<{ buffer: Buffer, fileName: string } | null> {
    const CACHE_DIR = path.join(process.cwd(), '.tmp', 'pokemon_cache');
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

    const localPath = path.join(CACHE_DIR, `${key}_full.png`);
    
    // 1. Check local cache first! (•̀ᴗ•́)و
    if (fs.existsSync(localPath)) {
      return { buffer: fs.readFileSync(localPath), fileName: `${key}.png` };
    }

    const url = await this.getPokemonImage(key);
    if (!url) return null;

    try {
      // If it's a local path (non-http), read from disk
      if (!url.startsWith('http')) {
        const fullPath = path.isAbsolute(url) ? url : path.join(process.cwd(), url);
        if (fs.existsSync(fullPath)) {
          return { buffer: fs.readFileSync(fullPath), fileName: path.basename(fullPath) };
        }
        return null;
      }

      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        }
      });

      const buffer = Buffer.from(response.data);
      // Save to cache for next time! (｡♥‿♥｡)
      fs.writeFileSync(localPath, buffer);

      return { buffer, fileName: `${key}.png` };
    } catch (error: any) {
      console.error(`Failed to fetch image buffer for ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Get a sprite buffer with local caching for Kzoo optimization.
   */
  public async getPokemonSpriteBuffer(key: string): Promise<Buffer | null> {
    const CACHE_DIR = path.join(process.cwd(), '.tmp', 'pokemon_cache');
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

    const localPath = path.join(CACHE_DIR, `${key}_sprite.png`);
    
    if (fs.existsSync(localPath)) {
      return fs.readFileSync(localPath);
    }

    const url = await this.getPokemonSprite(key);
    if (!url) return null;

    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      const buffer = Buffer.from(response.data);
      fs.writeFileSync(localPath, buffer);
      return buffer;
    } catch (error: any) {
      return null;
    }
  }

  /**
   * Get a RESIZED sprite buffer with local DISK caching.
   * Extremely important for Kzoo performance! (｡♥‿♥｡)
   */
  public async getResizedSpriteBuffer(key: string, size: number): Promise<Buffer | null> {
    const CACHE_DIR = path.join(process.cwd(), '.tmp', 'pokemon_cache', 'resized');
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

    const localPath = path.join(CACHE_DIR, `${key}_${size}.png`);

    // 1. Check disk cache first
    if (fs.existsSync(localPath)) {
      return fs.readFileSync(localPath);
    }

    // 2. Fetch original sprite
    const originalBuffer = await this.getPokemonSpriteBuffer(key);
    if (!originalBuffer) return null;

    try {
      // 3. Resize using Sharp
      const sharp = require('sharp');
      const resized = await sharp(originalBuffer)
        .resize(size, size, { 
          fit: 'contain', 
          background: { r: 0, g: 0, b: 0, alpha: 0 },
          kernel: 'nearest' 
        })
        .toBuffer();

      // 4. Save to cache
      fs.writeFileSync(localPath, resized);
      return resized;
    } catch (error: any) {
      console.error(`Failed to resize sprite for ${key}:`, error.message);
      return null;
    }
  }

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
   * Fetch Pokémon images using PokeAPI GitHub (100% Reliable!) (｡♥‿♥｡)
   */
  public async getPokemonImage(key: string): Promise<string | null> {
    if (this.imageCache.has(key)) return this.imageCache.get(key) || null;

    let lookup = key.toLowerCase();
    
    if (lookup === 'missingno') {
      const url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/25.png'; // Classic Backward Pikachu! (｡♥‿♥｡)
      this.imageCache.set(key, url);
      return url;
    }

    try {
      let isShiny = false;
      if (lookup === 'shinycharizard') {
        lookup = 'charizard';
        isShiny = true;
      }

      // Resolve ID using the cached Pokedex library
      const pokemon = await P.getPokemonByName(lookup as any);
      const id = pokemon.id;

      // Construct high-quality GitHub URL
      const baseUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork';
      const url = isShiny 
        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`
        : `${baseUrl}/${id}.png`;

      this.imageCache.set(key, url);
      return url;
    } catch (error: any) {
      console.error(`Failed to resolve Pokemon image for ${key}:`, error.message);
      return null;
    }
  }

  private spriteCache: Map<string, string> = new Map();

  /**
   * Fetch Pokémon sprites for PC Box style UI using PokeAPI GitHub (｡♥‿♥｡)
   */
  public async getPokemonSprite(key: string): Promise<string | null> {
    if (this.spriteCache.has(key)) return this.spriteCache.get(key) || null;

    let lookup = key.toLowerCase();
    
    if (lookup === 'missingno') {
      const url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/25.png';
      this.spriteCache.set(key, url);
      return url;
    }

    try {
      let isShiny = false;
      if (lookup === 'shinycharizard') {
        lookup = 'charizard';
        isShiny = true;
      }

      const pokemon = await P.getPokemonByName(lookup as any);
      const id = pokemon.id;

      // Use generation-viii icons for perfect PC Box style
      const url = isShiny
        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`
        : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/${id}.png`;

      this.spriteCache.set(key, url);
      return url;
    } catch (error: any) {
      console.error(`Failed to resolve Pokemon sprite for ${key}:`, error.message);
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
