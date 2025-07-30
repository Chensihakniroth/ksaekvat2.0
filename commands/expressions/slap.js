const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const database = require('../../utils/database.js');

module.exports = {
    name: 'slap',
    aliases: ['smack'],
    description: 'Slap someone with an action GIF',
    usage: 'slap <@user> [message]',
    cooldown: 3000, // 3 seconds
    execute(message, args, client) {
        // Check if user mentioned someone
        if (args.length < 1 || message.mentions.users.size === 0) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '👋 Slap Command',
                    description: 'Please mention someone to slap!\n**Usage:** `Kslap @user [message]`\n**Example:** `Kslap @friend That\'s what you get!`',
                    timestamp: new Date()
                }]
            });
        }

        const target = message.mentions.users.first();
        const customMessage = args.slice(1).join(' ');

        // Can't slap yourself
        if (target.id === message.author.id) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '👋 Self Slap',
                    description: 'You can\'t slap yourself! That would be weird! Find someone else to playfully slap! 😅',
                    timestamp: new Date()
                }]
            });
        }

        // Can't slap bots
        if (target.bot) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '🤖 Bot Slap',
                    description: 'Bots don\'t feel slaps, they just process the data! Try slapping a real person instead! 🤖',
                    timestamp: new Date()
                }]
            });
        }

        // Create initial embed
        const loadingEmbed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle('👋 Preparing Slap...')
            .setDescription('Winding up for the perfect slap! 💥')
            .setFooter({ 
                text: 'Powered by Tenor API',
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp();

        message.reply({ embeds: [loadingEmbed] }).then(async (sentMessage) => {
            try {
                // Fetch GIF from Tenor API
                const tenorApiKey = process.env.GOOGLE_API_KEY || config.googleApiKey || 'default_tenor_key';
                const searchTerms = ['anime slap', 'slap face', 'cartoon slap', 'slap fight', 'face slap'];
                const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];

                const tenorUrl = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(randomTerm)}&key=${tenorApiKey}&client_key=discord_bot&limit=50&contentfilter=medium`;

                const response = await fetch(tenorUrl);
                const data = await response.json();

                if (data.results && data.results.length > 0) {
                    // Select random GIF from results
                    const randomGif = data.results[Math.floor(Math.random() * data.results.length)];
                    const gifUrl = randomGif.media_formats.gif.url;

                    // Create slap messages
                    const slapMessages = [
                        `👋 **${message.author.username}** delivers a stinging slap to ${target}!`,
                        `💥 **${message.author.username}** gives ${target} a reality check slap!`,
                        `🤚 **${message.author.username}** smacks ${target} across the face!`,
                        `👋 **${message.author.username}** shows ${target} the power of their palm!`,
                        `💥 **${message.author.username}** slaps some sense into ${target}!`,
                        `🤚 **${message.author.username}** gives ${target} a well-deserved slap!`
                    ];

                    const randomMessage = slapMessages[Math.floor(Math.random() * slapMessages.length)];

                    const slapEmbed = new EmbedBuilder()
                        .setColor(colors.warning)
                        .setTitle('👋 SLAP!')
                        .setDescription(randomMessage + (customMessage ? `\n\n💬 *"${customMessage}"*` : ''))
                        .setImage(gifUrl)
                        .addFields(
                            {
                                name: '💥 Slap Power',
                                value: '████████░░ 80%',
                                inline: true
                            },
                            {
                                name: '🔥 Impact',
                                value: 'Direct Hit! 🎯',
                                inline: true
                            },
                            {
                                name: '😵 Effect',
                                value: 'Stunned for 3 seconds!',
                                inline: true
                            }
                        )
                        .setTimestamp();

                    await sentMessage.edit({ embeds: [slapEmbed] });
                } else {
                    throw new Error('No GIFs found');
                }
            } catch (error) {
                console.error('Error fetching slap GIF:', error);

                // Fallback with emojis and action message
                const fallbackMessages = [
                    `👋 **${message.author.username}** delivers a mighty slap to ${target}! 💥`,
                    `🤚 **${message.author.username}** gives ${target} a reality check! 💥`,
                    `💥 **${message.author.username}** shows ${target} their slapping skills! 👋`
                ];

                const randomFallback = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];

                const fallbackEmbed = new EmbedBuilder()
                    .setColor(colors.warning)
                    .setTitle('👋 SLAP!')
                    .setDescription(randomFallback + (customMessage ? `\n\n💬 *"${customMessage}"*` : ''))
                    .addFields(
                        {
                            name: '👋 Slap Emojis',
                            value: '👋 🤚 💥 🔥 ⚡ 💯 🎯 💢',
                            inline: false
                        },
                        {
                            name: '💭 Slap Wisdom',
                            value: 'Sometimes a good slap is all you need to wake up! 👋',
                            inline: false
                        }
                    )
                    .setFooter({ 
                        text: `GIF service unavailable, but the slap was heard! | ${target.username} ← ${message.author.username}`,
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