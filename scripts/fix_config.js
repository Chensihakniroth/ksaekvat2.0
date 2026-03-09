const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../config/config.js');
let configContent = fs.readFileSync(configPath, 'utf8');

configContent = configContent.replace(/minBet: 1000,/g, 'minBet: 2500,');
// Clean up the `minBet: 1,` duplicates I accidentally left earlier
configContent = configContent.replace(/minBet: 1,\s*minBet: 2500,\s*maxBet: 1000000,/g, 'minBet: 2500,\n      maxBet: 1000000,');

fs.writeFileSync(configPath, configContent, 'utf8');
console.log('Fixed config.js');
