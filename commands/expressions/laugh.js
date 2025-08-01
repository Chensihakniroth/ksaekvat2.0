const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const database = require('../../utils/database.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
    name: 'laugh',
    description: 'Show you’re laughing.',
    usage: 'laugh [message]',
    cooldown: 3000,

    async execute(message, args) {
        const customMessage = args.join(' ');

        const sent = await message.reply({
            embeds: [new EmbedBuilder()
                .setColor(colors.primary)
                .setTitle('😂 Laughing...')
                .setDescription('Loading the giggles...')
            ]
        });

        try {
            const res = await fetch('https://nekos.best/api/v2/laugh');
            const data = await res.json();
            const gifUrl = data.results[0].url;

            const embed = new EmbedBuilder()
                .setColor(colors.success)
                .setTitle('😂 LOL!')
                .setDescription(`**${message.author.username}** is laughing out loud!${customMessage ? `\n\n💬 *"${customMessage}"*` : ''}`)
                .setImage(gifUrl);

            await sent.edit({ embeds: [embed] });
        } catch {
            await sent.edit({
                embeds: [new EmbedBuilder()
                    .setColor(colors.success)
                    .setTitle('😂 LOL!')
                    .setDescription(`**${message.author.username}** is laughing! (No GIF 😢)`)
                ]
            });
        }

        database.updateStats(message.author.id, 'command');
    }
};
