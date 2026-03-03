const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const User = require('./models/User');
const Promo = require('./models/Promo');

async function migrate() {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ksae_bot';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('Connected! 🌿');

    // --- MIGRATE USERS ---
    const usersPath = path.join(__dirname, 'data', 'users.json');
    if (fs.existsSync(usersPath)) {
        const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        const userIds = Object.keys(usersData);
        console.log(`Found ${userIds.length} users to migrate.`);

        for (const id of userIds) {
            const raw = usersData[id];
            
            // Map Raw JSON to Schema
            const mapped = {
                id: raw.id,
                balance: raw.balance || 0,
                level: raw.level || 1,
                worldLevel: raw.worldLevel || 1,
                experience: raw.experience || 0,
                dailyClaimed: raw.dailyClaimed || false,
                weeklyClaimed: raw.weeklyClaimed || false,
                lastGachaReset: raw.lastGachaReset || null,
                dailyPulls: raw.dailyPulls || 0,
                extraPulls: raw.extraPulls || 0,
                gacha_inventory: raw.gacha_inventory || [],
                team: raw.team || [],
                inventory: raw.inventory || [],
                equipped: raw.equipped || {},
                lootbox: raw.lootbox || 0,
                stats: {
                    totalGambled: raw.totalGambled || 0,
                    totalWon: raw.totalWon || 0,
                    totalLost: raw.totalLost || 0,
                    commandsUsed: raw.commandsUsed || 0,
                    won_riel: (raw.stats && raw.stats.won) || 0,
                    lost_riel: (raw.stats && raw.stats.lost) || 0
                },
                joinedAt: raw.joinedAt ? new Date(raw.joinedAt) : new Date()
            };

            await User.findOneAndUpdate({ id: mapped.id }, mapped, { upsert: true });
            process.stdout.write('.');
        }
        console.log('\nUser migration complete! ✅');
    }

    // --- MIGRATE PROMOS ---
    const promosPath = path.join(__dirname, 'data', 'promo_codes.json');
    if (fs.existsSync(promosPath)) {
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
                createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date()
            };

            await Promo.findOneAndUpdate({ code: mapped.code }, mapped, { upsert: true });
        }
        console.log('Promo migration complete! ✅');
    }

    console.log('All migrations finished! You can now safely delete the .json files after verifying the bot works.');
    process.exit(0);
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});