const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
  MessageFlags,
} = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const logger = require('../../utils/logger.js');
const { getItemEmoji } = require('../../utils/images.js');

module.exports = {
  name: 'bag',
  aliases: ['inventory', 'inv', 'kb', 'kbag'],
  description: 'Check your balls and star dust! (｡♥‿♥｡)',
  usage: 'bag',
  async execute(message, args, client) {
    const userId = message.author.id;
    logger.command('bag', { user: message.author.tag });

    const renderBag = async () => {
      const userData = await database.getUser(userId, message.author.username);
      
      const stardustEmoji = getItemEmoji({ name: 'Star Dust' }, client);
      const pokeballEmoji = getItemEmoji({ name: 'Pokeball' }, client);
      const ultraballEmoji = getItemEmoji({ name: 'Ultraball' }, client);
      const masterballEmoji = getItemEmoji({ name: 'Master Ball' }, client);

      const items = [
        { name: 'Pokeball', count: userData.pokeballs || 0, emoji: pokeballEmoji, key: 'pokeball' },
        { name: 'Ultraball', count: userData.ultraballs || 0, emoji: ultraballEmoji, key: 'ultraball' },
        { name: 'Master Ball', count: userData.masterballs || 0, emoji: masterballEmoji, key: 'masterball' }
      ];

      const hasItems = items.some(i => i.count > 0);

      const embed = new EmbedBuilder()
        .setColor(colors.primary)
        .setTitle(`🎒 ${message.author.username}'s Bag`)
        .setDescription(
            `✨ **Star Dust:** ${userData.star_dust || 0}\n\n` +
            (hasItems 
                ? items.filter(i => i.count > 0).map(i => `${i.emoji} **${i.name}** x${i.count}`).join('\n')
                : '*Your bag is empty of balls, darling. Pull some from gacha! (｡•́︿•̀｡)*')
        )
        .setFooter({ text: 'Select a ball below to use it for hunting! (◕‿✿)' });

      return { embed, items: items.filter(i => i.count > 0) };
    };

    const getComponents = (items) => {
      if (items.length === 0) return [];

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('use_item_select')
        .setPlaceholder('Select a ball to use...')
        .addOptions(
          items.map(item => ({
            label: item.name,
            description: `Use 1x ${item.name}`,
            value: item.name,
            emoji: item.emoji
          }))
        );

      return [new ActionRowBuilder().addComponents(selectMenu)];
    };

    try {
      const { embed, items: currentItems } = await renderBag();
      const components = getComponents(currentItems);
      
      const msg = await message.reply({
        embeds: [embed],
        components: components,
      });

      if (components.length === 0) return;

      const collector = msg.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 300000,
      });

      collector.on('collect', async (i) => {
        if (i.user.id !== userId)
          return i.reply({ content: "That's not yours, sweetheart! (っ˘ω˘ς)", flags: [MessageFlags.Ephemeral] });

        const itemName = i.values[0];
        const userData = await database.getUser(userId, message.author.username);
        
        let hasItem = false;
        let boosterKey = '';
        const boosters = userData.boosters || new Map();

        if (itemName === 'Pokeball') {
            if (userData.pokeballs > 0) {
                userData.pokeballs--;
                hasItem = true;
                boosterKey = 'pokeball';
                stackLimit = 5;
            }
        } else if (itemName === 'Ultraball') {
            if (userData.ultraballs > 0) {
                userData.ultraballs--;
                hasItem = true;
                boosterKey = 'ultraball';
            }
        } else if (itemName === 'Master Ball') {
            if (userData.masterballs > 0) {
                userData.masterballs--;
                hasItem = true;
                boosterKey = 'masterball';
            }
        }

        if (!hasItem) {
          return i.reply({ content: `❌ You don't have any **${itemName}** left! (｡•́︿•̀｡)`, flags: [MessageFlags.Ephemeral] });
        }

        const currentBooster = boosters.get(boosterKey);
        if (currentBooster?.active && currentBooster?.oneTime) {
          return i.reply({ content: `❌ You already have a **${itemName}** active for your next hunt, darling! (｡•́︿•̀｡)`, flags: [MessageFlags.Ephemeral] });
        }

        await database.setPokeball(userId, boosterKey);

        await i.reply({
          content: `✅ Successfully used **${itemName}**! Your next hunt will have much better rates! (ﾉ´ヮ\` )ﾉ*:･ﾟ✧`,
          flags: [MessageFlags.Ephemeral],
        });

        const { embed: newEmbed, items: newItems } = await renderBag();
        await msg.edit({ embeds: [newEmbed], components: getComponents(newItems) });
      });

      collector.on('end', () => {
        msg.edit({ components: [] }).catch(() => { });
      });
    } catch (error) {
        logger.error('Bag command failed', error);
        message.reply('❌ Oopsie! Something went wrong while opening your bag. (っ˘ω˘ς)');
    }
  },
};
