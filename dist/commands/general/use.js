"use strict";
const { EmbedBuilder } = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
module.exports = {
    name: 'use',
    aliases: ['activate', 'consume'],
    description: 'Use an item from your bag, like a Pokeball booster! ✨',
    usage: 'use <item_name>',
    async execute(message, args, client) {
        if (args.length === 0) {
            return message.reply({
                content: '✨ What would you like to use, sweetie? (◕‿◕✿)\nExample: `Kuse masterball` or `Kuse ultraball`!',
            });
        }
        const itemName = args.join('').toLowerCase();
        const userId = message.author.id;
        let type = '';
        if (itemName.includes('master'))
            type = 'masterball';
        else if (itemName.includes('ultra'))
            type = 'ultraball';
        else if (itemName.includes('poke'))
            type = 'pokeball';
        if (!type) {
            return message.reply({
                content: "I don't know how to use that yet, darling! (｡•́︿•̀｡) Try using a Pokeball, Ultraball, or Master Ball!",
            });
        }
        const result = await database.usePokeball(userId, type);
        if (!result.success) {
            return message.reply({ content: result.message });
        }
        const ballNames = {
            pokeball: '⚪ Pokeball',
            ultraball: '🟡 Ultraball',
            masterball: '🟣 Master Ball',
        };
        const ballEffects = {
            pokeball: 'reduced distraction chance',
            ultraball: 'guaranteed Epic+ rarity',
            masterball: 'guaranteed Epic+ rarity and 5x Mythical chance',
        };
        const embed = new EmbedBuilder()
            .setColor(colors.success)
            .setTitle(`✨ Booster Activated!`)
            .setDescription(`You used a **${ballNames[type]}**, sweetie! (｡♥‿♥｡)\n\n` +
            `🔥 **Effect:** ${ballEffects[type]}\n` +
            `⏳ **Duration:** 1 hour (Ends <t:${Math.floor(result.expiresAt / 1000)}:R>)`)
            .setFooter({ text: "Happy hunting, darling! ヽ(>∀<☆)ノ" });
        message.reply({ embeds: [embed] });
        await database.updateStats(userId, 'command');
    },
};
