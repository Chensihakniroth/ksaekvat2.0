const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const database = require('../../services/DatabaseService');
const QuestService = require('../../services/QuestService').default || require('../../services/QuestService');
const colors = require('../../utils/colors.js');

module.exports = {
  name: 'quests',
  aliases: ['q', 'daily', 'tasks', 'kquests'],
  description: "View your daily tasks from Mommy! Complete them for big rewards! (｡♥‿♥｡)",
  usage: 'quests',
  async execute(message, args, client) {
    const userId = message.author.id;
    let userData = await database.getUser(userId, message.author.username);

    // Initial check for quests
    if (!userData.quests || userData.quests.length === 0) {
      await QuestService.generateDailyQuests(userId);
      userData = await database.getUser(userId, message.author.username);
    }

    // Check if reset is needed
    const today = new Date().setHours(0, 0, 0, 0);
    const lastReset = userData.lastQuestReset ? new Date(userData.lastQuestReset).setHours(0, 0, 0, 0) : 0;

    if (today > lastReset) {
      await QuestService.generateDailyQuests(userId);
      userData = await database.getUser(userId, message.author.username);
    }

    const embed = new EmbedBuilder()
      .setColor(colors.primary)
      .setTitle('📜 Mommy\'s Daily Quest Board')
      .setDescription(`Complete these tasks today to earn extra rewards, sweetie! (◕‿◕✿)\n\n*Quests reset every day at midnight!*`)
      .setThumbnail(client.user.displayAvatarURL());

    let allCompleted = true;
    let anyToClaim = false;

    userData.quests.forEach((q) => {
      const info = QuestService.getQuestInfo(q);
      embed.addFields({
        name: `${info.status} — ${info.name}`,
        value: `${info.description}\n📊 **Progress:** \`${info.progress}\``,
        inline: false,
      });
      if (!q.completed) allCompleted = false;
      if (q.completed && !q.rewarded) anyToClaim = true;
    });

    if (allCompleted) {
        embed.addFields({ name: '🎊 All Done!', value: "You've finished everything for today! Mommy is so proud of you! (｡♥‿♥｡)", inline: false });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('claim_quests')
        .setLabel('Claim Rewards')
        .setEmoji('🎁')
        .setStyle(ButtonStyle.Success)
        .setDisabled(!anyToClaim)
    );

    const msg = await message.reply({ embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({ time: 60000 });

    collector.on('collect', async (i) => {
      if (i.user.id !== userId) return;

      if (i.customId === 'claim_quests') {
        const updatedUser = await database.getUser(userId, message.author.username);
        let rewardsGiven = 0;
        let starDustReward = 0;
        let pullReward = 0;

        updatedUser.quests.forEach(q => {
            if (q.completed && !q.rewarded) {
                q.rewarded = true;
                rewardsGiven++;
                // Base reward: 10 Star Dust and 2 Extra Pulls per quest
                starDustReward += 10;
                pullReward += 2;
            }
        });

        if (rewardsGiven > 0) {
            updatedUser.star_dust = (updatedUser.star_dust || 0) + starDustReward;
            updatedUser.extraPulls = (updatedUser.extraPulls || 0) + pullReward;
            updatedUser.markModified('quests');
            await database.saveUser(updatedUser);

            await i.reply({
                content: `🎊 **REWARDS CLAIMED!** 🎊\nYou received **${starDustReward}** Star Dust and **${pullReward}** Extra Pulls! Mommy loves a hard worker! (｡♥‿♥｡)`,
                flags: [MessageFlags.Ephemeral]
            });

            // Update main embed
            const finalEmbed = EmbedBuilder.from(embed).setFields([]);
            updatedUser.quests.forEach((q) => {
                const info = QuestService.getQuestInfo(q);
                finalEmbed.addFields({
                    name: `${q.rewarded ? '🎁 Claimed' : info.status} — ${info.name}`,
                    value: `${info.description}\n📊 **Progress:** \`${info.progress}\``,
                    inline: false,
                });
            });
            await msg.edit({ embeds: [finalEmbed], components: [] });
        }
      }
    });

    await database.updateStats(userId, 'command');
  },
};
