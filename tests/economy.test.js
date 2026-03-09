const economyService = require('../services/EconomyService');

// We'll mock the config so we can test with predictable numbers!
// (Industry standard: Mocking external dependencies)
jest.mock('../config/config.js', () => ({
  economy: {
    maxBet: 1000000,
    workReward: { min: 100, max: 500 }
  }
}));

describe('EconomyService', () => {
  
  describe('parseBet', () => {
    test('should parse a simple number correctly', () => {
      const result = economyService.parseBet('500', 1000);
      expect(result).toBe(500);
    });

    test('should return max balance if input is "all"', () => {
      const result = economyService.parseBet('all', 1000);
      expect(result).toBe(1000);
    });

    test('should cap "all" bet at maxLimit', () => {
      const result = economyService.parseBet('all', 5000000, 1000000);
      expect(result).toBe(1000000);
    });

    test('should return 0 for invalid inputs', () => {
      expect(economyService.parseBet('not-a-number', 1000)).toBe(0);
      expect(economyService.parseBet('-100', 1000)).toBe(0);
      expect(economyService.parseBet('', 1000)).toBe(0);
    });
  });

  describe('format', () => {
    test('should format numbers with commas correctly', () => {
      expect(economyService.format(1000)).toBe('1,000');
      expect(economyService.format(1000000)).toBe('1,000,000');
    });
  });

});
