"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const router = (0, express_1.Router)();
// In-memory cache for 15 minutes
let cachedHistory = null;
let cacheExpiresAt = 0;
// Hardcoded fallback milestones (the static timeline we had)
const fallbackTimeline = [
    {
        date: 'Jan 2025',
        title: 'The Spark — KSAEKVAT 1.0 Alpha',
        desc: 'First codebase release. Initializing core Discord handlers, simple database schemas, and text-based specimen hunting commands.',
        author: 'Mo',
        hash: 'v1.0.0',
        url: 'https://github.com/Chensihakniroth/ksaekvat2.0'
    },
    {
        date: 'Mar 2025',
        title: 'Combat & Economy Integration',
        desc: 'Added fully functional RPG PVE combat systems, boss levels, dynamic stat calculations, and the daily claims claim engine.',
        author: 'Mo',
        hash: 'v1.2.0',
        url: 'https://github.com/Chensihakniroth/ksaekvat2.0'
    },
    {
        date: 'May 2025',
        title: 'The UI Dimension',
        desc: 'Shipped a comprehensive Vite + React 19 dashboard featuring real-time live database search and interactive user profile bios.',
        author: 'Mo',
        hash: 'v1.8.0',
        url: 'https://github.com/Chensihakniroth/ksaekvat2.0'
    },
    {
        date: 'June 2025',
        title: 'Version 2.0 — Cozy Matte Revamp',
        desc: 'A complete aesthetic redesign. Replacing neon cyberpunk glows with a clean, matte, flat-studio layout optimized for clarity.',
        author: 'Mo',
        hash: 'v2.0.0',
        url: 'https://github.com/Chensihakniroth/ksaekvat2.0'
    }
];
// Helper to format date (e.g. 2026-05-25 -> May 25, 2026)
function formatDateString(dateRaw) {
    try {
        const date = new Date(dateRaw);
        if (isNaN(date.getTime()))
            return dateRaw;
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }
    catch {
        return dateRaw;
    }
}
async function fetchFromGitHub() {
    try {
        const res = await axios_1.default.get('https://api.github.com/repos/Chensihakniroth/ksaekvat2.0/commits', {
            headers: {
                'User-Agent': 'KSAEKVAT-Bot-Dashboard'
            },
            timeout: 5000
        });
        if (!Array.isArray(res.data))
            return null;
        const items = res.data
            .map((c) => {
            const fullMsg = c.commit?.message || '';
            const lines = fullMsg.split('\n').map((l) => l.trim()).filter(Boolean);
            const title = lines[0] || 'Codebase update';
            const desc = lines.slice(1).join(' ') || 'General maintenance and codebase updates.';
            const dateRaw = c.commit?.author?.date || c.commit?.committer?.date;
            const author = c.commit?.author?.name || c.author?.login || 'Developer';
            const hash = c.sha?.substring(0, 7) || '';
            const url = c.html_url || '';
            return {
                date: formatDateString(dateRaw),
                title,
                desc,
                author,
                hash,
                url
            };
        })
            .filter((item) => {
            const isMerge = item.title.toLowerCase().startsWith('merge');
            const isPunctuation = /^[.,/#!$%^&*;:{}=\-_`~()?\s]+$/.test(item.title);
            const isTooShort = item.title.length < 4;
            return !isMerge && !isPunctuation && !isTooShort;
        });
        return items.slice(0, 10);
    }
    catch (err) {
        console.warn('[Backend] GitHub commits API fetch failed:', err?.message || err);
        return null;
    }
}
async function fetchFromLocalGit() {
    try {
        const { stdout: oneLinerOut } = await execAsync('git log -n 30 --date=iso --pretty=format:"%ad|%s|%h|%an"', {
            timeout: 5000
        });
        const lines = oneLinerOut.split('\n').filter(Boolean);
        const items = lines
            .map(line => {
            const [dateRaw, title, hash, author] = line.split('|');
            return {
                date: formatDateString(dateRaw),
                title: title || 'Codebase update',
                desc: 'General maintenance and codebase updates.',
                author: author || 'Developer',
                hash: hash || '',
                url: `https://github.com/Chensihakniroth/ksaekvat2.0/commit/${hash}`
            };
        })
            .filter(item => {
            const isMerge = item.title.toLowerCase().startsWith('merge');
            const isPunctuation = /^[.,/#!$%^&*;:{}=\-_`~()?\s]+$/.test(item.title);
            const isTooShort = item.title.length < 4;
            return !isMerge && !isPunctuation && !isTooShort;
        });
        return items.slice(0, 10);
    }
    catch (err) {
        console.warn('[Backend] Local git log fetch failed:', err?.message || err);
        return null;
    }
}
router.get('/', async (_req, res) => {
    const now = Date.now();
    if (cachedHistory && now < cacheExpiresAt) {
        return res.json({ success: true, data: cachedHistory });
    }
    let data = await fetchFromGitHub();
    if (!data) {
        data = await fetchFromLocalGit();
    }
    if (!data || data.length === 0) {
        data = fallbackTimeline;
    }
    cachedHistory = data;
    cacheExpiresAt = now + 15 * 60 * 1000;
    res.json({ success: true, data });
});
module.exports = router;
