"use strict";
const { EmbedBuilder } = require('discord.js');
const promoUtil = require('../../utils/promo.js');
const colors = require('../../utils/colors.js');
module.exports = {
    name: 'promolist',
    aliases: ['codes', 'listpromo'],
    description: 'List all existing promo codes and their status',
    usage: 'promolist',
    adminOnly: true,
    async execute(message, args, client) {
        const codes = await promoUtil.getAllCodes();
        if (codes.length === 0) {
            return message.reply('There are no active promo codes right now, sweetie! (っ˘ω˘ς)');
        }
        const embed = new EmbedBuilder()
            .setColor(colors.primary || '#5865F2')
            .setTitle("(｡♥‿♥｡) Mommy's Special Codes!")
            .setTimestamp();
        let description = 'Here are all the active promo codes, darling! (◕‿◕✿)\n\n';
        codes.forEach((data) => {
            const code = data.code;
            const remaining = data.maxUses - data.usedBy.length;
            const rewardType = data.type === 'riel' ? '<:coin:1480551418464305163> (｡♥‿♥｡)' : '10-pulls ヽ(>∀<☆)ノ';
            const rewardAmount = data.type === 'riel' ? data.amount.toLocaleString() : data.amount;
            description += `**\`${code}\`**\n`;
            description += `┗ Reward: ${rewardAmount} ${rewardType}\n`;
            description += `┗ Uses: ${data.usedBy.length}/${data.maxUses} (${remaining} left)\n`;
            description += `┗ Created: <t:${Math.floor(new Date(data.createdAt).getTime() / 1000)}:R>\n\n`;
        });
        // Handle description length limits
        if (description.length > 4096) {
            description = description.substring(0, 4090) + '...';
        }
        embed.setDescription(description || 'No codes found, darling. (っ˘ω˘ς)');
        return message.reply({ embeds: [embed] });
    },
};
