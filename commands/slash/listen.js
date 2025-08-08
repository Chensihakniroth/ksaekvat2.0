// commands/admin/listen.js
const { SlashCommandBuilder } = require('discord.js');

let listening = false;
let targetUserId = null;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listen')
        .setDescription('Start listening to messages from a specific user (Admin only)')
        .addStringOption(option =>
            option.setName('userid')
                .setDescription('The User ID to listen to')
                .setRequired(true)
        ),
    async execute(interaction) {
        const adminId = process.env.ADMIN_ID;
        if (interaction.user.id !== adminId) {
            return interaction.reply({ content: '❌ You are not authorized to use this command.', ephemeral: true });
        }

        targetUserId = interaction.options.getString('userid');
        listening = true;

        return interaction.reply(`✅ Now listening to messages from <@${targetUserId}>`);
    },
    getListeningState: () => ({ listening, targetUserId }),
    stopListening: () => { listening = false; targetUserId = null; }
};
