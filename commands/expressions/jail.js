const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const database = require('../../utils/database.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

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

        try {
            let gifUrl = null;

            // Try to get a GIF from APIs first
            try {
                const res = await fetch('https://api.waifu.pics/sfw/handhold');
                const data = await res.json();

                if (data && data.url) {
                    gifUrl = data.url;
                }
            } catch (e) {
                console.log('API failed, using static jail image');
            }

            const targetUser = mentionedUser || message.author;
            const embed = new EmbedBuilder()
                .setColor(colors.danger || 0xFF4444)
                .setTitle('🔒 JAIL TIME!')
                .setDescription(`**${targetUser.username}** has been sent to jail!${customMessage ? `\n\n💬 "${customMessage}"` : ''}`)
                .setThumbnail('https://i.imgur.com/YQakgwb.png'); // Generic jail bars emoji/image

            // Add GIF if we got one, otherwise just use the thumbnail
            if (gifUrl) {
                embed.setImage(gifUrl);
            }

            await sent.edit({ embeds: [embed] });

        } catch (error) {
            console.error('Error in jail command:', error);
            await sent.edit({
                embeds: [new EmbedBuilder()
                    .setColor(colors.danger || 0xFF4444)
                    .setTitle('🔒 JAIL TIME!')
                    .setDescription(`**${mentionedUser?.username || message.author.username}** has been sent to jail! (No GIF available)`)
                    .setThumbnail('https://i.imgur.com/YQakgwb.png')
                ]
            });
        }

        database.updateStats(message.author.id, 'command');
    }
};