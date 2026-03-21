/**
 * Professional Jumper File (Compatible with ts-node & Node.js 22+)
 * (｡♥‿♥｡) This file allows .js code to use the .ts AnimalRegistry model!
 */
const mod = require('./AnimalRegistry.ts');
module.exports = mod.default || mod;
