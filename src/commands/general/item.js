const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
} = require('discord.js');
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
        { name: 'Star Dust', count: userData.star_dust || 0, emoji: '✨' },
        { name: 'Pokeball', count: userData.pokeballs || 0, emoji: '⚪' },
        { name: 'Ultraball', count: userData.ultraballs || 0, emoji: '🟡' },
        { name: 'Master Ball', count: userData.masterballs || 0, emoji: '🟣' },
      ].filter(item => item.count > 0);

      if (itemsList.length === 0) {
        return {
          embed: new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle(`🎒 ${message.author.username}'s Bag`)
            .setDescription(
              '*Your bag is empty, darling. Try some gacha pulls! (｡•́︿•̀｡)*'
            ),
          items: [],
        };
      }

      const list = itemsList
        .map((w) => {
          return `${w.emoji} **${w.name}**: ${w.count}`;
        });

      const embed = new EmbedBuilder()
        .setColor(colors.primary)
        .setTitle(`🎒 ${message.author.username}'s Bag`)
        .setDescription(`**Items in your bag:**\n\n${list.join('\n')}`)
        .setFooter({ text: 'More items coming soon! (◕‿✿)' });

      return { embed, items: itemsList };
    };

    const { embed, items: initialItems } = await renderInventory();
    await message.reply({
      embeds: [embed],
    });
  },
};
