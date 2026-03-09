const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const { getCharacterIcon, getCharacterEmoji } = require('../../utils/images.js');

module.exports = {
  name: 'char',
  aliases: ['characters', 'kchar', 'collection'],
  description: 'View your beautiful character collection! ✨',
  usage: 'char',
  async execute(message, args, client) {
    const inventory = await database.getHydratedInventory(message.author.id);
    const characters = inventory.filter((i) => i.type === 'character' || !i.type);

    if (characters.length === 0) {
      return message.reply(
        "💸 Oh no, darling! You don't have any characters yet. Use `Kwish` to start your collection! (｡•́︿•̀｡)"
      );
    }

    // Group by name
    const grouped = characters.reduce((acc, char) => {
      if (!acc[char.name]) {
        acc[char.name] = { ...char, count: 0 };
      }
      acc[char.name].count++;
      return acc;
    }, {});

    let currentSort = 'rarity'; // 'rarity', 'game', 'name'
    let currentPage = 0;
    const itemsPerPage = 10;

    const getSortedList = () => {
      return Object.values(grouped).sort((a, b) => {
        if (currentSort === 'rarity') {
          if (b.rarity !== a.rarity) return b.rarity - a.rarity;
          return a.name.localeCompare(b.name);
        } else if (currentSort === 'game') {
          if (a.game !== b.game) return a.game.localeCompare(b.game);
          return b.rarity - a.rarity;
        } else {
          return a.name.localeCompare(b.name);
        }
      });
    };

    const createEmbed = () => {
      const sorted = getSortedList();
      const totalPages = Math.ceil(sorted.length / itemsPerPage);
      const start = currentPage * itemsPerPage;
      const end = start + itemsPerPage;
      const pageItems = sorted.slice(start, end);

      const description = pageItems
        .map((c) => {
          const charEmoji = getCharacterEmoji(c, client);
          const star = c.rarity === 5 ? '🟡' : c.rarity === 4 ? '🟣' : '🔵';
          return `${star} ${charEmoji} **${c.name}** x${c.count}`;
        })
        .join('\n');

      const embed = new EmbedBuilder()
        .setColor(colors.primary)
        .setTitle(`👤 ${message.author.username}'s Collection`)
        .setDescription(
          `**Total Unique:** ${sorted.length}\n**Sorted by:** ${currentSort.charAt(0).toUpperCase() + currentSort.slice(1)}\n\n${description}`
        )
        .setFooter({ text: `Page ${currentPage + 1} of ${totalPages} (｡♥‿♥｡)` });

      // Show the first character's icon as a thumbnail for the page
      if (pageItems.length > 0) {
        embed.setThumbnail(getCharacterIcon(pageItems[0]));
      }

      return embed;
    };

    const createButtons = () => {
      const sorted = getSortedList();
      const totalPages = Math.ceil(sorted.length / itemsPerPage);

      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('sort_rarity')
          .setLabel('Sort: Rarity')
          .setStyle(currentSort === 'rarity' ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('sort_game')
          .setLabel('Sort: Game')
          .setStyle(currentSort === 'game' ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('sort_name')
          .setLabel('Sort: Name')
          .setStyle(currentSort === 'name' ? ButtonStyle.Primary : ButtonStyle.Secondary)
      );

      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('prev_page')
          .setLabel('Previous')
          .setStyle(ButtonStyle.Success)
          .setDisabled(currentPage === 0),
        new ButtonBuilder()
          .setCustomId('next_page')
          .setLabel('Next')
          .setStyle(ButtonStyle.Success)
          .setDisabled(currentPage >= totalPages - 1)
      );

      return [row1, row2];
    };

    const msg = await message.reply({ embeds: [createEmbed()], components: createButtons() });
    const collector = msg.createMessageComponentCollector({ time: 300000 });

    collector.on('collect', async (i) => {
      if (i.user.id !== message.author.id)
        return i.reply({
          content: "This isn't your collection, darling! (っ˘ω˘ς)",
          flags: [MessageFlags.Ephemeral],
        });

      if (i.customId.startsWith('sort_')) {
        currentSort = i.customId.replace('sort_', '');
        currentPage = 0;
      } else if (i.customId === 'prev_page') {
        currentPage--;
      } else if (i.customId === 'next_page') {
        currentPage++;
      }

      await i.update({ embeds: [createEmbed()], components: createButtons() });
    });

    collector.on('end', () => {
      msg.edit({ components: [] }).catch(() => {});
    });
  },
};
