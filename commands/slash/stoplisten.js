// commands/admin/stoplis.js
const { SlashCommandBuilder } = require('discord.js');
const listenCommand = require('./listen.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stoplisten')
        .setDescription('Stop listening to messages from a user (Admin only)'),
    async execute(interaction) {
        const adminId = process.env.ADMIN_ID;
        if (interaction.user.id !== adminId) {
            return interaction.reply({ content: '❌ You are not authorized to use this command.', ephemeral: true });
        }

        listenCommand.stopListening();
        return interaction.reply(`🛑 Stopped listening to messages.`);
    }
};
