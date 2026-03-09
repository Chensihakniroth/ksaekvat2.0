"use strict";
const { EmbedBuilder } = require('discord.js');
const config = require('../../config/config.js');
const colors = require('../../utils/colors.js');
module.exports = {
    name: 'info',
    aliases: ['botinfo', 'about'],
    description: 'Show bot information and statistics',
    usage: 'info',
    execute(message, args, client) {
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;
        const seconds = Math.floor(uptime % 60);
        const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        const embed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle('🤖 reab rorb pi ah pov Ksaekvat')
            .setThumbnail(client.user.displayAvatarURL())
            .addFields({
            name: '📊 Bek Stats',
            value: [
                `**Server bek :** ${client.guilds.cache.size}`,
                `**Knea bek :** ${client.users.cache.size}`,
                `**Ban bek :** ${client.commands.size} commands`,
                `**Morrng rous :** ${uptimeString} (Uptime)`,
            ].join('\n'),
            inline: true,
        }, {
            name: '💻 Bek Machine',
            value: [
                `**Node.js:** ${process.version}`,
                `**Djs:** v14`,
                `**size:** ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
                `**rous nv ler:** ${process.platform}`,
            ].join('\n'),
            inline: true,
        }, {
            name: "🎮 p'vat t'rub",
            value: [
                `**Chmous :** ${config.botInfo.name}`,
                `**Version :** ${config.botInfo.version}`,
                `**Chmous Ah nak tver :** ${config.botInfo.author}`,
                `**Prefix:** K, k`,
            ].join('\n'),
            inline: false,
        }, {
            name: '🌟 Features Bek Bek',
            value: [
                "• leng l'beng (coinflip, slots, dice)",
                '• Luy <:coin:1480551418464305163> (Economy)',
                '• der banh sat (Hunting)',
                '• soun sat (Collection)',
                '• Expressions GIF bek bek (Fun)',
                '• Admin tools (Moderation)',
                '• Profile (Statistics)',
                '• Reward (Daily/Weekly)',
                '• Booster (Boosters)',
            ].join('\n'),
            inline: false,
        });
        message.reply({ embeds: [embed] });
    },
};
