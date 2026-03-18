"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User = require('../../models/User').default || require('../../models/User');
const registry = require('../../utils/registry.js');
const router = (0, express_1.Router)();
// GET /api/stats — global server stats for the dashboard home page
router.get('/', async (_req, res) => {
    try {
        const [totalUsers, sampleUsers] = await Promise.all([
            User.countDocuments(),
            User.find({}).select('animals stats gacha_inventory balance').lean(),
        ]);
        let totalPokemon = 0;
        let totalBalance = 0;
        let totalCharacters = 0;
        for (const u of sampleUsers) {
            totalBalance += u.balance || 0;
            totalCharacters += Array.isArray(u.gacha_inventory) ? u.gacha_inventory.length : 0;
            if (u.animals) {
                for (const rarityGroup of Object.values(u.animals)) {
                    if (rarityGroup && typeof rarityGroup === 'object') {
                        for (const count of Object.values(rarityGroup)) {
                            totalPokemon += count;
                        }
                    }
                }
            }
        }
        const allChars = registry.getAllCharacters();
        res.json({
            success: true,
            data: {
                totalUsers,
                totalPokemonCaught: totalPokemon,
                totalCharactersInRegistry: allChars.length,
                totalCharactersOwned: totalCharacters,
                totalCoinsCirculating: totalBalance,
            },
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
module.exports = router;
