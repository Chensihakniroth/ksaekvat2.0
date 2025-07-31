const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  // For Discord.js:
  data: new SlashCommandBuilder()
    .setName('devbadge')
    .setDescription('Ping Discord to keep the Active Developer Badge active.'),

  // For your command handler (some expect this)
  name: 'devbadge',

  async execute(interaction) {
    await interaction.reply({
      content: '✅ Slash command executed! You’ve pinged Discord for the Active Developer Badge renewal.',
      ephemeral: true
    });
  }
};
