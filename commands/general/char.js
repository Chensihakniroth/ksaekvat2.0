const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');

module.exports = {
    name: 'char',
    aliases: ['characters', 'collection', 'chars'],
    description: 'View and filter your Gacha character collection',
    usage: 'char',
    async execute(message, args, client) {
        const userId = message.author.id;
        const userData = database.getUser(userId);
        const inventory = userData.gacha_inventory || [];

        if (inventory.length === 0) {
            return message.reply("hg kmean charecter teat! Use `Kgacha` pull mork.");
        }

        // --- FILTER LOGIC ---
        const renderArchive = (filterType = 'all') => {
            let filtered = inventory;
            let title = `${message.author.username}'s Archive`;

            if (filterType === '5star') {
                filtered = inventory.filter(c => c.rarity === 5);
                title = "⭐ 5-Star Records";
            } else if (filterType === '4star') {
                filtered = inventory.filter(c => c.rarity === 4);
                title = "⭐ 4-Star Records";
            } else if (['Genshin', 'HSR', 'WuWa', 'ZZZ'].includes(filterType)) {
                filtered = inventory.filter(c => c.game === filterType);
                title = `${filterType} Manifestations`;
            }

            // Group by name
            const grouped = filtered.reduce((acc, char) => {
                if (!acc[char.name]) acc[char.name] = { ...char, count: 0 };
                acc[char.name].count++;
                return acc;
            }, {});

            const sorted = Object.values(grouped).sort((a, b) => b.rarity - a.rarity);
            const list = sorted.map(c => {
                const icon = c.rarity === 5 ? '🔶' : (c.rarity === 4 ? '🔷' : '⚪');
                return `${icon} **${c.name}** x${c.count} \`[${c.game}]\``;
            });

            const display = list.slice(0, 15).join('\n') || '*No records found for this filter.*';

            return new EmbedBuilder()
                .setColor(filterType === '5star' ? '#FFB13F' : colors.primary)
                .setTitle(`👤 ${title}`)
                .setThumbnail(message.author.displayAvatarURL())
                .setDescription(`**Total Unique:** ${sorted.length}\n**Total Records:** ${filtered.length}\n\n${display}`)
                .setFooter({ text: `Showing top 15 • Use buttons to filter` });
        };

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('all').setLabel('All').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('5star').setLabel('5★').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('4star').setLabel('4★').setStyle(ButtonStyle.Primary)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('Genshin').setLabel('Genshin').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('HSR').setLabel('HSR').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('WuWa').setLabel('WuWa').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('ZZZ').setLabel('ZZZ').setStyle(ButtonStyle.Secondary)
        );

        const msg = await message.reply({ embeds: [renderArchive()], components: [row1, row2] });

        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 60000
        });

        collector.on('collect', async i => {
            await i.update({ embeds: [renderArchive(i.customId)] });
        });

        collector.on('end', () => {
            msg.edit({ components: [] }).catch(() => {});
        });
    }
};