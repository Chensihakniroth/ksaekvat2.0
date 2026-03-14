"use strict";
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType, MessageFlags, } = require('discord.js');
const database = require('../../services/DatabaseService');
const shopConfig = require('../../config/shopConfig.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const EconomyService = require('../../services/EconomyService').default || require('../../services/EconomyService');
module.exports = {
    name: 'shop',
    aliases: ['store', 'market', 'kshop'],
    description: "Mommy's General Store! Buy items, boosters, and more! (｡♥‿♥｡)",
    usage: 'shop',
    async execute(message, args, client) {
        const userId = message.author.id;
        const createShopEmbed = (categoryKey = 'essentials') => {
            const category = shopConfig.categories[categoryKey];
            const embed = new EmbedBuilder()
                .setColor(colors.primary)
                .setTitle(`🏪 Mommy's General Store — ${category.name}`)
                .setDescription(`Welcome sweetie! What would you like to buy today? (◕‿◕✿)\n\n*Use the menu below to switch categories.*`)
                .setThumbnail(client.user.displayAvatarURL());
            category.items.forEach((item) => {
                embed.addFields({
                    name: `${item.emoji} ${item.name} — ${EconomyService.format(item.price)}`,
                    value: item.description,
                    inline: false,
                });
            });
            embed.setFooter({ text: 'Select an item from the menu to purchase it! (っ˘ω˘ς)' });
            return embed;
        };
        const createComponents = (categoryKey = 'essentials') => {
            const categoryMenu = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder()
                .setCustomId('shop_category')
                .setPlaceholder('📁 Switch Category')
                .addOptions(Object.entries(shopConfig.categories).map(([key, cat]) => ({
                label: cat.name.replace(/[^\w\s]/g, '').trim(),
                value: key,
                emoji: cat.name.split(' ')[0],
                default: key === categoryKey,
            }))));
            const itemMenu = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder()
                .setCustomId('shop_buy')
                .setPlaceholder('🛒 Select an item to buy')
                .addOptions(shopConfig.categories[categoryKey].items.map((item) => ({
                label: item.name,
                value: item.id,
                description: `${EconomyService.format(item.price)} coins`,
                emoji: item.emoji,
            }))));
            return [categoryMenu, itemMenu];
        };
        const msg = await message.reply({
            embeds: [createShopEmbed()],
            components: createComponents(),
        });
        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 120000,
        });
        collector.on('collect', async (i) => {
            if (i.user.id !== userId) {
                return i.reply({
                    content: "You can't use this shop, sweetheart! (っ˘ω˘ς)",
                    flags: [MessageFlags.Ephemeral],
                });
            }
            if (i.customId === 'shop_category') {
                const newCategory = i.values[0];
                await i.update({
                    embeds: [createShopEmbed(newCategory)],
                    components: createComponents(newCategory),
                });
            }
            else if (i.customId === 'shop_buy') {
                const itemId = i.values[0];
                let selectedItem = null;
                let categoryKey = null;
                for (const [key, cat] of Object.entries(shopConfig.categories)) {
                    selectedItem = cat.items.find((it) => it.id === itemId);
                    if (selectedItem) {
                        categoryKey = key;
                        break;
                    }
                }
                if (!selectedItem)
                    return;
                const userData = await database.getUser(userId, message.author.username);
                if (userData.balance < selectedItem.price) {
                    return i.reply({
                        content: `💸 Oh no, darling! You need **${EconomyService.format(selectedItem.price - userData.balance)}** more coins to buy that. (｡•́︿•̀｡)`,
                        flags: [MessageFlags.Ephemeral],
                    });
                }
                // Process Purchase
                await database.removeBalance(userId, selectedItem.price);
                if (selectedItem.id.includes('ball')) {
                    await database.addPokeball(userId, selectedItem.id, 1);
                }
                else if (selectedItem.id === 'hunt_boost') {
                    await database.addHuntBoost(userId, selectedItem.amount);
                }
                else {
                    // Generic item (like Ring of Promise)
                    await database.addItem(userId, selectedItem.name, 1);
                }
                await i.reply({
                    content: `✅ Successfully bought **${selectedItem.emoji} ${selectedItem.name}** for **${EconomyService.format(selectedItem.price)}** coins! Mommy is so happy for you! ヽ(>∀<☆)ノ`,
                    flags: [MessageFlags.Ephemeral],
                });
                // Update the original message to show new balance (optional, but nice)
                const updatedCategory = i.message.embeds[0].title.split('—')[1].trim();
                const catKey = Object.keys(shopConfig.categories).find(k => shopConfig.categories[k].name.includes(updatedCategory)) || 'essentials';
                await msg.edit({
                    embeds: [createShopEmbed(catKey)],
                    components: createComponents(catKey)
                });
            }
        });
        collector.on('end', () => {
            msg.edit({ components: [] }).catch(() => { });
        });
    },
};
