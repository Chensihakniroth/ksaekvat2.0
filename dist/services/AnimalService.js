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
// Due to how some TS/node environments resolve default exports from commonjs
// packages, we might need `.default` if it's nested.
const PokedexClass = pokedex_promise_v2_1.default.default || pokedex_promise_v2_1.default;
const P = new PokedexClass(); // Includes built-in auto-caching
class AnimalService {
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
     * Fetch Pokémon images using Pokedex Promise v2 (Auto-cached)
     */
    async getPokemonImage(key) {
        if (this.imageCache.has(key))
            return this.imageCache.get(key) || null;
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
            const pokemon = await P.getPokemonByName(lookup);
            let imageUrl = null;
            if (isShiny) {
                imageUrl = pokemon.sprites?.other?.['official-artwork']?.front_shiny || pokemon.sprites?.front_shiny || null;
            }
            else {
                imageUrl = pokemon.sprites?.other?.['official-artwork']?.front_default || pokemon.sprites?.front_default || null;
            }
            if (imageUrl) {
                this.imageCache.set(key, imageUrl);
            }
            return imageUrl;
        }
        catch (error) {
            console.error(`Pokedex Promise v2 error for ${key}:`, error.message);
            return null;
        }
    }
    spriteCache = new Map();
    /**
     * Fetch Pokémon tiny pixel sprite for PC Box style UI (Auto-cached)
     */
    async getPokemonSprite(key) {
        if (this.spriteCache.has(key))
            return this.spriteCache.get(key) || null;
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
            const pokemon = await P.getPokemonByName(lookup);
            let spriteUrl = null;
            if (isShiny) {
                spriteUrl = pokemon.sprites?.front_shiny || null;
            }
            else {
                // Prefer gen8 icons for the literal perfectly sized PC Box icons, fallback to standard front_default 
                const gen8icons = pokemon.sprites?.versions?.['generation-viii']?.icons;
                spriteUrl = gen8icons?.front_default || pokemon.sprites?.front_default || null;
            }
            if (spriteUrl) {
                this.spriteCache.set(key, spriteUrl);
            }
            return spriteUrl;
        }
        catch (error) {
            console.error(`Pokedex Promise v2 sprite error for ${key}:`, error.message);
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
