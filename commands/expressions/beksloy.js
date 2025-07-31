const { EmbedBuilder } = require("discord.js");
const colors = require("../../utils/colors.js");
const config = require("../../config/config.js");
const database = require("../../utils/database.js");

module.exports = {
    name: "ksaekvat",
    aliases: ["kk"],
    description: "Send beksloy vibes with an action GIF",
    usage: "kkk <@user> [message]",
    cooldown: 3000,
    execute(message, args, client) {
        if (args.length < 1 || message.mentions.users.size === 0) {
            return message.reply({
                embeds: [
                    {
                        color: colors.error,
                        title: "🔥 Beksloy Command",
                        description:
                            "Please mention someone to beksloy!\n**Usage:** `Kbeksloy @user [message]` or `kkk @user [message]`\n**Example:** `kkk @friend You're so beksloy!`",
                        timestamp: new Date(),
                    },
                ],
            });
        }

        const target = message.mentions.users.first();
        const customMessage = args.slice(1).join(" ");

        if (target.id === message.author.id) {
            return message.reply({
                embeds: [
                    {
                        color: colors.warning,
                        title: "bekbek",
                        description: "jom ah oun vai klun eng! 😅",
                        timestamp: new Date(),
                    },
                ],
            });
        }

        if (target.bot) {
            return message.reply({
                embeds: [
                    {
                        color: colors.warning,
                        title: "🤖 ah nis ngang men ?",
                        description: "juii chlery, c ksae kvat lv ai! 🤖",
                        timestamp: new Date(),
                    },
                ],
            });
        }

        const loadingEmbed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle("ksae kvat lerng knorng !")
            .setDescription("ANH KAB ALL! 😎");

        message.reply({ embeds: [loadingEmbed] }).then(async (sentMessage) => {
            try {
                const beksloyGifs = [
                    "https://c.tenor.com/0jxMoG6W1KcAAAAd/tenor.gif",
                ];

                const gifUrl =
                    beksloyGifs[Math.floor(Math.random() * beksloyGifs.length)];

                const beksloyMessages = [
                    `🔥 **${message.author.username}** ksae kvat lerng klun lv aii ${target}!`,
                ];

                const randomMessage =
                    beksloyMessages[
                        Math.floor(Math.random() * beksloyMessages.length)
                    ];

                const vibes = [
                    "Ultra Cool! 😎",
                    "Maximum Fire! 🔥",
                    "Pure Energy! ⚡",
                    "Epic Vibes! 🌟",
                    "Legendary! 👑",
                    "Absolutely Lit! 🚀",
                ];
                const randomVibe =
                    vibes[Math.floor(Math.random() * vibes.length)];

                const beksloyEmbed = new EmbedBuilder()
                    .setColor(colors.warning)
                    .setDescription(
                        randomMessage +
                            (customMessage
                                ? `\n\n💬 *"${customMessage}"*`
                                : ""),
                    )
                    .setImage(gifUrl)
                    .setFooter({ text: "STEAV INCOMING 🐉 🔪" })
                    .setTimestamp();

                await sentMessage.edit({ embeds: [beksloyEmbed] });
            } catch (error) {
                console.error("Error fetching beksloy GIF:", error);

                const fallbackMessages = [
                    `🔥 **${message.author.username}** sends pure beksloy energy to ${target}! ✨`,
                    `😎 **${message.author.username}** recognizes ${target}'s beksloy vibes! 🚀`,
                    `🌟 **${message.author.username}** shares the beksloy spirit with ${target}! 💫`,
                ];

                const randomFallback =
                    fallbackMessages[
                        Math.floor(Math.random() * fallbackMessages.length)
                    ];

                const vibes = [
                    "Ultra Cool! 😎",
                    "Maximum Fire! 🔥",
                    "Pure Energy! ⚡",
                    "Epic Vibes! 🌟",
                    "Legendary! 👑",
                    "Absolutely Lit! 🚀",
                ];
                const randomVibe =
                    vibes[Math.floor(Math.random() * vibes.length)];

                const fallbackEmbed = new EmbedBuilder()
                    .setColor(colors.warning)
                    .setTitle("🔥 BEKSLOY ACTIVATED!")
                    .setDescription(
                        randomFallback +
                            (customMessage
                                ? `\n\n💬 *"${customMessage}"*`
                                : ""),
                    )
                    .addFields(
                        {
                            name: "🔥 Beksloy Emojis",
                            value: "🔥 😎 ✨ 🚀 💫 🌟 👑 ⚡",
                            inline: false,
                        },
                        {
                            name: "✨ Vibe Report",
                            value: `${target.username}'s beksloy level: ${randomVibe}`,
                            inline: true,
                        },
                        {
                            name: "🎯 Beksloy Facts",
                            value: [
                                "• Beksloy is a state of mind",
                                "• Everyone has inner beksloy",
                                "• Beksloy vibes are contagious",
                                "• Stay beksloy, stay awesome!",
                            ].join("\n"),
                            inline: false,
                        },
                    )
                    .setFooter({ text: "STEAV INCOMING 🐉 🔪" })
                    .setTimestamp();

                await sentMessage.edit({ embeds: [fallbackEmbed] });
            }
        });

        database.updateStats(message.author.id, "command");
    },
};
