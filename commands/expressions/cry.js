const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const database = require('../../utils/database.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
    name: 'cry',
    description: 'Show that you’re crying.',
    usage: 'cry [message]',
    cooldown: 3000,

    async execute(message, args) {
        const customMessage = args.join(' ');

        const sent = await message.reply({
            embeds: [new EmbedBuilder()
                .setColor(colors.primary)
                .setTitle('😭 Crying...')
                .setDescription('Tears are flowing...')
            ]
        });

        try {
            const res = await fetch('https://nekos.best/api/v2/cry');
            const data = await res.json();
            const gifUrl = data.results[0].url;

            const embed = new EmbedBuilder()
                .setColor(colors.error)
                .setTitle('😭 So Sad!')
                .setDescription(`**${message.author.username}** is crying.${customMessage ? `\n\n💬 *"${customMessage}"*` : ''}`)
                .setImage(gifUrl);

            await sent.edit({ embeds: [embed] });
        } catch {
            await sent.edit({
                embeds: [new EmbedBuilder()
                    .setColor(colors.error)
                    .setTitle('😭 So Sad!')
                    .setDescription(`**${message.author.username}** is crying. (No GIF 😢)`)
                ]
            });
        }

        database.updateStats(message.author.id, 'command');
    }
};
