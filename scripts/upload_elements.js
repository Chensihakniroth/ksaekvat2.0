require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    console.log('Logged in as ' + client.user.tag);

    const assetsDir = path.join(__dirname, '../assets/element_icon');
    const files = fs.readdirSync(assetsDir).filter(f => f.endsWith('.png'));

    for (const file of files) {
        const name = path.parse(file).name;
        const filePath = path.join(assetsDir, file);

        try {
            // Check if emoji exists
            const existing = client.application.emojis.cache.find(e => e.name === name);
            if (existing) {
                console.log(`Emoji ${name} already exists: ${existing.toString()}`);
            } else {
                console.log(`Uploading ${name}...`);
                const emoji = await client.application.emojis.create({
                    attachment: filePath,
                    name: name
                });
                console.log(`Created custom emoji: ${emoji.name} ${emoji.toString()}`);
            }
        } catch (error) {
            console.error(`Error uploading ${name}:`, error);
        }
    }

    console.log('Done!');
    process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
