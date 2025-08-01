const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const database = require('../../utils/database.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
    name: 'kill',
    description: 'Kill someone (virtually)!',
    usage: 'kill <@user> [message]',
    cooldown: 3000,
    async execute(message, args) {
        const target = message.mentions.users.first();
        const customMessage = args.slice(1).join(' ');

        if (!target || target.id === message.author.id || target.bot) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor(colors.danger || 0xFF4444)
                    .setTitle('☠️ Kill Fail')
                    .setDescription('You must mention someone else to kill.')
                ]
            });
        }

        const sentMessage = await message.reply({
            embeds: [new EmbedBuilder()
                .setColor(colors.primary || 0x0099FF)
                .setTitle('☠️ Loading weapon...')
                .setDescription('Assassination in progress...')
            ]
        });

        try {
            // Try multiple APIs in order of preference
            let gifUrl = null;

            // Try nekos.best first
            try {
                const res1 = await fetch('https://nekos.best/api/v2/kill');
                const data1 = await res1.json();
                console.log('Nekos.best response:', data1);

                if (data1 && data1.results && data1.results.length > 0 && data1.results[0].url) {
                    gifUrl = data1.results[0].url;
                } else if (data1 && data1.url) {
                    gifUrl = data1.url;
                }
            } catch (e) {
                console.log('Nekos.best failed, trying alternative...');
            }

            // If nekos.best failed, try waifu.pics
            if (!gifUrl) {
                try {
                    const res2 = await fetch('https://api.waifu.pics/sfw/kill');
                    const data2 = await res2.json();
                    console.log('Waifu.pics response:', data2);

                    if (data2 && data2.url) {
                        gifUrl = data2.url;
                    }
                } catch (e) {
                    console.log('Waifu.pics also failed');
                }
            }

            const killEmbed = new EmbedBuilder()
                .setColor(colors.danger || 0xFF4444)
                .setTitle('☠️ Fatality!')
                .setDescription(`**${message.author.username}** kills ${target}!${customMessage ? `\n\n💬 "${customMessage}"` : ''}`);

            if (gifUrl) {
                console.log('Using GIF URL:', gifUrl);
                killEmbed.setImage(gifUrl);
            } else {
                console.log('No GIF found from any API');
            }

            await sentMessage.edit({ embeds: [killEmbed] });

        } catch (error) {
            console.error('Error in kill command:', error);
            await sentMessage.edit({
                embeds: [new EmbedBuilder()
                    .setColor(colors.danger || 0xFF4444)
                    .setTitle('☠️ Fatality!')
                    .setDescription(`**${message.author.username}** kills ${target}! (No GIF 😢)`)
                ]
            });
        }

        database.updateStats(message.author.id, 'command');
    }
};