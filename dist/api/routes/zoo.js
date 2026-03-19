"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AnimalRegistry_1 = __importDefault(require("../../models/AnimalRegistry"));
const AnimalService_1 = __importDefault(require("../../services/AnimalService"));
const axios_1 = __importDefault(require("axios"));
const router = (0, express_1.Router)();
// GET /api/zoo/registry — returns the full animal registry
router.get('/registry', async (_req, res) => {
    try {
        const registry = await AnimalRegistry_1.default.find({}).sort({ value: 1 }).lean();
        res.json({ success: true, data: registry });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// GET /api/zoo/image/:key — proxies Pokemon images to bypass Referer blocks
router.get('/image/:key', async (req, res) => {
    const { key } = req.params;
    try {
        const imageUrl = await AnimalService_1.default.getPokemonImage(key);
        if (!imageUrl)
            return res.status(404).send('Not found');
        if (imageUrl.startsWith('http')) {
            const response = await axios_1.default.get(imageUrl, {
                responseType: 'stream',
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Cache-Control', 'public, max-age=86400'); // 24h cache
            response.data.pipe(res);
        }
        else {
            // Local file
            const fullPath = require('path').isAbsolute(imageUrl)
                ? imageUrl
                : require('path').join(process.cwd(), imageUrl);
            res.sendFile(fullPath);
        }
    }
    catch (err) {
        res.status(500).send('Proxy error');
    }
});
// GET /api/zoo/sprite/:key — proxies Pokemon sprites
router.get('/sprite/:key', async (req, res) => {
    const { key } = req.params;
    try {
        const buffer = await AnimalService_1.default.getPokemonSpriteBuffer(key);
        if (!buffer)
            return res.status(404).send('Not found');
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.end(buffer);
    }
    catch (err) {
        res.status(500).send('Proxy error');
    }
});
module.exports = router;
