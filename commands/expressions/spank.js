const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const database = require('../../utils/database.js');

module.exports = {
    name: 'spank',
    aliases: ['spanking'],
    description: 'Playfully spank someone with an action GIF',
    usage: 'spank <@user> [message]',
    cooldown: 3000, // 3 seconds
    execute(message, args, client) {
        // Check if user mentioned someone
        if (args.length < 1 || message.mentions.users.size === 0) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '🍑 Spank Command',
                    description: 'Please mention someone to playfully spank!\n**Usage:** `Kspank @user [message]`\n**Example:** `Kspank @friend That\'s for being naughty!`\n\n*Note: This is just playful fun!*',
                    timestamp: new Date()
                }]
            });
        }

        const target = message.mentions.users.first();
        const customMessage = args.slice(1).join(' ');

        // Can't spank yourself
        if (target.id === message.author.id) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '🍑 Self Spank',
                    description: 'You can\'t spank yourself! That\'s just awkward! Find someone else to playfully spank! 😅',
                    timestamp: new Date()
                }]
            });
        }

        // Can't spank bots
        if (target.bot) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '🤖 Bot Spank',
                    description: 'Bots don\'t have the necessary... anatomy for this! Try spanking a real person instead! 🤖',
                    timestamp: new Date()
                }]
            });
        }

        // Create initial embed
        const loadingEmbed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle('🍑 Preparing Spanking...')
            .setDescription('Getting ready for some playful discipline! 😈')
            .setFooter({ 
                text: 'Powered by Tenor API | Keep it playful!',
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp();

        message.reply({ embeds: [loadingEmbed] }).then(async (sentMessage) => {
            try {
                // Fetch GIF from Tenor API
                const tenorApiKey = process.env.GOOGLE_API_KEY || config.googleApiKey || 'default_tenor_key';
                const searchTerms = ['anime spank', 'playful spank', 'cartoon spank', 'funny spank', 'discipline'];
                const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
                
                const tenorUrl = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(randomTerm)}&key=${tenorApiKey}&client_key=discord_bot&limit=50&contentfilter=medium`;
                
                const response = await fetch(tenorUrl);
                const data = await response.json();
                
                if (data.results && data.results.length > 0) {
                    // Select random GIF from results
                    const randomGif = data.results[Math.floor(Math.random() * data.results.length)];
                    const gifUrl = randomGif.media_formats.gif.url;
                    
                    // Create spank messages
                    const spankMessages = [
                        `🍑 **${message.author.username}** gives ${target} a playful spanking!`,
                        `😈 **${message.author.username}** disciplines ${target} with a spank!`,
                        `🍑 **${message.author.username}** shows ${target} who's boss with a spank!`,
                        `💥 **${message.author.username}** delivers some playful punishment to ${target}!`,
                        `😈 **${message.author.username}** gives ${target} what they deserve!`,
                        `🍑 **${message.author.username}** teaches ${target} a lesson!`
                    ];
                    
                    const randomMessage = spankMessages[Math.floor(Math.random() * spankMessages.length)];
                    
                    const spankEmbed = new EmbedBuilder()
                        .setColor(colors.error)
                        .setTitle('🍑 SPANK!')
                        .setDescription(randomMessage + (customMessage ? `\n\n💬 *"${customMessage}"*` : ''))
                        .setImage(gifUrl)
                        .addFields(
                            {
                                name: '😈 Naughty Level',
                                value: `${target.username}: ███████░░░ 70%`,
                                inline: true
                            },
                            {
                                name: '🍑 Discipline Power',
                                value: '██████████ 100%',
                                inline: true
                            },
                            {
                                name: '📚 Lesson Learned',
                                value: 'Don\'t be naughty! 😈',
                                inline: true
                            }
                        )
                        
                        .setTimestamp();

                    await sentMessage.edit({ embeds: [spankEmbed] });
                } else {
                    throw new Error('No GIFs found');
                }
            } catch (error) {
                console.error('Error fetching spank GIF:', error);
                
                // Fallback with emojis and playful message
                const fallbackMessages = [
                    `🍑 **${message.author.username}** gives ${target} a playful spanking! 😈`,
                    `💥 **${message.author.username}** disciplines ${target} with authority! 🍑`,
                    `😈 **${message.author.username}** shows ${target} some playful punishment! 💥`
                ];
                
                const randomFallback = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
                
                const fallbackEmbed = new EmbedBuilder()
                    .setColor(colors.error)
                    .setTitle('🍑 SPANK!')
                    .setDescription(randomFallback + (customMessage ? `\n\n💬 *"${customMessage}"*` : ''))
                    .addFields(
                        {
                            name: '😈 Spank Emojis',
                            value: '🍑 😈 💥 🔥 ⚡ 💢 👋 🤚',
                            inline: false
                        },
                        {
                            name: '📚 Discipline Quote',
                            value: '"Sometimes you need a little discipline to keep things fun!" 😈',
                            inline: false
                        },
                        {
                            name: '🎭 Keep It Playful',
                            value: '*This is all just for fun and games! Keep it lighthearted! 😄',
                            inline: false
                        }
                    )
                    .setFooter({ 
                        text: `GIF service unavailable, but the spanking was effective! | ${target.username} ← ${message.author.username}`,
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
