/**
 * Professional Jumper File (Compatible with ts-node & Node.js 22+)
 * (｡♥‿♥｡) This file allows .js code to use the .ts DatabaseService model!
 */
const mod = require('./DatabaseService.ts');
module.exports = mod.default || mod;
