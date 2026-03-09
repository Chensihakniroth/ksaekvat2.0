const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
  name: 'pay',
  aliases: ['give', 'send'],
  description: 'Send <:coin:1480551418464305163> to another user',
  usage: 'pay <@user> <amount>',
  async execute(message, args, client) {
    // Check for target user
    const target = message.mentions.users.first();
    if (!target) {
      return message.reply(
        '❓ Who are you trying to send money to, sweetie? Please mention them! (◕‿◕✿)'
      );
    }

    if (target.id === message.author.id) {
      return message.reply(
        "🚫 You can't send money to yourself, darling! That would be silly! (っ˘ω˘ς)"
      );
    }

    if (target.bot) {
      return message.reply("🤖 Bots don't need money, sweetie! They only need code! (◕‿-)");
    }

    // Check for amount
    let amount = args[1];
    if (!amount) {
      return message.reply('💰 How much do you want to send, darling? Please specify an amount!');
    }

    const senderData = await database.getUser(message.author.id, message.author.username);

    if (amount.toLowerCase() === 'all') {
      amount = senderData.balance;
    } else {
      amount = parseInt(amount);
    }

    if (isNaN(amount) || amount <= 0) {
      return message.reply(
        "🚫 That's not a valid amount, sweetie! Please enter a positive number."
      );
    }

    if (senderData.balance < amount) {
      return message.reply(
        `💸 You don't have enough money, darling! You only have **${senderData.balance.toLocaleString()}** ${config.economy.currency}.`
      );
    }

    // Process the transaction
    const targetData = await database.getUser(target.id, target.username);

    // Update balances
    senderData.balance -= amount;
    targetData.balance += amount;

    await database.saveUser(senderData);
    await database.saveUser(targetData);

    const embed = new EmbedBuilder()
      .setColor(colors.success)
      .setTitle('💸 Transaction Successful!')
      .setDescription(
        `You successfully sent **${amount.toLocaleString()}** ${config.economy.currency} to **${target.username}**!`
      )
      .addFields(
        {
          name: '👤 From',
          value: message.author.username,
          inline: true,
        },
        {
          name: '👤 To',
          value: target.username,
          inline: true,
        }
      )
      .setTimestamp();

    // Update statistics
    await database.updateStats(message.author.id, 'command');

    message.reply({ embeds: [embed] });
  },
};
