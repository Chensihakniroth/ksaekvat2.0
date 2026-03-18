import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

// --- CORS and basic headers ---
router.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=30'); // 30 second cache
  next();
});

// --- Simple rate limiter (in-memory) ---
const requestLog = new Map<string, { count: number; resetAt: number }>();
router.use((req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const entry = requestLog.get(ip);

  if (!entry || entry.resetAt < now) {
    requestLog.set(ip, { count: 1, resetAt: now + 60_000 });
    return next();
  }

  entry.count++;
  if (entry.count > 60) {
    return res.status(429).json({ success: false, error: 'Too many requests. Slow down, darling! (ᗒᗣᗕ)' });
  }
  next();
});

// --- Route Mounts ---
router.use('/leaderboard', require('./routes/leaderboard'));
router.use('/profile', require('./routes/profile'));
router.use('/characters', require('./routes/characters'));
router.use('/stats', require('./routes/stats'));
router.use('/gacha', require('./routes/gacha'));

// --- Health ---
router.get('/ping', (_req, res) => res.json({ success: true, message: 'KsaeKvat API is alive! ヽ(>∀<☆)ノ' }));

module.exports = router;
