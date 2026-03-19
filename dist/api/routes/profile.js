"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User = require('../../models/User').default || require('../../models/User');
const registry = require('../../utils/registry.js');
const router = (0, express_1.Router)();
// GET /api/profile/search?query=...
router.get('/search', async (req, res) => {
    try {
        const query = String(req.query.query || '').trim();
        if (!query)
            return res.json({ success: true, data: [] });
        // Search by ID or Username (case-insensitive fuzzy)
        const users = await User.find({
            $or: [
                { id: query },
                { username: { $regex: query, $options: 'i' } }
            ]
        })
            .limit(10)
            .select('id username level')
            .lean();
        const formatted = users.map((u) => ({
            userId: u.id,
            username: u.username || 'Unknown Traveler',
            level: u.level || 1,
        }));
        res.json({ success: true, data: formatted });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// GET /api/profile/:userId
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findOne({ id: userId })
            .select('id username level balance experience star_dust gacha_inventory animals stats pokeballs dailyClaimed')
            .lean();
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        // Hydrate inventory: merge registry data with owned items
        const hydratedInventory = (user.gacha_inventory || [])
            .filter((item) => item.type !== 'weapon') // Surgical removal! (｡♥‿♥｡)
            .map((item) => {
            const regChar = registry.getCharacter(item.name);
            return {
                name: item.name,
                count: item.count || 1,
                game: regChar?.game || 'unknown',
                rarity: regChar?.rarity || '4',
                element: regChar?.element || null,
                role: regChar?.role || null,
                emoji: regChar?.emoji || '✨',
                image: regChar?.image || null,
            };
        });
        // Format animal collection with sprites
        const animalMap = {};
        const animalService = require('../../services/AnimalService').default;
        if (user.animals) {
            for (const [rarity, pokemonMap] of Object.entries(user.animals)) {
                animalMap[rarity] = {};
                if (pokemonMap && typeof pokemonMap === 'object') {
                    for (const [pokemon, count] of Object.entries(pokemonMap)) {
                        const sprite = await animalService.getPokemonSprite(pokemon);
                        // Only include if it's a real Pokemon! (•̀ᴗ•́)و
                        if (sprite || pokemonMap.hasOwnProperty(pokemon)) {
                            // We use the sprite as a truth check for "validity"
                            // but actually the service now returns null for non-pokemon.
                            if (sprite) {
                                animalMap[rarity][pokemon] = {
                                    count: count,
                                    sprite
                                };
                            }
                        }
                    }
                }
            }
        }
        const totalPokemon = Object.values(animalMap).reduce((acc, rarityGroup) => {
            return acc + Object.values(rarityGroup).reduce((s, c) => s + c.count, 0);
        }, 0);
        res.json({
            success: true,
            data: {
                userId: user.id,
                username: user.username || 'Unknown Traveler',
                level: user.level || 1,
                balance: user.balance || 0,
                star_dust: user.star_dust || 0,
                experience: user.experience || 0,
                pity: user.pity || 0,
                pity4: user.pity4 || 0,
                stats: user.stats || {},
                dailyClaimed: user.dailyClaimed || false,
                characters: hydratedInventory,
                characterCount: hydratedInventory.length,
                pokemon: animalMap,
                pokemonCount: totalPokemon,
            },
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// GET /api/profile — lists all users (paginated, public names only)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const skip = (page - 1) * limit;
        const users = await User.find({})
            .sort({ level: -1 })
            .skip(skip)
            .limit(limit)
            .select('id username level balance')
            .lean();
        const formatted = users.map((u) => ({
            userId: u.id,
            username: u.username || 'Unknown Traveler',
            level: u.level || 1,
            balance: u.balance || 0,
        }));
        res.json({ success: true, page, data: formatted });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
module.exports = router;
