"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const QuestSchema = new mongoose_1.Schema({
    questId: String,
    type: String,
    target: { type: Number, default: 0 },
    current: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    rewarded: { type: Boolean, default: false },
}, { _id: false });
/**
 * USER SCHEMA (Gold Standard)
 * Defines the structure of our player data in MongoDB with full type-safety! (｡♥‿♥｡)
 */
const UserSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true, index: true }, // Discord ID
    username: { type: String, default: 'Unknown Traveler' }, // Discord Username
    balance: { type: Number, default: 1000 },
    star_dust: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    worldLevel: { type: Number, default: 1 },
    experience: { type: Number, default: 0 },
    // Rewards & Gacha
    dailyClaimed: { type: Boolean, default: false },
    weeklyClaimed: { type: Boolean, default: false },
    lastGachaReset: { type: Date, default: null },
    dailyPulls: { type: Number, default: 0 },
    extraPulls: { type: Number, default: 0 },
    pity: { type: Number, default: 0 }, // 5-star pity
    pity4: { type: Number, default: 0 }, // 4-star pity
    // Collection Systems
    gacha_inventory: [
        {
            name: String,
            type: { type: String, enum: ['character', 'weapon', 'item'] },
            ascension: { type: Number, default: 0 },
            refinement: { type: Number, default: 1 },
            count: { type: Number, default: 1 },
        },
    ],
    inventory: { type: [mongoose_1.Schema.Types.Mixed], default: [] },
    equipped: { type: mongoose_1.Schema.Types.Map, of: mongoose_1.Schema.Types.Mixed, default: {} },
    lootbox: { type: Number, default: 0 },
    team: [String], // Array of character names (Slim Storage)
    // RPG & Stats
    animals: { type: mongoose_1.Schema.Types.Map, of: mongoose_1.Schema.Types.Map, default: {} }, // { rarity: { animalKey: count } }
    boosters: { type: mongoose_1.Schema.Types.Map, of: mongoose_1.Schema.Types.Mixed, default: {} },
    // Simplified Items
    pokeballs: { type: Number, default: 0 },
    ultraballs: { type: Number, default: 0 },
    masterballs: { type: Number, default: 0 },
    // Social & Customization
    spouse: {
        name: { type: String, default: null },
        affinity: { type: Number, default: 0 },
        marriedAt: { type: Date, default: null },
    },
    profileTheme: { type: String, default: 'default' },
    unlockedThemes: { type: [String], default: ['default'] },
    quests: [QuestSchema],
    lastQuestReset: { type: Date, default: null },
    stats: {
        totalGambled: { type: Number, default: 0 },
        totalWon: { type: Number, default: 0 },
        totalLost: { type: Number, default: 0 },
        commandsUsed: { type: Number, default: 0 },
        won_riel: { type: Number, default: 0 },
        lost_riel: { type: Number, default: 0 },
    },
    // Custom per-user prefix settings
    customPrefix: { type: String, default: null },
    customSubPrefix: { type: String, default: null },
    joinedAt: { type: Date, default: Date.now },
});
const User = mongoose_1.default.model('User', UserSchema);
exports.default = User;
