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

        const result = promoUtil.redeemCode(message.author.id, code);

        if (!result.success) {
            return message.reply(result.message);
        }

        const userData = database.getUser(message.author.id);
        const reward = result.reward;
        let rewardText = '';

        if (reward.type === 'riel') {
            database.addBalance(message.author.id, reward.amount);
            rewardText = `**${reward.amount.toLocaleString()}** riel! 💸`;
        } else if (reward.type === 'pulls') {
            userData.extraPulls = (userData.extraPulls || 0) + reward.amount;
            database.saveUser(userData);
            rewardText = `**${reward.amount}** free 10-pulls! ✨`;
        }

        const embed = new EmbedBuilder()
            .setColor(colors.success || '#43B581')
            .setTitle('🎁 Promo Code Redeemed!')
            .setDescription(`Yay! You've received ${rewardText}

Enjoy your gift, sweetie! (｡♥‿♥｡)`)
            .setThumbnail(message.author.displayAvatarURL())
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }
};