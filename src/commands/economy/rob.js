const { EmbedBuilder } = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

const GIPHY_API_KEY = config.giphyApiKey;

// Jail tracker: userId -> timestamp when jail expires
const jailedUsers = new Map();

// ── Curated GIF pools for guaranteed context relevance ──────────────
const GIF_POOLS = {
  rob_success: [
    'https://media.giphy.com/media/SOmjomEnNHsrK/giphy.gif',
    'https://media.giphy.com/media/l0HlNQ03J5JxX2rGU/giphy.gif',
    'https://media.giphy.com/media/dMsh6gRYJDymXSIatd/giphy.gif',
    'https://media.giphy.com/media/3oEdv22bKDUluFKkxi/giphy.gif',
    'https://media.giphy.com/media/Y6yRfR88rvP44/giphy.gif',
    'https://media.giphy.com/media/eKNrUbDJuFuaQ1A37p/giphy.gif',
  ],
  rob_fail: [
    'https://media.giphy.com/media/l2JehQ2GitHGdVG9Y/giphy.gif',
    'https://media.giphy.com/media/3o7TKnO6Wve3nkSLFm/giphy.gif',
    'https://media.giphy.com/media/H1LbI7KnGPnFiYljBH/giphy.gif',
    'https://media.giphy.com/media/3oAt21Fnr4i54uK8vK/giphy.gif',
    'https://media.giphy.com/media/26ybwvTX7TSe3eoKs/giphy.gif',
  ],
  jail: [
    'https://media.giphy.com/media/kcCfTKQ2s8its2fGBW/giphy.gif',
    'https://media.giphy.com/media/3oEjHV0z8S7WM4MwnK/giphy.gif',
    'https://media.giphy.com/media/YN1eB6slBDeNHr1gjs/giphy.gif',
    'https://media.giphy.com/media/26gsobowozGM9umBi/giphy.gif',
    'https://media.giphy.com/media/jmSjPi6soIoQCFwaXJ/giphy.gif',
    'https://media.giphy.com/media/l4Ep6uxU6aedrYUik/giphy.gif',
  ],
};

/**
 * Get a contextual GIF from curated pool, with Giphy random API fallback.
 */
async function getContextGif(pool) {
  // Primary: curated pool (instant, always relevant)
  const curated = GIF_POOLS[pool];
  if (curated && curated.length > 0) {
    return curated[Math.floor(Math.random() * curated.length)];
  }

  // Fallback: Giphy random endpoint with tight tag
  try {
    const tag = pool === 'jail' ? 'jail' : pool === 'rob_success' ? 'robbery' : 'caught';
    const url = `https://api.giphy.com/v1/gifs/random?api_key=${GIPHY_API_KEY}&tag=${tag}&rating=pg-13`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.data && data.data.images) {
      return data.data.images.original.url;
    }
  } catch (err) {
    console.error('[ROB] Giphy fallback failed:', err.message);
  }
  return null;
}

