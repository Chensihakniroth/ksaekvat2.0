const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const promoUtil = require('../../utils/promo.js');
const colors = require('../../utils/colors.js');

module.exports = {
  name: 'promo',
  description: 'Redeem a promo code for rewards!',
  usage: 'promo <code>',
  async execute(message, args, client) {
    const code = args[0];

    if (!code) {
      return message.reply('✨ Please provide a promo code! (ﾉ´ヮ`)ﾉ*:･ﾟ✧');
    }

    const result = await promoUtil.redeemCode(message.author.id, code);

    if (!result.success) {
      return message.reply(result.message);
    }

    const userData = await database.getUser(message.author.id, message.author.username);
    const reward = result.reward;
    let rewardText = '';

    if (reward.type === 'riel') {
      await database.addBalance(message.author.id, reward.amount);
      rewardText = `**${reward.amount.toLocaleString()}** <:coin:1480551418464305163>! 💸`;
    } else if (reward.type === 'pulls') {
      userData.extraPulls = (userData.extraPulls || 0) + reward.amount;
      await database.saveUser(userData);
      rewardText = `**${reward.amount}** free 10-pulls! ✨`;
    }

    const embed = new EmbedBuilder()
      .setColor(colors.success || '#43B581')
      .setTitle('🎁 Promo Code Redeemed!')
      .setDescription(
        `Yay! You've received ${rewardText}

Enjoy your gift, sweetie! (｡♥‿♥｡)`
      )
      .setThumbnail(message.author.displayAvatarURL())
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
