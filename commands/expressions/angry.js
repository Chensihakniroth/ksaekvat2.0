const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const database = require('../../utils/database.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
    name: 'angry',
    description: 'Express your anger.',
    usage: 'angry [message]',
    cooldown: 3000,
    async execute(message, args) {
        const customMessage = args.join(' ');
        const sent = await message.reply({
            embeds: [new EmbedBuilder()
                .setColor(colors.primary || 0x0099FF)
                .setTitle('😡 Getting mad...')
                .setDescription('Loading anger...')
            ]
        });

        try {
            let gifUrl = null;

            // Try Otaku GIF API first
            try {
                const res1 = await fetch('https://api.otakugifs.xyz/gif?reaction=angry&format=GIF');
                
                // Check if response is ok
                if (res1.ok) {
                    const contentType = res1.headers.get('content-type');
                    
                    // If it's JSON, parse it
                    if (contentType && contentType.includes('application/json')) {
                        const data1 = await res1.json();
                        console.log('Otaku GIF API JSON response:', data1);
                        
                        if (data1 && data1.url) {
                            gifUrl = data1.url;
                        }
                    } 
                    // If it's a direct image response, use the URL
                    else if (contentType && contentType.includes('image/')) {
                        gifUrl = res1.url;
                        console.log('Otaku GIF API direct image response:', gifUrl);
                    }
                }
            } catch (e) {
                console.log('Otaku GIF API failed, trying fallback...', e.message);
            }

            // Fallback to waifu.pics if Otaku API fails
            if (!gifUrl) {
                try {
                    const res2 = await fetch('https://api.waifu.pics/sfw/angry');
                    const data2 = await res2.json();
                    console.log('Waifu.pics angry response:', data2);

                    if (data2 && data2.url) {
                        gifUrl = data2.url;
                    }
                } catch (e) {
                    console.log('Waifu.pics angry failed, trying nekos.best...');
                }
            }

            // Second fallback to nekos.best with pout (similar to angry)
            if (!gifUrl) {
                try {
                    const res3 = await fetch('https://nekos.best/api/v2/pout');
                    const data3 = await res3.json();
                    console.log('Nekos.best pout response:', data3);

                    if (data3 && data3.results && data3.results.length > 0 && data3.results[0].url) {
                        gifUrl = data3.results[0].url;
                    } else if (data3 && data3.url) {
                        gifUrl = data3.url;
                    }
                } catch (e) {
                    console.log('Nekos.best pout also failed');
                }
            }

            const embed = new EmbedBuilder()
                .setColor(colors.danger || 0xFF4444)
                .setTitle('😡 So Angry!')
                .setDescription(`**${message.author.username}** is angry!${customMessage ? `\n\n💬 "${customMessage}"` : ''}`);

            if (gifUrl) {
                console.log('Using angry GIF URL:', gifUrl);
                embed.setImage(gifUrl);
            } else {
                console.log('No angry GIF found from any API');
            }

            await sent.edit({ embeds: [embed] });

        } catch (error) {
            console.error('Error in angry command:', error);
            await sent.edit({
                embeds: [new EmbedBuilder()
                    .setColor(colors.danger || 0xFF4444)
                    .setTitle('😡 So Angry!')
                    .setDescription(`**${message.author.username}** is angry! (No GIF 😢)`)
                ]
            });
        }

        database.updateStats(message.author.id, 'command');
    }
};