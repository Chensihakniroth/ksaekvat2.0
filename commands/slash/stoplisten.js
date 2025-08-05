const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stoplisten')
    .setDescription('Make the bot stop listening to messages in this channel'),
  async execute(interaction) {
    const channelId = interaction.channelId;
    interaction.client.listeningChannels.delete(channelId);
    await interaction.reply({ content: `Stopped listening to messages in this channel!`, ephemeral: true });
  }
};