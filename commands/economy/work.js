const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const cooldowns = require('../../utils/cooldowns.js');

module.exports = {
  name: 'work',
  aliases: ['job', 'earn'],
  description: 'Work to earn some riel',
  usage: 'work',
  async execute(message, args, client) {
    const userData = await database.getUser(message.author.id, message.author.username);

    // Cooldown is handled by the command handler, but we can add more logic here if needed

    // Pick a random work message
    const workMessages = [
      'You worked as a software developer and earned {amount} riel.',
      'You helped a neighbor with their garden and received {amount} riel.',
      'You sold some handmade crafts at the market for {amount} riel.',
      'You delivered packages all day and earned {amount} riel.',
      'You worked a shift at the local cafe and received {amount} riel.',
      'You helped Mommy with the chores and she gave you {amount} riel! (◕‿◕✿)',
      'You wrote some code for a friend and they paid you {amount} riel.',
      'You found some lost change while walking and collected {amount} riel.',
    ];

    const randomMessage = workMessages[Math.floor(Math.random() * workMessages.length)];

    // Generate random reward amount
    const { min, max } = config.economy.workReward;
    const baseReward = Math.floor(Math.random() * (max - min + 1)) + min;

    // Apply money booster if active
    let finalReward = baseReward;
    const moneyBooster = await database.getActiveBooster(message.author.id, 'money');
    if (moneyBooster) {
      finalReward = Math.floor(baseReward * moneyBooster.multiplier);
    }

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
      .setDescription(randomMessage.replace('{amount}', `**${finalReward.toLocaleString()}**`))
      .addFields(
        {
          name: '💰 New Balance',
          value: `${userData.balance.toLocaleString()} ${config.economy.currency}`,
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
