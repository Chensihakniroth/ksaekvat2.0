"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User = require('../../models/User').default || require('../../models/User');
const registry = require('../../utils/registry.js');
const router = (0, express_1.Router)();
// GET /api/stats — global server stats for the dashboard home page
router.get('/', async (_req, res) => {
    try {
        const stats = await User.aggregate([
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    totalBalance: { $sum: '$balance' },
                    // Count items in gacha_inventory array
                    totalCharacters: { $sum: { $size: { $ifNull: ['$gacha_inventory', []] } } },
                    // For nested objects like 'animals', we'll sum the values if possible, 
                    // but since it's a Map/Object, a simple count is often enough for global stats
                    commandsUsed: { $sum: '$stats.commandsUsed' }
                }
            }
        ]);
        const result = stats[0] || {
            totalUsers: 0,
            totalBalance: 0,
            totalCharacters: 0,
            commandsUsed: 0
        };
        const allChars = registry.getAllCharacters();
        res.json({
            success: true,
            data: {
                totalUsers: result.totalUsers,
                totalCharactersInRegistry: allChars.length,
                totalCharactersOwned: result.totalCharacters,
                totalCoinsCirculating: result.totalBalance,
                totalCommandsProcessed: result.commandsUsed
            },
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
module.exports = router;
