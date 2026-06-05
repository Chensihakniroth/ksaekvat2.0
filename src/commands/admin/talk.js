const { EmbedBuilder } = require('discord.js');
const config = require('../../config/config.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');

module.exports = {
  name: 'talk',
  aliases: ['talkto', 'forward'],
  description: 'Set a channel to forward your DMs through the bot. Use without a channel ID to stop.',
  usage: 'talk <channelId> | talk stop',
  category: 'admin',
  adminOnly: true,
  hidden: true, // Hidden from khelp
  async execute(message, args, client) {
    const subcommand = args[0]?.toLowerCase();

    // ── STOP / CLEAR ──────────────────────────────────────────────────
    if (!subcommand || subcommand === 'stop' || subcommand === 'off' || subcommand === 'clear') {
      await database.saveTalkTarget(message.author.id, '');

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.success)
            .setTitle('📡 Talk Link Disconnected')
            .setDescription(
              'DM forwarding has been **disabled**. Your messages will no longer be relayed. (◕‿◕✿)'
            )
            .setTimestamp(),
        ],
      });
    }

    // ── SET CHANNEL ───────────────────────────────────────────────────
    const channelId = subcommand.replace(/[<#>]/g, ''); // strip Discord channel mention formatting

    // Validate that it looks like a snowflake
    if (!/^\d{17,20}$/.test(channelId)) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.error)
            .setTitle('❌ Invalid Channel ID')
            .setDescription(
              'That doesn\'t look like a valid channel ID, darling. (・_・ヾ\n\n' +
              '**Usage:**\n' +
              '`ktalk <channelId>` — Start forwarding your DMs to that channel\n' +
              '`ktalk stop` — Stop forwarding'
            )
            .setTimestamp(),
        ],
      });
    }

    // Try to fetch the channel to verify it exists and the bot has access
    let targetChannel;
    try {
      targetChannel =
        client.channels.cache.get(channelId) ||
        (await client.channels.fetch(channelId));
    } catch (err) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.error)
            .setTitle('❌ Channel Not Found')
            .setDescription(
              `I can't access channel \`${channelId}\`. Make sure I'm in that server and have permission to send messages there! (ಥ﹏ಥ)`
            )
            .setTimestamp(),
        ],
      });
    }

    // Save the talk target
    const serverId = targetChannel.guild ? targetChannel.guild.id : 'DM';
    await database.saveTalkTarget(message.author.id, channelId, serverId);

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(colors.success)
          .setTitle('📡 Talk Link Established')
          .setDescription(
            `Your DMs are now being forwarded to **#${targetChannel.name || channelId}**${targetChannel.guild ? ` in **${targetChannel.guild.name}**` : ''}. (¬‿¬)\n\n` +
            'Just type in my DMs and I\'ll relay everything to that channel.\n' +
            'Use `ktalk stop` to disconnect.'
          )
          .addFields(
            { name: 'Channel', value: `<#${channelId}>`, inline: true },
            { name: 'Server', value: targetChannel.guild?.name || 'DM', inline: true }
          )
          .setTimestamp(),
      ],
    });
  },
};
