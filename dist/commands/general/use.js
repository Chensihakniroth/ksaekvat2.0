"use strict";
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags, } = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
module.exports = {
    name: 'use',
    aliases: ['activate', 'consume'],
    description: 'Use a Pokeball booster from your bag with buttons! ✨',
    usage: 'use',
    async execute(message, args, client) {
        const userId = message.author.id;
        const createUseEmbed = async () => {
            const userData = await database.getUser(userId, message.author.username);
            return new EmbedBuilder()
                .setColor(colors.primary)
                .setTitle('🎒 Use an Item')
                .setDescription(`Select a ball from your bag to activate its hunting booster, sweetie! (◕‿◕✿)\n\n` +
                `⚪ **Pokeballs:** ${userData.pokeballs || 0}\n` +
                `🟡 **Ultraballs:** ${userData.ultraballs || 0}\n` +
                `🟣 **Master Balls:** ${userData.masterballs || 0}`)
                .setFooter({ text: 'Boosters last 5-20 minutes and stack! (｡♥‿♥｡)' });
        };
        const createRow = () => {
            return new ActionRowBuilder().addComponents(new ButtonBuilder()
                .setCustomId('use_pokeball')
                .setLabel('Pokeball')
                .setEmoji('⚪')
                .setStyle(ButtonStyle.Secondary), new ButtonBuilder()
                .setCustomId('use_ultraball')
                .setLabel('Ultraball')
                .setEmoji('🟡')
                .setStyle(ButtonStyle.Secondary), new ButtonBuilder()
                .setCustomId('use_masterball')
                .setLabel('Master Ball')
                .setEmoji('🟣')
                .setStyle(ButtonStyle.Secondary), new ButtonBuilder()
                .setCustomId('go_shop')
                .setLabel('Shop')
                .setEmoji('🏪')
                .setStyle(ButtonStyle.Primary));
        };
        const msg = await message.reply({
            embeds: [await createUseEmbed()],
            components: [createRow()],
        });
        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000,
        });
        collector.on('collect', async (i) => {
            if (i.user.id !== userId) {
                return i.reply({
                    content: "This isn't for you, darling! (っ˘ω˘ς)",
                    flags: [MessageFlags.Ephemeral],
                });
            }
            if (i.customId === 'go_shop') {
                return i.reply({
                    content: '🏪 Use `Kshop` to visit Mommy\'s General Store and buy more balls! (｡♥‿♥｡)',
                    flags: [MessageFlags.Ephemeral],
                });
            }
            const typeMap = {
                use_pokeball: 'pokeball',
                use_ultraball: 'ultraball',
                use_masterball: 'masterball',
            };
            const type = typeMap[i.customId];
            const result = await database.usePokeball(userId, type);
            if (!result.success) {
                return i.reply({ content: result.message, flags: [MessageFlags.Ephemeral] });
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
            const addedMins = result.added / 60000;
            const totalRemaining = Math.ceil((result.expiresAt - Date.now()) / 60000);
            await i.reply({
                content: `✅ Activated **${ballNames[type]}**! (+${addedMins}m, ${totalRemaining}m total)`,
                flags: [MessageFlags.Ephemeral],
            });
            // Update the main embed to show new counts
            await msg.edit({ embeds: [await createUseEmbed()] });
        });
        collector.on('end', () => {
            msg.edit({ components: [] }).catch(() => { });
        });
        await database.updateStats(userId, 'command');
    },
};
