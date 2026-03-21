const { EmbedBuilder } = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
  name: 'duel',
  aliases: ['challenge', 'pvp'],
  description: 'Challenge another user to a duel',
  usage: 'duel <@user> [bet_amount]',
  cooldown: 30000, // 30 seconds
  async execute(message, args, client) {
    // Check if user provided a target
    if (args.length < 1) {
      return message.reply({
        embeds: [
          {
            color: colors.error,
            title: '(｡•́︿•̀｡) Missing someone?',
            description:
              'Sweetie, you need to mention a friend to play with!\n**Usage:** `Kduel @user [bet_amount]`\n**Example:** `Kduel @friend 1000` (◕‿◕✿)',
          },
        ],
      });
    }

    // Get target user
    let target = null;
    if (message.mentions.users.size > 0) {
      target = message.mentions.users.first();
    } else {
      const userId = args[0];
      target = client.users.cache.get(userId);
    }

    if (!target) {
      return message.reply({
        embeds: [
          {
            color: colors.error,
            title: '(っ˘ω˘ς) Where are they?',
            description: "I couldn't find that person, darling. Are you sure they are here? (◕‿◕✿)",
          },
        ],
      });
    }

    // Can't duel yourself
    if (target.id === message.author.id) {
      return message.reply({
        embeds: [
          {
            color: colors.warning,
            title: 'ヽ(>∀<☆)ノ Silly little one!',
            description:
              "You can't fight yourself, sweetie! Find a friend to play with instead. (◕‿◕✿)",
          },
        ],
      });
    }

    // Can't duel bots
    if (target.bot) {
      return message.reply({
        embeds: [
          {
            color: colors.warning,
            title: '(｡♥‿♥｡) Oh darling...',
            description:
              'The bots are too busy helping me! Please find a real friend to challenge. (◕‿◕✿)',
          },
        ],
      });
    }

    // Parse bet amount (optional)
    let betAmount = 0;
    if (args.length > 1) {
      betAmount = parseInt(args[1]);
      if (isNaN(betAmount) || betAmount < 0) {
        betAmount = 0;
      }
    }

    // Check if both users have enough balance for bet
    const challengerData = await database.getUser(message.author.id, message.author.username);
    const targetData = await database.getUser(target.id, target.username);

    if (betAmount > 0) {
      if (!(await database.hasBalance(message.author.id, betAmount))) {
        return message.reply({
          embeds: [
            {
              color: colors.error,
              title: '(｡•́︿•̀｡) Not enough coins...',
              description: `Sweetie, you don't have enough ${config.economy.currency} for this bet... (っ˘ω˘ς)\n**Your Balance:** ${challengerData.balance.toLocaleString()} ${config.economy.currency}\n**Required:** ${betAmount.toLocaleString()} ${config.economy.currency}`,
            },
          ],
        });
      }

      if (!(await database.hasBalance(target.id, betAmount))) {
        return message.reply({
          embeds: [
            {
              color: colors.warning,
              title: '(｡•́︿•̀｡) Friend is short on coins...',
              description: `${target.username} doesn't have enough ${config.economy.currency} to play this high stakes game, darling. (っ˘ω˘ς)\n**Their Balance:** ${targetData.balance.toLocaleString()} ${config.economy.currency}\n**Required:** ${betAmount.toLocaleString()} ${config.economy.currency}`,
            },
          ],
        });
      }
    }

    // Calculate combat stats based on level and experience (Equipment system removed)
    const challengerStats = {
      attack: Math.floor(challengerData.level * 10 + challengerData.experience / 100),
      defense: Math.floor(challengerData.level * 8 + challengerData.experience / 150),
      health: Math.floor(challengerData.level * 15 + 100),
      luck: Math.floor(challengerData.level * 2),
    };

    const targetStats = {
      attack: Math.floor(targetData.level * 10 + targetData.experience / 100),
      defense: Math.floor(targetData.level * 8 + targetData.experience / 150),
      health: Math.floor(targetData.level * 15 + 100),
      luck: Math.floor(targetData.level * 2),
    };

    // Create duel invitation embed
    const inviteEmbed = new EmbedBuilder()
      .setColor(colors.warning)
      .setTitle('(◕‿◕✿) A Friendly Duel!')
      .setDescription(`${message.author}, darling, wants to play with ${target}!`)
      .addFields(
        {
          name: '🥊 Your Strength, sweetie',
          value: [
            `**Level:** ${challengerData.level}`,
            `**Attack:** ${challengerStats.attack}`,
            `**Defense:** ${challengerStats.defense}`,
            `**Health:** ${challengerStats.health}`,
          ].join('\n'),
          inline: true,
        },
        {
          name: '🛡️ Their Strength, darling',
          value: [
            `**Level:** ${targetData.level}`,
            `**Attack:** ${targetStats.attack}`,
            `**Defense:** ${targetStats.defense}`,
            `**Health:** ${targetStats.health}`,
          ].join('\n'),
          inline: true,
        }
      );

    if (betAmount > 0) {
      inviteEmbed.addFields({
        name: '💰 Little Treasures at Stake',
        value: `**Bet Amount:** ${betAmount.toLocaleString()} ${config.economy.currency}\n**Winner Takes:** ${(betAmount * 2).toLocaleString()} ${config.economy.currency} (｡♥‿♥｡)`,
        inline: false,
      });
    }

    inviteEmbed.addFields({
      name: '📋 Will you play?',
      value: `${target}, darling, react with ⚔️ to play or ❌ to stay safe (◕‿◕✿)\n**Time Limit:** 60 seconds`,
      inline: false,
    });

    const sentMessage = await message.reply({ embeds: [inviteEmbed] });

    try {
      // Wait a moment before adding reactions
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Add reaction options
      await sentMessage.react('⚔️');
      await sentMessage.react('❌');

      // Create reaction collector
      const filter = (reaction, user) => {
        return ['⚔️', '❌'].includes(reaction.emoji.name) && user.id === target.id;
      };

      const collector = sentMessage.createReactionCollector({
        filter,
        time: 60000,
        max: 1,
      });

      let processed = false;

      collector.on('collect', async (reaction, user) => {
        if (processed) return;
        processed = true;

        if (reaction.emoji.name === '⚔️') {
          const acceptEmbed = new EmbedBuilder()
            .setColor(colors.success)
            .setTitle('(ﾉ´ヮ`)ﾉ*:･ﾟ✧ Let the games begin!')
            .setDescription(
              `${target} is ready to play, sweetie! Let's see who is stronger! (◕‿◕✿)`
            );

          await sentMessage.edit({ embeds: [acceptEmbed] });
          await sentMessage.reactions.removeAll().catch(() => {});

          await new Promise((resolve) => setTimeout(resolve, 3000));
          await startDuel(
            sentMessage,
            message.author,
            target,
            challengerStats,
            targetStats,
            betAmount
          );
        } else if (reaction.emoji.name === '❌') {
          const declineEmbed = new EmbedBuilder()
            .setColor(colors.error)
            .setTitle('(っ˘ω˘ς) Maybe next time')
            .setDescription(`${target} doesn't want to play right now, darling. (◕‿◕✿)`);

          await sentMessage.edit({ embeds: [declineEmbed] });
          await sentMessage.reactions.removeAll().catch(() => {});
        }
      });

      collector.on('end', async (collected, reason) => {
        if (processed) return;

        if (collected.size === 0) {
          const timeoutEmbed = new EmbedBuilder()
            .setColor(colors.warning)
            .setTitle('(｡•́︿•̀｡) No response...')
            .setDescription(`${target} must be busy, sweetie. Let's try again later! (◕‿◕✿)`);

          await sentMessage.edit({ embeds: [timeoutEmbed] });
          await sentMessage.reactions.removeAll().catch(() => {});
        }
      });
    } catch (error) {
      console.error('❌ Error setting up duel:', error);
      await message.channel.send('Failed to set up the duel. Please try again.');
    }

    // Update command usage statistics
    await database.updateStats(message.author.id, 'command');
  },
};

