"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const GachaHistory_1 = __importDefault(require("../../models/GachaHistory"));
const registry = require('../../utils/registry.js');
const router = (0, express_1.Router)();
// GET /api/gacha/history — returns the 30 most recent high-rarity pulls
router.get('/history', async (_req, res) => {
    try {
        // 1. Get Gacha Pulls (4-stars and 5-stars)
        const pulls = await GachaHistory_1.default.find({ rarity: { $gte: 4 } })
            .sort({ timestamp: -1 })
            .limit(30)
            .lean();
        // 2. Fetch registry for icons/emojis
        const formatted = pulls.map((h) => {
            const regChar = registry.getCharacter(h.itemName);
            return {
                id: h._id,
                type: 'gacha',
                username: h.username || 'Traveler',
                itemName: h.itemName,
                game: h.game || 'unknown',
                rarity: h.rarity,
                emoji: regChar?.emoji || '✨',
                timestamp: h.timestamp,
                image: regChar?.image_url || null,
            };
        });
        // 3. Optional: Add a few recent legendary/mythical animals if you have a way to track them 
        // (For now, we'll just focus on the high-quality gacha history)
        res.json({ success: true, data: formatted });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
module.exports = router;
