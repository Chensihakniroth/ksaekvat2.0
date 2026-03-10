/**
 * Professional Jumper File (Compatible with ts-node & Node.js 22+)
 * (｡♥‿♥｡) This file allows .js code to use the .ts User model!
 */
const mod = require('./User.ts');
module.exports = mod.default || mod;
