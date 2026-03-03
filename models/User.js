const mongoose = require('mongoose');

/**
 * USER SCHEMA (Gold Standard)
 * Defines the structure of our player data in MongoDB.
 * Includes automatic defaults, type validation, and lean storage.
 */

const UserSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true, index: true }, // Discord ID
    username: { type: String, default: 'Unknown Traveler' },        // Discord Username
    balance: { type: Number, default: 1000 },
    level: { type: Number, default: 1 },
    worldLevel: { type: Number, default: 1 },
    experience: { type: Number, default: 0 },
    
    // Rewards & Gacha
    dailyClaimed: { type: Boolean, default: false },
    weeklyClaimed: { type: Boolean, default: false },
    lastGachaReset: { type: Date, default: null },
    dailyPulls: { type: Number, default: 0 },
    extraPulls: { type: Number, default: 0 },
    pity: { type: Number, default: 0 },   // 5-star pity
    pity4: { type: Number, default: 0 },  // 4-star pity
    
    // Collection Systems
    gacha_inventory: [{
        name: String,
        type: { type: String, enum: ['character', 'weapon'] },
        ascension: { type: Number, default: 0 },
        refinement: { type: Number, default: 1 },
        count: { type: Number, default: 1 }
    }],
    
    team: [String], // Array of character names (Slim Storage)
    
    // RPG & Stats
    animals: { type: mongoose.Schema.Types.Map, of: mongoose.Schema.Types.Map, default: {} }, // { rarity: { animalKey: count } }
    boosters: { type: mongoose.Schema.Types.Map, of: mongoose.Schema.Types.Mixed, default: {} },
    inventory: [mongoose.Schema.Types.Mixed],
    equipped: { type: mongoose.Schema.Types.Map, of: mongoose.Schema.Types.Mixed, default: {} },
    lootbox: { type: Number, default: 0 },
    
    stats: {
        totalGambled: { type: Number, default: 0 },
        totalWon: { type: Number, default: 0 },
        totalLost: { type: Number, default: 0 },
        commandsUsed: { type: Number, default: 0 },
        won_riel: { type: Number, default: 0 },
        lost_riel: { type: Number, default: 0 }
    },
    
    joinedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);