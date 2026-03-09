"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Character_ts_1 = __importDefault(require("../models/Character.ts"));
/**
 * CHARACTER REPOSITORY (Professional Librarian)
 */
class CharacterRepository {
    async findByName(name) {
        return await Character_ts_1.default.findOne({ name });
    }
    async getPoolByRarity() {
        const allChars = await Character_ts_1.default.find({});
        const pool = { '3': [], '4': [], '5': [] };
        for (const char of allChars) {
            if (pool[char.rarity])
                pool[char.rarity].push(char);
        }
        return pool;
    }
    async findByGame(game) {
        return await Character_ts_1.default.find({ game });
    }
    async getCount() {
        return await Character_ts_1.default.countDocuments();
    }
}
const instance = new CharacterRepository();
exports.default = instance;
