import { Router, Request, Response } from 'express';
const User = require('../../models/User').default || require('../../models/User');

const router = Router();

// GET /api/leaderboard?sort=balance&limit=10
router.get('/', async (req: Request, res: Response) => {
  try {
    const sort = (req.query.sort as string) || 'balance';
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const sortMap: Record<string, any> = {
      balance: { balance: -1 },
      level: { level: -1 },
      pokemon: { 'stats.totalAnimals': -1 },
      characters: { 'gacha_inventory': -1 },
    };

    const sortField = sortMap[sort] || sortMap['balance'];

    const users = await User.find({})
      .sort(sortField)
      .limit(limit)
      .select('id username level balance experience star_dust gacha_inventory stats')
      .lean();

    const formatted = users.map((u: any, idx: number) => ({
      rank: idx + 1,
      userId: u.id,
      username: u.username || 'Unknown Traveler',
      level: u.level || 1,
      balance: u.balance || 0,
      star_dust: u.star_dust || 0,
      experience: u.experience || 0,
      characterCount: Array.isArray(u.gacha_inventory) ? u.gacha_inventory.length : 0,
      pokemonCount: u.stats?.totalAnimals || 0,
    }));

    res.json({ success: true, sort, data: formatted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
