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
  profileTheme: {
    theme: string;
    background: string | null;
    accentColor: string | null;
    bio: string | null;
    banner: string | null;
    bannerPosition: string | null;
    avatar: string | null;
    music: string | null;
    slug: string | null;
    socials: {
      discord?: string;
      instagram?: string;
      twitter?: string;
      github?: string;
      website?: string;
    };
    portfolio?: {
      type: 'github' | 'art';
      title: string;
      url: string;
      description?: string;
    }[];
    favorites?: {
      type: 'character' | 'animal';
      name: string;
    }[];
    showStats: boolean;
    showInventory: boolean;
  };
  unlockedThemes: string[];
  quests: {
    questId: string;
    type: string;
    target: number;
    current: number;
    completed: boolean;
    rewarded: boolean;
  }[];
  lastQuestReset: Date | null;
  weeklyQuests: {
    questId: string;
    type: string;
    target: number;
    current: number;
    completed: boolean;
    rewarded: boolean;
  }[];
  lastWeeklyQuestReset: Date | null;
  stats: IUserStats;
  joinedAt: Date;
  customPrefix?: string;   // User's personal main prefix (e.g. 'K', '!')
  customSubPrefix?: string; // User's personal short/sub prefix override
}

const QuestSchema: Schema = new Schema({
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
const UserSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true, index: true }, // Discord ID
  username: { type: String, default: 'Unknown Traveler' }, // Discord Username
  balance: { type: Number, default: 1000, index: true },
  star_dust: { type: Number, default: 0 },
  level: { type: Number, default: 1, index: true },
  worldLevel: { type: Number, default: 1 },
  experience: { type: Number, default: 0, index: true },

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
  profileTheme: {
    theme: { type: String, default: 'default' },
    background: { type: String, default: null },
    accentColor: { type: String, default: '#22d3ee' }, // Cyan default
    bio: { type: String, default: 'Exploring the digital realm.' },
    banner: { type: String, default: null },
    bannerPosition: { type: String, default: '50%' },
    avatar: { type: String, default: null },
    music: { type: String, default: null },
    slug: { type: String, default: null, index: true },
    socials: {
      discord: { type: String, default: null },
      instagram: { type: String, default: null },
      twitter: { type: String, default: null },
      github: { type: String, default: null },
      website: { type: String, default: null },
    },
    portfolio: [
      {
        type: { type: String, enum: ['github', 'art'] },
        title: String,
        url: String,
        description: String,
      },
    ],
    favorites: [
      {
        type: { type: String, enum: ['character', 'animal'] },
        name: String,
      },
    ],
    showStats: { type: Boolean, default: true },
    showInventory: { type: Boolean, default: true },
  },
  unlockedThemes: { type: [String], default: ['default'] },

  quests: [QuestSchema],
  lastQuestReset: { type: Date, default: null },
  
  // Weekly Quests
  weeklyQuests: [QuestSchema],
  lastWeeklyQuestReset: { type: Date, default: null },

  stats: {
    totalGambled: { type: Number, default: 0 },
    totalWon: { type: Number, default: 0 },
    totalLost: { type: Number, default: 0 },
    commandsUsed: { type: Number, default: 0 },
    won_riel: { type: Number, default: 0 },
    lost_riel: { type: Number, default: 0 },
    totalDonated: { type: Number, default: 0 },
    totalReceived: { type: Number, default: 0 },
  },

  // Custom per-user prefix settings
  customPrefix: { type: String, default: null },
  customSubPrefix: { type: String, default: null },

  joinedAt: { type: Date, default: Date.now },
});

const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
export default User;
