const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const database = require('../../utils/database.js');

module.exports = {
    name: 'jail',
    aliases: ['arrest', 'prison'],
    description: 'Send someone to jail with an action GIF',
    usage: 'jail <@user> [reason]',
    cooldown: 3000, // 3 seconds
    execute(message, args, client) {
        // Check if user mentioned someone
        if (args.length < 1 || message.mentions.users.size === 0) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '🚔 Jail Command',
                    description: 'Please mention someone to send to jail!\n**Usage:** `Kjail @user [reason]`\n**Example:** `Kjail @friend Being too funny!`',
                    timestamp: new Date()
                }]
            });
        }

        const target = message.mentions.users.first();
        const reason = args.slice(1).join(' ') || 'No reason provided';

        // Can't jail yourself
        if (target.id === message.author.id) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '🚔 Self Arrest',
                    description: 'You can\'t arrest yourself! That\'s not how the law works! Find someone else to send to jail! 👮‍♂️',
                    timestamp: new Date()
                }]
            });
        }

        // Can't jail bots
        if (target.bot) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '🤖 Bot Arrest',
                    description: 'Bots operate above the law! They have diplomatic immunity! Try arresting a real person instead! 🤖',
                    timestamp: new Date()
                }]
            });
        }

        // Create initial embed
        const loadingEmbed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle('🚔 Calling Police...')
            .setDescription('Dispatching officers to make an arrest! 👮‍♂️')
            .setFooter({ 
                text: 'Powered by Tenor API',
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp();

        message.reply({ embeds: [loadingEmbed] }).then(async (sentMessage) => {
            try {
                // Fetch GIF from Tenor API
                const tenorApiKey = process.env.GOOGLE_API_KEY || config.googleApiKey || 'default_tenor_key';
                const searchTerms = ['arrest jail', 'police arrest', 'going to jail', 'handcuffs arrest', 'cartoon jail'];
                const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
                
                const tenorUrl = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(randomTerm)}&key=${tenorApiKey}&client_key=discord_bot&limit=50&contentfilter=medium`;
                
                const response = await fetch(tenorUrl);
                const data = await response.json();
                
                if (data.results && data.results.length > 0) {
                    // Select random GIF from results
                    const randomGif = data.results[Math.floor(Math.random() * data.results.length)];
                    const gifUrl = randomGif.media_formats.gif.url;
                    
                    // Create jail messages
                    const jailMessages = [
                        `🚔 **${message.author.username}** arrests ${target} and sends them to jail!`,
                        `👮‍♂️ **${message.author.username}** puts ${target} behind bars!`,
                        `🚨 **${message.author.username}** calls the police on ${target}!`,
                        `⛓️ **${message.author.username}** locks up ${target} for their crimes!`,
                        `🚔 **${message.author.username}** serves justice to ${target}!`,
                        `👮‍♀️ **${message.author.username}** makes a citizen's arrest on ${target}!`
                    ];
                    
                    const randomMessage = jailMessages[Math.floor(Math.random() * jailMessages.length)];
                    
                    // Generate random sentence time
                    const sentenceTime = Math.floor(Math.random() * 10) + 1;
                    const timeUnit = ['minutes', 'hours', 'days'][Math.floor(Math.random() * 3)];
                    
                    const jailEmbed = new EmbedBuilder()
                        .setColor(colors.secondary)
                        .setTitle('🚔 ARREST MADE!')
                        .setDescription(randomMessage)
                        .setImage(gifUrl)
                        .addFields(
                            {
                                name: '👤 Arrested Person',
                                value: `${target.username}`,
                                inline: true
                            },
                            {
                                name: '👮‍♂️ Arresting Officer',
                                value: `Officer ${message.author.username}`,
                                inline: true
                            },
                            {
                                name: '⚖️ Charges',
                                value: reason,
                                inline: false
                            },
                            {
                                name: '⏰ Sentence',
                                value: `${sentenceTime} ${timeUnit} in jail`,
                                inline: true
                            },
                            {
                                name: '🏛️ Court Date',
                                value: 'Next Tuesday at 3 PM',
                                inline: true
                            },
                            {
                                name: '💰 Bail',
                                value: '$' + (Math.floor(Math.random() * 10000) + 1000).toLocaleString(),
                                inline: true
                            }
                        )
                        .setFooter({ 
                            text: `${target.username} was arrested by Officer ${message.author.username} | Powered by Tenor`,
                            iconURL: target.displayAvatarURL()
                        })
                        .setTimestamp();

                    await sentMessage.edit({ embeds: [jailEmbed] });
                } else {
                    throw new Error('No GIFs found');
                }
            } catch (error) {
                console.error('Error fetching jail GIF:', error);
                
                // Fallback with emojis and arrest message
                const fallbackMessages = [
                    `🚔 **${message.author.username}** arrests ${target} and throws away the key! 👮‍♂️`,
                    `⛓️ **${message.author.username}** locks up ${target} for their crimes! 🚨`,
                    `👮‍♀️ **${message.author.username}** serves justice to ${target}! 🚔`
                ];
                
                const randomFallback = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
                const sentenceTime = Math.floor(Math.random() * 10) + 1;
                const timeUnit = ['minutes', 'hours', 'days'][Math.floor(Math.random() * 3)];
                
                const fallbackEmbed = new EmbedBuilder()
                    .setColor(colors.secondary)
                    .setTitle('🚔 ARREST MADE!')
                    .setDescription(randomFallback)
                    .addFields(
                        {
                            name: '🚔 Police Emojis',
                            value: '🚔 👮‍♂️ 👮‍♀️ 🚨 ⛓️ 🏛️ ⚖️ 💰',
                            inline: false
                        },
                        {
                            name: '📋 Arrest Record',
                            value: [
                                `**Suspect:** ${target.username}`,
                                `**Officer:** ${message.author.username}`,
                                `**Charges:** ${reason}`,
                                `**Sentence:** ${sentenceTime} ${timeUnit}`
                            ].join('\n'),
                            inline: false
                        },
                        {
                            name: '⚖️ Justice Quote',
                            value: '"Justice is truth in action!" - Benjamin Disraeli 👨‍⚖️',
                            inline: false
                        }
                    )
                    .setFooter({ 
                        text: `GIF service unavailable, but justice was served! | ${target.username} ← Officer ${message.author.username}`,
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
