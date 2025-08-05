const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const database = require('../../utils/database.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
    name: 'thank',
    description: 'Thank someone (anime style).',
    usage: 'thank <@user> [message]',
    cooldown: 3000,
    async execute(message, args) {
        const target = message.mentions.users.first();
        const customMessage = args.slice(1).join(' ');

        if (!target || target.id === message.author.id || target.bot) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor(colors.danger || 0xFF4444)
                    .setTitle('🙏 Thank Fail')
                    .setDescription('You must mention someone else to thank.')
                ]
            });
        }

        const sent = await message.reply({
            embeds: [new EmbedBuilder()
                .setColor(colors.primary || 0x0099FF)
                .setTitle('🙏 Preparing...')
                .setDescription('Loading thank...')
            ]
        });

        try {
            let gifUrl = null;

            // Try waifu.pics with thank endpoint (placeholder, as endpoint may not exist)
            try {
                const res1 = await fetch('https://api.waifu.pics/sfw/thank');
                const data1 = await res1.json();
                console.log('Waifu.pics thank response:', data1);

                if (data1 && data1.url) {
                    gifUrl = data1.url;
                }
            } catch (e) {
                console.log('Waifu.pics thank failed, trying alternatives...');
            }

            // If waifu.pics thank failed, try nekos.best thank as backup (placeholder)
            if (!gifUrl) {
                try {
                    const res2 = await fetch('https://nekos.best/api/v2/thank');
                    const data2 = await res2.json();
                    console.log('Nekos.best thank response:', data2);

                    if (data2 && data2.results && data2.results.length > 0 && data2.results[0].url) {
                        gifUrl = data2.results[0].url;
                    } else if (data2 && data2.url) {
                        gifUrl = data2.url;
                    }
                } catch (e) {
                    console.log('Nekos.best thank also failed');
                }
            }

            // Final fallback to pat (gentle and similar)
            if (!gifUrl) {
                try {
                    const res3 = await fetch('https://api.waifu.pics/sfw/pat');
                    const data3 = await res3.json();
                    console.log('Waifu.pics pat response:', data3);

                    if (data3 && data3.url) {
                        gifUrl = data3.url;
                    }
                } catch (e) {
                    console.log('All thank APIs failed');
                }
            }

            const embed = new EmbedBuilder()
                .setColor(colors.success || 0x00FF44)
                .setTitle('🙏 Thank You!')
                .setDescription(`**${message.author.username}** thanks ${target}!${customMessage ? `\n\n💬 "${customMessage}"` : ''}`);

            if (gifUrl) {
                console.log('Using thank GIF URL:', gifUrl);
                embed.setImage(gifUrl);
            } else {
                console.log('No thank GIF found from any API');
            }

            await sent.edit({ embeds: [embed] });

        } catch (error) {
            console.error('Error in thank command:', error);
            await sent.edit({
                embeds: [new EmbedBuilder()
                    .setColor(colors.success || 0x00FF44)
                    .setTitle('🙏 Thank You!')
                    .setDescription(`**${message.author.username}** thanks ${target}! (No GIF available)`)
                ]
            });
        }

        database.updateStats(message.author.id, 'command');
    }
};