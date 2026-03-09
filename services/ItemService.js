/**
 * Professional Jumper File (Compatible with ts-node & Node.js 22+)
 * (｡♥‿♥｡) This file allows .js code to use the .ts ItemService!
 */
const mod = require('./ItemService.ts');
module.exports = mod.default || mod;
