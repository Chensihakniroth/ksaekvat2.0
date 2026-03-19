import { Router, Request, Response } from 'express';
const User = require('../../models/User').default || require('../../models/User');
const cache = require('../../utils/cache');

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const sort = (req.query.sort as string) || 'balance';
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const cacheKey = `leaderboard_${sort}_${limit}`;
    const result = await cache.get(cacheKey, 300_000, async () => {
      // 1. Build Query & Sort
      const mongoSort: Record<string, any> = {};
      if (sort === 'balance') mongoSort.balance = -1;
      else if (sort === 'level') { mongoSort.level = -1; mongoSort.experience = -1; }
      else mongoSort.balance = -1; // Default

      // 2. Fetch only what we need (The Scale Fix!)
      const users = await User.find({})
        .sort(mongoSort)
        .limit(limit * 2) // Fetch a bit extra for complex sorts
        .select('id username level balance experience star_dust gacha_inventory animals stats')
        .lean();

      const withCounts = users.map((u: any) => {
        let pokemonCount = 0;
        if (u.animals) {
          const rarityValues = u.animals instanceof Map ? u.animals.values() : Object.values(u.animals);
          for (const rarityGroup of rarityValues) {
            if (rarityGroup && typeof rarityGroup === 'object') {
              const counts = rarityGroup instanceof Map ? rarityGroup.values() : Object.values(rarityGroup);
              for (const count of counts) {
                pokemonCount += (count as number) || 0;
              }
            }
          }
        }
        return {
          userId: String(u.id || u._id),
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

      // 3. Final refinement for cases where MongoDB can't sort (like Pokemon count)
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

      const total = await User.countDocuments();
      return { total, data: sorted };
    });

    res.json({ success: true, sort, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
