"use strict";
/**
 * ANIMAL SERVICE (Professional TypeScript Edition)
 * Centralized logic for animal collections, rarity checks, and net worth calculations.
 * (｡♥‿♥｡) Now with type-safety to ensure every animal is perfectly counted!
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_js_1 = __importDefault(require("../config/config.js"));
const pokedex_promise_v2_1 = __importDefault(require("pokedex-promise-v2"));
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Due to how some TS/node environments resolve default exports from commonjs
// packages, we might need `.default` if it's nested.
const PokedexClass = pokedex_promise_v2_1.default.default || pokedex_promise_v2_1.default;
const P = new PokedexClass(); // Includes built-in auto-caching
class AnimalService {
    /**
     * Fetch Pokémon image buffer directly from Pokémon Fandom Wiki (｡♥‿♥｡)
     * This is used to bypass hotlinking restrictions by proxying through the bot.
     */
    async getPokemonImageBuffer(key) {
        const url = await this.getPokemonImage(key);
        if (!url)
            return null;
        try {
            // If it's a local path, read from disk
            if (!url.startsWith('http')) {
                const fullPath = path_1.default.isAbsolute(url) ? url : path_1.default.join(process.cwd(), url);
                if (fs_1.default.existsSync(fullPath)) {
                    return { buffer: fs_1.default.readFileSync(fullPath), fileName: path_1.default.basename(fullPath) };
                }
                return null;
            }
            const response = await axios_1.default.get(url, {
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
                    'Referer': 'https://pokemon.fandom.com/'
                }
            });
            const fileName = `${key}_${Date.now()}.png`;
            return { buffer: Buffer.from(response.data), fileName };
        }
        catch (error) {
            console.error(`Failed to fetch image buffer for ${key}:`, error.message);
            return null;
        }
    }
    /**
     * Calculate comprehensive stats for a user's animal collection.
     */
    calculateZooStats(userAnimals, animalsData) {
        let totalAnimals = 0;
        let totalValue = 0;
        let rarityStats = {};
        for (const rarity of Object.keys(config_js_1.default.hunting.rarities)) {
            rarityStats[rarity] = { count: 0, value: 0 };
        }
        const rarityEntries = userAnimals instanceof Map ? userAnimals.entries() : Object.entries(userAnimals);
        for (const [rarity, animals] of rarityEntries) {
            if (animalsData[rarity] && rarityStats[rarity]) {
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
        if (totalAnimalsFound >= 100)
            badges.push('🦁 **Hunter**');
        if (totalAnimalsFound >= 500)
            badges.push('👑 **Master**');
        if (totalValue >= 1000000)
            badges.push('💰 **Tycoon**');
        const hasPriceless = userAnimals instanceof Map ? userAnimals.has('priceless') : userAnimals.priceless;
        if (hasPriceless)
            badges.push('🌟 **Legend**');
        const uniqueCount = userAnimals instanceof Map ? userAnimals.size : Object.keys(userAnimals).length;
        if (uniqueCount >= 10)
            badges.push('🌈 **Collector**');
        return badges;
    }
    imageCache = new Map();
    /**
     * Fetch Pokémon images using PokeAPI GitHub (100% Reliable!) (｡♥‿♥｡)
     */
    async getPokemonImage(key) {
        if (this.imageCache.has(key))
            return this.imageCache.get(key) || null;
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
            const pokemon = await P.getPokemonByName(lookup);
            const id = pokemon.id;
            // Construct high-quality GitHub URL
            const baseUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork';
            const url = isShiny
                ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`
                : `${baseUrl}/${id}.png`;
            this.imageCache.set(key, url);
            return url;
        }
        catch (error) {
            console.error(`Failed to resolve Pokemon image for ${key}:`, error.message);
            return null;
        }
    }
    spriteCache = new Map();
    /**
     * Fetch Pokémon sprites for PC Box style UI using PokeAPI GitHub (｡♥‿♥｡)
     */
    async getPokemonSprite(key) {
        if (this.spriteCache.has(key))
            return this.spriteCache.get(key) || null;
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
            const pokemon = await P.getPokemonByName(lookup);
            const id = pokemon.id;
            // Use generation-viii icons for perfect PC Box style
            const url = isShiny
                ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`
                : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/${id}.png`;
            this.spriteCache.set(key, url);
            return url;
        }
        catch (error) {
            console.error(`Failed to resolve Pokemon sprite for ${key}:`, error.message);
            return null;
        }
    }
    kantoDexCache = null;
    /**
     * Fetch Kanto (Red/Blue Version) Pokedex entries.
     * Caches results so it only hits the API once.
     */
    async getKantoPokedexEntries() {
        if (this.kantoDexCache)
            return this.kantoDexCache;
        try {
            // id 2 is the classic Kanto pokedex used in Red/Blue
            const dex = await P.getPokedexByName('kanto');
            const kantoNames = new Set();
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
        }
        catch (error) {
            console.error('Failed to load Kanto Pokedex:', error.message);
            return new Set();
        }
    }
}
const instance = new AnimalService();
exports.default = instance;
