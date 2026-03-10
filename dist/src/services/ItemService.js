"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const registry_js_1 = __importDefault(require("../utils/registry.js"));
class ItemService {
    autoRefineWeapons(gachaInv) {
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
    sellExcessWeapons(gachaInv) {
        let totalGold = 0;
        let soldCount = 0;
        gachaInv.forEach((item) => {
            if (item.type === 'weapon' && item.refinement === 5 && item.count > 1) {
                const extra = item.count - 1;
                const hydrated = registry_js_1.default.getItem(item.name);
                const rarity = hydrated?.rarity || 3;
                const prices = { 5: 25000, 4: 2500, 3: 250 };
                const price = prices[rarity] || 250;
                totalGold += extra * price;
                soldCount += extra;
                item.count = 1;
            }
        });
        return { totalGold, soldCount };
    }
}
const instance = new ItemService();
exports.default = instance;
