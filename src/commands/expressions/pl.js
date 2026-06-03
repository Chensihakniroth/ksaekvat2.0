const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'pussylick',
  aliases: ['lickpussy', 'pl'],
  description: "NSFW: Lick someone's pussy (18+)",
  usage: 'pussylick @user',
  async execute(message, args) {
    if (!message.channel.nsfw) {
      return message.reply('🚫 This command can only be used in NSFW channels.');
    }

    const user = message.mentions.users.first();
    if (!user) {
      return message.reply('👉 Mention someone to lick.');
    }

    try {
      // Use Purrbot NSFW API
      const res = await axios.get('https://api.purrbot.site/v2/img/nsfw/pussylick/gif');
      const imageUrl = res.data.link; // Purrbot API returns the image URL in 'link' field

      const embed = new EmbedBuilder()
        .setTitle('🔞 NSFW Action: Pussy Lick')
        .setDescription(`${message.author} is licking ${user}'s pussy 😳💦`)
        .setImage(imageUrl)
        .setColor('DarkVividPink');

      message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error('API Error:', err.message);
      message.reply("❌ Couldn't fetch the image from Purrbot API.");
    }
  },
};
