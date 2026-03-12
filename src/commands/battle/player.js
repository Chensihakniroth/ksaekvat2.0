const { EmbedBuilder } = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const CombatService = require('../../services/CombatService.js').default || require('../../services/CombatService.js');
const EconomyService = require('../../services/EconomyService').default || require('../../services/EconomyService');

module.exports = {
  name: 'player',
  aliases: ['stats', 'pstats', 'playerstats'],
  description: 'View detailed player combat statistics',
  usage: 'player [@user]',
  cooldown: 5000,
  async execute(message, args, client) {
    let target = message.author;
    if (message.mentions.users.size > 0) {
      target = message.mentions.users.first();
    } else if (args[0]) {
      const userId = args[0].replace(/[<@!>]/g, '');
      const found = client.users.cache.get(userId);
      if (found) target = found;
    }

    const userData = await database.getUser(target.id, target.username);
    
    // --- CALCULATE STATS (Using Service) ---
    // Pass empty bonuses as the equipment system is removed
    const emptyBonuses = { attack: 0, defense: 0, hp: 0, speed: 0, luck: 0 };
    const { baseStats, totalStats } = CombatService.calculatePlayerStats(userData, emptyBonuses);

    const embed = new EmbedBuilder()
      .setColor(colors.primary)
      .setTitle(`⚔️ ${target.username}'s Combat Stats`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        {
          name: '📊 Combat Stats',
          value: [
            `**Level:** ${userData.level}`,
            `**Experience:** ${EconomyService.format(userData.experience)}`,
            `**Health:** ${totalStats.health}`,
            `**Attack:** ${totalStats.attack}`,
            `**Defense:** ${totalStats.defense}`,
            `**Luck:** ${totalStats.luck}`,
          ].join('\n'),
          inline: true,
        }
      );

    // Battle statistics
    const stats = userData.stats || {};
    embed.addFields({
      name: '🏆 Battle Record',
      value: [
        `**Total Gambled:** ${EconomyService.format(stats.totalGambled || 0)}`,
        `**Total Won:** ${EconomyService.format(stats.totalWon || 0)}`,
        `**Total Lost:** ${EconomyService.format(stats.totalLost || 0)}`,
        `**Win Rate:** ${stats.totalGambled > 0 ? Math.round((stats.totalWon / (stats.totalWon + stats.totalLost)) * 100) : 0}%`,
      ].join('\n'),
      inline: false,
    });

    await message.reply({ embeds: [embed] });
    await database.updateStats(message.author.id, 'command');
  },
};
