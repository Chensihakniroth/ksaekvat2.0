const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const database = require('../../utils/database.js');
// Use built-in fetch (Node.js 18+) or axios as fallback
const fetch = global.fetch || require('axios').get;

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
                const res1 = await axios.get('https://api.otakugifs.xyz/gif?reaction=angry&format=GIF');
                console.log('Otaku GIF API response:', res1.data);
                
                // Check if response has URL
                if (res1.data && res1.data.url) {
                    gifUrl = res1.data.url;
                }
                // If direct response is a URL string
                else if (typeof res1.data === 'string' && res1.data.startsWith('http')) {
                    gifUrl = res1.data;
                }
                // If the response itself is the image URL
                else if (res1.status === 200 && res1.config.url) {
                    gifUrl = res1.config.url;
                }
            } catch (e) {
                console.log('Otaku GIF API failed, trying fallback...', e.message);
            }

            // Fallback to waifu.pics if Otaku API fails
            if (!gifUrl) {
                try {
                    const res2 = await axios.get('https://api.waifu.pics/sfw/angry');
                    console.log('Waifu.pics angry response:', res2.data);

                    if (res2.data && res2.data.url) {
                        gifUrl = res2.data.url;
                    }
                } catch (e) {
                    console.log('Waifu.pics angry failed, trying nekos.best...');
                }
            }

            // Second fallback to nekos.best with pout (similar to angry)
            if (!gifUrl) {
                try {
                    const res3 = await axios.get('https://nekos.best/api/v2/pout');
                    console.log('Nekos.best pout response:', res3.data);

                    if (res3.data && res3.data.results && res3.data.results.length > 0 && res3.data.results[0].url) {
                        gifUrl = res3.data.results[0].url;
                    } else if (res3.data && res3.data.url) {
                        gifUrl = res3.data.url;
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