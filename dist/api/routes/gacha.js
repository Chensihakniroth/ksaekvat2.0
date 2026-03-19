"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const GachaHistory_1 = __importDefault(require("../../models/GachaHistory"));
const registry = require('../../utils/registry.js');
const router = (0, express_1.Router)();
// GET /api/gacha/history — returns the 20 most recent legendary pulls
router.get('/history', async (_req, res) => {
    try {
        const history = await GachaHistory_1.default.find({})
            .sort({ timestamp: -1 })
            .limit(20)
            .lean();
        const formatted = history.map((h) => {
            const regChar = registry.getCharacter(h.itemName);
            return {
                ...h,
                emoji: regChar?.emoji || '✨',
                // Optional: Include a small thumbnail if we want to show it in the ticker
                image: regChar?.image_url || null,
            };
        });
        res.json({ success: true, data: formatted });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
module.exports = router;
