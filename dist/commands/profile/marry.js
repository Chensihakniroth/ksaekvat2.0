"use strict";
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const { getCharacterImage, getCharacterIcon } = require('../../utils/images.js');
const registry = require('../../utils/registry.js');
module.exports = {
    name: 'marry',
    aliases: ['propose', 'claim'],
    description: 'Use a Ring of Promise to marry your favorite character! 💍',
    usage: 'marry <character_name>',
    async execute(message, args, client) {
        const userId = message.author.id;
        if (args.length === 0) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(colors.error)
                        .setTitle('(◕‸ ◕✿) Who is the lucky one?')
                        .setDescription('Please tell Mommy which character you want to marry, sweetie!\nExample: `Kmarry Raiden Shogun`'),
                ],
            });
        }
        const charName = args.join(' ').toLowerCase();
        const userData = await database.getUser(userId, message.author.username);
        // 1. Check if user already married
        if (userData.spouse && userData.spouse.name) {
            return message.reply({
                content: `💍 You are already married to **${userData.spouse.name}**, darling! (｡•́︿•̀｡) You can't have two spouses at once!`,
            });
        }
        // 2. Check if user has a Ring of Promise
        const ring = userData.inventory.find(i => i.name === 'Ring of Promise' && i.count > 0);
        if (!ring) {
            return message.reply({
                content: `💍 Oh no, sweetie! You need a **Ring of Promise** from the \`Kshop\` to propose! (｡•́︿•̀｡)`,
            });
        }
        // 3. Check if user owns the character
        const charEntry = userData.gacha_inventory.find(i => i.name.toLowerCase().includes(charName));
        if (!charEntry) {
            return message.reply({
                content: `❌ You don't own that character yet, darling! You must find them in the gacha first. (っ˘ω˘ς)`,
            });
        }
        const fullChar = registry.getCharacter(charEntry.name);
        const splashArt = getCharacterImage(fullChar);
        const embed = new EmbedBuilder()
            .setColor('#FF69B4')
            .setTitle('💍 A Proposal of Love!')
            .setDescription(`Are you sure you want to use your **Ring of Promise** to marry **${fullChar.name}**, sweetie? (｡♥‿♥｡)`)
            .setImage(splashArt)
            .setFooter({ text: 'This action cannot be undone easily! (っ˘ω˘ς)' });
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('marry_confirm').setLabel('Yes, I do!').setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId('marry_cancel').setLabel('Not yet...').setStyle(ButtonStyle.Secondary));
        const msg = await message.reply({ embeds: [embed], components: [row] });
        const collector = msg.createMessageComponentCollector({ time: 30000 });
        collector.on('collect', async (i) => {
            if (i.user.id !== userId)
                return;
            if (i.customId === 'marry_confirm') {
                // Consume Ring
                ring.count--;
                if (ring.count <= 0) {
                    userData.inventory = userData.inventory.filter(item => item.name !== 'Ring of Promise');
                }
                // Set Spouse
                userData.spouse = {
                    name: fullChar.name,
                    affinity: 1,
                    marriedAt: new Date()
                };
                userData.markModified('inventory');
                userData.markModified('spouse');
                await database.saveUser(userData);
                const successEmbed = new EmbedBuilder()
                    .setColor('#FF69B4')
                    .setTitle('🎉 JUST MARRIED! 🎊')
                    .setDescription(`Congratulations, darling! You and **${fullChar.name}** are now bound by the Ring of Promise! (｡♥‿♥｡)\n\nUse \`Kaffinity\` every day to grow your love!`)
                    .setImage(splashArt)
                    .setFooter({ text: `Wedding Date: ${new Date().toLocaleDateString()}` });
                await i.update({ embeds: [successEmbed], components: [] });
            }
            else {
                await i.update({ content: 'Mommy understands, sweetie. Take your time! (◕‿◕✿)', embeds: [], components: [] });
            }
        });
        collector.on('end', () => {
            msg.edit({ components: [] }).catch(() => { });
        });
    },
};
