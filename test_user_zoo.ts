import mongoose from 'mongoose';
import database from './src/services/DatabaseService';

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/ksaekvat_bot');
  
  const userId = '703266672022388789';
  const user = await database.getUser(userId);
  
  console.log("=== USER ANIMALS (ZOO) ===");
  if (user.animals instanceof Map) {
    for (const [rarity, animals] of user.animals.entries()) {
      const animalMap = animals instanceof Map ? animals : new Map(Object.entries(animals as any));
      console.log(`Rarity ${rarity}:`, Object.fromEntries(animalMap));
    }
  } else {
    console.log("User animals is not a Map:", user.animals);
  }

  console.log("\n=== TRAINED POKEMON ===");
  const trained = await database.getTrainedPokemon(userId);
  trained.forEach(p => console.log(`- ${p.speciesKey} (Lv.${p.level})`));

  console.log("\n=== CURRENT TEAM ===");
  const currentTeam = await database.getPokemonTeam(userId);
  currentTeam.forEach(p => console.log(`- ${p.speciesKey} (Lv.${p.level})`));

  console.log("\n=== TEST TRAIN POKEMON ===");
  const res = await database.trainPokemon(userId, 'charizard');
  console.log("Result of trying to train charizard:", res);
  
  // if it succeeded, wait, don't save it so we don't mess up their db state unless it auto-saves in trainPokemon
  
  mongoose.disconnect();
}

check().catch(console.error);
