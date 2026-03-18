"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const registry = require('../../utils/registry.js');
const router = (0, express_1.Router)();
// GET /api/characters — all characters (optional ?game=genshin&rarity=5)
router.get('/', (req, res) => {
    try {
        let characters = registry.getAllCharacters();
        if (req.query.game) {
            characters = characters.filter((c) => c.game === req.query.game);
        }
        if (req.query.rarity) {
            characters = characters.filter((c) => c.rarity === req.query.rarity);
        }
        if (req.query.type) {
            characters = characters.filter((c) => c.type === req.query.type);
        }
        // Sort by rarity descending then name
        characters.sort((a, b) => {
            if (b.rarity !== a.rarity)
                return parseInt(b.rarity) - parseInt(a.rarity);
            return a.name.localeCompare(b.name);
        });
        const formatted = characters.map((c) => ({
            name: c.name,
            game: c.game,
            rarity: c.rarity,
            element: c.element || null,
            role: c.role || null,
            emoji: c.emoji || null,
            image_url: c.image_url || null,
            type: c.type || 'character',
            shopPrice: c.rarity === '5' ? 400 : 200,
        }));
        const games = [...new Set(formatted.map((c) => c.game))];
        res.json({
            success: true,
            total: formatted.length,
            games,
            data: formatted,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// GET /api/characters/games — just the list of available games
router.get('/games', (_req, res) => {
    const characters = registry.getAllCharacters();
    const games = [...new Set(characters.map((c) => c.game))];
    res.json({ success: true, games });
});
module.exports = router;
