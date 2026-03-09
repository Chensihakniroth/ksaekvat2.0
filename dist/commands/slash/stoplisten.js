"use strict";
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const isAdmin = require('../../utils/adminCheck');
const database = require('../../utils/database.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('stoplisten')
        .setDescription('[Admin] Stop monitoring messages from previously tracked user')
        .setDefaultMemberPermissions('0'),
    async execute(interaction) {
        if (typeof isAdmin !== 'function' || !isAdmin(interaction.user.id)) {
            return interaction.reply({
                content: '⛔ This command is restricted to bot administrators.',
                flags: [4096],
            });
        }
        try {
            const listeners = await database.getListeners();
            if (listeners[interaction.user.id]) {
                const removedUserId = listeners[interaction.user.id];
                await database.saveListener(interaction.user.id, null);
                const embed = new EmbedBuilder()
                    .setColor(0x00ff00)
                    .setTitle('✅ Monitoring Stopped')
                    .setDescription('You will no longer receive notifications for this user')
                    .addFields({ name: 'Stopped Tracking', value: `<@${removedUserId}>`, inline: true }, { name: 'User ID', value: removedUserId, inline: true });
                await interaction.reply({ embeds: [embed], flags: [4096] });
            }
            else {
                await interaction.reply({
                    content: 'ℹ️ You were not currently monitoring any user.',
                    flags: [4096],
                });
            }
        }
        catch (error) {
            console.error('Stoplisten command error:', error);
            const errorMessage = '❌ An error occurred while stopping monitoring';
            if (!interaction.replied) {
                await interaction.reply({
                    content: errorMessage,
                    flags: [4096],
                });
            }
        }
    },
};