async function startDuel(message, challenger, defender, challengerStats, defenderStats, betAmount) {
  let challengerHP = challengerStats.health;
  let defenderHP = defenderStats.health;
  let round = 1;
  let battleLog = [];

  // Process bet if applicable
  if (betAmount > 0) {
    await database.removeBalance(challenger.id, betAmount);
    await database.removeBalance(defender.id, betAmount);
    await database.updateStats(challenger.id, 'gambled', betAmount);
    await database.updateStats(defender.id, 'gambled', betAmount);
  }

  const battleEmbed = new EmbedBuilder()
    .setColor(colors.primary)
    .setTitle('(◕‿◕✿) Having Fun!')
    .setDescription(`**${challenger.username}** and **${defender.username}** are playing together!`)
    .addFields(
      {
        name: `🥊 ${challenger.username}`,
        value: `❤️ **HP:** ${challengerHP}/${challengerStats.health}`,
        inline: true,
      },
      {
        name: `🛡️ ${defender.username}`,
        value: `❤️ **HP:** ${defenderHP}/${defenderStats.health}`,
        inline: true,
      }
    );

  await message.edit({ embeds: [battleEmbed] });
  await message.reactions.removeAll();

  // Battle loop
  while (challengerHP > 0 && defenderHP > 0 && round <= 15) {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const challengerInitiative = challengerStats.luck + Math.random() * 20;
    const defenderInitiative = defenderStats.luck + Math.random() * 20;

    let currentAttacker, currentDefender, attackerStats, defenderStatsInRound;

    if (challengerInitiative >= defenderInitiative) {
      currentAttacker = challenger;
      currentDefender = defender;
      attackerStats = challengerStats;
      defenderStatsInRound = defenderStats;
    } else {
      currentAttacker = defender;
      currentDefender = challenger;
      attackerStats = defenderStats;
      defenderStatsInRound = challengerStats;
    }

    const baseDamage = attackerStats.attack + Math.random() * 20;
    const defense = defenderStatsInRound.defense + Math.random() * 10;
    const damage = Math.max(1, Math.floor(baseDamage - defense));

    if (currentAttacker.id === challenger.id) {
      defenderHP = Math.max(0, defenderHP - damage);
    } else {
      challengerHP = Math.max(0, challengerHP - damage);
    }

    battleLog.push(
      `⚔️ ${currentAttacker.username} attacks ${currentDefender.username} for **${damage}** damage!`
    );

    const roundEmbed = new EmbedBuilder()
      .setColor(colors.primary)
      .setTitle(`⚔️ Duel - Round ${round}`)
      .setDescription(
        `**${challenger.username}** and **${defender.username}** are playing together!`
      )
      .addFields(
        {
          name: `🥊 ${challenger.username}`,
          value: `❤️ **HP:** ${challengerHP}/${challengerStats.health}`,
          inline: true,
        },
        {
          name: `🛡️ ${defender.username}`,
          value: `❤️ **HP:** ${defenderHP}/${defenderStats.health}`,
          inline: true,
        },
        {
          name: '📜 Play Log',
          value: battleLog.slice(-4).join('\n') || 'The fun begins... (◕‿◕✿)',
          inline: false,
        }
      );

    await message.edit({ embeds: [roundEmbed] });
    round++;
  }

  // Determine winner
  let winner, loser;
  if (challengerHP <= 0 && defenderHP <= 0) {
    winner = challengerStats.health >= defenderStats.health ? challenger : defender;
    loser = winner.id === challenger.id ? defender : challenger;
  } else if (challengerHP <= 0) {
    winner = defender;
    loser = challenger;
  } else if (defenderHP <= 0) {
    winner = challenger;
    loser = defender;
  } else {
    if (challengerHP > defenderHP) {
      winner = challenger;
      loser = defender;
    } else if (defenderHP > challengerHP) {
      winner = defender;
      loser = challenger;
    } else {
      winner = Math.random() < 0.5 ? challenger : defender;
      loser = winner.id === challenger.id ? defender : challenger;
    }
  }

  let rewardText = '';
  if (betAmount > 0) {
    const winAmount = betAmount * 2;
    await database.addBalance(winner.id, winAmount);
    await database.updateStats(winner.id, 'won', betAmount);
    await database.updateStats(loser.id, 'lost', betAmount);
    rewardText = `\n\n💰 **${winner.username}** gets a little treat of **${winAmount.toLocaleString()}** ${config.economy.currency}! (◕‿◕✿)`;
  }

  const winnerExpGain = await database.addExperience(winner.id, 50);
  const loserExpGain = await database.addExperience(loser.id, 25);

  const resultEmbed = new EmbedBuilder()
    .setColor(colors.success)
    .setTitle('(｡♥‿♥｡) We have a winner!')
    .setDescription(
      `**${winner.username}** was just a little stronger today, darling! ${rewardText}`
    )
    .addFields(
      {
        name: '🥇 Proud Champion',
        value: `${winner.username}\n+50 XP${winnerExpGain.leveledUp ? `\n🎉 Level Up! (${winnerExpGain.newLevel})` : ''}`,
        inline: true,
      },
      {
        name: '🥈 Brave Effort',
        value: `${loser.username}\n+25 XP${loserExpGain.leveledUp ? `\n🎉 Level Up! (${loserExpGain.newLevel})` : ''}`,
        inline: true,
      },
      {
        name: '📊 Final Stats',
        value: [
          `**Rounds:** ${round - 1}`,
          `**Final HP:** ${challenger.username}: ${challengerHP}, ${defender.username}: ${defenderHP}`,
        ].join('\n'),
        inline: false,
      }
    )
    .setThumbnail(winner.displayAvatarURL());

  await message.edit({ embeds: [resultEmbed] });
}
