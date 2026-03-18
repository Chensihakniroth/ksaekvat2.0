"use strict";
/**
 * update_character_icons.js
 *
 * Fetches character icon URLs from Fandom wikis for ZZZ and WuWa characters,
 * then updates the MongoDB character documents with working image_url values.
 *
 * ZZZ: https://zenless-zone-zero.fandom.com
 * WuWa: https://wutheringwaves.fandom.com
 *
 * Run with: node src/scripts/update_character_icons.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const https = require('https');
const Character = require('../models/Character').default || require('../models/Character');
// ─── MediaWiki API Helper ────────────────────────────────────────────────────
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, {
            headers: { 'User-Agent': 'KsaeKvat-Bot/2.0 (Discord bot; icon updater)' },
            timeout: 15000,
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                }
                catch {
                    reject(new Error(`Invalid JSON from ${url}`));
                }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout: ${url}`)); });
    });
}
/**
 * Query the Fandom MediaWiki imageinfo API to get the CDN URL for a file.
 * @param {string} wiki - e.g. 'zenless-zone-zero' or 'wutheringwaves'
 * @param {string} filename - e.g. 'Agent_Ellen_Joe_Icon.png'
 * @returns {string|null} The CDN URL or null if not found
 */
async function getFandomImageUrl(wiki, filename) {
    const apiUrl = `https://${wiki}.fandom.com/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&format=json`;
    try {
        const data = await fetchJson(apiUrl);
        const pages = data?.query?.pages;
        if (!pages)
            return null;
        const page = Object.values(pages)[0];
        if (!page || page.missing !== undefined)
            return null;
        return page.imageinfo?.[0]?.url || null;
    }
    catch (err) {
        return null;
    }
}
// ─── ZZZ Icon URL Builder ─────────────────────────────────────────────────────
// Special name overrides for ZZZ characters where the wiki naming differs
const ZZZ_NAME_OVERRIDES = {
    'Anby Demara': 'Anby Demara', // Standard
    'Anton Ivanov': 'Anton Ivanov', // Standard
    'Ben Bigger': 'Ben Bigger', // Standard
    'Billy Kid': 'Billy Kid', // Standard
    'Burnice White': 'Burnice White', // Standard
    'Caesar King': 'Caesar King', // Standard
    'Corin Wickes': 'Corin Wickes', // Standard
    'Ellen Joe': 'Ellen Joe', // Standard
    'Grace Howard': 'Grace Howard', // Standard
    'Hoshimi Miyabi': 'Miyabi', // Wiki uses just "Miyabi"
    'Hugo Vlad': 'Hugo Vlad', // Standard
    'Jane Doe': 'Jane Doe', // Standard
    'Ju Fufu': 'Ju Fufu', // Standard
    'Koleda Belobog': 'Koleda', // Wiki uses "Koleda"
    'Lucia Elowen': 'Lucia Elowen', // Standard  
    'Nangong Yu': 'Nangong Yu', // Standard
    'Nicole Demara': 'Nicole Demara', // Standard
    'Pan Yinhu': 'Pan Yinhu', // Standard
    'Piper Wheel': 'Piper Wheel', // Standard
    'Qingyi': 'Qingyi', // Standard
    'Seth Lowell': 'Seth Lowell', // Standard
    'Soldier 11': 'Soldier 11', // Standard
    'Soldier 0 - Anby': 'Soldier 0 - Anby', // Wiki keeps the hyphen
    'Soukaku': 'Soukaku', // Standard
    'Von Lycaon': 'Von Lycaon', // Standard
    'Yanagi': 'Yanagi', // Standard
    'Zhu Yuan': 'Zhu Yuan', // Standard
};
async function getZZZIconUrl(characterName) {
    const wikiName = ZZZ_NAME_OVERRIDES[characterName] || characterName;
    const filename = `Agent_${wikiName.replace(/ /g, '_')}_Icon.png`;
    const url = await getFandomImageUrl('zenless-zone-zero', filename);
    if (url)
        return url;
    // Fallback: try without space variations
    const altFilename = `Agent_${wikiName.replace(/ /g, '')}_Icon.png`;
    return await getFandomImageUrl('zenless-zone-zero', altFilename);
}
// ─── WuWa Icon URL Builder ────────────────────────────────────────────────────
// Special name overrides for WuWa characters
const WUWA_NAME_OVERRIDES = {
    'Rover (Spectro/Havoc/Aero)': 'Rover',
    'Xiangli Yao': 'Xiangli Yao',
    'Luuk Herssen': 'Luuk Herssen',
};
async function getWuWaIconUrl(characterName) {
    const wikiName = WUWA_NAME_OVERRIDES[characterName] || characterName;
    const filename = `Resonator_${wikiName.replace(/ /g, '_')}.png`;
    const url = await getFandomImageUrl('wutheringwaves', filename);
    if (url)
        return url;
    // Fallback: try with different casing
    const altFilename = `Resonator_${wikiName.replace(/ /g, '')}.png`;
    return await getFandomImageUrl('wutheringwaves', altFilename);
}
// ─── Main Update Script ──────────────────────────────────────────────────────
async function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
async function updateCharacterIcons() {
    const mongoUri = process.env.MONGO_URL || process.env.MONGODB_URI || process.env.MONGODB_URL || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ksae_bot';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected!\n');
    // Get all ZZZ and WuWa characters from the database
    const characters = await Character.find({ game: { $in: ['zzz', 'wuwa'] }, type: 'character' });
    console.log(`📋 Found ${characters.length} characters to update (ZZZ + WuWa)\n`);
    let updated = 0;
    let failed = 0;
    for (const char of characters) {
        const game = char.game;
        let newUrl = null;
        try {
            if (game === 'zzz') {
                newUrl = await getZZZIconUrl(char.name);
            }
            else if (game === 'wuwa') {
                newUrl = await getWuWaIconUrl(char.name);
            }
            if (newUrl) {
                await Character.findOneAndUpdate({ name: char.name, game: char.game }, { image_url: newUrl, updatedAt: new Date() }, { new: true });
                console.log(`✅ [${game.toUpperCase()}] ${char.name}`);
                console.log(`   → ${newUrl.substring(0, 80)}...`);
                updated++;
            }
            else {
                console.warn(`⚠️  [${game.toUpperCase()}] ${char.name} — icon NOT FOUND on wiki`);
                failed++;
            }
        }
        catch (err) {
            console.error(`❌ [${game.toUpperCase()}] ${char.name} — ERROR: ${err.message}`);
            failed++;
        }
        // Rate limit: 300ms between requests to be respectful to the wiki API
        await sleep(300);
    }
    console.log(`\n🎉 Done! Updated: ${updated}, Failed/Missing: ${failed}`);
    await mongoose.disconnect();
}
updateCharacterIcons().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
