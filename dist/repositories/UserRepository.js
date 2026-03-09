"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_ts_1 = __importDefault(require("../models/User.ts"));
/**
 * USER REPOSITORY (Professional Librarian)
 */
class UserRepository {
    async findById(id, username = 'Unknown Traveler') {
        let user = await User_ts_1.default.findOne({ id });
        if (!user)
            user = await User_ts_1.default.create({ id, username });
        return user;
    }
    async save(user) {
        return await user.save();
    }
    async updateStats(id, statsUpdate) {
        return await User_ts_1.default.findOneAndUpdate({ id }, { $inc: statsUpdate }, { new: true });
    }
    async getAll() {
        return await User_ts_1.default.find({});
    }
    async getTopBalances(limit = 10) {
        return await User_ts_1.default.find({}).sort({ balance: -1 }).limit(limit);
    }
}
const instance = new UserRepository();
exports.default = instance;
