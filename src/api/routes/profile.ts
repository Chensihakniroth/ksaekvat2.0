import { Router, Request, Response } from 'express';
const User = require('../../models/User').default || require('../../models/User');
const registry = require('../../utils/registry.js');
const animalService = require('../../services/AnimalService').default || require('../../services/AnimalService');
const mongoose = require('mongoose');

const router = Router();

// ... existing search route ...

// GET /api/profile/:userId
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // 1. Try finding by Discord ID (Numeric string)
    let user = await User.findOne({ id: userId }).lean();
    
    // 2. Try finding by MongoDB _id
    if (!user && mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId).lean();
    }

    // 3. Try finding by Username (Case-insensitive)
    if (!user) {
      user = await User.findOne({ 
        username: { $regex: new RegExp(`^${userId}$`, 'i') } 
      }).lean();
    }

    // 4. Try finding by Custom Slug (Case-insensitive)
    if (!user) {
      user = await User.findOne({
        'profileTheme.slug': { $regex: new RegExp(`^${userId}$`, 'i') }
      }).lean();
    }

    if (!user) {
      console.warn(`[Backend] Profile not found for UID: ${userId}`);
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    console.log(`[Backend] Loading profile for: ${user.username} (${user.id})`);

    // Hydrate inventory
    const hydratedInventory = (user.gacha_inventory || [])
      .filter((item: any) => item.type !== 'weapon')
      .map((item: any) => {
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
    const animalMap: Record<string, Record<string, { count: number; sprite: string | null }>> = {};

    if (user.animals) {
      for (const [rarity, pokemonMap] of Object.entries(user.animals as any)) {
        animalMap[rarity] = {};
        if (pokemonMap && typeof pokemonMap === 'object') {
          for (const [pokemon, count] of Object.entries(pokemonMap as any)) {
            try {
              const sprite = await animalService.getPokemonSprite(pokemon);
              if (sprite) {
                animalMap[rarity][pokemon] = {
                  count: count as number,
                  sprite
                };
              }
            } catch (err) {
              console.error(`[Backend] Failed to get sprite for ${pokemon}:`, err);
            }
          }
        }
      }
    }

    const totalPokemon = Object.values(animalMap).reduce((acc, rarityGroup) => {
      return acc + Object.values(rarityGroup).reduce((s, c) => s + (c.count || 0), 0);
    }, 0);

    // Hydrate Favorites
    const hydratedFavorites = await Promise.all((user.profileTheme?.favorites || []).map(async (fav: any) => {
      if (fav.type === 'character') {
        const char = registry.getCharacter(fav.name);
        return {
          type: 'character',
          name: fav.name,
          rarity: char?.rarity || '4',
          game: char?.game || 'unknown',
          emoji: char?.emoji || '✨'
        };
      } else {
        const sprite = await animalService.getPokemonSprite(fav.name);
        return {
          type: 'animal',
          name: fav.name,
          sprite: sprite || null
        };
      }
    }));

    res.json({
      success: true,
      data: {
        userId: user.id || user._id.toString(),
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
        profileTheme: {
          ...(user.profileTheme || {
            theme: 'default',
            accentColor: '#22d3ee',
            bio: 'Exploring the digital realm.',
            slug: null,
            showStats: true,
            showInventory: true,
            socials: {}
          }),
          portfolio: user.profileTheme?.portfolio || [],
          favorites: hydratedFavorites
        }
      },
    });
  } catch (err: any) {
    console.error(`[Backend] Profile fetch error for ${req.params.userId}:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/profile/update
router.post('/update', async (req: any, res: Response) => {
  const token = req.cookies?.ksaekvat_session;
  if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const jwt = require('jsonwebtoken');
    const { env } = require('../../utils/env.js');
    const decoded: any = jwt.verify(token, env.JWT_SECRET || 'ksaekvat-super-secret-jwt-key-change-me-in-prod-pls');
    
    const { bio, accentColor, background, music, socials, banner, bannerPosition, avatar, showStats, showInventory, portfolio, favorites, slug } = req.body;

    const user = await User.findOne({ id: decoded.id });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    // Validate and check slug uniqueness if provided
    if (slug && slug !== user.profileTheme?.slug) {
      if (!/^[a-zA-Z0-9-_]+$/.test(slug)) {
        return res.status(400).json({ success: false, error: 'Invalid slug format. Use only letters, numbers, dashes, and underscores.' });
      }
      const slugExists = await User.findOne({ 'profileTheme.slug': { $regex: new RegExp(`^${slug}$`, 'i') } });
      if (slugExists) return res.status(400).json({ success: false, error: 'This custom URL slug is already taken.' });
    }

    // Update profile theme object
    user.profileTheme = {
      ...user.profileTheme,
      bio: bio !== undefined ? bio : user.profileTheme.bio,
      accentColor: accentColor !== undefined ? accentColor : user.profileTheme.accentColor,
      background: background !== undefined ? background : user.profileTheme.background,
      music: music !== undefined ? music : user.profileTheme.music,
      banner: banner !== undefined ? banner : user.profileTheme.banner,
      bannerPosition: bannerPosition !== undefined ? bannerPosition : user.profileTheme.bannerPosition,
      avatar: avatar !== undefined ? avatar : user.profileTheme.avatar,
      slug: slug !== undefined ? slug : user.profileTheme.slug,
      showStats: showStats !== undefined ? showStats : user.profileTheme.showStats,
      showInventory: showInventory !== undefined ? showInventory : user.profileTheme.showInventory,
      portfolio: portfolio !== undefined ? portfolio : user.profileTheme.portfolio,
      favorites: favorites !== undefined ? favorites : user.profileTheme.favorites,
      socials: {
        ...user.profileTheme.socials,
        ...(socials || {})
      }
    };

    await user.save();
    res.json({ success: true, message: 'Profile updated successfully! (◕‿◕✿)' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/profile/upload-mp3
router.post('/upload-mp3', async (req: any, res: Response) => {
  const token = req.cookies?.ksaekvat_session;
  if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const jwt = require('jsonwebtoken');
    const { env } = require('../../utils/env.js');
    const fs = require('fs');
    const path = require('path');
    const decoded: any = jwt.verify(token, env.JWT_SECRET || 'ksaekvat-super-secret-jwt-key-change-me-in-prod-pls');
    
    const { base64Audio } = req.body;
    if (!base64Audio) return res.status(400).json({ success: false, error: 'Audio data missing.' });

    // Ensure audio directory exists
    const audioDir = path.join(__dirname, '../../../assets/audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    // Process base64
    const base64Data = base64Audio.replace(/^data:audio\/mpeg;base64,/, "");
    const filePath = path.join(audioDir, `user_${decoded.id}.mp3`);
    
    fs.writeFileSync(filePath, base64Data, 'base64');

    const publicUrl = `/assets/audio/user_${decoded.id}.mp3?t=${Date.now()}`;

    // Auto-update user profile music
    const user = await User.findOne({ id: decoded.id });
    if (user) {
      user.profileTheme.music = publicUrl;
      await user.save();
    }

    res.json({ success: true, url: publicUrl });
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
