const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const database = require('../../utils/database.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const TENOR_API_KEY = process.env.GOOGLE_API_KEY; // Use GOOGLE_API_KEY from environment variables

if (!TENOR_API_KEY) {
    console.error('GOOGLE_API_KEY is not defined. Please check your environment variables.');
}

module.exports = {
    name: 'jail',
    description: 'Send someone to jail.',
    usage: 'jail [@user] [message]',
    cooldown: 3000,
    async execute(message, args) {
        const mentionedUser = message.mentions.users.first();
        const customMessage = args.slice(1).join(' ');
        const sent = await message.reply({
            embeds: [new EmbedBuilder()
                .setColor(colors.primary || 0x0099FF)
                .setTitle('🔒 Preparing jail...')
                .setDescription('Loading jail animation...')
            ]
        });

        if (!TENOR_API_KEY) {
            console.error('GOOGLE_API_KEY is not defined. Please check your environment variables.');
            await sent.edit({
                embeds: [new EmbedBuilder()
                    .setColor(colors.danger || 0xFF4444)
                    .setTitle('🔒 JAIL TIME!')
                    .setDescription(`**${mentionedUser?.username || message.author.username}** has been sent to jail! (No GIF available)`)
                ]
            });
            return;
        }

        try {
            const query = 'jail handcuff arrest prison';
            const url = `https://tenor.googleapis.com/v2/search?key=${TENOR_API_KEY}&q=${encodeURIComponent(query)}&limit=1&media_filter=gif`;
            const response = await fetch(url);

            console.log('Tenor Response Status:', response.status);
            console.log('Tenor Response Headers:', response.headers);

            const data = await response.json();

            if (data.results && Array.isArray(data.results) && data.results.length > 0) {
                const gifUrl = data.results[0].media_formats.gif.url;
                const targetUser = mentionedUser || message.author;

                const embed = new EmbedBuilder()
                    .setColor(colors.danger || 0xFF4444)
                    .setTitle('🔒 JAIL TIME!')
                    .setDescription(`**${targetUser.username}** has been sent to jail!${customMessage ? `\n\n💬 "${customMessage}"` : ''}`)
                    .setImage(gifUrl);

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
                    .setColor(colors.danger || 0xFF4444)
                    .setTitle('🔒 JAIL TIME!')
                    .setDescription(`**${mentionedUser?.username || message.author.username}** has been sent to jail! (No GIF available)`)
                ]
            });
        }

        database.updateStats(message.author.id, 'command');
    }
};