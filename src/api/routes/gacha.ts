import { Router, Request, Response } from 'express';
import GachaHistory from '../../models/GachaHistory';
const registry = require('../../utils/registry.js');

const router = Router();

// GET /api/gacha/history — returns the 20 most recent legendary pulls
router.get('/history', async (_req: Request, res: Response) => {
  try {
    const history = await GachaHistory.find({})
      .sort({ timestamp: -1 })
      .limit(20)
      .lean();

    const formatted = history.map((h: any) => {
      const regChar = registry.getCharacter(h.itemName);
      return {
        ...h,
        emoji: regChar?.emoji || '✨',
        // Optional: Include a small thumbnail if we want to show it in the ticker
        image: regChar?.image_url || null,
      };
    });

    res.json({ success: true, data: formatted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
