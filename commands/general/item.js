const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
} = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const ItemService = require('../../services/ItemService.js');
const EconomyService = require('../../services/EconomyService');

module.exports = {
  name: 'item',
  aliases: ['items', 'kitem', 'weapon', 'weapons'],
  description: 'Manage your weapons! (Refine and Sell Excess)',
  usage: 'item',
  async execute(message, args, client) {
    const userId = message.author.id;

    const renderInventory = async () => {
      const inventory = await database.getHydratedInventory(userId);
      const weapons = inventory.filter((i) => i.type === 'weapon');

      if (weapons.length === 0) {
        return {
          embed: new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle(`⚔️ ${message.author.username}'s Armory`)
            .setDescription(
              '*Your armory is empty, darling. Pull some weapons from gacha! (｡•́︿•̀｡)*'
            ),
          weapons: [],
        };
      }

      const list = weapons
        .sort((a, b) => b.rarity - a.rarity)
        .map((w) => {
          const star = w.rarity === 5 ? '🔶' : w.rarity === 4 ? '🔷' : '⚪';
          const rank = `[R${w.refinement || 1}]`;
          return `${star} **${w.name}** ${rank} x${w.count || 1}`;
        });

      const embed = new EmbedBuilder()
        .setColor(colors.primary)
        .setTitle(`⚔️ ${message.author.username}'s Armory`)
        .setDescription(`**Total Weapons:** ${weapons.length}\n\n${list.join('\n')}`)
        .setFooter({ text: 'Use the buttons below to manage your collection! (◕‿◕✿)' });

      return { embed, weapons };
    };

    const getButtons = (weapons) => {
      const canAscend = weapons.some((w) => (w.count || 1) > 1 && (w.refinement || 1) < 5);
      const canSell = weapons.some((w) => (w.refinement || 1) === 5 && (w.count || 1) > 1);

      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('auto_ascend')
          .setLabel('Auto Ascension')
          .setEmoji('✨')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(!canAscend),
        new ButtonBuilder()
          .setCustomId('sell_excess')
          .setLabel('Sell Excess (Max R5)')
          .setEmoji('💰')
          .setStyle(ButtonStyle.Danger)
          .setDisabled(!canSell)
      );
    };

    const { embed, weapons: initialWeapons } = await renderInventory();
    const msg = await message.reply({
      embeds: [embed],
      components: initialWeapons.length > 0 ? [getButtons(initialWeapons)] : [],
    });

    if (initialWeapons.length === 0) return;

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300000,
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== userId)
        return i.reply({ content: 'hg ot torm armory heh!', flags: [MessageFlags.Ephemeral] });

      const userData = await database.getUser(userId, message.author.username);
      const gachaInv = userData.gacha_inventory;

      if (i.customId === 'auto_ascend') {
        const ascendedCount = ItemService.autoRefineWeapons(gachaInv);
        await database.saveUser(userData);
        await i.reply({
          content: `✅ Successfully performed **${ascendedCount}** refinements! (ﾉ´ヮ\` )ﾉ*:･ﾟ✧`,
          flags: [MessageFlags.Ephemeral],
        });
      } else if (i.customId === 'sell_excess') {
        const { totalGold, soldCount } = ItemService.sellExcessWeapons(gachaInv);

        if (soldCount > 0) {
          await database.addBalance(userId, totalGold);
          await database.saveUser(userData);
          await i.reply({
            content: `💰 Sold **${soldCount}** excess weapons for **${EconomyService.format(totalGold)}** ${config.economy.currency}! (｡♥‿♥｡)`,
            flags: [MessageFlags.Ephemeral],
          });
        }
      }

      const { embed: newEmbed, weapons: newWeapons } = await renderInventory();
      await msg.edit({ embeds: [newEmbed], components: [getButtons(newWeapons)] });
    });

    collector.on('end', () => {
      msg.edit({ components: [] }).catch(() => {});
    });
  },
};
