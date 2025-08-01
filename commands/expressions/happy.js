const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const database = require('../../utils/database.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
    name: 'happy',
    description: 'Show that you’re happy!',
    usage: 'happy [message]',
    cooldown: 3000,

    async execute(message, args) {
        const customMessage = args.join(' ');

        const sent = await message.reply({
            embeds: [new EmbedBuilder()
                .setColor(colors.primary)
                .setTitle('😄 Smiling...')
                .setDescription('Feeling the joy...')
            ]
        });

        try {
            const res = await fetch('https://nekos.best/api/v2/happy');
            const data = await res.json();
            const gifUrl = data.results[0].url;

            const embed = new EmbedBuilder()
                .setColor(colors.success)
                .setTitle('😄 So Happy!')
                .setDescription(`**${message.author.username}** is feeling happy!${customMessage ? `\n\n💬 *"${customMessage}"*` : ''}`)
                .setImage(gifUrl);

            await sent.edit({ embeds: [embed] });
        } catch {
            await sent.edit({
                embeds: [new EmbedBuilder()
                    .setColor(colors.success)
                    .setTitle('😄 So Happy!')
                    .setDescription(`**${message.author.username}** is happy. (No GIF 😢)`)
                ]
            });
        }

        database.updateStats(message.author.id, 'command');
    }
};
