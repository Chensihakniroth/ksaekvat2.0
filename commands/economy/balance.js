const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
  name: 'balance',
  aliases: ['bal', 'money', 'coins'],
  description: "Check your or another user's balance",
  usage: 'balance [@user]',
  async execute(message, args, client) {
    let target = message.author;

    // Determine the target user
    target = getTargetUser(message, args, client);

    const userData = await database.getUser(target.id, target.username);
    const embed = createBalanceEmbed(target, userData);

    // Add active boosters if any
    await addActiveBoosters(embed, target);

    // Update command usage statistics
    await database.updateStats(message.author.id, 'command');

    message.reply({ embeds: [embed] });
  },
};

// Function to get the target user
function getTargetUser(message, args, client) {
  if (message.mentions.users.size > 0) {
    return message.mentions.users.first();
  } else if (args.length > 0) {
    const userId = args[0];
    const foundUser = client.users.cache.get(userId);
    if (foundUser) return foundUser;
  }
  return message.author;
}

// Function to create the balance embed
function createBalanceEmbed(target, userData) {
  return new EmbedBuilder()
    .setColor(colors.success)
    .setTitle(`💰 ${target.username}'s Balance`)
    .setThumbnail(target.displayAvatarURL())
    .addFields(
      {
        name: `${config.economy.currencySymbol} Balance`,
        value: `**${userData.balance.toLocaleString()}** ${config.economy.currency}`,
        inline: false, // Make this field take the full width
      },
      {
        name: '📊 Level',
        value: `**${userData.level}** (${userData.experience} XP)`,
        inline: true,
      },
      {
        name: '🎯 Next Level',
        value: `${userData.level * 100 - userData.experience} XP needed`,
        inline: true,
      }
    );
}

// Function to add active boosters to the embed
async function addActiveBoosters(embed, target) {
  const moneyBooster = await database.getActiveBooster(target.id, 'money');
  const expBooster = await database.getActiveBooster(target.id, 'exp');

  if (moneyBooster || expBooster) {
    const boosterText = [];

    if (moneyBooster) {
      const timeLeft = Math.ceil((moneyBooster.expiresAt - Date.now()) / 1000 / 60);
      boosterText.push(`💰 Money x${moneyBooster.multiplier} (${timeLeft}m left)`);
    }

    if (expBooster) {
      const timeLeft = Math.ceil((expBooster.expiresAt - Date.now()) / 1000 / 60);
      boosterText.push(`⭐ Experience x${expBooster.multiplier} (${timeLeft}m left)`);
    }

    embed.addFields({
      name: '🚀 Active Boosters',
      value: boosterText.join('\n'),
      inline: false,
    });
  }
}
