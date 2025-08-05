const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const database = require('../../utils/database.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const GIPHY_API_KEY = process.env.GIPHY_API_KEY; // Ensure your API key is stored in environment variables

if (!GIPHY_API_KEY) {
    console.error('GIPHY_API_KEY is not defined. Please check your environment variables.');
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
                .setColor(colors.primary || 0x0099FF) // Use fallback color if undefined
                .setTitle('🔒 Preparing jail...')
                .setDescription('Loading jail animation...')
            ]
        });

        if (!GIPHY_API_KEY) {
            console.error('GIPHY_API_KEY is not defined. Please check your environment variables.');
            return; // Exit if API key is not defined
        }

        try {
            const query = 'jail, handcuff, arrest, prison'; 
            const url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=1`;
            const response = await fetch(url);

            console.log('Response Status:', response.status);
            console.log('Response Headers:', response.headers);

            const data = await response.json(); // Parse the response as JSON

            // Check if results exist
            if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                const gifUrl = data.data[0].images.original.url; // Get the GIF URL
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
