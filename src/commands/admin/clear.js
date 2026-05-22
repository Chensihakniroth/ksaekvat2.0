const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const colors = require('../../utils/colors.js');

module.exports = {
  name: 'clear',
  aliases: ['purge', 'delete'],
  description: 'Clear messages from the channel (Admin only)',
  usage: 'clear <amount> [@user]',
  adminOnly: true,
  execute(message, args, client) {
    // Check if bot has manage messages permissions
    if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply({
        embeds: [
          {
            color: colors.error,
            title: '🚫 PERMISSION ERROR',
            description:
              "System lacks 'Manage Messages' permission. (ಥ﹏ಥ) I can't sweep the cache if I don't have access! (・_・ヾ",
          },
        ],
      });
    }

    // Check arguments
    if (args.length < 1) {
      return message.reply({
        embeds: [
          {
            color: colors.error,
            title: '⚠️ ARGUMENT ERROR',
            description:
              'How many messages should I purge? (・_・ヾ\n**Usage:** `Kclear <amount> [@user]`\n**Examples:**\n`Kclear 10` - Clear 10 messages\n`Kclear 5 @user` - Clear 5 messages from specific user',
          },
        ],
      });
    }

    // Parse amount
    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount <= 0 || amount > 100) {
      return message.reply({
        embeds: [
          {
            color: colors.error,
            title: '❌ RANGE ERROR',
            description:
              'Please provide a number between 1 and 100. (・_・ヾ System limit exceeded!',
          },
        ],
      });
    }

    // Get target user if specified
    let targetUser = null;
    if (message.mentions.users.size > 0) {
      targetUser = message.mentions.users.first();
    } else if (args.length > 1) {
      const userId = args[1];
      targetUser = client.users.cache.get(userId);
    }

    // Delete the command message first
    message.delete().catch(() => {
      // Ignore if already deleted
    });

    // Fetch messages
    message.channel.messages
      .fetch({ limit: Math.min(amount + 10, 100) })
      .then((messages) => {
        let messagesToDelete = messages;

        // Filter by user if specified
        if (targetUser) {
          messagesToDelete = messages.filter((msg) => msg.author.id === targetUser.id);

          if (messagesToDelete.size === 0) {
            return message.channel
              .send({
                embeds: [
                  {
                    color: colors.warning,
                    title: '🔍 NO DATA FOUND',
                    description: `No messages from **${targetUser.username}** found in the recent simulation logs. (・_・ヾ`,
                  },
                ],
              })
              .then((msg) => {
                setTimeout(() => msg.delete().catch(() => {}), 5000);
              });
          }
        }

        // Limit to requested amount
        messagesToDelete = messagesToDelete.first(amount);

        // Filter out messages older than 14 days (Discord limitation)
        const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
        const recentMessages = messagesToDelete.filter((msg) => msg.createdTimestamp > twoWeeksAgo);
        const oldMessages = messagesToDelete.filter((msg) => msg.createdTimestamp <= twoWeeksAgo);

        if (recentMessages.size === 0) {
          return message.channel
            .send({
              embeds: [
                {
                  color: colors.warning,
                  title: '🛑 CACHE ERROR',
                  description:
                    "All targeted messages are older than 14 days. Discord's API won't let me bulk-purge old data! (ಥ﹏ಥ)",
                },
              ],
            })
            .then((msg) => {
              setTimeout(() => msg.delete().catch(() => {}), 5000);
            });
        }

        message.channel
          .bulkDelete(recentMessages, true)
          .then((deletedMessages) => {
            const deletedCount = deletedMessages.size;
            let description = `Cache cleared! Successfully purged **${deletedCount}** messages. (¬‿¬)`;

            if (targetUser) {
              description = `Purge successful! Removed **${deletedCount}** messages from **${targetUser.username}**. (✧ω✧)`;
            }

            if (oldMessages.size > 0) {
              description += `\n\n(・_0) **${oldMessages.size}** messages were too old to bulk-delete (older than 14 days).`;
            }

            const successEmbed = new EmbedBuilder()
              .setColor(colors.success)
              .setTitle('🧹 CACHE PURGED')
              .setDescription(description)
              .addFields(
                {
                  name: '📊 SUMMARY',
                  value: [
                    `**Requested:** ${amount} messages`,
                    `**Deleted:** ${deletedCount} messages`,
                    targetUser
                      ? `**Target User:** ${targetUser.username}`
                      : '**Target:** Global Purge',
                    `**Sector:** ${message.channel.name}`,
                    `**Operator:** ${message.author.username}`,
                  ].join('\n'),
                  inline: true,
                },
                {
                  name: '🛡️ AUTHENTICATION',
                  value: [
                    `**Admin:** ${message.author.username}`,
                    `**Protocol:** Cache Sweep`,
                  ].join('\n'),
                  inline: true,
                }
              );

            // Send confirmation message and delete it after 10 seconds
            message.channel.send({ embeds: [successEmbed] }).then((confirmMsg) => {
              setTimeout(() => {
                confirmMsg.delete().catch(() => {});
              }, 10000);
            });

            // Log the clear action
            console.log(
              `[CLEAR] ${message.author.tag} cleared ${deletedCount} messages in #${message.channel.name} ${targetUser ? `from ${targetUser.tag}` : ''}`
            );

            // Delete old messages individually if any (slower but necessary)
            if (oldMessages.size > 0) {
              oldMessages.forEach((msg) => {
                setTimeout(() => {
                  msg.delete().catch(() => {});
                }, Math.random() * 1000);
              });
            }
          })
          .catch((error) => {
            console.error('Error bulk deleting messages:', error);

            message.channel
              .send({
                embeds: [
                  {
                    color: colors.error,
                    title: '❌ SYSTEM FAILURE',
                    description: `Failed to clear messages: ${error.message} (ಥ﹏ಥ)`,
                  },
                ],
              })
              .then((msg) => {
                setTimeout(() => msg.delete().catch(() => {}), 10000);
              });
          });
      })
      .catch((error) => {
        console.error('Error fetching messages:', error);

        message.channel
          .send({
            embeds: [
              {
                color: colors.error,
                title: '🛑 LOG FETCH ERROR',
                description: `Failed to fetch messages: ${error.message} (・_0)`,
              },
            ],
          })
          .then((msg) => {
            setTimeout(() => msg.delete().catch(() => {}), 10000);
          });
      });
  },
};
