"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const User = require('../../models/User').default || require('../../models/User');
const registry = require('../../utils/registry.js');
const animalService = require('../../services/AnimalService').default || require('../../services/AnimalService');
const mongoose = require('mongoose');
const { env } = require('../../utils/env.js');
const router = (0, express_1.Router)();
// Fetch live Discord user data using the bot token
// This ensures avatar and decoration are always up-to-date
async function fetchDiscordUser(discordId) {
    try {
        const res = await axios_1.default.get(`https://discord.com/api/v10/users/${discordId}`, {
            headers: { Authorization: `Bot ${env.DISCORD_TOKEN}` },
            timeout: 5000,
        });
        const data = res.data;
        const bannerHash = data.banner || null;
        let bannerUrl = null;
        if (bannerHash) {
            const ext = bannerHash.startsWith('a_') ? 'gif' : 'png';
            bannerUrl = `https://cdn.discordapp.com/banners/${discordId}/${bannerHash}.${ext}?size=1024`;
        }
        return {
            avatar: data.avatar || null,
            avatarDecoration: data.avatar_decoration_data?.asset || null,
            username: data.username || null,
            banner: bannerUrl,
            bannerColor: data.banner_color || null,
        };
    }
    catch (err) {
        console.warn(`[Backend] Failed to fetch Discord user ${discordId}:`, err?.message || err);
        return null;
    }
}
// ... existing search route ...
// GET /api/profile/:userId
router.get('/:userId', async (req, res) => {
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
                username: { $regex: new RegExp(`^${userId}$`, 'i') },
            }).lean();
        }
        // 4. Try finding by Custom Slug (Case-insensitive)
        if (!user) {
            user = await User.findOne({
                'profileTheme.slug': { $regex: new RegExp(`^${userId}$`, 'i') },
            }).lean();
        }
        if (!user) {
            console.warn(`[Backend] Profile not found for UID: ${userId}`);
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        console.log(`[Backend] Loading profile for: ${user.username} (${user.id})`);
        // Fetch live Discord data (avatar + decoration) using the bot token
        const discordData = await fetchDiscordUser(user.id);
        // Hydrate inventory
        const hydratedInventory = (user.gacha_inventory || [])
            .filter((item) => item.type !== 'weapon')
            .map((item) => {
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
        const animalMap = {};
        if (user.animals) {
            for (const [rarity, pokemonMap] of Object.entries(user.animals)) {
                animalMap[rarity] = {};
                if (pokemonMap && typeof pokemonMap === 'object') {
                    for (const [pokemon, count] of Object.entries(pokemonMap)) {
                        try {
                            const sprite = await animalService.getPokemonSprite(pokemon);
                            if (sprite) {
                                animalMap[rarity][pokemon] = {
                                    count: count,
                                    sprite,
                                };
                            }
                        }
                        catch (err) {
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
        const hydratedFavorites = await Promise.all((user.profileTheme?.favorites || []).map(async (fav) => {
            if (fav.type === 'character') {
                const char = registry.getCharacter(fav.name);
                return {
                    type: 'character',
                    name: fav.name,
                    rarity: char?.rarity || '4',
                    game: char?.game || 'unknown',
                    emoji: char?.emoji || '✨',
                };
            }
            else {
                const sprite = await animalService.getPokemonSprite(fav.name);
                return {
                    type: 'animal',
                    name: fav.name,
                    sprite: sprite || null,
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
                customPrefix: user.customPrefix || null,
                customSubPrefix: user.customSubPrefix || null,
                profileTheme: {
                    theme: 'default',
                    accentColor: '#22d3ee',
                    bio: 'Exploring the digital realm.',
                    slug: null,
                    showStats: true,
                    showInventory: true,
                    publicLeaderboard: true,
                    dmOnLevelUp: true,
                    compactLogs: false,
                    ...(user.profileTheme || {}),
                    portfolio: user.profileTheme?.portfolio || [],
                    favorites: hydratedFavorites,
                    // Use live Discord data first, fallback to DB
                    avatar: discordData?.avatar || user.profileTheme?.avatar || null,
                    avatarDecoration: discordData?.avatarDecoration || user.profileTheme?.avatarDecoration || null,
                    banner: discordData?.banner || user.profileTheme?.banner || null,
                    bannerColor: discordData?.bannerColor || user.profileTheme?.bannerColor || null,
                },
            },
        });
    }
    catch (err) {
        console.error(`[Backend] Profile fetch error for ${req.params.userId}:`, err);
        res.status(500).json({ success: false, error: err.message });
    }
});
// POST /api/profile/update
router.post('/update', async (req, res) => {
    const token = req.cookies?.ksaekvat_session;
    if (!token)
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    try {
        const jwt = require('jsonwebtoken');
        const { env } = require('../../utils/env.js');
        const decoded = jwt.verify(token, env.JWT_SECRET || 'ksaekvat-super-secret-jwt-key-change-me-in-prod-pls');
        const { bio, accentColor, background, music, socials, banner, bannerPosition, avatar, showStats, showInventory, publicLeaderboard, dmOnLevelUp, compactLogs, portfolio, favorites, slug, customPrefix, customSubPrefix, } = req.body;
        const user = await User.findOne({ id: decoded.id });
        if (!user)
            return res.status(404).json({ success: false, error: 'User not found' });
        // Validate prefix if provided
        if (customPrefix !== undefined) {
            if (customPrefix !== null && customPrefix !== '') {
                const trimmed = customPrefix.trim();
                const FORBIDDEN_PREFIXES = ['@', '#', '/', '\\', '`'];
                if (trimmed.length > 5) {
                    return res.status(400).json({ success: false, error: 'Prefix must be 5 characters or fewer.' });
                }
                if (FORBIDDEN_PREFIXES.some(p => trimmed.includes(p))) {
                    return res.status(400).json({ success: false, error: 'Prefix contains forbidden characters.' });
                }
                user.customPrefix = trimmed;
            }
            else {
                user.customPrefix = null;
            }
        }
        if (customSubPrefix !== undefined) {
            if (customSubPrefix !== null && customSubPrefix !== '') {
                user.customSubPrefix = customSubPrefix.trim().slice(0, 5);
            }
            else {
                user.customSubPrefix = null;
            }
        }
        // Validate and check slug uniqueness if provided
        if (slug && slug !== user.profileTheme?.slug) {
            if (!/^[a-zA-Z0-9-_]+$/.test(slug)) {
                return res
                    .status(400)
                    .json({
                    success: false,
                    error: 'Invalid slug format. Use only letters, numbers, dashes, and underscores.',
                });
            }
            const slugExists = await User.findOne({
                'profileTheme.slug': { $regex: new RegExp(`^${slug}$`, 'i') },
            });
            if (slugExists)
                return res
                    .status(400)
                    .json({ success: false, error: 'This custom URL slug is already taken.' });
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
            publicLeaderboard: publicLeaderboard !== undefined ? publicLeaderboard : user.profileTheme.publicLeaderboard,
            dmOnLevelUp: dmOnLevelUp !== undefined ? dmOnLevelUp : user.profileTheme.dmOnLevelUp,
            compactLogs: compactLogs !== undefined ? compactLogs : user.profileTheme.compactLogs,
            portfolio: portfolio !== undefined ? portfolio : user.profileTheme.portfolio,
            favorites: favorites !== undefined ? favorites : user.profileTheme.favorites,
            socials: {
                ...user.profileTheme.socials,
                ...(socials || {}),
            },
        };
        await user.save();
        res.json({ success: true, message: 'Profile updated successfully! (◕‿◕✿)' });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// POST /api/profile/upload-mp3
router.post('/upload-mp3', async (req, res) => {
    const token = req.cookies?.ksaekvat_session;
    if (!token)
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    try {
        const jwt = require('jsonwebtoken');
        const { env } = require('../../utils/env.js');
        const fs = require('fs');
        const path = require('path');
        const decoded = jwt.verify(token, env.JWT_SECRET || 'ksaekvat-super-secret-jwt-key-change-me-in-prod-pls');
        const { base64Audio } = req.body;
        if (!base64Audio)
            return res.status(400).json({ success: false, error: 'Audio data missing.' });
        // Ensure audio directory exists
        const audioDir = path.join(__dirname, '../../../assets/audio');
        if (!fs.existsSync(audioDir)) {
            fs.mkdirSync(audioDir, { recursive: true });
        }
        // Process base64
        const base64Data = base64Audio.replace(/^data:audio\/mpeg;base64,/, '');
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
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// GET /api/profile — lists all users (paginated, public names only)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const skip = (page - 1) * limit;
        const users = await User.find({})
            .sort({ level: -1 })
            .skip(skip)
            .limit(limit)
            .select('id username level balance')
            .lean();
        const formatted = users.map((u) => ({
            userId: u.id,
            username: u.username || 'Unknown Traveler',
            level: u.level || 1,
            balance: u.balance || 0,
        }));
        res.json({ success: true, page, data: formatted });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
module.exports = router;
