// commands/admin/stopt.js
const { SlashCommandBuilder } = require('discord.js');
const talkCommand = require('./talk.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stoptalk')
        .setDescription('Stop talking to the set channel (Admin only)'),
    async execute(interaction) {
        const adminId = process.env.ADMIN_ID;
        if (interaction.user.id !== adminId) {
            return interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
        }

        talkCommand.stopTalk();
        return interaction.reply(`🛑 Stopped talking to any channel.`);
    }
};
