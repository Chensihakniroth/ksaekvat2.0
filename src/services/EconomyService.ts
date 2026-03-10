/**
 * ECONOMY SERVICE (Professional TypeScript Edition)
 * Centralized logic for betting, rewards, and general financial math.
 * Now with type-safety to prevent any gold-related bugs! (｡♥‿♥｡)
 */

import config from '../config/config.js';

class EconomyService {
  /**
   * Parse and validate a bet amount from user input.
   * Supports 'all' keyword and handles balance checks.
   */
  public parseBet(input: string | undefined, userBalance: number, minLimit: number = config.economy.minBet || 2500, maxLimit: number = config.economy.maxBet): number {
    let amount = 0;
    const normalized = input?.toLowerCase();

    if (normalized === 'all') {
      amount = userBalance;
    } else if (normalized === 'min') {
      amount = minLimit;
    } else if (normalized === 'max') {
      amount = maxLimit;
    } else {
      amount = parseInt(input || '0');
      if (isNaN(amount) || amount < 0) return 0;
      amount = Math.min(amount, maxLimit);
    }

    return amount;
  }

  /**
   * Calculate work rewards with potential multipliers.
   */
  public calculateWorkReward(
    min: number = config.economy.workReward.min,
    max: number = config.economy.workReward.max,
    multiplier: number = 1
  ): number {
    const base = Math.floor(Math.random() * (max - min + 1)) + min;
    return Math.floor(base * multiplier);
  }

  /**
   * Format currency numbers with commas.
   */
  public format(amount: number): string {
    return amount.toLocaleString();
  }
}

const instance = new EconomyService();
export default instance;
