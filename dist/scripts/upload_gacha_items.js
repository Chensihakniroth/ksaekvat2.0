"use strict";
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const path = require('path');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const items = [
    { name: 'Star_Dust', path: '../../assets/stardust.png' },
    { name: 'Pokeball', path: '../../assets/pokeball/poke_man.png' },
    { name: 'Ultraball', path: '../../assets/pokeball/ultra_ball.png' },
    { name: 'Master_Ball', path: '../../assets/pokeball/master_ball.png' }
];
client.once('ready', async () => {
    console.log('Logged in as ' + client.user.tag);
    for (const item of items) {
        const imagePath = path.join(__dirname, item.path);
        const name = item.name;
        try {
            // First check if it already exists as an application emoji
            const existing = client.application.emojis.cache.find(e => e.name === name);
            if (existing) {
                console.log(`Emoji ${name} already exists: ${existing.toString()}`);
            }
            else {
                console.log(`Uploading ${name}...`);
                const emoji = await client.application.emojis.create({
                    attachment: imagePath,
                    name: name
                });
                console.log(`Created custom emoji: ${emoji.name} ${emoji.toString()}`);
            }
        }
        catch (error) {
            console.error(`Error uploading ${name}:`, error);
        }
    }
    console.log('Done!');
    process.exit(0);
});
client.login(process.env.DISCORD_TOKEN);
