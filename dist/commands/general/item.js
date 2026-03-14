"use strict";
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags, } = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const ItemService = require('../../services/ItemService.js').default || require('../../services/ItemService.js');
const EconomyService = require('../../services/EconomyService').default || require('../../services/EconomyService');
const { getItemEmoji, getRarityEmoji } = require('../../utils/images.js');
module.exports = {
    name: 'item',
    aliases: ['items', 'kitem', 'bag'],
    description: 'View your collection of items and consumables! ✨',
    usage: 'item',
    async execute(message, args, client) {
        const userId = message.author.id;
        const renderInventory = async () => {
            const userData = await database.getUser(userId, message.author.username);
            const itemsList = [
                { id: 'star_dust', name: 'Star Dust', count: userData.star_dust || 0, emoji: '✨' },
                { id: 'pokeball', name: 'Pokeball', count: userData.pokeballs || 0, emoji: '⚪' },
                { id: 'ultraball', name: 'Ultraball', count: userData.ultraballs || 0, emoji: '🟡' },
                { id: 'masterball', name: 'Master Ball', count: userData.masterballs || 0, emoji: '🟣' },
            ];
            const heldItems = itemsList.filter(item => item.count > 0);
            const embed = new EmbedBuilder()
                .setColor(colors.primary)
                .setTitle(`🎒 ${message.author.username}'s Bag`)
                .setThumbnail(message.author.displayAvatarURL());
            if (heldItems.length === 0) {
                embed.setDescription('*Your bag is empty, darling. Try some gacha pulls! (｡•́︿•̀｡)*');
            }
            else {
                const list = heldItems.map(w => `${w.emoji} **${w.name}**: ${w.count}`);
                embed.setDescription(`**Items in your bag:**\n\n${list.join('\n')}\n\n*Click a button below to use a ball!*`);
            }
            embed.setFooter({ text: 'Boosters last 5-20 minutes and stack! (◕‿✿)' });
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder()
                .setCustomId('use_pokeball')
                .setLabel('Pokeball')
                .setEmoji('⚪')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled((userData.pokeballs || 0) <= 0), new ButtonBuilder()
                .setCustomId('use_ultraball')
                .setLabel('Ultraball')
                .setEmoji('🟡')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled((userData.ultraballs || 0) <= 0), new ButtonBuilder()
                .setCustomId('use_masterball')
                .setLabel('Master Ball')
                .setEmoji('🟣')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled((userData.masterballs || 0) <= 0), new ButtonBuilder()
                .setCustomId('go_shop')
                .setLabel('Shop')
                .setEmoji('🏪')
                .setStyle(ButtonStyle.Primary));
            return { embed, components: [row] };
        };
        const { embed, components } = await renderInventory();
        const msg = await message.reply({
            embeds: [embed],
            components: components,
        });
        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000,
        });
        collector.on('collect', async (i) => {
            if (i.user.id !== userId)
                return i.reply({ content: "Not your bag, darling! (っ˘ω˘ς)", flags: [MessageFlags.Ephemeral] });
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
            if (!type)
                return;
            const result = await database.usePokeball(userId, type);
            if (!result.success) {
                return i.reply({ content: result.message, flags: [MessageFlags.Ephemeral] });
            }
            const ballNames = {
                pokeball: '⚪ Pokeball',
                ultraball: '🟡 Ultraball',
                masterball: '🟣 Master Ball',
            };
            const addedMins = result.added / 60000;
            const totalRemaining = Math.ceil((result.expiresAt - Date.now()) / 60000);
            await i.reply({
                content: `✅ Activated **${ballNames[type]}**! (+${addedMins}m, ${totalRemaining}m total)`,
                flags: [MessageFlags.Ephemeral],
            });
            // Update the main Bag embed
            const { embed: updatedEmbed, components: updatedComponents } = await renderInventory();
            await msg.edit({ embeds: [updatedEmbed], components: updatedComponents });
        });
        collector.on('end', () => {
            msg.edit({ components: [] }).catch(() => { });
        });
    },
};
