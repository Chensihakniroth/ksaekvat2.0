"use strict";
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const Character = require('../models/Character').default || require('../models/Character');
const items = [
    {
        name: 'Star Dust',
        game: 'common',
        rarity: '3',
        emoji: '✨',
        type: 'item',
        image_url: 'http://bucket-production-4ca0.up.railway.app/gacha-images/common/stardust.png'
    },
    {
        name: 'Pokeball',
        game: 'common',
        rarity: '3',
        emoji: '⚪',
        type: 'item',
        image_url: 'http://bucket-production-4ca0.up.railway.app/gacha-images/common/poke_man.png'
    },
    {
        name: 'Ultraball',
        game: 'common',
        rarity: '4',
        emoji: '🟡',
        type: 'item',
        image_url: 'assets/pokeball/ultra_ball.png'
    },
    {
        name: 'Master Ball',
        game: 'common',
        rarity: '5',
        emoji: '🟣',
        type: 'item',
        image_url: 'assets/pokeball/master_ball.png'
    }
];
async function seedItems() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to MongoDB');
        for (const item of items) {
            await Character.findOneAndUpdate({ name: item.name, game: item.game }, item, { upsert: true, new: true });
            console.log(`Seeded item: ${item.name}`);
        }
        mongoose.connection.close();
        console.log('Seeding complete!');
    }
    catch (err) {
        console.error('Error seeding items:', err);
    }
}
seedItems();
