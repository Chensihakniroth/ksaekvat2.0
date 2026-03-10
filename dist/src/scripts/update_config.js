"use strict";
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../config/config.js');
let configContent = fs.readFileSync(configPath, 'utf8');
// Change standard economy limits
configContent = configContent.replace(/maxBet: 250000,/g, `minBet: 1000,\n    maxBet: 1000000,`);
configContent = configContent.replace(/minBet: 1,\n\s*maxBet: 250000,/g, `minBet: 1000,\n      maxBet: 1000000,`);
// Actually all of gambling configs
const gamblingRegex = /minBet:\s*\d+,\s*maxBet:\s*\d+,/g;
configContent = configContent.replace(gamblingRegex, `minBet: 1000,\n      maxBet: 1000000,`);
fs.writeFileSync(configPath, configContent, 'utf8');
console.log('Config updated.');
