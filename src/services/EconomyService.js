/**
 * Professional Jumper File (Compatible with ts-node & Node.js 22+)
 * (｡♥‿♥｡) This file allows .js code to use the .ts EconomyService!
 */
const mod = require('./EconomyService.ts');
module.exports = mod.default || mod;
