import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * USER INTERFACE (Professional Blueprint)
 * This interface defines exactly what a user's data looks like. (｡♥‿♥｡)
 */
export interface IGachaInventoryItem {
  name: string;
  type: 'character' | 'weapon' | 'item';
  ascension: number;
  refinement: number;
  count: number;
}

export interface IUserStats {
  totalGambled: number;
  totalWon: number;
  totalLost: number;
  commandsUsed: number;
  won_riel: number;
  lost_riel: number;
}

export interface IUser extends Document {
  id: string;
  username: string;
  balance: number;
  star_dust: number;
  level: number;
  worldLevel: number;
  experience: number;
  dailyClaimed: boolean;
  weeklyClaimed: boolean;
  lastGachaReset: Date | null;
  dailyPulls: number;
  extraPulls: number;
  pity: number;
  pity4: number;
  gacha_inventory: IGachaInventoryItem[];
  inventory: any[];
  equipped: Map<string, any>;
  lootbox: number;
  team: string[];
  animals: Map<string, Map<string, number>>;
  boosters: Map<string, any>;
  pokeballs: number;
  ultraballs: number;
  masterballs: number;
  spouse: {
    name: string;
    affinity: number;
    marriedAt: Date;
  } | null;
  profileTheme: string | null;
  unlockedThemes: string[];
  quests: {
    id: string;
    type: string;
    target: number;
    current: number;
    completed: boolean;
    rewarded: boolean;
  }[];
  lastQuestReset: Date | null;
  stats: IUserStats;
  joinedAt: Date;
  customPrefix?: string;   // User's personal main prefix (e.g. 'K', '!')
  customSubPrefix?: string; // User's personal short/sub prefix override
}

/**
 * USER SCHEMA (Gold Standard)
 * Defines the structure of our player data in MongoDB with full type-safety! (｡♥‿♥｡)
 */
const UserSchema: Schema = new Schema({
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

  inventory: { type: [Schema.Types.Mixed], default: [] },
  equipped: { type: Schema.Types.Map, of: Schema.Types.Mixed, default: {} },
  lootbox: { type: Number, default: 0 },

  team: [String], // Array of character names (Slim Storage)

  // RPG & Stats
  animals: { type: Schema.Types.Map, of: Schema.Types.Map, default: {} }, // { rarity: { animalKey: count } }
  boosters: { type: Schema.Types.Map, of: Schema.Types.Mixed, default: {} },
  
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

  // Quest System
  quests: [
    {
      id: String,
      type: String,
      target: { type: Number, default: 0 },
      current: { type: Number, default: 0 },
      completed: { type: Boolean, default: false },
      rewarded: { type: Boolean, default: false },
    },
  ],
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

const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
export default User;
