const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const database = require('../../utils/database.js');

module.exports = {
    name: 'kill',
    aliases: ['murder', 'eliminate'],
    description: 'Playfully kill someone with an action GIF',
    usage: 'kill <@user> [message]',
    cooldown: 3000, // 3 seconds
    execute(message, args, client) {
        // Check if user mentioned someone
        if (args.length < 1 || message.mentions.users.size === 0) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '💀 Kill Command',
                    description: 'Please mention someone to playfully eliminate!\n**Usage:** `Kkill @user [message]`\n**Example:** `Kkill @friend You\'re done for!`\n\n*Note: This is just for fun and roleplay!*',
                    timestamp: new Date()
                }]
            });
        }

        const target = message.mentions.users.first();
        const customMessage = args.slice(1).join(' ');

        // Can't kill yourself
        if (target.id === message.author.id) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '💀 Self Elimination',
                    description: 'You can\'t eliminate yourself! That\'s not how this works! Find someone else to playfully defeat! 😅',
                    timestamp: new Date()
                }]
            });
        }

        // Can't kill bots
        if (target.bot) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '🤖 Bot Elimination',
                    description: 'Bots can\'t be eliminated, they just respawn! Try targeting a real person for this roleplay! 🤖',
                    timestamp: new Date()
                }]
            });
        }

        // Create initial embed
        const loadingEmbed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle('💀 Preparing Elimination...')
            .setDescription('Sharpening weapons and preparing for battle! ⚔️')
            .setFooter({ 
                text: 'Powered by Tenor API | Just for fun!',
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp();

        message.reply({ embeds: [loadingEmbed] }).then(async (sentMessage) => {
            try {
                // Fetch GIF from Tenor API
                const tenorApiKey = process.env.GOOGLE_API_KEY || config.googleApiKey || 'default_tenor_key';
                const searchTerms = ['anime fight death', 'cartoon kill', 'game over death', 'defeat animation', 'knocked out'];
                const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];

                const tenorUrl = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(randomTerm)}&key=${tenorApiKey}&client_key=discord_bot&limit=50&contentfilter=medium`;

                const response = await fetch(tenorUrl);
                const data = await response.json();

                if (data.results && data.results.length > 0) {
                    // Select random GIF from results
                    const randomGif = data.results[Math.floor(Math.random() * data.results.length)];
                    const gifUrl = randomGif.media_formats.gif.url;

                    // Create kill messages
                    const killMessages = [
                        `💀 **${message.author.username}** has eliminated ${target} from existence!`,
                        `⚔️ **${message.author.username}** delivers the final blow to ${target}!`,
                        `💥 **${message.author.username}** sends ${target} to the shadow realm!`,
                        `🗡️ **${message.author.username}** defeats ${target} in epic combat!`,
                        `💀 **${message.author.username}** shows no mercy to ${target}!`,
                        `⚰️ **${message.author.username}** writes ${target}'s name in the death note!`
                    ];

                    const randomMessage = killMessages[Math.floor(Math.random() * killMessages.length)];

                    const killEmbed = new EmbedBuilder()
                        .setColor(colors.error)
                        .setTitle('💀 ELIMINATION!')
                        .setDescription(randomMessage + (customMessage ? `\n\n💬 *"${customMessage}"*` : ''))
                        .setImage(gifUrl)
                        .addFields(
                            {
                                name: '💀 Status',
                                value: `${target.username}: ❌ Eliminated`,
                                inline: true
                            },
                            {
                                name: '⚔️ Victory',
                                value: `${message.author.username}: 🏆 Winner`,
                                inline: true
                            },
                            {
                                name: '🎮 Game Over',
                                value: 'Press F to pay respects',
                                inline: false
                            }
                        )
                        .setTimestamp();

                    await sentMessage.edit({ embeds: [killEmbed] });
                } else {
                    throw new Error('No GIFs found');
                }
            } catch (error) {
                console.error('Error fetching kill GIF:', error);

                // Fallback with emojis and dramatic message
                const fallbackMessages = [
                    `💀 **${message.author.username}** has dramatically defeated ${target}! ⚔️`,
                    `🗡️ **${message.author.username}** eliminates ${target} in epic fashion! 💥`,
                    `⚰️ **${message.author.username}** sends ${target} to game over screen! 🎮`
                ];

                const randomFallback = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];

                const fallbackEmbed = new EmbedBuilder()
                    .setColor(colors.error)
                    .setTitle('💀 ELIMINATION!')
                    .setDescription(randomFallback + (customMessage ? `\n\n💬 *"${customMessage}"*` : ''))
                    .addFields(
                        {
                            name: '⚔️ Battle Emojis',
                            value: '💀 ⚔️ 🗡️ ⚰️ 💥 👻 🔥 ⚡',
                            inline: false
                        },
                        {
                            name: '🎮 Respawn Timer',
                            value: '5... 4... 3... 2... 1... Welcome back to the game! 🎮',
                            inline: false
                        },
                        {
                            name: '📢 Disclaimer',
                            value: '*This is just for fun and roleplay! No actual harm intended! 😄',
                            inline: false
                        }
                    )
                    .setFooter({ 
                        text: `GIF service unavailable, but the elimination was epic! | ${target.username} ← ${message.author.username}`,
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