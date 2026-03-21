/**
 * GACHA SERVICE (Professional TypeScript Edition)
 * Centralized logic for roll rates, pity mechanics, and pool selection.
 * Now with type-safety to ensure every wish is perfect! (｡♥‿♥｡)
 */

interface RollResult {
  rarity: '3' | '4' | '5';
  pity5: number;
  pity4: number;
}

interface GachaItem {
  name: string;
  game: string;
  emoji: string;
  rarity: number;
  type?: 'character' | 'weapon';
}

interface MultiPullResult {
  results: GachaResultItem[];
  pity5: number;
  pity4: number;
}

interface GachaResultItem extends GachaItem {
  rarity: number;
}

class GachaService {
  private readonly BASE_RATE_5 = 0.6;
  private readonly SOFT_PITY_START = 75;
  private readonly HARD_PITY_5 = 90;
  private readonly HARD_PITY_4 = 10;

  /**
   * Determine the rarity of a single pull based on current pity.
   * Updates pity values in the returned object.
   */
  public rollRarity(currentPity5: number, currentPity4: number): RollResult {
    let pity5 = currentPity5 + 1;
    let pity4 = currentPity4 + 1;
    let rarity: '3' | '4' | '5';

    let currentRate5 = this.BASE_RATE_5;
    if (pity5 >= this.SOFT_PITY_START) {
      currentRate5 += (pity5 - this.SOFT_PITY_START + 1) * 6;
    }

    const rand = Math.random() * 100;

    if (pity5 >= this.HARD_PITY_5 || rand < currentRate5) {
      rarity = '5';
      pity5 = 0;
    } else if (pity4 >= this.HARD_PITY_4 || rand < currentRate5 + 5.1) {
      rarity = '4';
      pity4 = 0;
    } else {
      rarity = '3';
    }

    return { rarity, pity5, pity4 };
  }

  /**
   * Perform a multi-pull (usually 10).
   */
  public performMultiPull(userData: any, pool: Record<string, GachaItem[]>): MultiPullResult {
    const results: GachaResultItem[] = [];
    let { pity: pity5, pity4 } = userData;
    let hasHighRarity = false;

    for (let i = 0; i < 10; i++) {
      const roll = this.rollRarity(pity5, pity4);
      pity5 = roll.pity5;
      pity4 = roll.pity4;

      if (roll.rarity === '4' || roll.rarity === '5') {
        hasHighRarity = true;
      }

      const charList = pool[roll.rarity];
      const item = charList[Math.floor(Math.random() * charList.length)];
      results.push({ ...item, rarity: parseInt(roll.rarity) });
    }

    // Mommy's Guarantee! Ensures at least one 4-star or better per 10-pull. (｡♥‿♥｡)
    if (!hasHighRarity) {
      // Find a 3-star to replace
      const replacementIndex = results.findIndex(r => r.rarity === 3);
      if (replacementIndex !== -1) {
        const fourStarPool = pool['4'];
        if (fourStarPool && fourStarPool.length > 0) {
          const newItem = fourStarPool[Math.floor(Math.random() * fourStarPool.length)];
          results[replacementIndex] = { ...newItem, rarity: 4 };
        }
      }
    }

    return { results, pity5, pity4 };
  }
}

const instance = new GachaService();
export default instance;
