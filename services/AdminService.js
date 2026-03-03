/**
 * ADMIN SERVICE
 * Centralized logic for administrative actions like user resets and data manipulation.
 */

class AdminService {
    /**
     * Reset a user object to its default starting values.
     */
    resetUser(userData) {
        userData.balance = 1000;
        userData.level = 1;
        userData.experience = 0;
        userData.dailyClaimed = false;
        userData.weeklyClaimed = false;
        userData.lastDaily = null;
        userData.lastWeekly = null;
        userData.lastHunt = null;
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
            totalAnimalsFound: 0 // Ensure this is in schema or handled
        };
        userData.joinedAt = new Date();
        return userData;
    }
}

module.exports = new AdminService();
