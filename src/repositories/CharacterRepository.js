/**
 * Professional Jumper File (Compatible with ts-node & Node.js 22+)
 * (｡♥‿♥｡) This file allows .js code to use the .ts CharacterRepository!
 */
const mod = require('./CharacterRepository.ts');
module.exports = mod.default || mod;
