const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const database = require('../../services/DatabaseService');
const config = require('../../config/config.js');

const GIPHY_API_KEY = config.giphyApiKey;

/**
 * Fetch a random GIF from Giphy by search query.
 */
async function getGiphyGif(query) {
  try {
    const url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=25&rating=pg-13`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.data && data.data.length > 0) {
      const pick = data.data[Math.floor(Math.random() * data.data.length)];
      return pick.images.original.url;
    }
  } catch (err) {
    console.error('[JAIL] Giphy fetch failed:', err.message);
  }
  return null;
}

module.exports = {
  name: 'jail',
  description: 'Send someone to jail. (¬‿¬)',
  usage: 'jail [@user] [message]',
  cooldown: 3000,
  async execute(message, args) {
    const mentionedUser = message.mentions.users.first();
    const customMessage = args.slice(1).join(' ');

    const sent = await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(colors.primary || 0x0099ff)
          .setTitle('🔒 Processing arrest...')
          .setDescription('Fetching jail footage... (・_・ヾ'),
      ],
    });

    try {
      const gifUrl = await getGiphyGif('anime jail handcuff arrest prison');

      const targetUser = mentionedUser || message.author;
      const embed = new EmbedBuilder()
        .setColor(colors.danger || 0xff4444)
        .setTitle('🔒 JAIL TIME!')
        .setDescription(
          `**${targetUser.username}** has been sent to jail!${customMessage ? `\n\n💬 "${customMessage}"` : ''}`
        );

      if (gifUrl) {
        embed.setImage(gifUrl);
      }

      await sent.edit({ embeds: [embed] });
    } catch (error) {
      console.error('Error in jail command:', error);
      await sent.edit({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.danger || 0xff4444)
            .setTitle('🔒 JAIL TIME!')
            .setDescription(
              `**${mentionedUser?.username || message.author.username}** has been sent to jail! (No GIF available) (ಥ﹏ಥ)`
            ),
        ],
      });
    }

    await database.updateStats(message.author.id, 'command');
  },
};
