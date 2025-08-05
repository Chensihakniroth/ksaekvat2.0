const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stoptalk')
    .setDescription('Make the bot stop talking in this channel'),
  async execute(interaction) {
    const channelId = interaction.channelId;
    interaction.client.talkingChannels.delete(channelId);
    await interaction.reply({ content: `Stopped talking in this channel!`, ephemeral: true });
  }
};