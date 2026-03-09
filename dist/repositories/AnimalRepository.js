"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AnimalRegistry_ts_1 = __importDefault(require("../models/AnimalRegistry.ts"));
/**
 * ANIMAL REPOSITORY (Professional Librarian)
 */
class AnimalRepository {
    async getAll() {
        return await AnimalRegistry_ts_1.default.find({});
    }
    async findByRarityAndKey(rarity, key) {
        return await AnimalRegistry_ts_1.default.findOne({ rarity, key });
    }
    async findByRarity(rarity) {
        return await AnimalRegistry_ts_1.default.find({ rarity });
    }
    async getRandomByRarity(rarity) {
        const animals = await this.findByRarity(rarity);
        if (animals.length === 0)
            return null;
        return animals[Math.floor(Math.random() * animals.length)];
    }
}
const instance = new AnimalRepository();
exports.default = instance;
