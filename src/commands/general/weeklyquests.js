const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const database = require('../../services/DatabaseService');
const QuestService = require('../../services/QuestService').default || require('../../services/QuestService');
const colors = require('../../utils/colors.js');

module.exports = {
  name: 'weeklyquests',
  aliases: ['wq', 'weeklyq', 'weeklytasks'],
  description: "View your weekly quests from Mommy! Complete them for big rewards! (｡♥‿♥｡)",
  usage: 'weeklyquests',
  async execute(message, args, client) {
    const userId = message.author.id;
    let userData = await database.getUser(userId, message.author.username);

    // Check if reset is needed (weekly reset)
    const now = new Date();
    const lastReset = userData.lastWeeklyQuestReset ? new Date(userData.lastWeeklyQuestReset) : null;

    // Check if it's been 7 days since last weekly reset
    if (lastReset && now.getTime() - lastReset.getTime() >= 7 * 24 * 60 * 60 * 1000) {
      await QuestService.generateWeeklyQuests(userId);
      userData = await database.getUser(userId, message.author.username);
    }

    // If no weekly quests exist, generate them
    if (!userData.weeklyQuests || userData.weeklyQuests.length === 0) {
      await QuestService.generateWeeklyQuests(userId);
      userData = await database.getUser(userId, message.author.username);
    }

    const embed = new EmbedBuilder()
      .setColor(colors.primary)
      .setTitle('📅 Mommy\'s Weekly Quest Board')
      .setDescription(`Complete these tasks this week to earn extra rewards, sweetie! (◕‿◕✿)\n\n*Weekly quests reset every 7 days!*`)
      .setThumbnail(client.user.displayAvatarURL());

    let allCompleted = true;
    let anyToClaim = false;

    userData.weeklyQuests.forEach((q) => {
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
        embed.addFields({ name: '🎊 All Done!', value: "You've finished everything for this week! Mommy is so proud of you! (｡♥‿♥｡)", inline: false });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('claim_weekly_quests')
        .setLabel('Claim Weekly Rewards')
        .setEmoji('🎁')
        .setStyle(ButtonStyle.Success)
        .setDisabled(!anyToClaim)
    );

    const msg = await message.reply({ embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({ time: 60000 });

    collector.on('collect', async (i) => {
      if (i.user.id !== userId) return;

      if (i.customId === 'claim_weekly_quests') {
        const updatedUser = await database.getUser(userId, message.author.username);
        let rewardsGiven = 0;
        let starDustReward = 0;
        let pullReward = 0;

        updatedUser.weeklyQuests.forEach(q => {
            if (q.completed && !q.rewarded) {
                q.rewarded = true;
                rewardsGiven++;
                // Weekly reward: 50 Star Dust and 10 Extra Pulls per quest (bigger than daily)
                starDustReward += 50;
                pullReward += 10;
            }
        });

        if (rewardsGiven > 0) {
            updatedUser.star_dust = (updatedUser.star_dust || 0) + starDustReward;
            updatedUser.extraPulls = (updatedUser.extraPulls || 0) + pullReward;
            updatedUser.markModified('weeklyQuests');
            await database.saveUser(updatedUser);

            await i.reply({
                content: `🎊 **WEEKLY REWARDS CLAIMED!** 🎊\nYou received **${starDustReward}** Star Dust and **${pullReward}** Extra Pulls! Mommy loves a hard worker! (｡♥‿♥｡)`,
                flags: [MessageFlags.Ephemeral]
            });

            // Update main embed
            const finalEmbed = EmbedBuilder.from(embed).setFields([]);
            updatedUser.weeklyQuests.forEach((q) => {
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