const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const database = require('../../utils/database.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
    name: 'kiss',
    description: 'Give someone a kiss!',
    usage: 'kiss <@user> [message]',
    cooldown: 3000,

    async execute(message, args) {
        const target = message.mentions.users.first();
        const customMessage = args.slice(1).join(' ');

        if (!target || target.id === message.author.id || target.bot) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor(colors.warning)
                    .setTitle('💋 Kiss Fail')
                    .setDescription('Please mention someone else to kiss!')
                ]
            });
        }

        const sentMessage = await message.reply({
            embeds: [new EmbedBuilder()
                .setColor(colors.primary)
                .setTitle('💋 Getting ready...')
                .setDescription('Puckering up!')
            ]
        });

        try {
            const res = await fetch('https://nekos.best/api/v2/kiss');
            const data = await res.json();
            const gifUrl = data.results[0].url;

            const kissEmbed = new EmbedBuilder()
                .setColor(colors.love || colors.warning)
                .setTitle('💋 Smooch!')
                .setDescription(`**${message.author.username}** kisses ${target}!${customMessage ? `\n\n💬 *"${customMessage}"*` : ''}`)
                .setImage(gifUrl);

            await sentMessage.edit({ embeds: [kissEmbed] });
        } catch {
            await sentMessage.edit({
                embeds: [new EmbedBuilder()
                    .setColor(colors.warning)
                    .setTitle('💋 Smooch!')
                    .setDescription(`**${message.author.username}** kisses ${target}! (No GIF 😢)`)
                ]
            });
        }

        database.updateStats(message.author.id, 'command');
    }
};
