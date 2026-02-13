const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const database = require('../../utils/database.js');
// Use built-in fetch (Node.js 18+) or axios as fallback
const fetch = global.fetch || require('axios').get;

module.exports = {
    name: 'happy',
    description: 'Express your happiness.',
    usage: 'happy [message]',
    cooldown: 3000,
    async execute(message, args) {
        const customMessage = args.join(' ');
        const sent = await message.reply({
            embeds: [new EmbedBuilder()
                .setColor(colors.primary || 0x0099FF)
                .setTitle('😊 Feeling happy...')
                .setDescription('Loading happiness...')
            ]
        });

        try {
            let gifUrl = null;

            // First try to fetch from nekos.best
            try {
                const res1 = await fetch('https://nekos.best/api/v2/happy');
                const data1 = await res1.json();
                if (data1 && data1.results && data1.results.length > 0 && data1.results[0].url) {
                    gifUrl = data1.results[0].url;
                }
            } catch (e) {
                console.log('Nekos.best happy API failed:', e);
            }

            // Fallback to waifu.pics
            if (!gifUrl) {
                try {
                    const res2 = await fetch('https://api.waifu.pics/sfw/happy');
                    const data2 = await res2.json();
                    if (data2 && data2.url) {
                        gifUrl = data2.url;
                    }
                } catch (e) {
                    console.log('Waifu.pics happy API failed:', e);
                }
            }

            const embed = new EmbedBuilder()
                .setColor(colors.success || 0x00FF00)
                .setTitle('😊 So Happy!')
                .setDescription(`**${message.author.username}** is happy!${customMessage ? `

💬 "${customMessage}"` : ''}`);

            if (gifUrl) {
                embed.setImage(gifUrl);
            }

            await sent.edit({ embeds: [embed] });

        } catch (error) {
            console.error('Error in happy command:', error);
            await sent.edit({
                embeds: [new EmbedBuilder()
                    .setColor(colors.success || 0x00FF00)
                    .setTitle('😊 So Happy!')
                    .setDescription(`**${message.author.username}** is happy! (No GIF 😢)`)
                ]
            });
        }

        database.updateStats(message.author.id, 'command');
    }
};




