const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('talk')
    .setDescription('Make the bot talk in this channel'),
  async execute(interaction) {
    const channelId = interaction.channelId;
    interaction.client.talkingChannels.add(channelId);
    await interaction.reply({ content: `Now talking in this channel!`, ephemeral: true });
  }
};