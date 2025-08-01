const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const database = require('../../utils/database.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
    name: 'spank',
    description: 'Playfully spank someone (anime style).',
    usage: 'spank <@user> [message]',
    cooldown: 3000,
    async execute(message, args) {
        const target = message.mentions.users.first();
        const customMessage = args.slice(1).join(' ');

        if (!target || target.id === message.author.id || target.bot) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor(colors.danger || 0xFF4444)
                    .setTitle('✋ Spank Fail')
                    .setDescription('You must mention someone else to spank.')
                ]
            });
        }

        const sent = await message.reply({
            embeds: [new EmbedBuilder()
                .setColor(colors.primary || 0x0099FF)
                .setTitle('✋ Preparing...')
                .setDescription('Loading playful punishment...')
            ]
        });

        try {
            let gifUrl = null;

            // Try waifu.pics with actual spank endpoint
            try {
                const res1 = await fetch('https://api.waifu.pics/sfw/spank');
                const data1 = await res1.json();
                console.log('Waifu.pics spank response:', data1);

                if (data1 && data1.url) {
                    gifUrl = data1.url;
                }
            } catch (e) {
                console.log('Waifu.pics spank failed, trying alternatives...');
            }

            // If waifu.pics spank failed, try poke as backup
            if (!gifUrl) {
                try {
                    const res2 = await fetch('https://api.waifu.pics/sfw/poke');
                    const data2 = await res2.json();
                    console.log('Waifu.pics poke response:', data2);

                    if (data2 && data2.url) {
                        gifUrl = data2.url;
                    }
                } catch (e) {
                    console.log('Waifu.pics poke also failed');
                }
            }

            // Final fallback to pat (gentle and cute)
            if (!gifUrl) {
                try {
                    const res3 = await fetch('https://api.waifu.pics/sfw/pat');
                    const data3 = await res3.json();
                    console.log('Waifu.pics pat response:', data3);

                    if (data3 && data3.url) {
                        gifUrl = data3.url;
                    }
                } catch (e) {
                    console.log('All spank APIs failed');
                }
            }

            const embed = new EmbedBuilder()
                .setColor(colors.warning || 0xFFAA00)
                .setTitle('✋ Playful Punishment!')
                .setDescription(`**${message.author.username}** playfully spanks ${target}!${customMessage ? `\n\n💬 "${customMessage}"` : ''}`);

            if (gifUrl) {
                console.log('Using spank GIF URL:', gifUrl);
                embed.setImage(gifUrl);
            } else {
                console.log('No spank GIF found from any API');
            }

            await sent.edit({ embeds: [embed] });

        } catch (error) {
            console.error('Error in spank command:', error);
            await sent.edit({
                embeds: [new EmbedBuilder()
                    .setColor(colors.warning || 0xFFAA00)
                    .setTitle('✋ Playful Punishment!')
                    .setDescription(`**${message.author.username}** playfully spanks ${target}! (No GIF available)`)
                ]
            });
        }

        database.updateStats(message.author.id, 'command');
    }
};