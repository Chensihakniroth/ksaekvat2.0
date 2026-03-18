import { Router, Request, Response } from 'express';
const User = require('../../models/User').default || require('../../models/User');

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const sort = (req.query.sort as string) || 'balance';
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    // Fetch all users and sort in JS (avoids Mongo issues with array fields)
    const users = await User.find({})
      .select('id username level balance experience star_dust gacha_inventory animals stats')
      .lean();

    // Count pokemon for each user
    const withCounts = users.map((u: any) => {
      let pokemonCount = 0;
      if (u.animals) {
        for (const rarityGroup of Object.values(u.animals)) {
          if (rarityGroup && typeof rarityGroup === 'object') {
            for (const count of Object.values(rarityGroup as any)) {
              pokemonCount += (count as number) || 0;
            }
          }
        }
      }
      return {
        userId: u.id,
        username: u.username || 'Unknown Traveler',
        level: u.level || 1,
        balance: u.balance || 0,
        star_dust: u.star_dust || 0,
        experience: u.experience || 0,
        characterCount: Array.isArray(u.gacha_inventory) ? u.gacha_inventory.length : 0,
        pokemonCount,
        commandsUsed: u.stats?.commandsUsed || 0,
      };
    });

    // Sort by desired field
    const sortFn: Record<string, (a: any, b: any) => number> = {
      balance: (a, b) => b.balance - a.balance,
      level: (a, b) => b.level - a.level || b.experience - a.experience,
      pokemon: (a, b) => b.pokemonCount - a.pokemonCount,
      characters: (a, b) => b.characterCount - a.characterCount,
    };

    const sorted = withCounts
      .sort(sortFn[sort] || sortFn['balance'])
      .slice(0, limit)
      .map((u, idx) => ({ rank: idx + 1, ...u }));

    res.json({ success: true, sort, total: withCounts.length, data: sorted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
