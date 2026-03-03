const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const { getCharacterImage } = require('../../utils/images.js');

module.exports = {
    name: 'char',
    aliases: ['characters', 'kchar', 'collection'],
    description: 'View your beautiful character collection! (Sorted by rarity)',
    usage: 'char',
    async execute(message, args, client) {
        const inventory = await database.getHydratedInventory(message.author.id);
        
        // Filter for characters only
        const characters = inventory.filter(i => i.type === 'character' || !i.type);

        if (characters.length === 0) {
            return message.reply("💸 hg ot mean character teat! Use `Kgacha` pull mork. (｡•́︿•̀｡)");
        }

        // Group by name and find highest stats
        const grouped = characters.reduce((acc, char) => {
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
            if (b.rarity !== a.rarity) return b.rarity - a.rarity;
            return a.name.localeCompare(b.name);
        });

        const renderListEmbed = () => {
            const list = sorted.slice(0, 15).map(c => {
                const star = c.rarity === 5 ? '🔶' : (c.rarity === 4 ? '🔷' : '⚪');
                return `${star} **${c.name}** \`[Asc ${c.highestAsc}]\` x${c.count}`;
            });

            return new EmbedBuilder()
                .setColor(colors.primary)
                .setTitle(`👤 ${message.author.username}'s Character Manifest`)
                .setDescription(`**Total Unique:** ${sorted.length}\n**Sorted by:** ⭐ Rarity (High to Low)\n\n${list.join('\n')}`)
                .setFooter({ text: `Use the menu below to view splash art! (◕‿◕✿)` });
        };

        const getRows = (selectedChar = null) => {
            const rows = [];
            
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_char')
                .setPlaceholder('Select a character to see splash art...')
                .addOptions(sorted.slice(0, 25).map(c => ({
                    label: c.name,
                    value: c.name,
                    description: `${c.rarity}★ Character`,
                    emoji: c.emoji || (c.rarity === 5 ? '🔶' : '🔷')
                })));

            rows.push(new ActionRowBuilder().addComponents(selectMenu));

            if (selectedChar) {
                rows.push(new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('back_to_list')
                        .setLabel('Back to List')
                        .setStyle(ButtonStyle.Secondary)
                ));
            }

            return rows;
        };

        const msg = await message.reply({ embeds: [renderListEmbed()], components: getRows() });
        const collector = msg.createMessageComponentCollector({ time: 300000 });

        collector.on('collect', async i => {
            if (i.user.id !== message.author.id) return i.reply({ content: "hg ot torm krorng heh!", ephemeral: true });

            if (i.customId === 'select_char') {
                const charName = i.values[0];
                const char = grouped[charName];
                const star = char.rarity === 5 ? '🔶' : (char.rarity === 4 ? '🔷' : '⚪');

                const detailEmbed = new EmbedBuilder()
                    .setColor(char.rarity === 5 ? '#FFB13F' : '#A256FF')
                    .setTitle(`${star} ${char.name} (Ascension ${char.highestAsc})`)
                    .setDescription(`**Game:** ${char.game.toUpperCase()}\n**Duplicates:** ${char.count - 1}`)
                    .setImage(getCharacterImage(char))
                    .setFooter({ text: "Looking good, darling! (｡♥‿♥｡)" });

                await i.update({ embeds: [detailEmbed], components: getRows(char) });
            }

            if (i.customId === 'back_to_list') {
                await i.update({ embeds: [renderListEmbed()], components: getRows() });
            }
        });

        collector.on('end', () => {
            msg.edit({ components: [] }).catch(() => {});
        });
    }
};
