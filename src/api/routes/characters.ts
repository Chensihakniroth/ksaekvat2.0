import { Router, Request, Response } from 'express';
const registry = require('../../utils/registry.js');

const router = Router();

// GET /api/characters — all characters (optional ?game=genshin&rarity=5)
router.get('/', (req: Request, res: Response) => {
  try {
    let characters = registry.getAllCharacters();

    if (req.query.game) {
      characters = characters.filter((c: any) => c.game === req.query.game);
    }
    if (req.query.rarity) {
      characters = characters.filter((c: any) => c.rarity === req.query.rarity);
    }
    if (req.query.type) {
      characters = characters.filter((c: any) => c.type === req.query.type);
    }

    // Sort by rarity descending then name
    characters.sort((a: any, b: any) => {
      if (b.rarity !== a.rarity) return parseInt(b.rarity) - parseInt(a.rarity);
      return a.name.localeCompare(b.name);
    });

    const formatted = characters.map((c: any) => ({
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

    const games = [...new Set(formatted.map((c: any) => c.game))];

    res.json({
      success: true,
      total: formatted.length,
      games,
      data: formatted,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/characters/games — just the list of available games
router.get('/games', (_req: Request, res: Response) => {
  const characters = registry.getAllCharacters();
  const games = [...new Set(characters.map((c: any) => c.game))];
  res.json({ success: true, games });
});

module.exports = router;
