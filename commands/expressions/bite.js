const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const database = require('../../utils/database.js');

module.exports = {
    name: 'bite',
    aliases: ['nom'],
    description: 'Playfully bite someone with an action GIF',
    usage: 'bite <@user> [message]',
    cooldown: 3000, // 3 seconds
    execute(message, args, client) {
        // Check if user mentioned someone
        if (args.length < 1 || message.mentions.users.size === 0) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '🦷 Bite Command',
                    description: 'Please mention someone to bite!\n**Usage:** `Kbite @user [message]`\n**Example:** `Kbite @friend Nom nom nom!`',
                    timestamp: new Date()
                }]
            });
        }

        const target = message.mentions.users.first();
        const customMessage = args.slice(1).join(' ');

        // Can't bite yourself
        if (target.id === message.author.id) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '🦷 Self Bite',
                    description: 'You can\'t bite yourself! That would just hurt! Find someone else to playfully bite! 😅',
                    timestamp: new Date()
                }]
            });
        }

        // Can't bite bots
        if (target.bot) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '🤖 Bot Bite',
                    description: 'Bots taste like metal and circuits! That can\'t be good for your teeth! Try biting a real person instead! 🤖',
                    timestamp: new Date()
                }]
            });
        }

        // Create initial embed
        const loadingEmbed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle('🦷 Preparing to Bite...')
            .setDescription('Sharpening teeth for a playful bite! 😈')
            .setFooter({ 
                text: 'Powered by Tenor API',
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp();

        message.reply({ embeds: [loadingEmbed] }).then(async (sentMessage) => {
            try {
                // Fetch GIF from Tenor API
                const tenorApiKey = process.env.GOOGLE_API_KEY || config.googleApiKey || 'default_tenor_key';
                const searchTerms = ['anime bite', 'playful bite', 'cute bite', 'nom bite', 'cartoon bite'];
                const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
                
                const tenorUrl = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(randomTerm)}&key=${tenorApiKey}&client_key=discord_bot&limit=50&contentfilter=medium`;
                
                const response = await fetch(tenorUrl);
                const data = await response.json();
                
                if (data.results && data.results.length > 0) {
                    // Select random GIF from results
                    const randomGif = data.results[Math.floor(Math.random() * data.results.length)];
                    const gifUrl = randomGif.media_formats.gif.url;
                    
                    // Create bite messages
                    const biteMessages = [
                        `🦷 **${message.author.username}** playfully bites ${target}!`,
                        `😈 **${message.author.username}** gives ${target} a gentle nom!`,
                        `🦷 **${message.author.username}** takes a playful bite out of ${target}!`,
                        `😋 **${message.author.username}** noms on ${target} affectionately!`,
                        `🦷 **${message.author.username}** shows their playful side by biting ${target}!`,
                        `😈 **${message.author.username}** gives ${target} a mischievous bite!`
                    ];
                    
                    const randomMessage = biteMessages[Math.floor(Math.random() * biteMessages.length)];
                    
                    // Generate taste rating
                    const tastes = ['Sweet! 🍭', 'Salty! 🧂', 'Spicy! 🌶️', 'Sour! 🍋', 'Bitter! ☕', 'Tasty! 😋'];
                    const randomTaste = tastes[Math.floor(Math.random() * tastes.length)];
                    
                    const biteEmbed = new EmbedBuilder()
                        .setColor(colors.warning)
                        .setTitle('🦷 NOM NOM!')
                        .setDescription(randomMessage + (customMessage ? `\n\n💬 *"${customMessage}"*` : ''))
                        .setImage(gifUrl)
                        .addFields(
                            {
                                name: '😋 Taste Test',
                                value: randomTaste,
                                inline: true
                            },
                            {
                                name: '🦷 Bite Strength',
                                value: '███████░░░ 70%',
                                inline: true
                            },
                            {
                                name: '😈 Playfulness',
                                value: '██████████ MAX',
                                inline: true
                            }
                        )
                        .setFooter({ 
                            text: `${target.username} got bitten by ${message.author.username} | Nom nom! | Powered by Tenor`,
                            iconURL: target.displayAvatarURL()
                        })
                        .setTimestamp();

                    await sentMessage.edit({ embeds: [biteEmbed] });
                } else {
                    throw new Error('No GIFs found');
                }
            } catch (error) {
                console.error('Error fetching bite GIF:', error);
                
                // Fallback with emojis and playful message
                const fallbackMessages = [
                    `🦷 **${message.author.username}** takes a playful bite out of ${target}! 😋`,
                    `😈 **${message.author.username}** noms on ${target} affectionately! 🦷`,
                    `😋 **${message.author.username}** gives ${target} a mischievous bite! 😈`
                ];
                
                const randomFallback = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
                
                // Generate taste and bite info
                const tastes = ['Sweet! 🍭', 'Salty! 🧂', 'Spicy! 🌶️', 'Sour! 🍋', 'Bitter! ☕', 'Tasty! 😋'];
                const randomTaste = tastes[Math.floor(Math.random() * tastes.length)];
                
                const fallbackEmbed = new EmbedBuilder()
                    .setColor(colors.warning)
                    .setTitle('🦷 NOM NOM!')
                    .setDescription(randomFallback + (customMessage ? `\n\n💬 *"${customMessage}"*` : ''))
                    .addFields(
                        {
                            name: '🦷 Bite Emojis',
                            value: '🦷 😈 😋 🤤 👹 🧛‍♂️ 🧛‍♀️ 👄',
                            inline: false
                        },
                        {
                            name: '😋 Taste Report',
                            value: `${target.username} tastes: ${randomTaste}`,
                            inline: true
                        },
                        {
                            name: '🍽️ Nom Facts',
                            value: [
                                '• Playful bites show affection',
                                '• Everyone has a unique taste',
                                '• Biting is a form of play',
                                '• Remember to brush your teeth!'
                            ].join('\n'),
                            inline: false
                        }
                    )
                    .setFooter({ 
                        text: `GIF service unavailable, but the bite was memorable! | ${target.username} ← ${message.author.username}`,
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
