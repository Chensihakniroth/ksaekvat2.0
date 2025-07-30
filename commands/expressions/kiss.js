const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const database = require('../../utils/database.js');

module.exports = {
    name: 'kiss',
    aliases: ['smooch'],
    description: 'Kiss someone with a cute GIF',
    usage: 'kiss <@user> [message]',
    cooldown: 3000, // 3 seconds
    execute(message, args, client) {
        // Check if user mentioned someone
        if (args.length < 1 || message.mentions.users.size === 0) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '💋 Kiss Command',
                    description: 'Please mention someone to kiss!\n**Usage:** `Kkiss @user [message]`\n**Example:** `Kkiss @friend You\'re amazing!`',
                    timestamp: new Date()
                }]
            });
        }

        const target = message.mentions.users.first();
        const customMessage = args.slice(1).join(' ');

        // Can't kiss yourself
        if (target.id === message.author.id) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '💋 Self Kiss',
                    description: 'You can\'t kiss yourself silly! Find someone else to show affection to! 😘',
                    timestamp: new Date()
                }]
            });
        }

        // Can't kiss bots
        if (target.bot) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '🤖 Bot Kiss',
                    description: 'Bots don\'t need kisses, but the gesture is sweet! Try kissing a real person instead! 💕',
                    timestamp: new Date()
                }]
            });
        }

        // Create initial embed
        const loadingEmbed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle('💋 Fetching Kiss GIF...')
            .setDescription('Finding the perfect kiss GIF for you! 💕')
            .setFooter({ 
                text: 'Powered by Tenor API',
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp();

        message.reply({ embeds: [loadingEmbed] }).then(async (sentMessage) => {
            try {
                // Fetch GIF from Tenor API
                const tenorApiKey = process.env.GOOGLE_API_KEY || config.googleApiKey || 'default_tenor_key';
                const searchTerms = ['anime kiss', 'cute kiss', 'kiss love', 'romantic kiss', 'sweet kiss'];
                const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
                
                const tenorUrl = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(randomTerm)}&key=${tenorApiKey}&client_key=discord_bot&limit=50&contentfilter=medium`;
                
                const response = await fetch(tenorUrl);
                const data = await response.json();
                
                if (data.results && data.results.length > 0) {
                    // Select random GIF from results
                    const randomGif = data.results[Math.floor(Math.random() * data.results.length)];
                    const gifUrl = randomGif.media_formats.gif.url;
                    
                    // Create kiss messages
                    const kissMessages = [
                        `💋 **${message.author.username}** gives ${target} a sweet kiss!`,
                        `😘 **${message.author.username}** kisses ${target} tenderly!`,
                        `💕 **${message.author.username}** plants a loving kiss on ${target}!`,
                        `😚 **${message.author.username}** gives ${target} an affectionate kiss!`,
                        `💖 **${message.author.username}** shares a romantic kiss with ${target}!`,
                        `😘 **${message.author.username}** surprises ${target} with a gentle kiss!`
                    ];
                    
                    const randomMessage = kissMessages[Math.floor(Math.random() * kissMessages.length)];
                    
                    const kissEmbed = new EmbedBuilder()
                        .setColor(colors.success)
                        .setTitle('💋 Kiss!')
                        .setDescription(randomMessage + (customMessage ? `\n\n💌 *"${customMessage}"*` : ''))
                        .setImage(gifUrl)
                        .addFields({
                            name: '💕 Affection Level',
                            value: '█████████░ 90%',
                            inline: true
                        })
                        
                        .setTimestamp();

                    await sentMessage.edit({ embeds: [kissEmbed] });
                } else {
                    throw new Error('No GIFs found');
                }
            } catch (error) {
                console.error('Error fetching kiss GIF:', error);
                
                // Fallback with emojis and cute message
                const fallbackMessages = [
                    `💋 **${message.author.username}** gives ${target} a sweet kiss! 😘`,
                    `💕 **${message.author.username}** kisses ${target} lovingly! 😚`,
                    `😘 **${message.author.username}** plants a gentle kiss on ${target}! 💖`
                ];
                
                const randomFallback = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
                
                const fallbackEmbed = new EmbedBuilder()
                    .setColor(colors.success)
                    .setTitle('💋 Kiss!')
                    .setDescription(randomFallback + (customMessage ? `\n\n💌 *"${customMessage}"*` : ''))
                    .addFields(
                        {
                            name: '💕 Kiss Emojis',
                            value: '😘 💋 😚 💕 💖 💗 💓 💞',
                            inline: false
                        },
                        {
                            name: '💌 Sweet Message',
                            value: 'A kiss is a lovely trick designed by nature to stop speech when words become superfluous! 💕',
                            inline: false
                        }
                    )
                    .setFooter({ 
                        text: `GIF service unavailable, but the love is real! | ${target.username} ← ${message.author.username}`,
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
