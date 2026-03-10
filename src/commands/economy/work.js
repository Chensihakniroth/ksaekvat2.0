const { EmbedBuilder } = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const economyService = require('../../services/EconomyService').default || require('../../services/EconomyService');
const cooldowns = require('../../utils/cooldowns.js');

module.exports = {
  name: 'work',
  aliases: ['job', 'earn'],
  description: 'Work to earn some <:coin:1480551418464305163>',
  usage: 'work',
  async execute(message, args, client) {
    const userData = await database.getUser(message.author.id, message.author.username);

    // Pick a random work message
    const workMessages = [
      'You worked as a software developer and earned {amount} <:coin:1480551418464305163>.',
      'You helped a neighbor with their garden and received {amount} <:coin:1480551418464305163>.',
      'You sold some handmade crafts at the market for {amount} <:coin:1480551418464305163>.',
      'You delivered packages all day and earned {amount} <:coin:1480551418464305163>.',
      'You worked a shift at the local cafe and received {amount} <:coin:1480551418464305163>.',
      'You helped Mommy with the chores and she gave you {amount} <:coin:1480551418464305163>! (◕‿◕✿)',
      'You wrote some code for a friend and they paid you {amount} <:coin:1480551418464305163>.',
      'You found some lost change while walking and collected {amount} <:coin:1480551418464305163>.',
    ];

    const randomMessage = workMessages[Math.floor(Math.random() * workMessages.length)];

    // Check for active money booster
    const moneyBooster = await database.getActiveBooster(message.author.id, 'money');
    const multiplier = moneyBooster ? moneyBooster.multiplier : 1;

    // Use EconomyService to calculate reward
    let finalReward = economyService.calculateWorkReward(
      config.economy.workReward.min,
      config.economy.workReward.max,
      multiplier
    );

    // Add bonus based on level
    const levelBonus = Math.floor(userData.level * 5);
    finalReward += levelBonus;

    // Update user data
    userData.balance += finalReward;
    await database.saveUser(userData);

    // Add some experience
    const expReward = Math.floor(Math.random() * 11) + 5; // 5-15 XP
    await database.addExperience(message.author.id, expReward);

    const embed = new EmbedBuilder()
      .setColor(colors.primary)
      .setTitle('💼 Work Finished!')
      .setDescription(randomMessage.replace('{amount}', `**${economyService.format(finalReward)}**`))
      .addFields(
        {
          name: '💰 New Balance',
          value: `${economyService.format(userData.balance)} ${config.economy.currency}`,
          inline: true,
        },
        {
          name: '⭐ Experience',
          value: `+${expReward} XP`,
          inline: true,
        }
      );

    if (moneyBooster) {
      embed.setFooter({ text: `Money Booster x${moneyBooster.multiplier} applied!` });
    }

    // Update command usage statistics
    await database.updateStats(message.author.id, 'command');

    message.reply({ embeds: [embed] });
  },
};
