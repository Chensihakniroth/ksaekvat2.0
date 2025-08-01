const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const database = require('../../utils/database.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
    name: 'sad',
    description: 'Express your sadness.',
    usage: 'sad [message]',
    cooldown: 3000,
    async execute(message, args) {
        const customMessage = args.join(' ');
        const sent = await message.reply({
            embeds: [new EmbedBuilder()
                .setColor(colors.primary || 0x0099FF)
                .setTitle('😢 Feeling it...')
                .setDescription('Loading sadness...')
            ]
        });

        try {
            let gifUrl = null;

            // Try nekos.best first
            try {
                const res = await fetch('https://nekos.best/api/v2/sad');
                const data = await res.json();
                console.log('Nekos.best sad response:', data);

                if (data && data.results && data.results.length > 0 && data.results[0].url) {
                    gifUrl = data.results[0].url;
                } else if (data && data.url) {
                    gifUrl = data.url;
                }
            } catch (e) {
                console.log('Nekos.best sad failed, trying alternative...');
            }

            // If nekos.best failed, try waifu.pics
            if (!gifUrl) {
                try {
                    const res2 = await fetch('https://api.waifu.pics/sfw/cry');
                    const data2 = await res2.json();
                    console.log('Waifu.pics cry response:', data2);

                    if (data2 && data2.url) {
                        gifUrl = data2.url;
                    }
                } catch (e) {
                    console.log('Waifu.pics cry also failed');
                }
            }

            const embed = new EmbedBuilder()
                .setColor(colors.danger || 0xFF4444)
                .setTitle('😢 So Sad...')
                .setDescription(`**${message.author.username}** is sad.${customMessage ? `\n\n💬 "${customMessage}"` : ''}`);

            if (gifUrl) {
                console.log('Using sad GIF URL:', gifUrl);
                embed.setImage(gifUrl);
            } else {
                console.log('No sad GIF found from any API');
            }

            await sent.edit({ embeds: [embed] });

        } catch (error) {
            console.error('Error in sad command:', error);
            await sent.edit({
                embeds: [new EmbedBuilder()
                    .setColor(colors.danger || 0xFF4444)
                    .setTitle('😢 So Sad...')
                    .setDescription(`**${message.author.username}** is sad. (No GIF 😢)`)
                ]
            });
        }

        database.updateStats(message.author.id, 'command');
    }
};