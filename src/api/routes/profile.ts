import { Router, Request, Response } from 'express';
const User = require('../../models/User').default || require('../../models/User');
const registry = require('../../utils/registry.js');

const router = Router();

// GET /api/profile/:userId
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ id: userId })
      .select('id username level balance experience star_dust gacha_inventory animals stats pokeballs dailyClaimed')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Hydrate inventory: merge registry data with owned items
    const hydratedInventory = (user.gacha_inventory || []).map((item: any) => {
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

    // Format animal collection
    const animalMap: Record<string, Record<string, number>> = {};
    if (user.animals) {
      for (const [rarity, pokemonMap] of Object.entries(user.animals as any)) {
        animalMap[rarity] = {};
        if (pokemonMap && typeof pokemonMap === 'object') {
          for (const [pokemon, count] of Object.entries(pokemonMap as any)) {
            animalMap[rarity][pokemon] = count as number;
          }
        }
      }
    }

    const totalPokemon = Object.values(animalMap).reduce((acc, rarityGroup) => {
      return acc + Object.values(rarityGroup).reduce((s, c) => s + c, 0);
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
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/profile — lists all users (paginated, public names only)
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;

    const users = await User.find({})
      .sort({ level: -1 })
      .skip(skip)
      .limit(limit)
      .select('id username level balance')
      .lean();

    const formatted = users.map((u: any) => ({
      userId: u.id,
      username: u.username || 'Unknown Traveler',
      level: u.level || 1,
      balance: u.balance || 0,
    }));

    res.json({ success: true, page, data: formatted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
