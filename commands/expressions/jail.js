const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const database = require('../../utils/database.js');
const config = require('../../config/config.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
    name: 'jail',
    description: 'Send someone to jail.',
    usage: 'jail [@user] [message]',
    cooldown: 3000,
    async execute(message, args) {
        const mentionedUser = message.mentions.users.first();
        const customMessage = args.slice(1).join(' ');
        const tenorApiKey = config.googleApiKey; // Using googleApiKey for Tenor API

        const sent = await message.reply({
            embeds: [new EmbedBuilder()
                .setColor(colors.primary || 0x0099FF) // Use fallback color if undefined
                .setTitle('🔒 Preparing jail...')
                .setDescription('Loading jail animation...')
            ]
        });

        try {
            const query = 'jail, handcuff, arrest, prison';
            const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${tenorApiKey}&limit=1&contentfilter=medium`;
            const response = await fetch(url);

            console.log('Response Status:', response.status);
            console.log('Response Headers:', response.headers);

            const data = await response.json(); // Parse the response as JSON

            // Check if results exist
            if (data.results && Array.isArray(data.results) && data.results.length > 0) {
                const gifUrl = data.results[0].media_formats.gif.url; // Get the GIF URL
                const targetUser = mentionedUser || message.author;

                const embed = new EmbedBuilder()
                    .setColor(colors.danger || 0xFF4444) // Use fallback color if undefined
                    .setTitle('🔒 JAIL TIME!')
                    .setDescription(`**${targetUser.username}** has been sent to jail!${customMessage ? `\n\n💬 "${customMessage}"` : ''}`)
                    .setImage(gifUrl); // Set the GIF URL

                await sent.edit({ embeds: [embed] });
            } else {
                await sent.edit({
                    embeds: [new EmbedBuilder()
                        .setColor(colors.warning || 0xFFFF00)
                        .setTitle('⚠️ No GIFs found!')
                        .setDescription(`No GIFs found for the search term "jail".`)
                    ]
                });
            }
        } catch (error) {
            console.error('Error in jail command:', error);
            await sent.edit({
                embeds: [new EmbedBuilder()
                    .setColor(colors.danger || 0xFF4444) // Use fallback color if undefined
                    .setTitle('🔒 JAIL TIME!')
                    .setDescription(`**${mentionedUser?.username || message.author.username}** has been sent to jail! (No GIF available)`)
                ]
            });
        }

        database.updateStats(message.author.id, 'command');
    }
};
