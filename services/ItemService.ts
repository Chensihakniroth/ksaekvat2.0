import { IGachaInventoryItem } from '../models/User.ts';
import registry from '../utils/registry.js';

/**
 * ITEM SERVICE (Professional TypeScript Edition)
 * Centralized logic for weapon refinements, selling logic, and inventory management.
 * (｡♥‿♥｡) Now with type-safety to ensure every weapon is handled perfectly!
 */

interface SellResult {
  totalGold: number;
  soldCount: number;
}

class ItemService {
  /**
   * Perform auto-ascension/refinement on all eligible weapons in inventory.
   */
  public autoRefineWeapons(gachaInv: IGachaInventoryItem[]): number {
    let ascendedCount = 0;

    gachaInv.forEach((item) => {
      if (item.type === 'weapon') {
        while (item.count > 1 && (item.refinement || 1) < 5) {
          item.refinement = (item.refinement || 1) + 1;
          item.count--;
          ascendedCount++;
        }
      }
    });

    return ascendedCount;
  }

  /**
   * Calculate and process selling excess (post-R5) weapons.
   */
  public sellExcessWeapons(gachaInv: IGachaInventoryItem[]): SellResult {
    let totalGold = 0;
    let soldCount = 0;

    gachaInv.forEach((item) => {
      if (item.type === 'weapon' && item.refinement === 5 && item.count > 1) {
        const extra = item.count - 1;
        const hydrated = registry.getItem(item.name);
        const rarity = hydrated?.rarity || 3;

        const prices: Record<number, number> = { 5: 25000, 4: 2500, 3: 250 };
        const price = prices[rarity as number] || 250;

        totalGold += extra * price;
        soldCount += extra;
        item.count = 1;
      }
    });

    return { totalGold, soldCount };
  }
}

const instance = new ItemService();
export default instance;
