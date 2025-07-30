const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const database = require('../../utils/database.js');

module.exports = {
    name: 'punch',
    aliases: ['hit'],
    description: 'Punch someone with an action GIF',
    usage: 'punch <@user> [message]',
    cooldown: 3000, // 3 seconds
    execute(message, args, client) {
        // Check if user mentioned someone
        if (args.length < 1 || message.mentions.users.size === 0) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '👊 Punch Command',
                    description: 'Please mention someone to punch!\n**Usage:** `Kpunch @user [message]`\n**Example:** `Kpunch @friend That\'s for being silly!`',
                    timestamp: new Date()
                }]
            });
        }

        const target = message.mentions.users.first();
        const customMessage = args.slice(1).join(' ');

        // Can't punch yourself
        if (target.id === message.author.id) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '👊 Self Punch',
                    description: 'You can\'t punch yourself! That would just be self-harm! Find someone else to playfully punch! 😅',
                    timestamp: new Date()
                }]
            });
        }

        // Can't punch bots
        if (target.bot) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '🤖 Bot Punch',
                    description: 'Bots are made of code, punching them won\'t work! Try punching a real person instead (playfully)! 🤖',
                    timestamp: new Date()
                }]
            });
        }

        // Create initial embed
        const loadingEmbed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle('👊 Preparing Punch...')
            .setDescription('Getting ready to throw a punch! 💥')
            .setFooter({ 
                text: 'Powered by Tenor API',
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp();

        message.reply({ embeds: [loadingEmbed] }).then(async (sentMessage) => {
            try {
                // Fetch GIF from Tenor API
                const tenorApiKey = process.env.GOOGLE_API_KEY || config.googleApiKey || 'default_tenor_key';
                const searchTerms = ['anime punch', 'punch fight', 'action punch', 'fighting punch', 'cartoon punch'];
                const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];

                const tenorUrl = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(randomTerm)}&key=${tenorApiKey}&client_key=discord_bot&limit=50&contentfilter=medium`;

                const response = await fetch(tenorUrl);
                const data = await response.json();

                if (data.results && data.results.length > 0) {
                    // Select random GIF from results
                    const randomGif = data.results[Math.floor(Math.random() * data.results.length)];
                    const gifUrl = randomGif.media_formats.gif.url;

                    // Create punch messages
                    const punchMessages = [
                        `👊 **${message.author.username}** throws a powerful punch at ${target}!`,
                        `💥 **${message.author.username}** lands a solid hit on ${target}!`,
                        `🥊 **${message.author.username}** delivers a knockout punch to ${target}!`,
                        `👊 **${message.author.username}** gives ${target} a playful punch!`,
                        `💥 **${message.author.username}** unleashes their fighting spirit on ${target}!`,
                        `🥊 **${message.author.username}** shows ${target} their boxing skills!`
                    ];

                    const randomMessage = punchMessages[Math.floor(Math.random() * punchMessages.length)];

                    const punchEmbed = new EmbedBuilder()
                        .setColor(colors.error)
                        .setTitle('👊 PUNCH!')
                        .setDescription(randomMessage + (customMessage ? `\n\n💬 *"${customMessage}"*` : ''))
                        .setImage(gifUrl)
                        .addFields(
                            {
                                name: '💥 Impact Level',
                                value: '██████████ 100%',
                                inline: true
                            },
                            {
                                name: '🩹 Damage Dealt',
                                value: 'Critical Hit! 💥',
                                inline: true
                            }
                        )
                        .setTimestamp();

                    await sentMessage.edit({ embeds: [punchEmbed] });
                } else {
                    throw new Error('No GIFs found');
                }
            } catch (error) {
                console.error('Error fetching punch GIF:', error);

                // Fallback with emojis and action message
                const fallbackMessages = [
                    `👊 **${message.author.username}** throws a mighty punch at ${target}! 💥`,
                    `🥊 **${message.author.username}** delivers a knockout blow to ${target}! 💥`,
                    `💥 **${message.author.username}** shows ${target} their fighting moves! 👊`
                ];

                const randomFallback = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];

                const fallbackEmbed = new EmbedBuilder()
                    .setColor(colors.error)
                    .setTitle('👊 PUNCH!')
                    .setDescription(randomFallback + (customMessage ? `\n\n💬 *"${customMessage}"*` : ''))
                    .addFields(
                        {
                            name: '🥊 Fight Emojis',
                            value: '👊 🥊 💥 🤜 🤛 💪 ⚡ 🔥',
                            inline: false
                        },
                        {
                            name: '💭 Fight Quote',
                            value: '"Float like a butterfly, sting like a bee!" - Muhammad Ali 🥊',
                            inline: false
                        }
                    )
                    .setFooter({ 
                        text: `GIF service unavailable, but the punch landed! | ${target.username} ← ${message.author.username}`,
                        iconURL: target.displayAvatarURL()
                    })
                    .setTimestamp();

                await sentMessage.edit({ embeds: [fallbackEmbed] });
            }
        });

        // Update command usage statistics
        database.updateStats(message.author.id, 'command');
    }
};