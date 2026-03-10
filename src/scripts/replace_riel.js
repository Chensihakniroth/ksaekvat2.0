const fs = require('fs');
const path = require('path');

const emoji = '<:coin:1480551418464305163>';

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // config.js
    content = content.replace(/currency: 'riel',/g, `currency: '${emoji}',`);

    // Global text replacements - only match space-riel to avoid changing JS types
    content = content.replace(/ \briel\b/gi, ` ${emoji}`);
    content = content.replace(/'riel \(/g, `'${emoji} (`);

    // Some specific cases
    content = content.replace(/Luy Riel/g, `Coins`);
    content = content.replace(/Send riel/g, `Send coins`);
    content = content.replace(/earn some riel/g, `earn some coins`);
    content = content.replace(/10k riel/g, `10k ${emoji}`);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Replaced in ${filePath}`);
}

const files = [
    'config/config.js',
    'commands/economy/work.js',
    'commands/economy/pay.js',
    'commands/gambling/rps.js',
    'commands/gambling/blackjack.js',
    'commands/battle/fight.js',
    'commands/general/promo.js',
    'commands/general/gacha.js',
    'commands/general/info.js',
    'commands/admin/promolist.js'
];

files.forEach(f => replaceInFile(path.join(__dirname, '../', f)));
