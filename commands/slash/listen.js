module.exports = {
  data: {
    name: 'listen', // or 'stoplisten', 'stoptalk', 'talk'
    description: 'Description of the command'
  },
  execute: async (interaction) => {
    await interaction.reply('Command executed!');
  }
};  