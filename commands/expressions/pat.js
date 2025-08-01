const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const database = require('../../utils/database.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
    name: 'pat',
    description: 'Pat someone gently!',
    usage: 'pat <@user> [message]',
    cooldown: 3000,

    async execute(message, args) {
        const target = message.mentions.users.first();
        const customMessage = args.slice(1).join(' ');

        if (!target || target.bot || target.id === message.author.id) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor(colors.neutral)
                    .setTitle('🤍 Pat Fail')
                    .setDescription('You must mention someone else to pat.')
                ]
            });
        }

        const sent = await message.reply({
            embeds: [new EmbedBuilder()
                .setColor(colors.primary)
                .setTitle('🤍 Patting...')
                .setDescription('Reaching hand...')
            ]
        });

        try {
            const res = await fetch('https://nekos.best/api/v2/pat');
            const data = await res.json();
            const gifUrl = data.results[0].url;

            const embed = new EmbedBuilder()
                .setColor(colors.success)
                .setTitle('🤍 Pat Pat!')
                .setDescription(`**${message.author.username}** pats ${target}!${customMessage ? `\n\n💬 *"${customMessage}"*` : ''}`)
                .setImage(gifUrl);

            await sent.edit({ embeds: [embed] });
        } catch {
            await sent.edit({
                embeds: [new EmbedBuilder()
                    .setColor(colors.success)
                    .setTitle('🤍 Pat Pat!')
                    .setDescription(`**${message.author.username}** pats ${target}! (No GIF 😢)`)
                ]
            });
        }

        database.updateStats(message.author.id, 'command');
    }
};
