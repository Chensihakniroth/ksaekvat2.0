"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = __importDefault(require("../models/User"));
const logger = require('../utils/logger.js');
const QUEST_TYPES = {
    HUNT: {
        name: 'Master Hunter',
        description: 'Catch {target} Pokémon using Khunt!',
        targets: [3, 5, 10],
    },
    SLOTS: {
        name: 'Lucky Spinner',
        description: 'Play Slots {target} times!',
        targets: [5, 10, 15],
    },
    COINFLIP: {
        name: 'Risk Taker',
        description: 'Play Coinflip {target} times!',
        targets: [5, 10, 15],
    },
    AFFINITY: {
        name: 'Heart to Heart',
        description: 'Spend time with your spouse {target} time(s)!',
        targets: [1, 2, 3],
    },
    GACHA: {
        name: 'Wish Maker',
        description: 'Perform {target} Gacha pulls!',
        targets: [10, 20, 30],
    }
};
class QuestService {
    /**
     * Generate 3 random quests for a user (｡♥‿♥｡)
     */
    async generateDailyQuests(userId) {
        const user = await User_1.default.findOne({ id: userId });
        if (!user)
            return null;
        const questPool = Object.keys(QUEST_TYPES);
        const selectedTypes = questPool.sort(() => 0.5 - Math.random()).slice(0, 3);
        const newQuests = selectedTypes.map(type => {
            const config = QUEST_TYPES[type];
            const target = config.targets[Math.floor(Math.random() * config.targets.length)];
            return {
                id: `${type}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                type: type,
                target: target,
                current: 0,
                completed: false,
                rewarded: false
            };
        });
        user.quests = newQuests;
        user.lastQuestReset = new Date();
        await user.save();
        return newQuests;
    }
    /**
     * Update progress for a specific quest type (｡♥‿♥｡)
     */
    async updateProgress(userId, type, amount = 1) {
        const user = await User_1.default.findOne({ id: userId });
        if (!user || !user.quests || user.quests.length === 0)
            return;
        // Check if reset is needed
        const today = new Date().setHours(0, 0, 0, 0);
        const lastReset = user.lastQuestReset ? new Date(user.lastQuestReset).setHours(0, 0, 0, 0) : 0;
        if (today > lastReset) {
            await this.generateDailyQuests(userId);
            return;
        }
        let modified = false;
        for (const quest of user.quests) {
            if (quest.type === type && !quest.completed) {
                quest.current += amount;
                if (quest.current >= quest.target) {
                    quest.current = quest.target;
                    quest.completed = true;
                }
                modified = true;
            }
        }
        if (modified) {
            user.markModified('quests');
            await user.save();
        }
    }
    /**
     * Get formatted quest list for embeds (｡♥‿♥｡)
     */
    getQuestInfo(quest) {
        const config = QUEST_TYPES[quest.type];
        if (!config)
            return { name: 'Unknown', description: 'Unknown' };
        return {
            name: config.name,
            description: config.description.replace('{target}', quest.target),
            progress: `${quest.current}/${quest.target}`,
            status: quest.completed ? '✅ Completed' : '⏳ In Progress'
        };
    }
}
exports.default = new QuestService();
