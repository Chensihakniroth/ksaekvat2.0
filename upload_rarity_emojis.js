require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    console.log('Logged in as ' + client.user.tag);

    const assetsDir = path.join(__dirname, 'assets/raritypokemon');
    if (!fs.existsSync(assetsDir)) {
        console.error('Assets directory not found: ' + assetsDir);
        process.exit(1);
    }

    const files = fs.readdirSync(assetsDir).filter(f => f.endsWith('.png'));
    const results = {};

    for (const file of files) {
        const name = `rarity_${path.parse(file).name}`; // Prefix to avoid collisions
        const filePath = path.join(assetsDir, file);

        try {
            // Fetch application emojis
            await client.application.emojis.fetch();
            let emoji = client.application.emojis.cache.find(e => e.name === name);
            
            if (emoji) {
                console.log(`Emoji ${name} already exists: ${emoji.toString()}`);
            } else {
                console.log(`Uploading ${name}...`);
                const imageBuffer = fs.readFileSync(filePath);
                const base64 = imageBuffer.toString('base64');
                const dataURI = `data:image/png;base64,${base64}`;

                emoji = await client.application.emojis.create({
                    attachment: dataURI,
                    name: name
                });
                console.log(`Created custom emoji: ${emoji.name} ${emoji.toString()}`);
            }
            results[path.parse(file).name] = emoji.toString();
        } catch (error) {
            console.error(`Error uploading ${name}:`, error.message);
        }
    }

    console.log('\n--- UPLOAD COMPLETE ---');
    console.log('Use these in your config:');
    console.log(JSON.stringify(results, null, 2));
    console.log('------------------------');
    
    process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
