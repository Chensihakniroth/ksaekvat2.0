const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
  MessageFlags,
} = require('discord.js');
const database = require('../../services/DatabaseService');
const shopConfig = require('../../config/shopConfig.js');
const colors = require('../../utils/colors.js');

module.exports = {
  name: 'settheme',
  aliases: ['theme', 'ktheme'],
  description: 'Switch between your unlocked profile themes! 🎨',
  usage: 'settheme',
  async execute(message, args, client) {
    const userId = message.author.id;
    const userData = await database.getUser(userId, message.author.username);

    const unlocked = userData.unlockedThemes || ['default'];
    
    // Get all theme info from shop config
    const allThemes = [
      { id: 'default', name: 'Default', emoji: '⚙️', description: 'The classic look.' }
    ];

    Object.values(shopConfig.categories.themes.items).forEach(t => {
      allThemes.push({
        id: t.id,
        name: t.name,
        emoji: t.emoji,
        description: t.description
      });
    });

    const userThemes = allThemes.filter(t => unlocked.includes(t.id));

    const embed = new EmbedBuilder()
      .setColor(colors.primary)
      .setTitle('🎨 Your Profile Themes')
      .setDescription(
        `Select a theme below to customize your \`Kprofile\`, sweetie! (｡♥‿♥｡)\n\n` +
        `**Current Theme:** ${userData.profileTheme || 'Default'}`
      );

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_theme')
        .setPlaceholder('✨ Choose a theme')
        .addOptions(
          userThemes.map(t => ({
            label: t.name,
            value: t.id,
            description: t.description,
            emoji: t.emoji,
            default: t.id === userData.profileTheme
          }))
        )
    );

    const msg = await message.reply({
      embeds: [embed],
      components: [menu]
    });

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 60000
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== userId) return;

      const themeId = i.values[0];
      await database.setTheme(userId, themeId);

      const theme = allThemes.find(t => t.id === themeId);

      await i.update({
        content: `✅ Your profile theme has been set to **${theme.emoji} ${theme.name}**! It looks beautiful, darling! (｡♥‿♥｡)`,
        embeds: [],
        components: []
      });
    });

    collector.on('end', () => {
      msg.edit({ components: [] }).catch(() => {});
    });
  },
};
