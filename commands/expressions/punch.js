const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const database = require('../../utils/database.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
    name: 'punch',
    description: 'Punch someone!',
    usage: 'punch <@user> [message]',
    cooldown: 3000,

    async execute(message, args) {
        const target = message.mentions.users.first();
        const customMessage = args.slice(1).join(' ');

        if (!target || target.id === message.author.id || target.bot) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor(colors.warning)
                    .setTitle('🥊 Punch Fail')
                    .setDescription('Please mention someone else to punch!')
                ]
            });
        }

        const sentMessage = await message.reply({
            embeds: [new EmbedBuilder()
                .setColor(colors.primary)
                .setTitle('🥊 Winding up a punch...')
                .setDescription('Getting ready to swing!')
            ]
        });

        try {
            const res = await fetch('https://nekos.best/api/v2/punch');
            const data = await res.json();
            const gifUrl = data.results[0].url;

            const punchEmbed = new EmbedBuilder()
                .setColor(colors.warning)
                .setTitle('🥊 POW!')
                .setDescription(`**${message.author.username}** punches ${target}!${customMessage ? `\n\n💬 *"${customMessage}"*` : ''}`)
                .setImage(gifUrl);

            await sentMessage.edit({ embeds: [punchEmbed] });
        } catch {
            await sentMessage.edit({
                embeds: [new EmbedBuilder()
                    .setColor(colors.warning)
                    .setTitle('🥊 POW!')
                    .setDescription(`**${message.author.username}** punches ${target}! (No GIF 😢)`)
                ]
            });
        }

        database.updateStats(message.author.id, 'command');
    }
};
