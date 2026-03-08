const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const isAdmin = require('../../utils/adminCheck');
const database = require('../../utils/database.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stoptalk')
        .setDescription('[Admin] Stop DM message forwarding')
        .setDefaultMemberPermissions('0'),

    async execute(interaction) {
        if (!isAdmin(interaction.user.id)) {
            return interaction.reply({
                content: '⛔ This command is restricted to bot administrators.',
                ephemeral: true
            });
        }

        try {
            const talkTargets = await database.getTalkTargets();
            
            if (talkTargets[interaction.user.id]) {
                const removedTarget = talkTargets[interaction.user.id];
                await database.saveTalkTarget(interaction.user.id, null);

                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ DM Forwarding Stopped')
                    .setDescription('You will no longer receive forwarded DMs')
                    .addFields(
                        { name: 'Previous Channel ID', value: removedTarget.channelId, inline: true }
                    );

                await interaction.reply({ embeds: [embed], ephemeral: true });
            } else {
                await interaction.reply({
                    content: 'ℹ️ You did not have DM forwarding enabled.',
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Stoptalk command error:', error);
            const errorMessage = '❌ An error occurred while stopping message forwarding';

            await interaction.reply({
                content: errorMessage,
                ephemeral: true
            });
        }
    }
};