module.exports = {
  name: 'rob',
  aliases: ['steal', 'heist'],
  description: 'Attempt to rob another user\'s wallet! 50/50 odds... but you might end up in jail. (¬‿¬)',
  usage: 'rob <@user>',
  category: 'economy',
  cooldown: 60000, // 1 minute (60,000 ms)

  async execute(message, args, client) {
    const robber = message.author;

    // ── Jail check ──────────────────────────────────────────────────────
    const jailExpiry = jailedUsers.get(robber.id);
    if (jailExpiry && Date.now() < jailExpiry) {
      const remaining = Math.ceil((jailExpiry - Date.now()) / 60000);
      const jailGif = await getContextGif('jail');

      const embed = new EmbedBuilder()
        .setColor(colors.error)
        .setTitle('🔒 STILL IN JAIL')
        .setDescription(`You're still locked up! Wait **${remaining} minute(s)** before trying another heist. (ಥ﹏ಥ)`);

      if (jailGif) embed.setImage(jailGif);

      const sent = await message.reply({ embeds: [embed] });
      setTimeout(() => sent.delete().catch(() => {}), 8000);
      return 'CUSTOM_COOLDOWN'; // Signal to messageCreate that we handled it
    }

    // ── Target validation ───────────────────────────────────────────────
    const target = message.mentions.users.first();
    if (!target) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.error)
            .setTitle('⚠️ TARGET REQUIRED')
            .setDescription('Who are you trying to rob? Mention someone! (・_・ヾ\n**Usage:** `krob @user`')
        ]
      });
    }

    if (target.id === robber.id) {
      return message.reply('You can\'t rob yourself... that\'s just moving money between pockets. (≧◡≦)');
    }

    if (target.bot) {
      return message.reply('Bots don\'t carry cash. Nice try though. (¬‿¬)');
    }

    // ── Fetch both users ────────────────────────────────────────────────
    const robberData = await database.getUser(robber.id, robber.username);
    const targetData = await database.getUser(target.id, target.username);

    // Only wallet money can be stolen
    if (targetData.balance < 500) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.warning)
            .setTitle('💸 NOT WORTH IT')
            .setDescription(`**${target.username}** barely has anything in their wallet. Find a richer target! (・_・ヾ`)
        ]
      });
    }

    // ── Roll the dice ───────────────────────────────────────────────────
    const roll = Math.random();
    const jailChance = 0.15; // 15% chance of jail on failure
    const successChance = 0.50; // 50% success rate

    // Random steal amount: 1,000 - 10,000, capped at target's wallet
    const stealAmount = Math.min(
      Math.floor(Math.random() * 9001) + 1000, // 1000–10000
      targetData.balance
    );

    // ── SUCCESS ─────────────────────────────────────────────────────────
    if (roll < successChance) {
      // Transfer money
      await database.addBalance(robber.id, stealAmount);
      await database.removeBalance(target.id, stealAmount);

      const robGif = await getContextGif('rob_success');

      const embed = new EmbedBuilder()
        .setColor(0x00ff88)
        .setTitle('💰 HEIST SUCCESS!')
        .setDescription(
          `**${robber.username}** just robbed **${stealAmount.toLocaleString()}** ${config.economy.currencySymbol} from **${target.username}**'s wallet! (¬‿¬)\n\n` +
          `Their bank was untouchable... but their wallet? Wide open.`
        )
        .addFields(
          { name: '🏃 Your Wallet', value: `**${(robberData.balance + stealAmount).toLocaleString()}** ${config.economy.currencySymbol}`, inline: true },
          { name: '😭 Victim\'s Wallet', value: `**${(targetData.balance - stealAmount).toLocaleString()}** ${config.economy.currencySymbol}`, inline: true }
        )
        .setTimestamp();

      if (robGif) embed.setImage(robGif);

      await database.updateStats(robber.id, 'command');
      return message.reply({ embeds: [embed] });
    }

    // ── FAILURE ─────────────────────────────────────────────────────────
    // Robber loses some money as a penalty (25% of what they tried to steal)
    const penalty = Math.min(Math.floor(stealAmount * 0.25), robberData.balance);
    if (penalty > 0) {
      await database.removeBalance(robber.id, penalty);
      await database.addBalance(target.id, penalty);
    }

    // ── JAIL CHECK on failure ───────────────────────────────────────────
    if (Math.random() < jailChance) {
      // JAILED! 20 minute lockout
      const jailDuration = 20 * 60 * 1000; // 20 minutes
      jailedUsers.set(robber.id, Date.now() + jailDuration);

      const jailGif = await getContextGif('jail');

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('🚨 BUSTED — YOU\'RE GOING TO JAIL!')
        .setDescription(
          `**${robber.username}** tried to rob **${target.username}** and got caught by the authorities! (ಥ﹏ಥ)\n\n` +
          `💸 **Penalty:** Lost **${penalty.toLocaleString()}** ${config.economy.currencySymbol} (paid to victim)\n` +
          `🔒 **Jail Time:** You can't rob for **20 minutes**!`
        )
        .setTimestamp();

      if (jailGif) embed.setImage(jailGif);

      await database.updateStats(robber.id, 'command');
      return message.reply({ embeds: [embed] });
    }

    // ── Regular failure (no jail) ───────────────────────────────────────
    const failGif = await getContextGif('rob_fail');

    const embed = new EmbedBuilder()
      .setColor(colors.error)
      .setTitle('❌ HEIST FAILED!')
      .setDescription(
        `**${robber.username}** tried to rob **${target.username}** but got caught! (・_・ヾ\n\n` +
        `💸 **Penalty:** Lost **${penalty.toLocaleString()}** ${config.economy.currencySymbol} (paid to victim)\n` +
        `Lucky you didn't end up in jail this time...`
      )
      .setTimestamp();

    if (failGif) embed.setImage(failGif);

    await database.updateStats(robber.id, 'command');
    return message.reply({ embeds: [embed] });
  },
};
