"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = require("../../utils/env.js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const router = (0, express_1.Router)();
const OWNER_ID = '703266672022388789';
// Middleware to verify the user is the owner
function verifyOwner(req, res, next) {
    const token = req.cookies?.ksaekvat_session;
    if (!token) {
        return res.status(401).json({ success: false, error: 'Unauthorized. Authenticate first.' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_js_1.env.JWT_SECRET || 'ksaekvat-super-secret-jwt-key-change-me-in-prod-pls');
        if (decoded.id !== OWNER_ID) {
            return res.status(403).json({ success: false, error: 'Forbidden. Access restricted to creator.' });
        }
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(401).json({ success: false, error: 'Session invalid or expired.' });
    }
}
// GET /api/admin/stats
// Returns live bot telemetry metrics
router.get('/stats', verifyOwner, (req, res) => {
    const client = req.app.locals.client;
    if (!client) {
        return res.status(500).json({ success: false, error: 'Discord client offline' });
    }
    const memory = process.memoryUsage();
    const uptime = process.uptime(); // in seconds
    res.json({
        success: true,
        stats: {
            uptime,
            memory: {
                rss: (memory.rss / 1024 / 1024).toFixed(2), // MB
                heapUsed: (memory.heapUsed / 1024 / 1024).toFixed(2), // MB
                heapTotal: (memory.heapTotal / 1024 / 1024).toFixed(2), // MB
                external: (memory.external / 1024 / 1024).toFixed(2), // MB
            },
            guildCount: client.guilds.cache.size,
            cachedUsers: client.users.cache.size,
            ping: client.ws.ping || 0,
            cpuUsage: process.cpuUsage(),
            guilds: client.guilds.cache.map((g) => ({
                id: g.id,
                name: g.name,
                memberCount: g.memberCount,
                iconUrl: g.iconURL() || null,
            })),
        },
    });
});
// POST /api/admin/execute
// Handles command execution from the creator console
router.post('/execute', verifyOwner, async (req, res) => {
    const { command } = req.body;
    if (!command) {
        return res.status(400).json({ success: false, error: 'Command query missing.' });
    }
    const client = req.app.locals.client;
    if (!client) {
        return res.status(500).json({ success: false, error: 'Discord client offline.' });
    }
    const normalized = command.trim().toLowerCase();
    try {
        if (normalized === 'reload') {
            // 1. Recursive clear of require cache for commands directory
            const commandsPath = path.join(__dirname, '..', '..', 'commands');
            const clearRequireCache = (dir) => {
                if (!fs.existsSync(dir))
                    return;
                const items = fs.readdirSync(dir, { withFileTypes: true });
                for (const item of items) {
                    const itemPath = path.join(dir, item.name);
                    if (item.isDirectory()) {
                        clearRequireCache(itemPath);
                    }
                    else if (item.isFile() && (item.name.endsWith('.js') || item.name.endsWith('.ts'))) {
                        try {
                            delete require.cache[require.resolve(itemPath)];
                        }
                        catch (_) { }
                    }
                }
            };
            clearRequireCache(commandsPath);
            // 2. Clear command collection
            client.commands.clear();
            // 3. Reload commands
            const loader = require('../../handlers/commandHandler.js');
            loader(client);
            return res.json({
                success: true,
                output: `[System] Commands cache flushed.\n[System] Successfully reloaded ${client.commands.size} commands / aliases.`,
            });
        }
        if (normalized === 'flush cache' || normalized === 'flush') {
            const startUsers = client.users.cache.size;
            // We can't completely empty cache since bot needs basic user mappings, but we can sweep sweeping unneeded ones
            client.users.cache.clear();
            const endUsers = client.users.cache.size;
            return res.json({
                success: true,
                output: `[Cache] Cleared user cache.\n[Cache] Pre-flush: ${startUsers} users. Post-flush: ${endUsers} users.`,
            });
        }
        if (normalized === 'guild list' || normalized === 'guilds') {
            const guilds = client.guilds.cache.map((g) => `• ${g.name} (${g.id}) | Members: ${g.memberCount}`).join('\n');
            return res.json({
                success: true,
                output: `[Guilds] Currently connected to ${client.guilds.cache.size} servers:\n${guilds || 'None'}`,
            });
        }
        if (normalized === 'shard status' || normalized === 'shard') {
            const ping = client.ws.ping;
            const status = client.ws.status;
            const statuses = ['READY', 'CONNECTING', 'RECONNECTING', 'IDLE', 'NEARLY', 'DISCONNECTED'];
            const currentStatus = statuses[status] || 'UNKNOWN';
            return res.json({
                success: true,
                output: `[Shard #0] Gateway status: ${currentStatus}\n[Shard #0] WebSocket ping: ${ping}ms\n[Shard #0] Uptime: ${(process.uptime() / 60).toFixed(2)} minutes`,
            });
        }
        // Default help response for unsupported commands
        return res.json({
            success: true,
            output: `Unknown command: "${command}". Available commands:\n  - reload       (Reload command registry and clear caches)\n  - flush        (Flush users cache)\n  - guild list   (List all connected servers)\n  - shard status (Retrieve active websocket status)`,
        });
    }
    catch (err) {
        res.json({ success: false, output: `Execution Error: ${err.message}` });
    }
});
module.exports = router;
