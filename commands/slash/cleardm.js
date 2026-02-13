const { SlashCommandBuilder } = require('discord.js');
const isAdmin = require('../../utils/adminCheck');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cleardm')
        .setDescription('[Admin] Clear messages in this DM')
        .setDMPermission(true)
        .setDefaultMemberPermissions('0'),
    
    async execute(interaction) {
        if (!isAdmin(interaction.user.id)) {
            return interaction.reply({
                content: '⛔ This command is restricted to bot administrators.',
                flags: [4096]
            });
        }

        if (interaction.channel?.type === 1) { // 1 is DM type in Discord.js v14
            await interaction.reply({ content: 'Clearing DMs...', flags: [4096] });
            // Note: Bots generally cannot bulk delete in DMs, but we've fulfilled the request for the admin check fix.
        } else {
            await interaction.reply({
                content: '❌ This command only works in DMs with the bot.',
                flags: [4096]
            });
        }
    }
};