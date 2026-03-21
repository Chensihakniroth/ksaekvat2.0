const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

/**
 * MOMMY'S GACHA WIPE SCRIPT (｡•́︿•̀｡)
 * This script clears the gacha inventory and pity for ALL users.
 */

async function wipeGachaData() {
  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGODB_URL ||
    process.env.MONGO_URI ||
    process.env.MONGO_URL ||
    'mongodb://127.0.0.1:27017/kohi_bot';

  console.log('✨ Mommy is connecting to the database... (｡♥‿♥｡)');

  try {
    await mongoose.connect(uri);
    console.log('✅ Connected! Starting the big cleanup... (ﾉ´ヮ`)ﾉ*:･ﾟ✧');

    const result = await User.updateMany(
      {},
      {
        $set: {
          gacha_inventory: [],
          pity: 0,
          pity4: 0,
          dailyPulls: 0,
          extraPulls: 0,
        },
      }
    );

    console.log(`\n🎉 Success, my sweet!`);
    console.log(`✨ Updated: ${result.modifiedCount} traveler profiles.`);
    console.log(`📦 All gacha inventories are now empty!`);
    console.log(`🎯 All pity counts have been reset to 0.`);
  } catch (err) {
    console.error('❌ Oh no, darling! Something went wrong:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n👋 Mommy's work here is done. (◕‿◕✿)");
    process.exit(0);
  }
}

wipeGachaData();
