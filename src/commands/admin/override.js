const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const colors = require('../../utils/colors.js');

module.exports = {
  name: 'override',
  aliases: ['purge', 'kpurge', 'system-purge'],
  description: 'System override protocol. (¬‿¬)',
  usage: 'override <kick/ban> <@user/ID> [reason]',
  category: 'admin',
  adminOnly: true,
  hidden: true, // Hidden from khelp
  async execute(message, args, client) {
    // Initial check: Mode
    const mode = args[0]?.toLowerCase();
    if (!['kick', 'ban'].includes(mode)) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.error)
            .setTitle('❌ SYSTEM ERROR: Invalid Protocol')
            .setDescription('Usage: `koverride <kick/ban> <@user> [reason]` (・_・ヾ'),
        ],
      });
    }

    // Permission check for bot
    const requiredPerm = mode === 'kick' ? PermissionsBitField.Flags.KickMembers : PermissionsBitField.Flags.BanMembers;
    if (!message.guild.members.me.permissions.has(requiredPerm)) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.error)
            .setTitle('🚫 ACCESS DENIED')
            .setDescription(`System lacks ${mode.toUpperCase()} permissions in this sector. (ಥ﹏ಥ)`),
        ],
      });
    }

    // Get target
    const targetArg = args[1];
    if (!targetArg) {
      return message.reply('Specify a target for the purge protocol. (・__・ヾ');
    }

    const targetUser = message.mentions.users.first() || await client.users.fetch(targetArg.replace(/[<@!>]/g, '')).catch(() => null);

    if (!targetUser) {
      return message.reply('User not found in the simulation database. (・_・ヾ');
    }

    const reason = args.slice(2).join(' ') || 'Simulation breach / Rule violation';
    const member = message.guild.members.cache.get(targetUser.id);

    // Safety checks
    if (targetUser.id === message.author.id) return message.reply("You can't purge yourself from the simulation! (≧◡≦)");
    if (targetUser.id === client.user.id) return message.reply("Whoa! Trying to delete my source code? Not happening. (¬‿¬)");

    if (member) {
      const hierarchyCheck = mode === 'kick' ? member.kickable : member.bannable;
      if (!hierarchyCheck) {
        return message.reply('Target has higher clearance. Purge protocol failed. (ಥ﹏ಥ)');
      }
      
      if (member.roles.highest.position >= message.guild.members.me.roles.highest.position) {
        return message.reply('Target role level exceeds my current admin permissions. (・_・ヾ');
      }
    }

    // Attempt Purge
    try {
      const logEmbed = new EmbedBuilder()
        .setColor(colors.warning)
        .setTitle('⚠️ SYSTEM NOTICE')
        .setDescription(`You are being purged from **${message.guild.name}**.\n**Action:** ${mode.toUpperCase()}\n**Reason:** ${reason}`)
        .setFooter({ text: 'Simulation Exit Code: 0x69' });

      await targetUser.send({ embeds: [logEmbed] }).catch(() => {});

      if (mode === 'kick') {
        await message.guild.members.kick(targetUser.id, `${reason} | Purged by ${message.author.tag}`);
      } else {
        await message.guild.members.ban(targetUser.id, { reason: `${reason} | Purged by ${message.author.tag}` });
      }

      const success = new EmbedBuilder()
        .setColor(colors.success)
        .setTitle(`🛡️ PROTOCOL: ${mode.toUpperCase()} SUCCESS`)
        .setDescription(`**${targetUser.tag}** has been removed from the server. (¬‿¬)`)
        .addFields(
          { name: 'Target ID', value: `\`${targetUser.id}\``, inline: true },
          { name: 'Reason', value: reason, inline: true },
          { name: 'Operator', value: message.author.tag, inline: true }
        )
        .setThumbnail(targetUser.displayAvatarURL())
        .setTimestamp();

      message.reply({ embeds: [success] });

    } catch (err) {
      console.error(err);
      message.reply(`System crash during purge: ${err.message} (ಥ﹏ಥ)`);
    }
  },
};
