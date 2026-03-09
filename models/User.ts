import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * USER INTERFACE (Professional Blueprint)
 * This interface defines exactly what a user's data looks like. (｡♥‿♥｡)
 */
export interface IGachaInventoryItem {
  name: string;
  type: 'character' | 'weapon';
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
  team: string[];
  animals: Map<string, Map<string, number>>;
  boosters: Map<string, any>;
  inventory: any[];
  equipped: Map<string, any>;
  lootbox: number;
  stats: IUserStats;
  joinedAt: Date;
}

/**
 * USER SCHEMA (Gold Standard)
 * Defines the structure of our player data in MongoDB with full type-safety! (｡♥‿♥｡)
 */
const UserSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true, index: true }, // Discord ID
  username: { type: String, default: 'Unknown Traveler' }, // Discord Username
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
  pity: { type: Number, default: 0 }, // 5-star pity
  pity4: { type: Number, default: 0 }, // 4-star pity

  // Collection Systems
  gacha_inventory: [
    {
      name: String,
      type: { type: String, enum: ['character', 'weapon'] },
      ascension: { type: Number, default: 0 },
      refinement: { type: Number, default: 1 },
      count: { type: Number, default: 1 },
    },
  ],

  team: [String], // Array of character names (Slim Storage)

  // RPG & Stats
  animals: { type: Schema.Types.Map, of: Schema.Types.Map, default: {} }, // { rarity: { animalKey: count } }
  boosters: { type: Schema.Types.Map, of: Schema.Types.Mixed, default: {} },
  inventory: [Schema.Types.Mixed],
  equipped: { type: Schema.Types.Map, of: Schema.Types.Mixed, default: {} },
  lootbox: { type: Number, default: 0 },

  stats: {
    totalGambled: { type: Number, default: 0 },
    totalWon: { type: Number, default: 0 },
    totalLost: { type: Number, default: 0 },
    commandsUsed: { type: Number, default: 0 },
    won_riel: { type: Number, default: 0 },
    lost_riel: { type: Number, default: 0 },
  },

  joinedAt: { type: Date, default: Date.now },
});

const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
export default User;
