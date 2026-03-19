import mongoose from 'mongoose';
import User from '../models/User';
import Character from '../models/Character';
import AnimalRegistry from '../models/AnimalRegistry';
import { getMongoURI } from '../utils/env';

/**
 * GEN 1 POKEMON SLUGS (The only survivors! ｡♥‿♥｡)
 */
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
  'dratini', 'dragonair', 'dragonite', 'mewtwo', 'mew', 'missingno', 'shinycharizard'
]);

async function cleanup() {
  const uri = getMongoURI();
  console.log('--- SYSTEM CLEANUP INITIATED ---');
  console.log('Connecting to database...');
  await mongoose.connect(uri);

  // 1. Purge Global Character Registry of Weapons
  console.log('Purging global character registry of weapons...');
  const charPurge = await Character.deleteMany({ type: 'weapon' });
  console.log(`Global weapons purged: ${charPurge.deletedCount}`);

  // 2. Purge Animal Registry of Non-Pokémon
  console.log('Purging animal registry of non-Pokémon...');
  const animals = await AnimalRegistry.find({});
  let animalsPurged = 0;
  for (const animal of animals) {
    if (!GEN1_POKEMON.has(animal.key.toLowerCase())) {
      await AnimalRegistry.deleteOne({ _id: animal._id });
      animalsPurged++;
    }
  }
  console.log(`Animal registry purged: ${animalsPurged} entries.`);

  // 3. Audit Users
  const users = await User.find({});
  console.log(`Auditing ${users.length} users...`);

  let weaponsRemoved = 0;
  let nonPokemonRemoved = 0;

  for (const user of users) {
    let changed = false;

    // 1. Remove Weapons from Gacha Inventory
    if (user.gacha_inventory && user.gacha_inventory.length > 0) {
      const initialCount = user.gacha_inventory.length;
      user.gacha_inventory = user.gacha_inventory.filter(item => item.type !== 'weapon');
      const removed = initialCount - user.gacha_inventory.length;
      if (removed > 0) {
        weaponsRemoved += removed;
        changed = true;
      }
    }

    // 2. Remove Non-Pokémon from Animals Map
    // user.animals is a Map<string, Map<string, number>>
    if (user.animals && user.animals.size > 0) {
      for (const [rarity, pokemonMap] of user.animals.entries()) {
        if (pokemonMap instanceof Map) {
          for (const [animalKey] of pokemonMap.entries()) {
            if (!GEN1_POKEMON.has(animalKey.toLowerCase())) {
              pokemonMap.delete(animalKey);
              nonPokemonRemoved++;
              changed = true;
            }
          }
        }
      }
    }

    if (changed) {
      await user.save();
    }
  }

  console.log('--- CLEANUP COMPLETE ---');
  console.log(`Weapons purged: ${weaponsRemoved}`);
  console.log(`Non-Pokémon purged: ${nonPokemonRemoved}`);
  
  process.exit(0);
}

cleanup().catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
