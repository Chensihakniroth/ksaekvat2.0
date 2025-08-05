const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('listen')
    .setDescription('Make the bot listen to messages in this channel'),
  async execute(interaction) {
    const channelId = interaction.channelId;
    interaction.client.listeningChannels.add(channelId);
    await interaction.reply({ content: `Now listening to messages in this channel!`, ephemeral: true });
  }
};