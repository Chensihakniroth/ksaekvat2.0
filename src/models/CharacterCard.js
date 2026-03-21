/**
 * Professional Jumper File (Compatible with ts-node & Node.js 22+)
 * (｡♥‿♥｡) This file allows .js code to use the .ts CharacterCard model!
 */
const mod = require('./CharacterCard.ts');
module.exports = mod.default || mod;
