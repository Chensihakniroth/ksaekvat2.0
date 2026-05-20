import { Router, Request, Response } from 'express';
const User = require('../../models/User').default || require('../../models/User');
const registry = require('../../utils/registry.js');

const router = Router();

/**
 * GET /api/shop/characters
 * Returns characters available for purchase, filtered and paginated.
 */
router.get('/characters', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const game = req.query.game as string;
    const rarity = req.query.rarity as string;
    const search = (req.query.search as string)?.toLowerCase();

    let characters = registry.getAllCharacters();

    // Filter by type character (no weapons in this shop)
    characters = characters.filter((c: any) => c.type === 'character' || !c.type);

    if (game && game !== 'all') {
      characters = characters.filter((c: any) => c.game === game);
    }
    if (rarity && rarity !== 'all') {
      characters = characters.filter((c: any) => String(c.rarity) === rarity);
    }
    if (search) {
      characters = characters.filter((c: any) => c.name.toLowerCase().includes(search));
    }

    // Sort: 5 star first, then name
    characters.sort((a: any, b: any) => {
      if (b.rarity !== a.rarity) return parseInt(b.rarity) - parseInt(a.rarity);
      return a.name.localeCompare(b.name);
    });

    const total = characters.length;
    const skip = (page - 1) * limit;
    const paginated = characters.slice(skip, skip + limit);

    const data = paginated.map((c: any) => ({
      name: c.name,
      game: c.game,
      rarity: c.rarity,
      element: c.element,
      emoji: c.emoji,
      price: c.rarity === '5' ? 600 : 400
    }));

    res.json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/shop/buy
 * Handles character purchase using star_dust.
 */
router.post('/buy', async (req: any, res: Response) => {
  const token = req.cookies?.ksaekvat_session;
  if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const jwt = require('jsonwebtoken');
    const { env } = require('../../utils/env.js');
    const decoded: any = jwt.verify(token, env.JWT_SECRET || 'ksaekvat-super-secret-jwt-key-change-me-in-prod-pls');
    
    const { characterName } = req.body;
    if (!characterName) return res.status(400).json({ success: false, error: 'Target character name required.' });

    const user = await User.findOne({ id: decoded.id });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const char = registry.getCharacter(characterName);
    if (!char) return res.status(404).json({ success: false, error: 'Character not found in database.' });

    const price = char.rarity === '5' ? 600 : 400;

    if (user.star_dust < price) {
      return res.status(400).json({ success: false, error: `Insufficient Star Dust! You need ${price} but only have ${user.star_dust}.` });
    }

    // Deduct currency
    user.star_dust -= price;

    // Add to inventory
    const existing = user.gacha_inventory.find((i: any) => i.name === char.name);
    if (existing) {
      existing.count = (existing.count || 1) + 1;
    } else {
      user.gacha_inventory.push({
        name: char.name,
        type: 'character',
        ascension: 0,
        refinement: 1,
        count: 1
      });
    }

    await user.save();

    res.json({ 
      success: true, 
      message: `Successfully acquired ${char.name}! (｡♥‿♥｡)`,
      newBalance: user.star_dust
    });

  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
