"use strict";
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
module.exports = {
    name: 'leaderboard',
    aliases: ['ld', 'lb', 'top'],
    description: 'View the richest or top donators in this server',
    usage: 'leaderboard',
    async execute(message, args, client) {
        // 1. Data Prep
        let isGlobal = false;
        let currentTab = 'wealth'; // 'wealth' or 'donators'
        const fetchServerUsers = async () => {
            try {
                await message.guild.members.fetch({ time: 5000 }); // Short timeout
            }
            catch (e) {
                console.error('Member fetch timed out, using cache.');
            }
            const guildMemberIds = Array.from(message.guild.members.cache.keys());
            const allUsers = await database.getAllUsers() || [];
            return allUsers.filter(u => guildMemberIds.includes(u.id));
        };
        const fetchGlobalUsers = async () => {
            return await database.getAllUsers() || [];
        };
        let serverUsers = await fetchServerUsers();
        let globalUsers = await fetchGlobalUsers();
        // 2. Generation Functions
        const getEmbed = (tab, global) => {
            const data = global ? globalUsers : serverUsers;
            const titlePrefix = global ? '🌐 Global' : `🏆 ${message.guild.name}`;
            if (tab === 'wealth') {
                const top = [...data]
                    .sort((a, b) => (b.balance || 0) - (a.balance || 0))
                    .slice(0, 10);
                const lines = top.map((u, i) => {
                    const name = u.username || `User ${u.id}`;
                    return `**${i + 1}.** 👤 ${name} — **${(u.balance || 0).toLocaleString()}** ${config.economy.currencySymbol}`;
                });
                return new EmbedBuilder()
                    .setColor(colors.primary)
                    .setTitle(`${titlePrefix} Wealth Leaderboard`)
                    .setDescription(lines.join('\n') || 'No data found.')
                    .setTimestamp();
            }
            else {
                const top = [...data]
                    .sort((a, b) => (b.stats?.totalDonated || 0) - (a.stats?.totalDonated || 0))
                    .filter(u => (u.stats?.totalDonated || 0) > 0)
                    .slice(0, 10);
                const lines = top.map((u, i) => {
                    const name = u.username || `User ${u.id}`;
                    const donated = u.stats?.totalDonated || 0;
                    return `**${i + 1}.** 👤 ${name} — Donated **${donated.toLocaleString()}** ${config.economy.currencySymbol}`;
                });
                return new EmbedBuilder()
                    .setColor(colors.warning)
                    .setTitle(`${titlePrefix} Top Donators`)
                    .setDescription(lines.join('\n') || 'No donations recorded yet! (｡•́︿•̀｡)')
                    .setTimestamp();
            }
        };
        // 3. Components
        const getButtons = (tab, global) => {
            return new ActionRowBuilder().addComponents(new ButtonBuilder()
                .setCustomId('ld_wealth')
                .setLabel('💰 Wealth')
                .setStyle(tab === 'wealth' ? ButtonStyle.Success : ButtonStyle.Primary), new ButtonBuilder()
                .setCustomId('ld_donators')
                .setLabel('💎 Donators')
                .setStyle(tab === 'donators' ? ButtonStyle.Success : ButtonStyle.Primary), new ButtonBuilder()
                .setCustomId('ld_toggle_scope')
                .setLabel(global ? '🌐 Global View' : '🏠 Server View')
                .setStyle(ButtonStyle.Secondary));
        };
        // 4. Initial Send
        const response = await message.reply({
            embeds: [getEmbed(currentTab, isGlobal)],
            components: [getButtons(currentTab, isGlobal)]
        });
        // 5. Collector
        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000
        });
        collector.on('collect', async (i) => {
            if (i.user.id !== message.author.id) {
                return i.reply({ content: "Only the command user can switch tabs! (っ˘ω˘ς)", ephemeral: true });
            }
            if (i.customId === 'ld_wealth')
                currentTab = 'wealth';
            else if (i.customId === 'ld_donators')
                currentTab = 'donators';
            else if (i.customId === 'ld_toggle_scope')
                isGlobal = !isGlobal;
            await i.update({
                embeds: [getEmbed(currentTab, isGlobal)],
                components: [getButtons(currentTab, isGlobal)]
            });
        });
        collector.on('end', () => {
            const row = getButtons(currentTab, isGlobal);
            const disabledRow = new ActionRowBuilder().addComponents(row.components.map(b => ButtonBuilder.from(b).setDisabled(true)));
            response.edit({ components: [disabledRow] }).catch(() => { });
        });
    },
};
