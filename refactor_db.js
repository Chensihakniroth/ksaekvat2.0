const fs = require('fs');
const path = require('path');

function replaceInFolder(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInFolder(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');

            // We know that `commands/*/*.js` imports it as `../../utils/database.js`
            // We want to change that to `../../services/DatabaseService`
            content = content.replace(/require\(['"]\.\.\/\.\.\/utils\/database\.js['"]\)/g, "require('../../services/DatabaseService')");

            // `commands/slash/*.js` imports it as `../../utils/database.js` 
            // `commands/*.js` imports it as `../utils/database.js`
            content = content.replace(/require\(['"]\.\.\/utils\/database\.js['"]\)/g, "require('../services/DatabaseService')");

            // `core/index.ts` imports it as `../utils/database.js`
            content = content.replace(/require\(['"]\.\/utils\/database\.js['"]\)/g, "require('./services/DatabaseService')");

            fs.writeFileSync(fullPath, content);
        }
    }
}

replaceInFolder(path.join(__dirname, 'src'));
console.log('Done replacing database references!');
