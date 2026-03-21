"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const compression = require('compression');
const router = (0, express_1.Router)();
// Enable Gzip compression
router.use(compression());
// --- CORS and basic headers ---
router.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'public, max-age=60'); // 1 minute browser cache
    next();
});
// --- Simple rate limiter (in-memory) ---
const requestLog = new Map();
router.use((req, res, next) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const entry = requestLog.get(ip);
    if (!entry || entry.resetAt < now) {
        requestLog.set(ip, { count: 1, resetAt: now + 60_000 });
        return next();
    }
    entry.count++;
    // Increased limit for dashboard functionality (galleries/icons)
    if (entry.count > 1000) {
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
router.use('/zoo', require('./routes/zoo'));
router.use('/auth', require('./routes/auth'));
// --- Health ---
router.get('/ping', (_req, res) => res.json({ success: true, message: 'KSAEKVAT API is alive! ヽ(>∀<☆)ノ' }));
module.exports = router;
