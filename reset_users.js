const fs = require('fs');
const path = require('path');

const usersPath = path.join(__dirname, 'data', 'users.json');

if (fs.existsSync(usersPath)) {
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    
    for (const id in users) {
        users[id].level = 1;
        users[id].worldLevel = 1;
        users[id].experience = 0;
        users[id].inventory = [];
        users[id].equipped = {};
        users[id].balance = 1000; // Fresh start balance
    }
    
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    console.log('All user data reset to World 1, Level 1.');
} else {
    console.log('No users.json found.');
}