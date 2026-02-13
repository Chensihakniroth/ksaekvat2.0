const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
    name: 'leaderboard',
    aliases: ['ld', 'lb', 'top'],
    description: 'View the richest users in this server',
    usage: 'leaderboard',
    async execute(message, args, client) {
        // Fetch all members to ensure they are in cache
        await message.guild.members.fetch();
        const guildMemberIds = message.guild.members.cache.map(m => m.id);
        
        const allUsers = database.getAllUsers();
        
        // Filter users who are in this guild and sort by balance
        const serverUsers = allUsers
            .filter(user => guildMemberIds.includes(user.id))
            .sort((a, b) => b.balance - a.balance)
            .slice(0, 10);
        
        const leaderboardLines = serverUsers.map((user, index) => {
            const member = message.guild.members.cache.get(user.id);
            const name = member ? member.displayName : `User ${user.id}`;
            // Profile "tiny profile" representation using emoji or just mention/text
            return `**${index + 1}.** 👤 ${name} - ${user.balance.toLocaleString()} ${config.economy.currencySymbol}`;
        });

        const embed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle(`🏆 Richest in ${message.guild.name}`)
            .setDescription(leaderboardLines.join('\n') || 'No users found on this server.')
            

        message.reply({ embeds: [embed] });
    }
};



