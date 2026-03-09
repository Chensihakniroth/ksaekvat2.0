const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Load Models
const User = require('./models/User');
const Promo = require('./models/Promo');
const Listener = require('./models/Listener');
const TalkTarget = require('./models/TalkTarget');
const CharacterCard = require('./models/CharacterCard');
const AnimalRegistry = require('./models/AnimalRegistry');
const Character = require('./models/Character');

async function migrate() {
  const mongoURI =
    process.env.MONGODB_URI ||
    process.env.MONGODB_URL ||
    process.env.MONGO_URI ||
    process.env.MONGO_URL ||
    'mongodb://127.0.0.1:27017/ksae_bot';

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoURI);
  console.log('Connected! 🌿');

  // --- MIGRATE USERS ---
  const usersPath = path.join(__dirname, 'data', 'users.json');
  if (fs.existsSync(usersPath)) {
    console.log('Checking User migration status...');
    const existingUsersCount = await User.countDocuments();

    if (existingUsersCount > 0) {
      console.log('Users already migrated. Skipping. ✅');
    } else {
      const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
      const userIds = Object.keys(usersData);
      console.log(`Found ${userIds.length} users to migrate.`);

      for (const id of userIds) {
        const raw = usersData[id];

        // Map Raw JSON to Schema
        const mapped = {
          id: raw.id || id,
          username: raw.username || 'Unknown Traveler',
          balance: raw.balance || 0,
          level: raw.level || 1,
          worldLevel: raw.worldLevel || 1,
          experience: raw.experience || 0,
          dailyClaimed: raw.dailyClaimed || false,
          weeklyClaimed: raw.weeklyClaimed || false,
          lastGachaReset: raw.lastGachaReset || null,
          dailyPulls: raw.dailyPulls || 0,
          extraPulls: raw.extraPulls || 0,
          pity: raw.pity || 0,
          pity4: raw.pity4 || 0,
          gacha_inventory: (raw.gacha_inventory || []).map(item => ({
            name: item.name,
            type: item.type || (item.rarity === '3' ? 'weapon' : 'character'),
            ascension: item.ascension || 0,
            refinement: item.refinement || 1,
            count: item.count || 1,
          })),
          team: raw.team || [],
          animals: raw.animals || {},
          boosters: raw.boosters || {},
          inventory: raw.inventory || [],
          equipped: raw.equipped || {},
          lootbox: raw.lootbox || 0,
          stats: {
            totalGambled: raw.totalGambled || 0,
            totalWon: raw.totalWon || 0,
            totalLost: raw.totalLost || 0,
            commandsUsed: raw.commandsUsed || 0,
            won_riel: (raw.stats && raw.stats.won_riel) || (raw.stats && raw.stats.won) || 0,
            lost_riel: (raw.stats && raw.stats.lost_riel) || (raw.stats && raw.stats.lost) || 0,
          },
          joinedAt: raw.joinedAt ? new Date(raw.joinedAt) : new Date(),
        };

        // UPSERT: Create if doesn't exist, update if it does (but keep existing data if possible)
        await User.findOneAndUpdate({ id: mapped.id }, mapped, { upsert: true, new: true });
        process.stdout.write('.');
      }
      console.log('\nUser migration complete! ✅');
    }
  }

  // --- MIGRATE PROMOS ---
  // (rest of the file stays the same, but we will remove the Gacha Pool section below)
  const promosPath = path.join(__dirname, 'data', 'promo_codes.json');
  if (fs.existsSync(promosPath)) {
    console.log('Checking Promo migration status...');
    const existingPromosCount = await Promo.countDocuments();

    if (existingPromosCount > 0) {
      console.log('Promos already migrated. Skipping. ✅');
    } else {
      const promoData = JSON.parse(fs.readFileSync(promosPath, 'utf8'));
      const codes = Object.keys(promoData);
      console.log(`Found ${codes.length} promo codes to migrate.`);

      for (const code of codes) {
        const raw = promoData[code];
        const mapped = {
          code: code,
          type: raw.type,
          amount: raw.amount,
          usedBy: raw.usedBy || [],
          maxUses: raw.maxUses || 1,
          createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
        };

        await Promo.findOneAndUpdate({ code: mapped.code }, mapped, { upsert: true });
      }
      console.log('Promo migration complete! ✅');
    }
  }

  // --- MIGRATE LISTENERS ---
  const listenersPath = path.join(__dirname, 'data', 'listeners.json');
  if (fs.existsSync(listenersPath)) {
    console.log('Checking Listener migration status...');
    const existingListenersCount = await Listener.countDocuments();

    if (existingListenersCount > 0) {
      console.log('Listeners already migrated. Skipping. ✅');
    } else {
      const listenersData = JSON.parse(fs.readFileSync(listenersPath, 'utf8'));
      const adminIds = Object.keys(listenersData);
      console.log(`Found ${adminIds.length} listeners to migrate.`);

      for (const adminId of adminIds) {
        const targetUserId = listenersData[adminId];
        if (targetUserId) {
          await Listener.findOneAndUpdate({ adminId }, { adminId, targetUserId }, { upsert: true });
        }
      }
      console.log('Listener migration complete! ✅');
    }
  }

  // --- MIGRATE TALK TARGETS ---
  const talkTargetsPath = path.join(__dirname, 'data', 'talktargets.json');
  if (fs.existsSync(talkTargetsPath)) {
    console.log('Checking Talk Target migration status...');
    const existingTalkTargetsCount = await TalkTarget.countDocuments();

    if (existingTalkTargetsCount > 0) {
      console.log('Talk Targets already migrated. Skipping. ✅');
    } else {
      const talkTargetsData = JSON.parse(fs.readFileSync(talkTargetsPath, 'utf8'));
      const adminIds = Object.keys(talkTargetsData);
      console.log(`Found ${adminIds.length} talk targets to migrate.`);

      for (const adminId of adminIds) {
        const data = talkTargetsData[adminId];
        await TalkTarget.findOneAndUpdate(
          { adminId },
          {
            adminId,
            channelId: data.channelId,
            serverId: data.serverId || 'DM',
            setAt: data.setAt ? new Date(data.setAt) : new Date(),
          },
          { upsert: true }
        );
      }
      console.log('Talk Target migration complete! ✅');
    }
  }

  // --- MIGRATE CHARACTER CARD ---
  const characterPath = path.join(__dirname, 'data', 'character.json');
  if (fs.existsSync(characterPath)) {
    console.log('Checking Character Card migration status...');
    const existingCharacterCardCount = await CharacterCard.countDocuments();

    if (existingCharacterCardCount > 0) {
      console.log('Character Card already migrated. Skipping. ✅');
    } else {
      const charData = JSON.parse(fs.readFileSync(characterPath, 'utf8'));
      console.log('Migrating character card...');
      await CharacterCard.findOneAndUpdate(
        { id: 'default' },
        {
          id: 'default',
          name: charData.name,
          style: charData.style,
          personality: charData.personality,
          rules: charData.rules || '',
        },
        { upsert: true }
      );
      console.log('Character Card migration complete! ✅');
    }
  }

  // --- MIGRATE ANIMALS REGISTRY ---
  const animalsPath = path.join(__dirname, 'data', 'animals.json');
  if (fs.existsSync(animalsPath)) {
    console.log('Checking Animals Registry migration status...');
    const existingAnimalsCount = await AnimalRegistry.countDocuments();

    if (existingAnimalsCount > 0) {
      console.log('Animals Registry already migrated. Skipping. ✅');
    } else {
      const animalsData = JSON.parse(fs.readFileSync(animalsPath, 'utf8'));
      console.log('Migrating animals registry...');
      let animalCount = 0;
      for (const [rarity, animals] of Object.entries(animalsData)) {
        for (const [key, animal] of Object.entries(animals)) {
          await AnimalRegistry.findOneAndUpdate(
            { rarity, key },
            {
              rarity,
              key,
              name: animal.name,
              emoji: animal.emoji,
              value: animal.value,
            },
            { upsert: true }
          );
          animalCount++;
        }
      }
      console.log(`Animal Registry migration complete (${animalCount} animals)! ✅`);
    }
  }

  console.log(
    'All migrations finished! You can now safely delete the .json files after verifying the bot works.'
  );
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
