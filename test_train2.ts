import mongoose from 'mongoose';
import database from './src/services/DatabaseService';

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/ksaekvat_bot');
  
  // mock a user
  const user = await database.getUser('mock_user_123');
  
  if (!user.animals.get('common')) user.animals.set('common', new Map());
  user.animals.get('common').set('pikachu', 0); // They have 0
  user.markModified('animals');
  await database.saveUser(user);

  const res = await database.trainPokemon('mock_user_123', 'pikachu');
  console.log('Result when count is 0:', res);

  mongoose.disconnect();
}

test().catch(console.error);
