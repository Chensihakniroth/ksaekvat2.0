"use strict";
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const AnimalRegistry = require('../models/AnimalRegistry').default || require('../models/AnimalRegistry');
// Gen 1 Pokemon keys from cleanup_system.ts
const GEN1_POKEMON = new Set([
    'bulbasaur', 'ivysaur', 'venusaur', 'charmander', 'charmeleon', 'charizard',
    'squirtle', 'wartortle', 'blastoise', 'caterpie', 'metapod', 'butterfree',
    'weedle', 'kakuna', 'beedrill', 'pidgey', 'pidgeotto', 'pidgeot',
    'rattata', 'raticate', 'spearow', 'fearow', 'ekans', 'arbok',
    'pikachu', 'raichu', 'sandshrew', 'sandslash', 'nidoran-f', 'nidorina',
    'nidoqueen', 'nidoran-m', 'nidorino', 'nidoking', 'clefairy', 'clefable',
    'vulpix', 'ninetales', 'jigglypuff', 'wigglytuff', 'zubat', 'golbat',
    'oddish', 'gloom', 'vileplume', 'paras', 'parasect', 'venonat',
    'venomoth', 'diglett', 'dugtrio', 'meowth', 'persian', 'psyduck',
    'golduck', 'mankey', 'primeape', 'growlithe', 'arcanine', 'poliwag',
    'poliwhirl', 'poliwrath', 'abra', 'kadabra', 'alakazam', 'machop',
    'machoke', 'machamp', 'bellsprout', 'weepinbell', 'victreebel', 'tentacool',
    'tentacruel', 'geodude', 'graveler', 'golem', 'ponyta', 'rapidash',
    'slowpoke', 'slowbro', 'magnemite', 'magneton', 'farfetchd', 'doduo',
    'dodrio', 'seel', 'dewgong', 'grimer', 'muk', 'shellder', 'cloyster',
    'gastly', 'haunter', 'gengar', 'onix', 'drowzee', 'hypno', 'krabby',
    'kingler', 'voltorb', 'electrode', 'exeggcute', 'exeggutor', 'cubone',
    'marowak', 'hitmonlee', 'hitmonchan', 'lickitung', 'koffing', 'weezing',
    'rhyhorn', 'rhydon', 'chansey', 'tangela', 'kangaskhan', 'horsea',
    'seadra', 'goldeen', 'seaking', 'staryu', 'starmie', 'mr-mime',
    'scyther', 'jynx', 'electabuzz', 'magmar', 'pinsir', 'tauros',
    'magikarp', 'gyarados', 'lapras', 'ditto', 'eevee', 'vaporeon',
    'jolteon', 'flareon', 'porygon', 'omanyte', 'omastar', 'kabuto',
    'kabutops', 'aerodactyl', 'snorlax', 'articuno', 'zapdos', 'moltres',
    'dratini', 'dragonair', 'dragonite', 'mewtwo', 'mew'
]);
async function checkAndInjectGen2() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ Connected to MongoDB.');
        // Check current animals
        const currentAnimals = await AnimalRegistry.find({});
        console.log(`\nCurrent AnimalRegistry has ${currentAnimals.length} entries`);
        // Check which Gen 1 Pokemon are present
        const presentKeys = new Set(currentAnimals.map(a => a.key.toLowerCase()));
        const missingGen1 = [];
        const extraKeys = [];
        for (const key of GEN1_POKEMON) {
            if (!presentKeys.has(key)) {
                missingGen1.push(key);
            }
        }
        for (const key of presentKeys) {
            if (!GEN1_POKEMON.has(key)) {
                extraKeys.push(key);
            }
        }
        console.log(`\n=== Gen 1 Pokemon Status ===`);
        console.log(`Present: ${GEN1_POKEMON.size - missingGen1.length}/${GEN1_POKEMON.size}`);
        console.log(`Missing: ${missingGen1.length}`);
        if (extraKeys.length > 0) {
            console.log(`\n=== Non-Pokemon entries found ===`);
            console.log(`Count: ${extraKeys.length}`);
        }
        // Determine if Gen 1 is complete (allowing some missing as they may have been removed)
        const completeness = (GEN1_POKEMON.size - missingGen1.length) / GEN1_POKEMON.size;
        console.log(`\nCompleteness: ${(completeness * 100).toFixed(1)}%`);
        // Load and inject Gen 2
        const gen2Data = JSON.parse(fs.readFileSync(path.join(__dirname, '../../gen2_pokemon.json'), 'utf8'));
        if (completeness >= 0.9) {
            console.log('\n✅ Gen 1 pool is sufficiently complete. Proceeding with Gen 2 injection...');
            let inserted = 0;
            let skipped = 0;
            for (const pokemon of gen2Data) {
                try {
                    await AnimalRegistry.findOneAndUpdate({ key: pokemon.key }, {
                        key: pokemon.key,
                        name: pokemon.key.charAt(0).toUpperCase() + pokemon.key.slice(1),
                        rarity: pokemon.rarity,
                        value: pokemon.value,
                        emoji: '🐾'
                    }, { upsert: true, new: true });
                    inserted++;
                }
                catch (e) {
                    skipped++;
                }
            }
            console.log(`\n✅ Gen 2 injection complete!`);
            console.log(`Inserted/Updated: ${inserted}`);
            console.log(`Skipped: ${skipped}`);
        }
        else {
            console.log('\n⚠️ Gen 1 pool is incomplete. Please ensure Gen 1 is properly seeded first.');
            console.log('Missing Pokemon:', missingGen1.slice(0, 10).join(', '));
        }
        const finalCount = await AnimalRegistry.countDocuments();
        console.log(`\nFinal AnimalRegistry count: ${finalCount}`);
        mongoose.connection.close();
    }
    catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}
checkAndInjectGen2();
