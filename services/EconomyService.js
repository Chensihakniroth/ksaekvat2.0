/**
 * ECONOMY SERVICE
 * Centralized logic for betting, rewards, and general financial math.
 */

const config = require('../config/config.js');

class EconomyService {
    /**
     * Parse and validate a bet amount from user input.
     * Supports 'all' keyword and handles balance checks.
     */
    parseBet(input, userBalance, maxLimit = config.economy.maxBet) {
        let amount = 0;
        const normalized = input?.toLowerCase();

        if (normalized === 'all') {
            amount = Math.min(userBalance, maxLimit);
        } else {
            amount = parseInt(input);
        }

        if (isNaN(amount) || amount < 0) return 0;
        return Math.min(amount, maxLimit);
    }

    /**
     * Calculate work rewards with potential multipliers.
     */
    calculateWorkReward(min = config.economy.workReward.min, max = config.economy.workReward.max, multiplier = 1) {
        const base = Math.floor(Math.random() * (max - min + 1)) + min;
        return Math.floor(base * multiplier);
    }

    /**
     * Format currency numbers with commas.
     */
    format(amount) {
        return amount.toLocaleString();
    }
}

module.exports = new EconomyService();
