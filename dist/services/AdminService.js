"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * ADMIN SERVICE (Professional TypeScript Edition)
 * Centralized logic for administrative actions like user resets and data manipulation.
 */
class AdminService {
    resetUser(userData) {
        userData.balance = 1000;
        userData.level = 1;
        userData.experience = 0;
        userData.dailyClaimed = false;
        userData.weeklyClaimed = false;
        userData.lastGachaReset = null;
        userData.dailyPulls = 0;
        userData.extraPulls = 0;
        userData.pity = 0;
        userData.pity4 = 0;
        userData.animals = new Map();
        userData.boosters = new Map();
        userData.gacha_inventory = [];
        userData.team = [];
        userData.inventory = [];
        userData.equipped = new Map();
        userData.lootbox = 0;
        userData.stats = {
            totalGambled: 0,
            totalWon: 0,
            totalLost: 0,
            commandsUsed: 0,
            won_riel: 0,
            lost_riel: 0,
        };
        userData.joinedAt = new Date();
        return userData;
    }
}
const instance = new AdminService();
exports.default = instance;
