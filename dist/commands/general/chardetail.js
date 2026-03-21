"use strict";
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, } = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const { getItemEmoji, getRarityEmoji, getElementEmoji, getRoleEmoji, getCharacterImage, } = require('../../utils/images.js');
module.exports = {
    name: 'chardetail',
    aliases: ['kcd', 'cd', 'charinfo'],
    description: 'View detailed info for a character — art, role, element, and more! ✨',
    usage: 'kcd <character name>',
    cooldown: 3000,
    async execute(message, args, client) {
        const charName = args.join(' ').trim();
        if (!charName) {
            return message.reply(`❓ Tell Mommy which character you want to inspect! (｡♥‿♥｡)\n**Usage:** \`kcd <name>\`\n*Example: \`kcd Raiden Shogun\`*`);
        }
        // Fetch user inventory
        const inventory = await database.getHydratedInventory(message.author.id);
        const userData = await database.getUser(message.author.id, message.author.username);
        // Search in inventory (partial match)
        const match = inventory.find((i) => (i.type === 'character' || !i.type) &&
            i.name.toLowerCase().includes(charName.toLowerCase()));
        if (!match) {
            return message.reply(`❌ Sweetie, you don't have **${charName}** in your collection yet! Use \`kwish\` to get them~ (っ˘ω˘ς)`);
        }
        // Count duplicates for constellation/eidolon level
        const allCopies = inventory.filter((i) => (i.type === 'character' || !i.type) && i.name === match.name);
        const count = allCopies.length;
        const constellationLevel = Math.min(count - 1, 6); // C0–C6
        // Team status
        if (!userData.team)
            userData.team = [];
        const isInTeam = userData.team.includes(match.name);
        const teamFull = userData.team.length >= 4 && !isInTeam;
        // Build emojis
        const rarityEmoji = getRarityEmoji(match.rarity, client, match);
        const elementEmoji = getElementEmoji(match, client);
        const roleEmoji = getRoleEmoji(match.role, client);
        const charEmoji = getItemEmoji(match, client);
        // Image URL — use stored image_url (same source as gacha result), fallback to fandom wiki
        const artUrl = match.image_url || getCharacterImage(match);
        const gameNames = {
            genshin: 'Genshin Impact',
            hsr: 'Honkai: Star Rail',
            wuwa: 'Wuthering Waves',
            zzz: 'Zenless Zone Zero',
        };
        const gameName = gameNames[match.game?.toLowerCase()] || match.game || 'Unknown';
        const createEmbed = () => {
            const conLabel = match.game?.toLowerCase() === 'hsr' ? 'Eidolon' : 'Constellation';
            const embed = new EmbedBuilder()
                .setColor(match.rarity >= 5 ? 0xFFB13F : match.rarity >= 4 ? 0xA256FF : colors.primary)
                .setTitle(`${charEmoji} ${match.name}`)
                .setDescription([
                `${rarityEmoji} ${elementEmoji} ${roleEmoji}`,
                `**Game:** ${gameName}`,
                `**Role:** ${match.role || 'Unknown'}`,
                `**Element:** ${match.element || 'Unknown'}`,
            ].join('\n'))
                .addFields({
                name: '📦 Your Copies',
                value: `**${count}x** owned\n${conLabel}: **C${constellationLevel}**`,
                inline: true,
            }, {
                name: '🛡️ Team Status',
                value: isInTeam
                    ? '✅ In your team!'
                    : teamFull
                        ? '🚫 Team is full (4/4)'
                        : '➕ Not in team yet',
                inline: true,
            })
                .setImage(artUrl)
                .setFooter({ text: `Use the buttons below to manage your team~ (｡♥‿♥｡)` });
            return embed;
        };
        const createButtons = () => {
            const row = new ActionRowBuilder();
            if (isInTeam) {
                row.addComponents(new ButtonBuilder()
                    .setCustomId('cd_remove_team')
                    .setLabel('Remove from Team')
                    .setEmoji('🗑️')
                    .setStyle(ButtonStyle.Danger));
            }
            else {
                row.addComponents(new ButtonBuilder()
                    .setCustomId('cd_add_team')
                    .setLabel('Add to Team')
                    .setEmoji('⚔️')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(teamFull));
            }
            return [row];
        };
        const msg = await message.reply({
            embeds: [createEmbed()],
            components: createButtons(),
        });
        const collector = msg.createMessageComponentCollector({
            filter: (i) => i.user.id === message.author.id,
            time: 60000,
        });
        collector.on('collect', async (i) => {
            await i.deferUpdate();
            // Re-fetch latest user data
            const freshUser = await database.getUser(message.author.id, message.author.username);
            if (!freshUser.team)
                freshUser.team = [];
            if (i.customId === 'cd_add_team') {
                if (freshUser.team.length >= 4) {
                    return i.followUp({
                        content: '🚫 Your team is already full! Remove someone with `kteam remove <slot>`. (っ˘ω˘ς)',
                        flags: [MessageFlags.Ephemeral],
                    });
                }
                if (freshUser.team.includes(match.name)) {
                    return i.followUp({
                        content: '🚫 They are already in your team! (◕‿◕✿)',
                        flags: [MessageFlags.Ephemeral],
                    });
                }
                freshUser.team.push(match.name);
                await database.saveUser(freshUser);
                // Update the embed to reflect team status
                userData.team = freshUser.team;
                const nowInTeam = true;
                const refreshedEmbed = new EmbedBuilder()
                    .setColor(match.rarity >= 5 ? 0xFFB13F : match.rarity >= 4 ? 0xA256FF : colors.primary)
                    .setTitle(`${charEmoji} ${match.name}`)
                    .setDescription([
                    `${rarityEmoji} ${elementEmoji} ${roleEmoji}`,
                    `**Game:** ${gameName}`,
                    `**Role:** ${match.role || 'Unknown'}`,
                    `**Element:** ${match.element || 'Unknown'}`,
                ].join('\n'))
                    .addFields({
                    name: '📦 Your Copies',
                    value: `**${count}x** owned\n${match.game?.toLowerCase() === 'hsr' ? 'Eidolon' : 'Constellation'}: **C${constellationLevel}**`,
                    inline: true,
                }, {
                    name: '🛡️ Team Status',
                    value: '✅ In your team!',
                    inline: true,
                })
                    .setThumbnail(artUrl)
                    .setFooter({ text: `Added to team! (ﾉ´ヮ\`)ﾉ*:･ﾟ✧` });
                const removeRow = new ActionRowBuilder().addComponents(new ButtonBuilder()
                    .setCustomId('cd_remove_team')
                    .setLabel('Remove from Team')
                    .setEmoji('🗑️')
                    .setStyle(ButtonStyle.Danger));
                await msg.edit({ embeds: [refreshedEmbed], components: [removeRow] });
            }
            else if (i.customId === 'cd_remove_team') {
                const idx = freshUser.team.indexOf(match.name);
                if (idx === -1) {
                    return i.followUp({
                        content: '🚫 They are not in your team! (｡•́︿•̀｡)',
                        flags: [MessageFlags.Ephemeral],
                    });
                }
                freshUser.team.splice(idx, 1);
                await database.saveUser(freshUser);
                const refreshedEmbed = new EmbedBuilder()
                    .setColor(match.rarity >= 5 ? 0xFFB13F : match.rarity >= 4 ? 0xA256FF : colors.primary)
                    .setTitle(`${charEmoji} ${match.name}`)
                    .setDescription([
                    `${rarityEmoji} ${elementEmoji} ${roleEmoji}`,
                    `**Game:** ${gameName}`,
                    `**Role:** ${match.role || 'Unknown'}`,
                    `**Element:** ${match.element || 'Unknown'}`,
                ].join('\n'))
                    .addFields({
                    name: '📦 Your Copies',
                    value: `**${count}x** owned\n${match.game?.toLowerCase() === 'hsr' ? 'Eidolon' : 'Constellation'}: **C${constellationLevel}**`,
                    inline: true,
                }, {
                    name: '🛡️ Team Status',
                    value: freshUser.team.length >= 4 ? '🚫 Team is full (4/4)' : '➕ Not in team yet',
                    inline: true,
                })
                    .setThumbnail(artUrl)
                    .setFooter({ text: `Removed from team. (っ˘ω˘ς)` });
                const addRow = new ActionRowBuilder().addComponents(new ButtonBuilder()
                    .setCustomId('cd_add_team')
                    .setLabel('Add to Team')
                    .setEmoji('⚔️')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(freshUser.team.length >= 4));
                await msg.edit({ embeds: [refreshedEmbed], components: [addRow] });
            }
        });
        collector.on('end', () => {
            msg.edit({ components: [] }).catch(() => { });
        });
        await database.updateStats(message.author.id, 'command');
    },
};
