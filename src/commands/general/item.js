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
      
      const stardustEmoji = getItemEmoji({ name: 'Star Dust' }, client);
      const pokeballEmoji = getItemEmoji({ name: 'Pokeball' }, client);
      const ultraballEmoji = getItemEmoji({ name: 'Ultraball' }, client);
      const masterballEmoji = getItemEmoji({ name: 'Master Ball' }, client);

      const itemsList = [
        { id: 'star_dust', name: 'Star Dust', count: userData.star_dust || 0, emoji: stardustEmoji },
        { id: 'pokeball', name: 'Pokeball', count: userData.pokeballs || 0, emoji: pokeballEmoji },
        { id: 'ultraball', name: 'Ultraball', count: userData.ultraballs || 0, emoji: ultraballEmoji },
        { id: 'masterball', name: 'Master Ball', count: userData.masterballs || 0, emoji: masterballEmoji },
      ];

      const heldItems = itemsList.filter(item => item.count > 0);

      const embed = new EmbedBuilder()
        .setColor(colors.primary)
        .setTitle(`🎒 ${message.author.username}'s Bag`)
        .setThumbnail(message.author.displayAvatarURL());

      if (heldItems.length === 0) {
        embed.setDescription('*Your bag is empty, darling. Try some gacha pulls! (｡•́︿•̀｡)*');
      } else {
        const list = heldItems.map(w => `${w.emoji} **${w.name}**: ${w.count}`);
        embed.setDescription(`**Items in your bag:**\n\n${list.join('\n')}\n\n*Click a button below to use a ball!*`);
      }

      embed.setFooter({ text: 'Pokeballs are one-time-use and valid for exactly one hunt! (◕‿✿)' });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('use_pokeball')
          .setLabel('Pokeball')
          .setEmoji('⚪')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled((userData.pokeballs || 0) <= 0),
        new ButtonBuilder()
          .setCustomId('use_ultraball')
          .setLabel('Ultraball')
          .setEmoji('🟡')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled((userData.ultraballs || 0) <= 0),
        new ButtonBuilder()
          .setCustomId('use_masterball')
          .setLabel('Master Ball')
          .setEmoji('🟣')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled((userData.masterballs || 0) <= 0),
        new ButtonBuilder()
          .setCustomId('go_shop')
          .setLabel('Shop')
          .setEmoji('🏪')
          .setStyle(ButtonStyle.Primary)
      );

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
      if (i.user.id !== userId) return i.reply({ content: "Not your bag, darling! (っ˘ω˘ς)", flags: [MessageFlags.Ephemeral] });

      if (i.customId === 'go_shop') {
        return i.reply({
          content: '🏪 Use `Kshop` to visit Mommy\'s General Store and exchange Star Dust for characters! (｡♥‿♥｡)',
          flags: [MessageFlags.Ephemeral],
        });
      }

      const typeMap = {
        use_pokeball: 'pokeball',
        use_ultraball: 'ultraball',
        use_masterball: 'masterball',
      };

      const type = typeMap[i.customId];
      if (!type) return;

      const userData = await database.getUser(userId, message.author.username);
      const boosters = userData.boosters || new Map();
      const currentBooster = boosters.get(type);

      if (currentBooster?.active && currentBooster?.oneTime) {
        return i.reply({ content: `❌ You already have a **${type}** active for your next hunt, darling! (｡•́︿•̀｡)`, flags: [MessageFlags.Ephemeral] });
      }

      const result = await database.setPokeball(userId, type);

      if (!result.success) {
        return i.reply({ content: result.message, flags: [MessageFlags.Ephemeral] });
      }

      const ballNames = {
        pokeball: '⚪ Pokeball',
        ultraball: '🟡 Ultraball',
        masterball: '🟣 Master Ball',
      };

      await i.reply({
        content: `✅ Activated **${ballNames[type]}**! Your next hunt will be boosted! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧`,
        flags: [MessageFlags.Ephemeral],
      });

      // Update the main Bag embed
      const { embed: updatedEmbed, components: updatedComponents } = await renderInventory();
      await msg.edit({ embeds: [updatedEmbed], components: updatedComponents });
    });

    collector.on('end', () => {
      msg.edit({ components: [] }).catch(() => {});
    });
  },
};
