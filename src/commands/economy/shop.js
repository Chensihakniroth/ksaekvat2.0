const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
} = require('discord.js');
const database = require('../../services/DatabaseService');
const shopConfig = require('../../config/shopConfig.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const EconomyService = require('../../services/EconomyService').default || require('../../services/EconomyService');
const registry = require('../../utils/registry.js');

module.exports = {
  name: 'shop',
  aliases: ['store', 'market', 'kshop'],
  description: "Mommy's General Store! Buy items, boosters, and more! (｡♥‿♥｡)",
  usage: 'shop',
  async execute(message, args, client) {
    const userId = message.author.id;
    let currentCategory = 'characters';
    let selectedGame = 'genshin';
    let currentPage = 0;
    const itemsPerPage = 25;

    const createShopEmbed = () => {
      const category = shopConfig.categories[currentCategory];
      const embed = new EmbedBuilder()
        .setColor(colors.primary)
        .setTitle(`🏪 Mommy's General Store — ${category.name}`)
        .setThumbnail(client.user.displayAvatarURL());

      if (currentCategory === 'characters') {
        const gameNames = { genshin: 'Genshin Impact', hsr: 'Honkai: Star Rail', wuwa: 'Wuthering Waves', zzz: 'Zenless Zone Zero' };
        embed.setDescription(`Welcome sweetie! Here are all my beautiful characters from **${gameNames[selectedGame]}**! (◕‿◕✿)\n\n*Select a game or browse the pages below.*`);
        
        const allChars = registry.getAllCharacters().filter(c => c.game === selectedGame && (c.rarity === '4' || c.rarity === '5'));
        const totalPages = Math.ceil(allChars.length / itemsPerPage);
        embed.setFooter({ text: `Page ${currentPage + 1} of ${totalPages} • Each character costs 400 (4★) or 600 (5★) Star Dust` });
      } else {
        embed.setDescription(`Welcome sweetie! What would you like to buy today? (◕‿◕✿)\n\n*Use the menu below to switch categories.*`);
        category.items.forEach((item) => {
          const currencySymbol = category.currency === 'star_dust' ? '✨' : '🪙';
          embed.addFields({
            name: `${item.emoji} ${item.name} — ${item.price} ${currencySymbol}`,
            value: item.description,
            inline: false,
          });
        });
        embed.setFooter({ text: 'Select an item from the menu to purchase it! (っ˘ω˘ς)' });
      }

      return embed;
    };

    const createComponents = () => {
      // 1. Category Menu
      const categoryMenu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('shop_category')
          .setPlaceholder('📁 Switch Category')
          .addOptions(
            Object.entries(shopConfig.categories).map(([key, cat]) => ({
              label: cat.name.replace(/[^\w\s]/g, '').trim(),
              value: key,
              emoji: cat.name.split(' ')[0],
              default: key === currentCategory,
            }))
          )
      );

      const rows = [categoryMenu];

      if (currentCategory === 'characters') {
        // 2. Game Selection Menu
        const gameMenu = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('shop_game')
            .setPlaceholder('🎮 Select Game')
            .addOptions([
              { label: 'Genshin Impact', value: 'genshin', emoji: '⚔️', default: selectedGame === 'genshin' },
              { label: 'Honkai: Star Rail', value: 'hsr', emoji: '🚂', default: selectedGame === 'hsr' },
              { label: 'Wuthering Waves', value: 'wuwa', emoji: '🌊', default: selectedGame === 'wuwa' },
              { label: 'Zenless Zone Zero', value: 'zzz', emoji: '📺', default: selectedGame === 'zzz' }
            ])
        );
        rows.push(gameMenu);

        // 3. Dynamic Character Menu
        const allChars = registry.getAllCharacters().filter(c => c.game === selectedGame && (c.rarity === '4' || c.rarity === '5'));
        const totalPages = Math.ceil(allChars.length / itemsPerPage);
        const start = currentPage * itemsPerPage;
        const pageItems = allChars.slice(start, start + itemsPerPage);

        if (pageItems.length > 0) {
          const charMenu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId('shop_buy_char')
              .setPlaceholder('🎭 Select a character to buy')
              .addOptions(
                pageItems.map(c => ({
                  label: `${c.name} (${c.rarity}★)`,
                  value: c.name,
                  description: `${c.rarity === '5' ? 600 : 400} Star Dust`,
                  emoji: c.emoji || (c.rarity === '5' ? '⭐' : '✨')
                }))
              )
          );
          rows.push(charMenu);
        }

        // 4. Pagination Buttons
        if (totalPages > 1) {
          const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('shop_prev')
              .setLabel('Previous Page')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(currentPage === 0),
            new ButtonBuilder()
              .setCustomId('shop_next')
              .setLabel('Next Page')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(currentPage >= totalPages - 1)
          );
          rows.push(buttons);
        }
      } else {
        // Standard item menu for other categories
        const items = shopConfig.categories[currentCategory].items;
        if (items.length > 0) {
          const itemMenu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId('shop_buy_item')
              .setPlaceholder('🛒 Select an item to buy')
              .addOptions(
                items.map((item) => ({
                  label: item.name,
                  value: item.id,
                  description: `${EconomyService.format(item.price)} coins`,
                  emoji: item.emoji,
                }))
              )
          );
          rows.push(itemMenu);
        }
      }

      return rows;
    };

    const msg = await message.reply({
      embeds: [createShopEmbed()],
      components: createComponents(),
    });

    const collector = msg.createMessageComponentCollector({
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
        currentCategory = i.values[0];
        currentPage = 0;
        await i.update({ embeds: [createShopEmbed()], components: createComponents() });
      } 
      else if (i.customId === 'shop_game') {
        selectedGame = i.values[0];
        currentPage = 0;
        await i.update({ embeds: [createShopEmbed()], components: createComponents() });
      }
      else if (i.customId === 'shop_next') {
        currentPage++;
        await i.update({ embeds: [createShopEmbed()], components: createComponents() });
      }
      else if (i.customId === 'shop_prev') {
        currentPage--;
        await i.update({ embeds: [createShopEmbed()], components: createComponents() });
      }
      else if (i.customId === 'shop_buy_char' || i.customId === 'shop_buy_item') {
        const value = i.values[0];
        let selectedItem = null;
        let isCharacter = i.customId === 'shop_buy_char';

        if (isCharacter) {
          const charData = registry.getCharacter(value);
          selectedItem = {
            name: charData.name,
            price: charData.rarity === '5' ? 600 : 400,
            emoji: charData.emoji,
            currency: 'star_dust'
          };
        } else {
          selectedItem = shopConfig.categories[currentCategory].items.find(it => it.id === value);
        }

        if (!selectedItem) return;

        const userData = await database.getUser(userId, message.author.username);
        const currency = isCharacter ? 'star_dust' : (shopConfig.categories[currentCategory].currency || 'coins');

        // Currency Check
        if (currency === 'star_dust') {
          if ((userData.star_dust || 0) < selectedItem.price) {
            return i.reply({
              content: `✨ Oh no, darling! You need **${selectedItem.price - (userData.star_dust || 0)}** more Star Dust to buy that. (｡•́︿•̀｡)`,
              flags: [MessageFlags.Ephemeral],
            });
          }
          await database.removeStarDust(userId, selectedItem.price);
        } else {
          if (userData.balance < selectedItem.price) {
            return i.reply({
              content: `💸 Oh no, darling! You need **${EconomyService.format(selectedItem.price - userData.balance)}** more coins to buy that. (｡•́︿•̀｡)`,
              flags: [MessageFlags.Ephemeral],
            });
          }
          await database.removeBalance(userId, selectedItem.price);
        }

        // Process Granting
        if (isCharacter) {
          await database.addGachaItem(userId, selectedItem.name);
        } else if (currentCategory === 'themes') {
          await database.unlockTheme(userId, selectedItem.id);
        } else {
          await database.addItem(userId, selectedItem.name, 1);
        }

        const symbol = currency === 'star_dust' ? '✨' : '🪙';
        await i.reply({
          content: `✅ Successfully bought **${selectedItem.emoji || ''} ${selectedItem.name}** for **${selectedItem.price} ${symbol}**! Mommy is so happy for you! ヽ(>∀<☆)ノ`,
          flags: [MessageFlags.Ephemeral],
        });

        // Refresh main embed
        await msg.edit({ embeds: [createShopEmbed()], components: createComponents() });
      }
    });

    collector.on('end', () => {
      msg.edit({ components: [] }).catch(() => {});
    });
  },
};
