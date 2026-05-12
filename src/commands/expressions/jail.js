const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const database = require('../../services/DatabaseService');
const config = require('../../config/config.js');

const GIPHY_API_KEY = config.giphyApiKey;

// ── Curated jail GIFs for guaranteed relevance ──────────────────────
const JAIL_GIFS = [
  'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExbWtka21lZWZxdDhldndtaDlscmN6M2xjbmIycWJ2czk0OWE5bzg5aiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/d8XNDMiXhPMVRKpjlu/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHQ0eWVyZTVsNjR5a2k4bmNrendqNTA5OWVxcXdhazIwN3FxeTVldiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/soS6N6KBCB3oc/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Z3F1MGliaGphNnJ4eGliMHJoNDVrYm50NGdrbzhodDAwa3k3NWxoOCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ZwX6kSakHXY5KsJZP1/giphy.gif',
  'https://media.giphy.com/media/26gsobowozGM9umBi/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3azJ6ZnN4bXJkbHA5NWd0enAxZW5nNWs1c3p3OXQzOG16ZHV5Ymd1eSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/t6qZSIwcLk8GLCX6Vp/giphy.gif',
  'https://media.giphy.com/media/l4Ep6uxU6aedrYUik/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Mm90OHV0aWgzNDR0dnAyNGQxY2UxaWl5bnpoam1za2Jvb2l2dDlhMSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/r59gUvu0iTW2Q/giphy.gif',
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
