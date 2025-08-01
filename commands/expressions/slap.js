const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const database = require('../../utils/database.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
    name: 'slap',
    description: 'Slap someone!',
    usage: 'slap <@user> [message]',
    cooldown: 3000,

    async execute(message, args) {
        const target = message.mentions.users.first();
        const customMessage = args.slice(1).join(' ');

        if (!target || target.id === message.author.id || target.bot) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor(colors.warning)
                    .setTitle('👋 Slap Fail')
                    .setDescription('Please mention someone else to slap!')
                ]
            });
        }

        const sentMessage = await message.reply({
            embeds: [new EmbedBuilder()
                .setColor(colors.primary)
                .setTitle('👋 Charging up...')
                .setDescription('Winding up that slap!')
            ]
        });

        try {
            const res = await fetch('https://nekos.best/api/v2/slap');
            const data = await res.json();
            const gifUrl = data.results[0].url;

            const slapEmbed = new EmbedBuilder()
                .setColor(colors.warning)
                .setTitle('👋 SLAP!')
                .setDescription(`**${message.author.username}** slaps ${target}!${customMessage ? `\n\n💬 *"${customMessage}"*` : ''}`)
                .setImage(gifUrl);

            await sentMessage.edit({ embeds: [slapEmbed] });
        } catch {
            await sentMessage.edit({
                embeds: [new EmbedBuilder()
                    .setColor(colors.warning)
                    .setTitle('👋 SLAP!')
                    .setDescription(`**${message.author.username}** slaps ${target}! (No GIF 😢)`)
                ]
            });
        }

        database.updateStats(message.author.id, 'command');
    }
};
