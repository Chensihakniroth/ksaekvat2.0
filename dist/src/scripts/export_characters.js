"use strict";
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const registry = require('../utils/registry');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
/**
 * Exports all character names and their associated games to a JSON file.
 * This provides a simple, database-agnostic list for other scripts to use.
 */
async function exportCharacters() {
    if (!process.env.MONGO_URL) {
        console.error('MONGO_URL not found in .env file. Please ensure it is configured.');
        process.exit(1);
    }
    console.log('Connecting to database...');
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Database connected. Initializing registry...');
        await registry.initializeRegistry();
        console.log('Registry initialized.');
        const allChars = registry.getAllCharacters();
        const charData = allChars.map(c => ({
            name: c.name,
            game: c.game,
            rarity: c.rarity
        }));
        const outputPath = path.join(__dirname, 'characters.json');
        fs.writeFileSync(outputPath, JSON.stringify(charData, null, 2));
        console.log(`Successfully exported ${charData.length} characters to ${outputPath}`);
    }
    catch (error) {
        console.error('An error occurred during the export process:', error);
    }
    finally {
        console.log('Disconnecting from database.');
        await mongoose.disconnect();
    }
}
exportCharacters();
