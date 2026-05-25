"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const GuildConfig_1 = __importDefault(require("../../models/GuildConfig"));
const env_js_1 = require("../../utils/env.js");
const router = (0, express_1.Router)();
// Helper to verify auth and return user details + accessToken
function verifyAuth(req, res) {
    const token = req.cookies?.ksaekvat_session;
    if (!token) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return null;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_js_1.env.JWT_SECRET || 'ksaekvat-super-secret-jwt-key-change-me-in-prod-pls');
        return decoded;
    }
    catch (err) {
        res.status(401).json({ success: false, error: 'Invalid or expired session' });
        return null;
    }
}
// GET /api/guild/list
// Returns all guilds where the user has Manage Guild / Administrator permissions, split by whether the bot is in them or not
router.get('/list', async (req, res) => {
    const user = verifyAuth(req, res);
    if (!user)
        return; // verifyAuth already sent response
    const accessToken = user.accessToken;
    if (!accessToken) {
        return res.status(401).json({ success: false, error: 'Discord access token missing. Please log in again.' });
    }
    try {
        // 1. Fetch user's guilds from Discord OAuth API
        const discordRes = await axios_1.default.get('https://discord.com/api/v10/users/@me/guilds', {
            headers: { Authorization: `Bearer ${accessToken}` },
            timeout: 5000,
        });
        const userGuilds = discordRes.data;
        if (!Array.isArray(userGuilds)) {
            return res.status(500).json({ success: false, error: 'Invalid response from Discord' });
        }
        const MANAGE_GUILD = 0x20n;
        const ADMINISTRATOR = 0x8n;
        const client = req.app.locals.client;
        if (!client) {
            return res.status(500).json({ success: false, error: 'Discord bot client is offline' });
        }
        // 2. Filter guilds where user is admin/manager
        const adminGuilds = userGuilds.filter((g) => {
            if (g.owner)
                return true;
            const perms = BigInt(g.permissions);
            return (perms & MANAGE_GUILD) === MANAGE_GUILD || (perms & ADMINISTRATOR) === ADMINISTRATOR;
        });
        // 3. Separate guilds by bot presence and fetch configs for active ones
        const mutualGuildIds = adminGuilds
            .filter((g) => client.guilds.cache.has(g.id))
            .map((g) => g.id);
        const dbConfigs = await GuildConfig_1.default.find({ guildId: { $in: mutualGuildIds } }).lean();
        const configMap = new Map(dbConfigs.map((c) => [c.guildId, c]));
        const formattedGuilds = adminGuilds.map((g) => {
            const botIn = client.guilds.cache.has(g.id);
            const iconUrl = g.icon
                ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`
                : null;
            let config = null;
            if (botIn) {
                config = configMap.get(g.id) || {
                    guildId: g.id,
                    guildName: g.name,
                    prefix: 'k',
                    welcomeEnabled: false,
                    welcomeChannel: null,
                    welcomeMessage: 'Welcome {user} to the server!',
                    loggingEnabled: false,
                    logChannel: null,
                    modules: {
                        rpg: true,
                        economy: true,
                        gacha: true,
                        hunting: true,
                        aiChat: true,
                    },
                };
            }
            return {
                id: g.id,
                name: g.name,
                icon: g.icon,
                iconUrl,
                botIn,
                config,
            };
        });
        res.json({ success: true, guilds: formattedGuilds });
    }
    catch (err) {
        console.error('[Backend] Guild list error:', err?.response?.data || err.message);
        if (err?.response?.status === 401) {
            return res.status(401).json({ success: false, error: 'Discord session expired. Please log in again.' });
        }
        res.status(500).json({ success: false, error: err.message });
    }
});
// GET /api/guild/:guildId
// Returns the configuration and text channels of a specific guild
router.get('/:guildId', async (req, res) => {
    const user = verifyAuth(req, res);
    if (!user)
        return;
    const { guildId } = req.params;
    const client = req.app.locals.client;
    if (!client) {
        return res.status(500).json({ success: false, error: 'Discord bot client is offline' });
    }
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
        return res.status(404).json({ success: false, error: 'Bot is not in this guild' });
    }
    try {
        // Check user permissions in this guild
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            return res.status(403).json({ success: false, error: 'You are not a member of this server' });
        }
        const hasPerm = member.permissions.has('ManageGuild') || member.permissions.has('Administrator');
        if (!hasPerm) {
            return res.status(403).json({ success: false, error: 'You do not have permission to configure this server' });
        }
        // Get config from DB
        let config = await GuildConfig_1.default.findOne({ guildId }).lean();
        if (!config) {
            config = {
                guildId,
                guildName: guild.name,
                prefix: 'k',
                welcomeEnabled: false,
                welcomeChannel: null,
                welcomeMessage: 'Welcome {user} to the server!',
                loggingEnabled: false,
                logChannel: null,
                modules: {
                    rpg: true,
                    economy: true,
                    gacha: true,
                    hunting: true,
                    aiChat: true,
                },
                updatedBy: null,
                updatedAt: new Date(),
            };
        }
        // Fetch text channels
        const channels = guild.channels.cache
            .filter((c) => c.type === 0) // GuildText channels
            .map((c) => ({
            id: c.id,
            name: c.name,
        }))
            .sort((a, b) => a.name.localeCompare(b.name));
        res.json({ success: true, config, channels });
    }
    catch (err) {
        console.error(`[Backend] Guild config fetch error for ${guildId}:`, err);
        res.status(500).json({ success: false, error: err.message });
    }
});
// POST /api/guild/:guildId/update
// Updates the configuration of a specific guild
router.post('/:guildId/update', async (req, res) => {
    const user = verifyAuth(req, res);
    if (!user)
        return;
    const { guildId } = req.params;
    const client = req.app.locals.client;
    if (!client) {
        return res.status(500).json({ success: false, error: 'Discord bot client is offline' });
    }
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
        return res.status(404).json({ success: false, error: 'Bot is not in this guild' });
    }
    try {
        // Check user permissions
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            return res.status(403).json({ success: false, error: 'You are not a member of this server' });
        }
        const hasPerm = member.permissions.has('ManageGuild') || member.permissions.has('Administrator');
        if (!hasPerm) {
            return res.status(403).json({ success: false, error: 'You do not have permission to configure this server' });
        }
        const { prefix, welcomeEnabled, welcomeChannel, welcomeMessage, loggingEnabled, logChannel, modules, } = req.body;
        let config = await GuildConfig_1.default.findOne({ guildId });
        if (!config) {
            config = new GuildConfig_1.default({
                guildId,
                guildName: guild.name,
            });
        }
        // Prefix validation
        if (prefix !== undefined) {
            if (prefix !== null && prefix !== '') {
                const trimmed = prefix.trim();
                const FORBIDDEN_PREFIXES = ['@', '#', '/', '\\', '`'];
                if (trimmed.length > 5) {
                    return res.status(400).json({ success: false, error: 'Prefix must be 5 characters or fewer.' });
                }
                if (FORBIDDEN_PREFIXES.some((p) => trimmed.includes(p))) {
                    return res.status(400).json({ success: false, error: 'Prefix contains forbidden characters.' });
                }
                config.prefix = trimmed;
            }
            else {
                config.prefix = 'k'; // Default fallback
            }
        }
        if (welcomeEnabled !== undefined)
            config.welcomeEnabled = welcomeEnabled;
        if (welcomeChannel !== undefined)
            config.welcomeChannel = welcomeChannel;
        if (welcomeMessage !== undefined)
            config.welcomeMessage = welcomeMessage;
        if (loggingEnabled !== undefined)
            config.loggingEnabled = loggingEnabled;
        if (logChannel !== undefined)
            config.logChannel = logChannel;
        if (modules !== undefined) {
            config.modules = {
                ...config.modules,
                ...modules,
            };
        }
        config.updatedBy = user.id;
        await config.save();
        res.json({ success: true, message: 'Server configuration updated! (◕‿-)', config });
    }
    catch (err) {
        console.error(`[Backend] Guild config update error for ${guildId}:`, err);
        res.status(500).json({ success: false, error: err.message });
    }
});
module.exports = router;
