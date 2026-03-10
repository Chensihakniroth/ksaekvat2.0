/**
 * Professional Jumper File (Compatible with ts-node & Node.js 22+)
 * (｡♥‿♥｡) This file allows .js code to use the .ts CombatService!
 */
const mod = require('./CombatService.ts');
module.exports = mod.default || mod;
