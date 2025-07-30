const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const database = require('../../utils/database.js');

module.exports = {
    name: 'pat',
    aliases: ['headpat'],
    description: 'Give someone a gentle pat with a cute GIF',
    usage: 'pat <@user> [message]',
    cooldown: 3000, // 3 seconds
    execute(message, args, client) {
        // Check if user mentioned someone
        if (args.length < 1 || message.mentions.users.size === 0) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '🤗 Pat Command',
                    description: 'Please mention someone to pat!\n**Usage:** `Kpat @user [message]`\n**Example:** `Kpat @friend You\'re doing great!`',
                    timestamp: new Date()
                }]
            });
        }

        const target = message.mentions.users.first();
        const customMessage = args.slice(1).join(' ');

        // Can't pat yourself
        if (target.id === message.author.id) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '🤗 Self Pat',
                    description: 'You can\'t pat yourself! That\'s just weird! Find someone else to give headpats to! 😅',
                    timestamp: new Date()
                }]
            });
        }

        // Can't pat bots
        if (target.bot) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '🤖 Bot Pat',
                    description: 'Bots appreciate the gesture, but they can\'t feel headpats! Try patting a real person instead! 🤖',
                    timestamp: new Date()
                }]
            });
        }

        // Create initial embed
        const loadingEmbed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle('🤗 Preparing Headpats...')
            .setDescription('Getting ready to give some gentle headpats! 💕')
            
            .setTimestamp();

        message.reply({ embeds: [loadingEmbed] }).then(async (sentMessage) => {
            try {
                // Fetch GIF from Tenor API
                const tenorApiKey = process.env.GOOGLE_API_KEY || config.googleApiKey || 'default_tenor_key';
                const searchTerms = ['anime pat head', 'headpat cute', 'pat pat', 'gentle pat', 'head pat cute'];
                const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
                
                const tenorUrl = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(randomTerm)}&key=${tenorApiKey}&limit=50&contentfilter=medium`;
                
                const response = await fetch(tenorUrl);
                const data = await response.json();
                
                if (data.results && data.results.length > 0) {
                    // Select random GIF from results
                    const randomGif = data.results[Math.floor(Math.random() * data.results.length)];
                    const gifUrl = randomGif.media_formats.gif.url;
                    
                    // Create pat messages
                    const patMessages = [
                        `🤗 **${message.author.username}** gives ${target} gentle headpats!`,
                        `💕 **${message.author.username}** pats ${target} lovingly on the head!`,
                        `🥰 **${message.author.username}** shows ${target} some affection with headpats!`,
                        `😊 **${message.author.username}** comforts ${target} with gentle pats!`,
                        `💖 **${message.author.username}** gives ${target} the sweetest headpats!`,
                        `🤗 **${message.author.username}** pats ${target} to cheer them up!`
                    ];
                    
                    const randomMessage = patMessages[Math.floor(Math.random() * patMessages.length)];
                    
                    const patEmbed = new EmbedBuilder()
                        .setColor(colors.success)
                        .setTitle('🤗 Headpats!')
                        .setDescription(randomMessage + (customMessage ? `\n\n💌 *"${customMessage}"*` : ''))
                        .setImage(gifUrl)
                        .addFields(
                            {
                                name: '💕 Comfort Level',
                                value: '██████████ 100%',
                                inline: true
                            },
                            {
                                name: '🥰 Wholesome Meter',
                                value: '██████████ MAX',
                                inline: true
                            },
                            {
                                name: '😊 Mood Boost',
                                value: '+50 Happiness! ✨',
                                inline: true
                            }
                        )
                        
                        .setTimestamp();

                    await sentMessage.edit({ embeds: [patEmbed] });
                } else {
                    throw new Error('No GIFs found');
                }
            } catch (error) {
                console.error('Error fetching pat GIF:', error);
                
                // Fallback with emojis and wholesome message
                const fallbackMessages = [
                    `🤗 **${message.author.username}** gives ${target} the most gentle headpats! 💕`,
                    `💖 **${message.author.username}** shows ${target} pure affection with pats! 🥰`,
                    `😊 **${message.author.username}** comforts ${target} with loving headpats! 🤗`
                ];
                
                const randomFallback = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
                
                const fallbackEmbed = new EmbedBuilder()
                    .setColor(colors.success)
                    .setTitle('🤗 Headpats!')
                    .setDescription(randomFallback + (customMessage ? `\n\n💌 *"${customMessage}"*` : ''))
                    .addFields(
                        {
                            name: '🥰 Pat Emojis',
                            value: '🤗 💕 😊 🥰 💖 💝 ✨ 🌟',
                            inline: false
                        },
                        {
                            name: '💌 Wholesome Message',
                            value: 'Headpats are the purest form of affection! Everyone deserves gentle headpats! 💕',
                            inline: false
                        },
                        {
                            name: '🌈 Pat Benefits',
                            value: [
                                '• Reduces stress by 90%',
                                '• Increases happiness levels',
                                '• Shows genuine care and affection',
                                '• Creates wholesome moments'
                            ].join('\n'),
                            inline: false
                        }
                    )
                    
                    .setTimestamp();

                await sentMessage.edit({ embeds: [fallbackEmbed] });
            }
        });

        // Update command usage statistics
        database.updateStats(message.author.id, 'command');
    }
};
