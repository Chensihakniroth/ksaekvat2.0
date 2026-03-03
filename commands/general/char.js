const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');

/**
 * Helper to get the best possible image URL for a character.
 * Uses official/fan-maintained asset APIs for high-quality splashes.
 */
function getCharacterImage(char) {
    const name = char.name.replace(/\s+/g, '_');
    const game = char.game?.toLowerCase();
    
    if (game === 'genshin') {
        // High quality gacha splash from ambr.top
        return `https://api.ambr.top/assets/UI/UI_Gacha_AvatarIcon_${name}.png`;
    } else if (game === 'hsr') {
        // Enka.network or StarRailRes patterns
        return `https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/image/character_preview/1001.png`; // Placeholder: needs ID mapping for perfection
    } else if (game === 'wuwa') {
        return `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`; // Fallback
    }
    return `https://api.dicebear.com/7.x/thumbs/svg?seed=${name}`; // Cute fallback
}

module.exports = {
    name: 'char',
    aliases: ['characters', 'kchar', 'collection'],
    description: 'View, sort, and manage your character collection!',
    usage: 'char [name]',
    async execute(message, args, client) {
        const userData = database.getUser(message.author.id);
        const inventory = userData.gacha_inventory || [];
        const characters = inventory.filter(i => i.type === 'character' || !i.type);

        if (characters.length === 0) {
            return message.reply("💸 hg ot mean character teat! Use `Kgacha` pull mork. (｡•́︿•̀｡)");
        }

        // --- RENDER LIST FUNCTION ---
        const renderList = (sortBy = 'rarity', filterGame = 'all') => {
            let filtered = [...characters];
            if (filterGame !== 'all') {
                filtered = filtered.filter(c => c.game.toLowerCase() === filterGame);
            }

            // Group by name for the list view
            const grouped = filtered.reduce((acc, char) => {
                if (!acc[char.name]) {
                    acc[char.name] = { ...char, count: 0, highestAsc: char.ascension || 0 };
                }
                acc[char.name].count++;
                if ((char.ascension || 0) > acc[char.name].highestAsc) {
                    acc[char.name].highestAsc = char.ascension;
                }
                return acc;
            }, {});

            const sorted = Object.values(grouped).sort((a, b) => {
                if (sortBy === 'rarity') return b.rarity - a.rarity;
                if (sortBy === 'name') return a.name.localeCompare(b.name);
                if (sortBy === 'ascension') return b.highestAsc - a.highestAsc;
                return 0;
            });

            const list = sorted.map(c => {
                const star = c.rarity === 5 ? '🔶' : (c.rarity === 4 ? '🔷' : '⚪');
                return `${star} **${c.name}** \`[Asc ${c.highestAsc}]\` x${c.count}`;
            });

            const display = list.slice(0, 15).join('\n') || "*No matches found.*";

            return new EmbedBuilder()
                .setColor(colors.primary)
                .setTitle(`👤 ${message.author.username}'s Manifest`)
                .setDescription(`**Total Unique:** ${sorted.length}\n**Sort:** ${sortBy} | **Filter:** ${filterGame}\n\n${display}`)
                .setFooter({ text: "Use the menu to view details or buttons to sort! (◕‿◕✿)" });
        };

        // --- RENDER DETAIL FUNCTION ---
        const renderDetail = (charName, showSplash = false) => {
            const charInstances = characters.filter(c => c.name === charName);
            if (charInstances.length === 0) return null;

            // Pick the one with highest ascension as the "main" one
            const char = charInstances.sort((a, b) => (b.ascension || 0) - (a.ascension || 0))[0];
            const star = char.rarity === 5 ? '🔶' : (char.rarity === 4 ? '🔷' : '⚪');
            const duplicateCount = charInstances.length - 1;
            const asc = char.ascension || 0;

            const embed = new EmbedBuilder()
                .setColor(char.rarity === 5 ? '#FFB13F' : '#A256FF')
                .setTitle(`${star} ${char.name} (Ascension ${asc})`)
                .addFields(
                    { name: '📊 Stats', value: `❤️ HP: \`${(char.rarity*50)+(asc*100)+200}\`\n⚔️ ATK: \`${(char.rarity*15)+(asc*30)+50}\`\n🛡️ DEF: \`${(char.rarity*10)+(asc*20)+30}\``, inline: true },
                    { name: '✨ Extra', value: `Duplicates: \`${duplicateCount}\`\nGame: \`${char.game.toUpperCase()}\``, inline: true }
                );

            if (showSplash) {
                embed.setImage(getCharacterImage(char));
            } else {
                embed.setThumbnail(getCharacterImage(char));
            }

            return { embed, char, duplicateCount };
        };

        // --- COMPONENTS ---
        const getRows = (currentSort = 'rarity', currentGame = 'all', selectedChar = null) => {
            const rows = [];

            // Row 1: Sort Buttons
            const sortRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('sort_rarity').setLabel('Sort Rarity').setStyle(currentSort === 'rarity' ? ButtonStyle.Primary : ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('sort_name').setLabel('Sort Name').setStyle(currentSort === 'name' ? ButtonStyle.Primary : ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('sort_asc').setLabel('Sort Asc').setStyle(currentSort === 'ascension' ? ButtonStyle.Primary : ButtonStyle.Secondary)
            );
            rows.push(sortRow);

            // Row 2: Select Menu for Details
            const uniqueChars = [];
            const seen = new Set();
            for (const c of characters) {
                if (!seen.has(c.name)) {
                    uniqueChars.push(c);
                    seen.add(c.name);
                }
            }
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_char')
                .setPlaceholder('Select a character for details...')
                .addOptions(uniqueChars.slice(0, 25).map(c => ({
                    label: c.name,
                    value: c.name,
                    description: `${c.rarity}★ - ${c.game.toUpperCase()}`,
                    emoji: c.emoji || (c.rarity === 5 ? '🔶' : '🔷')
                })));
            rows.push(new ActionRowBuilder().addComponents(selectMenu));

            // Row 3: Action Buttons (Only if character selected)
            if (selectedChar) {
                const charInstances = characters.filter(c => c.name === selectedChar.name);
                const duplicateCount = charInstances.length - 1;
                const actionRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`splash_${selectedChar.name}`).setLabel('Show Splash Art').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId(`ascend_${selectedChar.name}`).setLabel('Manual Ascension').setStyle(ButtonStyle.Danger).setDisabled(duplicateCount === 0 || selectedChar.ascension >= 6),
                    new ButtonBuilder().setCustomId('back_to_list').setLabel('Back to List').setStyle(ButtonStyle.Secondary)
                );
                rows.push(actionRow);
            }

            return rows;
        };

        // --- EXECUTION ---
        const initialEmbed = renderList();
        const initialRows = getRows();
        const msg = await message.reply({ embeds: [initialEmbed], components: initialRows });

        const collector = msg.createMessageComponentCollector({ time: 300000 }); // 5 mins
        let currentSort = 'rarity';
        let filterGame = 'all';
        let viewingChar = null;

        collector.on('collect', async i => {
            if (i.user.id !== message.author.id) return i.reply({ content: "hg ot torm krorng heh!", ephemeral: true });

            if (i.customId.startsWith('sort_')) {
                currentSort = i.customId.split('_')[1];
                viewingChar = null;
                await i.update({ embeds: [renderList(currentSort, filterGame)], components: getRows(currentSort, filterGame) });
            }

            if (i.customId === 'back_to_list') {
                viewingChar = null;
                await i.update({ embeds: [renderList(currentSort, filterGame)], components: getRows(currentSort, filterGame) });
            }

            if (i.customId === 'select_char') {
                const name = i.values[0];
                const { embed, char } = renderDetail(name);
                viewingChar = char;
                await i.update({ embeds: [embed], components: getRows(currentSort, filterGame, char) });
            }

            if (i.customId.startsWith('splash_')) {
                const name = i.customId.split('_')[1];
                const { embed } = renderDetail(name, true);
                await i.update({ embeds: [embed] });
            }

            if (i.customId.startsWith('ascend_')) {
                const name = i.customId.split('_')[1];
                const charInstances = characters.filter(c => c.name === name);
                const mainChar = charInstances.sort((a, b) => (b.ascension || 0) - (a.ascension || 0))[0];
                
                const duplicateIndex = inventory.findIndex(c => c.name === name && c !== mainChar);
                if (duplicateIndex !== -1) {
                    inventory.splice(duplicateIndex, 1);
                    mainChar.ascension = (mainChar.ascension || 0) + 1;
                    database.saveUser(userData);
                    
                    const { embed } = renderDetail(name);
                    message.channel.send(`✨ **${mainChar.name}** ascended to level **${mainChar.ascension}**! (ﾉ´ヮ\`)ﾉ*:･ﾟ✧`);
                    await i.update({ embeds: [embed], components: getRows(currentSort, filterGame, mainChar) });
                }
            }
        });

        collector.on('end', () => {
            msg.edit({ components: [] }).catch(() => {});
        });
    }
};