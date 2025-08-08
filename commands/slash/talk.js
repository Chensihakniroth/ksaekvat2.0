// commands/admin/talk.js
const { SlashCommandBuilder } = require('discord.js');

let talkGuildId = null;
let talkChannelId = null;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('talk')
        .setDescription('Talk to a specific channel in a server (Admin only)')
        .addStringOption(option =>
            option.setName('serverid')
                .setDescription('The server ID')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('channelid')
                .setDescription('The channel ID')
                .setRequired(true)
        ),
    async execute(interaction) {
        const adminId = process.env.ADMIN_ID;
        if (interaction.user.id !== adminId) {
            return interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
        }

        talkGuildId = interaction.options.getString('serverid');
        talkChannelId = interaction.options.getString('channelid');

        return interaction.reply(`✅ Ready to talk in guild **${talkGuildId}**, channel **${talkChannelId}**`);
    },
    getTalkTarget: () => ({ talkGuildId, talkChannelId }),
    stopTalk: () => { talkGuildId = null; talkChannelId = null; }
};
