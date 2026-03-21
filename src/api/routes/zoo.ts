import { Router, Request, Response } from 'express';
import AnimalRegistry from '../../models/AnimalRegistry';
import AnimalService from '../../services/AnimalService';
import axios from 'axios';
const cache = require('../../utils/cache');

const router = Router();

// GET /api/zoo/registry — returns all possible animals
router.get('/registry', async (_req: Request, res: Response) => {
  try {
    const data = await cache.get('zoo_registry', 600_000, async () => {
      return await AnimalRegistry.find({}).sort({ rarity: 1, name: 1 }).lean();
    });
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/zoo/image/:key — proxies Pokemon images to bypass Referer blocks
router.get('/image/:key', async (req: Request, res: Response) => {
  const { key } = req.params;
  try {
    const imageUrl = await AnimalService.getPokemonImage(key as string);
    if (!imageUrl) return res.status(404).send('Not found');

    if ((imageUrl as string).startsWith('http')) {
      const response = await axios.get(imageUrl as string, {
        responseType: 'stream',
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 24h cache
      response.data.pipe(res);
    } else {
      // Local file
      const fullPath = require('path').isAbsolute(imageUrl as string) 
        ? (imageUrl as string) 
        : require('path').join(process.cwd(), imageUrl as string);
      res.sendFile(fullPath);
    }
  } catch (err) {
    res.status(500).send('Proxy error');
  }
});

// GET /api/zoo/sprite/:key — proxies Pokemon sprites
router.get('/sprite/:key', async (req: Request, res: Response) => {
  const { key } = req.params;
  try {
    const buffer = await AnimalService.getPokemonSpriteBuffer(key as string);
    if (!buffer) return res.status(404).send('Not found');

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.end(buffer);
  } catch (err) {
    res.status(500).send('Proxy error');
  }
});

module.exports = router;
