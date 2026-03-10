const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const AnimalRegistry = require('../models/AnimalRegistry').default || require('../models/AnimalRegistry'); // Assuming we can use the JS jumper

const pokemonList = [
    // COMMON
    { rarity: 'common', key: 'pidgey', name: 'Pidgey', emoji: '🐦', value: 100 },
    { rarity: 'common', key: 'rattata', name: 'Rattata', emoji: '🐀', value: 100 },
    { rarity: 'common', key: 'caterpie', name: 'Caterpie', emoji: '🐛', value: 100 },
    { rarity: 'common', key: 'weedle', name: 'Weedle', emoji: '🐛', value: 100 },
    { rarity: 'common', key: 'zubat', name: 'Zubat', emoji: '🦇', value: 100 },
    { rarity: 'common', key: 'magikarp', name: 'Magikarp', emoji: '🐟', value: 100 },

    // UNCOMMON
    { rarity: 'uncommon', key: 'pikachu', name: 'Pikachu', emoji: '⚡', value: 500 },
    { rarity: 'uncommon', key: 'charmander', name: 'Charmander', emoji: '🔥', value: 500 },
    { rarity: 'uncommon', key: 'squirtle', name: 'Squirtle', emoji: '💧', value: 500 },
    { rarity: 'uncommon', key: 'bulbasaur', name: 'Bulbasaur', emoji: '🍃', value: 500 },
    { rarity: 'uncommon', key: 'jigglypuff', name: 'Jigglypuff', emoji: '🎤', value: 500 },
    { rarity: 'uncommon', key: 'meowth', name: 'Meowth', emoji: '🐱', value: 500 },

    // RARE
    { rarity: 'rare', key: 'eevee', name: 'Eevee', emoji: '🦊', value: 1500 },
    { rarity: 'rare', key: 'snorlax', name: 'Snorlax', emoji: '🐻', value: 1500 },
    { rarity: 'rare', key: 'lapras', name: 'Lapras', emoji: '🦕', value: 1500 },
    { rarity: 'rare', key: 'gyarados', name: 'Gyarados', emoji: '🐉', value: 1500 },
    { rarity: 'rare', key: 'growlithe', name: 'Growlithe', emoji: '🐕', value: 1500 },
    { rarity: 'rare', key: 'vulpix', name: 'Vulpix', emoji: '🦊', value: 1500 },

    // EPIC
    { rarity: 'epic', key: 'dragonite', name: 'Dragonite', emoji: '🐲', value: 5000 },
    { rarity: 'epic', key: 'aerodactyl', name: 'Aerodactyl', emoji: '🦖', value: 5000 },
    { rarity: 'epic', key: 'gengar', name: 'Gengar', emoji: '👻', value: 5000 },
    { rarity: 'epic', key: 'alakazam', name: 'Alakazam', emoji: '🥄', value: 5000 },

    // LEGENDARY
    { rarity: 'legendary', key: 'articuno', name: 'Articuno', emoji: '❄️', value: 15000 },
    { rarity: 'legendary', key: 'zapdos', name: 'Zapdos', emoji: '⚡', value: 15000 },
    { rarity: 'legendary', key: 'moltres', name: 'Moltres', emoji: '🔥', value: 15000 },

    // MYTHICAL
    { rarity: 'mythical', key: 'mewtwo', name: 'Mewtwo', emoji: '🧠', value: 50000 },
    { rarity: 'mythical', key: 'mew', name: 'Mew', emoji: '🌟', value: 50000 },

    // PRICELESS
    { rarity: 'priceless', key: 'missingno', name: 'MissingNo.', emoji: '🔲', value: 100000 },
    { rarity: 'priceless', key: 'shinycharizard', name: 'Shiny Charizard', emoji: '✨🔥', value: 100000 }
];

async function seedPokemon() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to MongoDB');

        await AnimalRegistry.deleteMany({});
        console.log('Cleared existing animals.');

        await AnimalRegistry.insertMany(pokemonList);
        console.log('Successfully inserted Gen 1 Pokemon!');

        mongoose.connection.close();
    } catch (err) {
        console.error('Error seeding data:', err);
    }
}

seedPokemon();
