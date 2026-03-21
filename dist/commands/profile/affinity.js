"use strict";
const { EmbedBuilder, MessageFlags } = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const { getCharacterImage } = require('../../utils/images.js');
const registry = require('../../utils/registry.js');
module.exports = {
    name: 'affinity',
    aliases: ['love', 'interact', 'kaffinity'],
    description: 'Spend time with your spouse to increase your Love Level! (｡♥‿♥｡)',
    usage: 'affinity',
    cooldown: 3600000, // 1 hour cooldown between interactions
    async execute(message, args, client) {
        const userId = message.author.id;
        const userData = await database.getUser(userId, message.author.username);
        if (!userData.spouse || !userData.spouse.name) {
            return message.reply({
                content: "💍 You aren't married yet, sweetie! (｡•́︿•̀｡) Use `Kshop` to buy a ring and `Kmarry` to propose!",
            });
        }
        const spouse = userData.spouse;
        const fullChar = registry.getCharacter(spouse.name);
        const splashArt = getCharacterImage(fullChar);
        // Calculate affinity gain (random 5-15)
        const gain = Math.floor(Math.random() * 11) + 5;
        spouse.affinity += gain;
        userData.markModified('spouse');
        await database.saveUser(userData);
        // Heart levels!
        const hearts = '❤️'.repeat(Math.min(10, Math.ceil(spouse.affinity / 100)));
        const level = Math.floor(spouse.affinity / 100) + 1;
        const embed = new EmbedBuilder()
            .setColor('#FF69B4')
            .setTitle(`💞 Spending Time with ${spouse.name}`)
            .setDescription(`You spent a lovely afternoon with **${spouse.name}**, darling! (｡♥‿♥｡)\n\n` +
            `💖 **Affinity Gained:** +${gain}\n` +
            `📈 **Love Level:** ${level} (${spouse.affinity} total)\n` +
            `✨ **Bond:** ${hearts || '🤍'}`)
            .setImage(splashArt)
            .setFooter({ text: "Every moment together makes your bond stronger! ヽ(>∀<☆)ノ" });
        message.reply({ embeds: [embed] });
        // Update Quest Progress! (｡♥‿♥｡)
        const QuestService = require('../../services/QuestService').default || require('../../services/QuestService');
        await QuestService.updateProgress(userId, 'AFFINITY', 1);
        await database.updateStats(userId, 'command');
    },
};
