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

const axios = require('axios');

// Helper to normalise names for Wiki filenames
const nameNormalizers: Record<string, (n: string) => string> = {
  genshin: (n) => n.replace(/ /g, '_'),
  hsr: (n) => n.replace(/ /g, '_'),
  wuwa: (n) => n.replace(/ /g, '_'),
  zzz: (n) => n.replace(/ /g, '_'),
};

const wikiConfigs: Record<string, { wiki: string; patterns: string[] }> = {
  genshin: { 
    wiki: 'genshin-impact', 
    patterns: ['{name}_Icon.png', '{name}.png'] 
  },
  hsr: { 
    wiki: 'honkai-star-rail', 
    patterns: ['Character_{name}_Icon.png', 'Icon_Character_{name}.png', '{name}_Icon.png'] 
  },
  wuwa: { 
    wiki: 'wutheringwaves', 
    patterns: ['Resonator_{name}.png', '{name}.png'] 
  },
  zzz: { 
    wiki: 'zenless-zone-zero', 
    patterns: ['Agent_{name}_Icon.png', '{name}_Icon.png'] 
  },
};

// In-memory cache for icon URLs: "game:name" -> "url"
const iconCache = new Map<string, string>();

// GET /api/characters/icon/:game/:name — Proxy for Fandom icons to fix 404s
router.get('/icon/:game/:name', async (req: Request, res: Response) => {
  try {
    const game = String(req.params.game).toLowerCase();
    const name = String(req.params.name);
    const cacheKey = `${game}:${name.toLowerCase()}`;

    // Check cache first to avoid 429s from Fandom
    if (iconCache.has(cacheKey)) {
      return res.redirect(iconCache.get(cacheKey)!);
    }

    const config = wikiConfigs[game];
    if (!config) return res.status(404).send('Game not supported');

    const normalized = nameNormalizers[game]?.(name) || name.replace(/ /g, '_');
    
    for (const pattern of config.patterns) {
      try {
        const filename = pattern.replace('{name}', normalized);
        const apiUrl = `https://${config.wiki}.fandom.com/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&format=json`;
        
        const response = await axios.get(apiUrl, { timeout: 3000 });
        const pages = response.data?.query?.pages;
        if (!pages) continue;

        const page = Object.values(pages)[0] as any;
        if (page && page.imageinfo && page.imageinfo[0]?.url) {
          const validUrl = page.imageinfo[0].url;
          iconCache.set(cacheKey, validUrl); // Cache it!
          return res.redirect(validUrl);
        }
      } catch (err) {
        // Continue to next pattern
      }
    }

    // Final fallback to a generic silhouette or placeholder
    res.redirect('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png');
  } catch (err) {
    res.redirect('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png');
  }
});

module.exports = router;
