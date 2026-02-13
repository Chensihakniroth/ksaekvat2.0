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
            .setTitle('🤖 Rerng rorb ah pov Bot (Beksloy Edition)')
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                {
                    name: '📊 Bek Stats',
                    value: [
                        `**Server bek:** ${client.guilds.cache.size}`,
                        `**Kneal bek:** ${client.users.cache.size}`,
                        `**Ban bek:** ${client.commands.size} commands`,
                        `**Ngorb hz:** ${uptimeString} (Uptime)`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '💻 Bek Machine',
                    value: [
                        `**Node.js:** ${process.version}`,
                        `**Djs:** v14`,
                        `**Luy Memory:** ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
                        `**Plat bek:** ${process.platform}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🎮 Bot Rerng Bek',
                    value: [
                        `**Chmous:** ${config.botInfo.name}`,
                        `**Version:** ${config.botInfo.version}`,
                        `**Ah nak tver:** ${config.botInfo.author}`,
                        `**Prefix:** K, k`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🌟 Bek Features',
                    value: [
                        '• Game bek2 (coinflip, slots, dice)',
                        '• Luy Riel bek (Economy)',
                        '• Dor lork sat (Hunting)',
                        '• Zoo bek (Collection)',
                        '• Expressions GIF bek (Fun)',
                        '• Admin bek tools (Moderation)',
                        '• Profile bek (Statistics)',
                        '• Reward bek (Daily/Weekly)',
                        '• Booster bek (Boosters)'
                    ].join('\n'),
                    inline: false
                }
            )
            
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};
