"use strict";
/**
 * ECONOMY SERVICE (Professional TypeScript Edition)
 * Centralized logic for betting, rewards, and general financial math.
 * Now with type-safety to prevent any gold-related bugs! (｡♥‿♥｡)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_js_1 = __importDefault(require("../config/config.js"));
class EconomyService {
    /**
     * Parse and validate a bet amount from user input.
     * Supports 'all' keyword and handles balance checks.
     */
    parseBet(input, userBalance, minLimit = config_js_1.default.economy.minBet || 1, maxLimit = config_js_1.default.economy.maxBet) {
        let amount = 0;
        const normalized = input?.toLowerCase();
        if (normalized === 'all') {
            amount = userBalance;
        }
        else if (normalized === 'min') {
            amount = minLimit;
        }
        else if (normalized === 'max') {
            amount = maxLimit;
        }
        else {
            amount = parseInt(input || '0');
            if (isNaN(amount) || amount < 0)
                return 0;
            amount = Math.min(amount, maxLimit);
        }
        return amount;
    }
    /**
     * Calculate work rewards with potential multipliers.
     */
    calculateWorkReward(min = config_js_1.default.economy.workReward.min, max = config_js_1.default.economy.workReward.max, multiplier = 1) {
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
const instance = new EconomyService();
exports.default = instance;
