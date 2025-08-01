const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const database = require('../../utils/database.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
    name: 'bite',
    aliases: ['nom'],
    description: 'Playfully bite someone with an action GIF',
    usage: 'bite <@user> [message]',
    cooldown: 3000,
    async execute(message, args, client) {
        if (args.length < 1 || message.mentions.users.size === 0) {
            return message.reply({
                embeds: [{
                    color: colors.error,
                    title: '🦷 Bite Command',
                    description: 'Please mention someone to bite!\n**Usage:** `Kbite @user [message]`\n**Example:** `Kbite @friend Nom nom nom!`',
                }]
            });
        }

        const target = message.mentions.users.first();
        const customMessage = args.slice(1).join(' ');

        if (target.id === message.author.id) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '🦷 Self Bite',
                    description: 'You can\'t bite yourself! That would just hurt! 😅',
                }]
            });
        }

        if (target.bot) {
            return message.reply({
                embeds: [{
                    color: colors.warning,
                    title: '🤖 Bot Bite',
                    description: 'Bots taste like metal! Try biting a human. 🤖',
                }]
            });
        }

        const loadingEmbed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle('🦷 Preparing to Bite...')
            .setDescription('Sharpening teeth for a playful bite!');

        const sentMessage = await message.reply({ embeds: [loadingEmbed] });

        try {
            const response = await fetch('https://nekos.best/api/v2/bite');
            const data = await response.json();
            const gifUrl = data.results[0].url;

            const messages = [
                `🦷 **${message.author.username}** playfully bites ${target}!`,
                `😈 **${message.author.username}** noms on ${target}!`,
                `😋 **${message.author.username}** gives ${target} a mischievous bite!`
            ];
            const finalMessage = messages[Math.floor(Math.random() * messages.length)];

            const biteEmbed = new EmbedBuilder()
                .setColor(colors.warning)
                .setTitle('🦷 NOM NOM!')
                .setDescription(finalMessage + (customMessage ? `\n\n💬 *"${customMessage}"*` : ''))
                .setImage(gifUrl);

            await sentMessage.edit({ embeds: [biteEmbed] });

        } catch (err) {
            console.error('Failed to fetch bite GIF from nekos.best:', err);

            const fallbackEmbed = new EmbedBuilder()
                .setColor(colors.warning)
                .setTitle('🦷 NOM NOM!')
                .setDescription(`**${message.author.username}** bites ${target}! (No GIF this time 😢)`);

            await sentMessage.edit({ embeds: [fallbackEmbed] });
        }

        database.updateStats(message.author.id, 'command');
    }
};
