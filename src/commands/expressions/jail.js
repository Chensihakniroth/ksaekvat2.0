const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const database = require('../../services/DatabaseService');
const config = require('../../config/config.js');

const GIPHY_API_KEY = config.giphyApiKey;

// ── Curated jail GIFs for guaranteed relevance ──────────────────────
const JAIL_GIFS = [
  'https://media.giphy.com/media/kcCfTKQ2s8its2fGBW/giphy.gif',
  'https://media.giphy.com/media/3oEjHV0z8S7WM4MwnK/giphy.gif',
  'https://media.giphy.com/media/YN1eB6slBDeNHr1gjs/giphy.gif',
  'https://media.giphy.com/media/26gsobowozGM9umBi/giphy.gif',
  'https://media.giphy.com/media/jmSjPi6soIoQCFwaXJ/giphy.gif',
  'https://media.giphy.com/media/l4Ep6uxU6aedrYUik/giphy.gif',
  'https://media.giphy.com/media/3oEjI5VtIhHvK37WYo/giphy.gif',
];

/**
 * Get a jail GIF — curated pool first, Giphy random API fallback.
 */
async function getJailGif() {
  // Primary: curated pool (instant, always jail-themed)
  if (JAIL_GIFS.length > 0) {
    return JAIL_GIFS[Math.floor(Math.random() * JAIL_GIFS.length)];
  }

  // Fallback: Giphy random endpoint
  try {
    const url = `https://api.giphy.com/v1/gifs/random?api_key=${GIPHY_API_KEY}&tag=jail&rating=pg-13`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.data && data.data.images) {
      return data.data.images.original.url;
    }
  } catch (err) {
    console.error('[JAIL] Giphy fallback failed:', err.message);
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
      const gifUrl = await getJailGif();

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
