const { EmbedBuilder } = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const AdminService = require('../../services/AdminService.js').default || require('../../services/AdminService.js');
const EconomyService = require('../../services/EconomyService').default || require('../../services/EconomyService');

module.exports = {
  name: 'reset',
  aliases: ['resetuser'],
  description: "Reset a user's data completely (Admin only)",
  usage: 'reset <@user>',
  adminOnly: true,
  async execute(message, args, client) {
    // Check arguments
    if (args.length < 1) {
      return message.reply({
        embeds: [
          {
            color: colors.error,
            title: '(◕‸ ◕✿) Sweetie, you forgot something!',
            description:
              'Please tell Mommy who to reset. (｡•́︿•̀｡)\n**Usage:** `Kreset @user`\n**Warning:** This will delete ALL their progress, darling!',
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
            title: "(｡•́︿•̀｡) I can't find them, darling",
            description:
              'Please mention a valid user or provide their user ID so Mommy can find them. (◕‿◕✿)',
          },
        ],
      });
    }

    // Prevent resetting admin accounts
    if (config.adminIds.includes(target.id)) {
      return message.reply({
        embeds: [
          {
            color: colors.error,
            title: '(｡♥‿♥｡) Oh, sweetie...',
            description:
              "Mommy cannot reset another admin's account! That would be very bad. (っ˘ω˘ς)",
          },
        ],
      });
    }

    // Get current user data for backup info
    const userData = await database.getUser(target.id, target.username);
    const backupData = {
      balance: userData.balance || 0,
      level: userData.level || 1,
      experience: userData.experience || 0,
      totalAnimalsFound: userData.stats?.totalAnimalsFound || 0,
      commandsUsed: userData.stats?.commandsUsed || 0,
      animalCount: Object.keys(userData.animals || {}).reduce(
        (total, rarity) => total + Object.keys(userData.animals[rarity] || {}).length,
        0
      ),
    };

    // Create confirmation embed
    const confirmEmbed = new EmbedBuilder()
      .setColor(colors.warning)
      .setTitle('(◕‸ ◕✿) ARE YOU SURE, DARLING?')
      .setDescription(
        `Are you really sure you want Mommy to **COMPLETELY RESET** ${target.username}'s account?\n\n**MOMMY CAN\'T UNDO THIS! (｡•́︿•̀｡)**`
      )
      .addFields(
        {
          name: '(◕‿◕✿) Target User',
          value: [
            `**Username:** ${target.username}`,
            `**User ID:** ${target.id}`,
            `**Account Age:** ${Math.floor((Date.now() - (userData.joinedAt || Date.now())) / (1000 * 60 * 60 * 24))} days`,
          ].join('\n'),
          inline: true,
        },
        {
          name: '(っ˘ω˘ς) Data to be Lost',
          value: [
            `**Balance:** ${EconomyService.format(backupData.balance)} ${config.economy.currency}`,
            `**Level:** ${backupData.level} (${backupData.experience} XP)`,
            `**Animals Found:** ${backupData.totalAnimalsFound}`,
            `**Unique Animals:** ${backupData.animalCount}`,
            `**Commands Used:** ${backupData.commandsUsed}`,
          ].join('\n'),
          inline: true,
        },
        {
          name: "(｡•́︿•̀｡) MOMMY'S WARNING",
          value: [
            '• All progress will be deleted',
            '• All animals will be lost',
            '• All statistics will be reset',
            '• Balance will reset to 1000',
            '• Level will reset to 1',
            "• Mommy can't get it back!",
          ].join('\n'),
          inline: false,
        },
        {
          name: '(◕‿◕✿) How to Confirm',
          value: 'React with (◕‿◕✿) to confirm reset\nReact with (っ˘ω˘ς) to cancel',
          inline: false,
        }
      );

    message.reply({ embeds: [confirmEmbed] }).then(async (sentMessage) => {
      // Add reaction options
      await sentMessage.react('✅');
      await sentMessage.react('❌');

      // Create reaction collector
      const filter = (reaction, user) => {
        return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
      };

      const collector = sentMessage.createReactionCollector({ filter, time: 30000, max: 1 });

      collector.on('collect', async (reaction, user) => {
        if (reaction.emoji.name === '✅') {
          // Reset confirmed - using Service
          AdminService.resetUser(userData);
          await database.saveUser(userData);

          const resetEmbed = new EmbedBuilder()
            .setColor(colors.success)
            .setTitle('ヽ(>∀<☆)ノ Reset Complete!')
            .setDescription(
              `**${target.username}**'s account has been completely reset by Mommy. (｡♥‿♥｡)`
            )
            .addFields(
              {
                name: '(◕‿◕✿) Reset Summary',
                value: [
                  `**User:** ${target.username} (${target.id})`,
                  `**Reset by:** ${message.author.username}`,
                  `**Reset time:** <t:${Math.floor(Date.now() / 1000)}:F>`,
                  `**Previous balance:** ${EconomyService.format(backupData.balance)} ${config.economy.currency}`,
                  `**Previous level:** ${backupData.level}`,
                ].join('\n'),
                inline: false,
              },
              {
                name: '(っ˘ω˘ς) New Account State',
                value: [
                  `**Balance:** 1,000 ${config.economy.currency}`,
                  `**Level:** 1 (0 XP)`,
                  `**Animals:** None`,
                  `**Statistics:** All reset to 0`,
                ].join('\n'),
                inline: false,
              }
            )
            .setThumbnail(target.displayAvatarURL());

          await sentMessage.edit({ embeds: [resetEmbed] });
          await sentMessage.reactions.removeAll();

          // Log the admin action
          console.log(`[ADMIN] ${message.author.tag} RESET ${target.tag}'s account completely`);

          // Try to DM the user
          try {
            const dmEmbed = new EmbedBuilder()
              .setColor(colors.warning)
              .setTitle('(っ˘ω˘ς) Fresh Start, Little One')
              .setDescription(
                'Your account has been reset by an administrator. Mommy is here for your new journey! (｡♥‿♥｡)'
              )
              .addFields({
                name: 'What happened?',
                value:
                  'All your progress, animals, and statistics have been reset to default values.',
                inline: false,
              });

            target.send({ embeds: [dmEmbed] }).catch(() => { });
          } catch (error) { }
        } else {
          // Reset cancelled
          const cancelEmbed = new EmbedBuilder()
            .setColor(colors.secondary)
            .setTitle('(っ˘ω˘ς) Reset Cancelled')
            .setDescription(
              `Mommy cancelled the reset for **${target.username}**. Everything is safe! (◕‿◕✿)`
            );

          await sentMessage.edit({ embeds: [cancelEmbed] });
          await sentMessage.reactions.removeAll();
        }
      });

      collector.on('end', async (collected) => {
        if (collected.size === 0) {
          const timeoutEmbed = new EmbedBuilder()
            .setColor(colors.warning)
            .setTitle('(｡•́︿•̀｡) Mommy Timed Out')
            .setDescription(
              `Reset confirmation timed out for **${target.username}**. Mommy didn't do anything. (っ˘ω˘ς)`
            );

          await sentMessage.edit({ embeds: [timeoutEmbed] });
          await sentMessage.reactions.removeAll();
        }
      });
    });
  },
};
