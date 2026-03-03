const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');

module.exports = {
    name: 'inv',
    aliases: ['inventory', 'items', 'kitems'],
    description: 'View your complete collection of characters and weapons!',
    usage: 'inv',
    async execute(message, args, client) {
        const userData = database.getUser(message.author.id);
        const inventory = userData.gacha_inventory || [];

        if (inventory.length === 0) {
            return message.reply("💸 hg ot mean item teat! Use `Kgacha` pull mork. (｡•́︿•̀｡)");
        }

        const renderInventory = (tab = 'chars') => {
            let filtered = [];
            let title = "";

            if (tab === 'chars') {
                filtered = inventory.filter(i => i.type === 'character' || !i.type); // Handle legacy
                title = "👤 Character Collection";
            } else {
                filtered = inventory.filter(i => i.type === 'weapon');
                title = "⚔️ Weapon Arsenal";
            }

            // Grouping for cleaner display
            const grouped = filtered.reduce((acc, item) => {
                if (!acc[item.name]) acc[item.name] = { ...item, count: 0 };
                acc[item.name].count++;
                return acc;
            }, {});

            const list = Object.values(grouped).sort((a, b) => b.rarity - a.rarity).map(i => {
                const star = i.rarity === 5 ? '🔶' : (i.rarity === 4 ? '🔷' : '⚪');
                const extra = i.type === 'weapon' ? `[R${i.refinement || 1}]` : `x${i.count}`;
                return `${star} **${i.name}** ${extra} `[${i.game.toUpperCase()}]``;
            });

            const display = list.slice(0, 15).join('
') || "*No items in this category.*";

            return new EmbedBuilder()
                .setColor(colors.primary)
                .setTitle(title)
                .setDescription(`**Total Unique:** ${Object.keys(grouped).length}
**Total Items:** ${filtered.length}

${display}`)
                .setFooter({ text: `Page 1 • Use buttons to switch tabs` });
        };

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('chars').setLabel('Characters').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('weapons').setLabel('Weapons').setStyle(ButtonStyle.Secondary)
        );

        const msg = await message.reply({ embeds: [renderInventory()], components: [row] });

        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 60000
        });

        collector.on('collect', async i => {
            await i.update({ embeds: [renderInventory(i.customId)] });
        });

        collector.on('end', () => {
            msg.edit({ components: [] }).catch(() => {});
        });
    }
};