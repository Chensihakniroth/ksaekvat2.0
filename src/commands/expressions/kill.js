const { EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors.js');
const database = require('../../services/DatabaseService');
const config = require('../../config/config.js');
// Use built-in fetch (Node.js 18+) or axios as fallback
const fetch = global.fetch || require('axios').get;

module.exports = {
  name: 'kill',
  description: 'Express a dramatic action!',
  usage: 'kill [message]',
  cooldown: 3000,
  async execute(message, args) {
    const customMessage = args.join(' ');
    const sent = await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(colors.primary || 0x0099ff)
          .setTitle('⚔️ Preparing to strike...')
          .setDescription('Loading action...'),
      ],
    });

    // Curated high-relevance anime kill/fight GIFs for a stellar experience
    const CURATED_KILL_GIFS = [
      'https://media.tenor.com/7123LelOq60AAAAC/anime-fight.gif', // Demon Slayer Hinokami Kagura
      'https://media.tenor.com/fL3sT-V13cMAAAAC/anime-fight.gif', // Sukuna Jujutsu Kaisen fight
      'https://media.tenor.com/V7e5p0vNfBwAAAAC/anime-kill.gif', // Akame ga Kill slash
      'https://media.tenor.com/Z4cO9yU2yzkAAAAC/anime-fight-punch.gif', // Saitama Punch
      'https://media.tenor.com/tHqT-83Yp3gAAAAC/anime-sword-slash.gif', // Sword strike
      'https://media.tenor.com/T0bA5Xm8oFMAAAAC/gojo-hollow-purple.gif', // Gojo Hollow Purple
      'https://media.tenor.com/D_F1QkS49HIAAAAC/anime-fight-madara.gif', // Madara fight
      'https://media.tenor.com/b9L_3v12VPAAAAAC/anime-slash.gif', // Zoro slash
      'https://media.tenor.com/O61q3rJ5CscAAAAC/levi-ackerman.gif', // Levi Ackerman titan slash
      'https://media.tenor.com/uG_jF1J_F-MAAAAC/anime-combat.gif', // Epic anime battle
    ];

    const fetchJson = async (url) => {
      if (global.fetch) {
        const res = await global.fetch(url);
        return await res.json();
      } else {
        const axios = require('axios');
        const res = await axios.get(url);
        return res.data;
      }
    };

    try {
      let gifUrl = null;

      // 1. 40% chance to pull a hand-curated action GIF (instant, zero network lag, guaranteed hype)
      if (Math.random() < 0.40) {
        gifUrl = CURATED_KILL_GIFS[Math.floor(Math.random() * CURATED_KILL_GIFS.length)];
      }

      // 2. Fetch from Waifu.pics SFW Kill endpoint (direct anime killing GIFs)
      if (!gifUrl) {
        try {
          const data = await fetchJson('https://api.waifu.pics/sfw/kill');
          if (data && data.url) {
            gifUrl = data.url;
          }
        } catch (e) {
          console.log('[KILL] Waifu.pics kill API failed:', e.message);
        }
      }

      // 3. Fallback to Tenor V2 API (curated action/fight search terms)
      if (!gifUrl && config.tenorApiKey) {
        try {
          const searchTerms = ['anime fight', 'anime kill', 'anime slash', 'dramatic anime death'];
          const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
          const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(term)}&key=${config.tenorApiKey}&limit=20&contentfilter=medium`;
          const data = await fetchJson(url);
          if (data && data.results && data.results.length > 0) {
            const randomGif = data.results[Math.floor(Math.random() * data.results.length)];
            gifUrl = randomGif.media_formats.gif.url;
          }
        } catch (e) {
          console.log('[KILL] Tenor API fallback failed:', e.message);
        }
      }

      // 4. Ultimate fallback to the curated list if all API connections are down
      if (!gifUrl) {
        gifUrl = CURATED_KILL_GIFS[Math.floor(Math.random() * CURATED_KILL_GIFS.length)];
      }

      const embed = new EmbedBuilder()
        .setColor(colors.danger || 0xff4444)
        .setTitle('⚔️ Strike!')
        .setDescription(
          `**${message.author.username}** attacks!${customMessage ? `\n\n💬 "${customMessage}"` : ''}`
        );

      if (gifUrl) {
        console.log('Using kill GIF URL:', gifUrl);
        embed.setImage(gifUrl);
      } else {
        console.log('No kill GIF found from any API');
      }

      await sent.edit({ embeds: [embed] });
    } catch (error) {
      console.error('Error in kill command:', error);
      await sent.edit({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.danger || 0xff4444)
            .setTitle('⚔️ Strike!')
            .setDescription(`**${message.author.username}** attacks! (No GIF 😢)`),
        ],
      });
    }

    await database.updateStats(message.author.id, 'command');
  },
};
