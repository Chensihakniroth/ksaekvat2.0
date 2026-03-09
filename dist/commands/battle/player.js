"use strict";
const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const { getEquippedItems, calculateEquippedBonuses } = require('./item.js');
const CombatService = require('../../services/CombatService.js');
const EconomyService = require('../../services/EconomyService');
module.exports = {
    name: 'player',
    aliases: ['stats', 'pstats', 'playerstats'],
    description: 'View detailed player combat statistics',
    usage: 'player [@user]',
    cooldown: 5000,
    async execute(message, args, client) {
        let target = message.author;
        if (message.mentions.users.size > 0) {
            target = message.mentions.users.first();
        }
        else if (args[0]) {
            const userId = args[0];
            target = client.users.cache.get(userId);
        }
        if (!target) {
            return message.reply({
                embeds: [
                    {
                        color: colors.error,
                        title: '❌ User Not Found',
                        description: 'Please mention a valid user or provide their ID.',
                    },
                ],
            });
        }
        const userData = await database.getUser(target.id, target.username);
        const equipped = await getEquippedItems(target.id);
        const bonuses = await calculateEquippedBonuses(target.id);
        // --- CALCULATE STATS (Using Service) ---
        const { baseStats, totalStats } = CombatService.calculatePlayerStats(userData, bonuses);
        const embed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle(`⚔️ ${target.username}'s Combat Stats`)
            .setThumbnail(target.displayAvatarURL())
            .addFields({
            name: '📊 Base Stats',
            value: [
                `**Level:** ${userData.level}`,
                `**Experience:** ${EconomyService.format(userData.experience)}`,
                `**Attack:** ${baseStats.attack}`,
                `**Defense:** ${baseStats.defense}`,
                `**Health:** ${baseStats.health}`,
                `**Luck:** ${baseStats.luck}`,
            ].join('\n'),
            inline: true,
        }, {
            name: '⚔️ Total Stats (With Equipment)',
            value: [
                `**Attack:** ${totalStats.attack} ${bonuses.attack > 0 ? `(+${bonuses.attack})` : ''}`,
                `**Defense:** ${totalStats.defense} ${bonuses.defense > 0 ? `(+${bonuses.defense})` : ''}`,
                `**Health:** ${totalStats.health} ${bonuses.hp > 0 ? `(+${bonuses.hp})` : ''}`,
                `**Luck:** ${totalStats.luck} ${bonuses.luck > 0 ? `(+${bonuses.luck})` : ''}`,
                totalStats.speed > 0 ? `**Speed:** +${totalStats.speed}` : '',
                totalStats.critRate > 0 ? `**Crit Rate:** +${totalStats.critRate}%` : '',
                totalStats.evasion > 0 ? `**Evasion:** +${totalStats.evasion}%` : '',
            ]
                .filter(Boolean)
                .join('\n'),
            inline: true,
        });
        // Show equipped items
        const equippedText = Object.keys(equipped).length > 0
            ? Object.entries(equipped)
                .map(([slot, item]) => {
                const bonusText = Object.entries(item.bonus)
                    .map(([stat, val]) => `+${val} ${stat}`)
                    .join(', ');
                return `**${slot.charAt(0).toUpperCase() + slot.slice(1)}:** ${item.name}\n   🔹 ${bonusText}`;
            })
                .join('\n')
            : 'No items equipped';
        embed.addFields({ name: '🛡️ Equipped Items', value: equippedText, inline: false });
        // Battle statistics
        const stats = userData.stats || {};
        embed.addFields({
            name: '🏆 Battle Record',
            value: [
                `**Total Gambled:** ${EconomyService.format(stats.totalGambled || 0)}`,
                `**Total Won:** ${EconomyService.format(stats.totalWon || 0)}`,
                `**Total Lost:** ${EconomyService.format(stats.totalLost || 0)}`,
                `**Win Rate:** ${stats.totalGambled > 0 ? Math.round((stats.totalWon / (stats.totalWon + stats.totalLost)) * 100) : 0}%`,
            ].join('\n'),
            inline: false,
        });
        await message.reply({ embeds: [embed] });
        await database.updateStats(message.author.id, 'command');
    },
};
