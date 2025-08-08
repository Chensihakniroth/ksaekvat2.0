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

            // First try to fetch from nekos.life
            try {
                const res1 = await fetch('https://nekos.best/api/v2/angry');
                const data1 = await res1.json();
                console.log('Nekos.life angry response:', data1);
                if (data1 && data1.url) {
                    gifUrl = data1.url;
                }
            } catch (e) {
                console.log('Nekos.life angry API failed:', e);
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