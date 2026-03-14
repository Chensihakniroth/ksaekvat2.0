"use strict";
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const AnimalRegistry = require('../models/AnimalRegistry').default || require('../models/AnimalRegistry');
const config = require('../config/config.js');
async function seedPokemon() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ Connected to MongoDB.');
        // Load the generated Gen 1 list
        const gen1Data = JSON.parse(fs.readFileSync(path.join(__dirname, '../../gen1_pokemon.json'), 'utf8'));
        // Prepare the final list with values from config
        const finalPokemonList = gen1Data.map(pokemon => {
            const rarityInfo = config.hunting.rarities[pokemon.rarity];
            return {
                ...pokemon,
                value: pokemon.value || (rarityInfo ? rarityInfo.value : 100)
            };
        });
        console.log(`Clearing existing ${await AnimalRegistry.countDocuments()} animals...`);
        await AnimalRegistry.deleteMany({});
        console.log('✅ Collection cleared.');
        console.log(`Inserting ${finalPokemonList.length} Pokemon...`);
        await AnimalRegistry.insertMany(finalPokemonList);
        console.log('✅ Successfully inserted all Gen 1 Pokemon! (｡♥‿♥｡)');
        mongoose.connection.close();
    }
    catch (err) {
        console.error('🚨 Error seeding data:', err);
        process.exit(1);
    }
}
seedPokemon();
