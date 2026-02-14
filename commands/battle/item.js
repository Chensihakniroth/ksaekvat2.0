const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

// Add item to user's inventory
function addItemToInventory(userId, item) {
    const userData = database.getUser(userId);
    if (!userData.inventory) userData.inventory = [];
    const itemId = Math.random().toString(36).substr(2, 4).toUpperCase();
    const newItem = { id: itemId, ...item, obtainedAt: new Date().toISOString() };
    userData.inventory.push(newItem);
    database.saveUser(userData);
    return itemId;
}

function getInventory(userId) {
    const userData = database.getUser(userId);
    return userData.inventory || [];
}

function getEquippedItems(userId) {
    const userData = database.getUser(userId);
    return userData.equipped || {};
}

function equipItem(userId, itemId) {
    const userData = database.getUser(userId);
    const inventory = userData.inventory || [];
    const equipped = userData.equipped || {};
    const itemIndex = inventory.findIndex(item => item.id.toUpperCase() === itemId.toUpperCase());
    if (itemIndex === -1) return { success: false, message: 'Item not found in inventory' };
    const item = inventory[itemIndex];
    const slot = item.type.toLowerCase();
    if (equipped[slot]) inventory.push(equipped[slot]);
    equipped[slot] = item;
    inventory.splice(itemIndex, 1);
    userData.equipped = equipped;
    userData.inventory = inventory;
    database.saveUser(userData);
    return { success: true, item, slot };
}

function unequipItem(userId, slot) {
    const userData = database.getUser(userId);
    const equipped = userData.equipped || {};
    const inventory = userData.inventory || [];
    if (!equipped[slot]) return { success: false, message: `No item equipped in ${slot}` };
    const item = equipped[slot];
    delete equipped[slot];
    inventory.push(item);
    userData.equipped = equipped;
    userData.inventory = inventory;
    database.saveUser(userData);
    return { success: true, item, slot };
}

function calculateEquippedBonuses(userId) {
    const equipped = getEquippedItems(userId);
    const bonuses = { attack: 0, defense: 0, hp: 0, speed: 0, luck: 0 };
    Object.values(equipped).forEach(item => {
        if (item.bonus) {
            Object.entries(item.bonus).forEach(([stat, value]) => {
                if (bonuses.hasOwnProperty(stat)) bonuses[stat] += value;
            });
        }
    });
    return bonuses;
}

async function showInventory(message, args, existingMsg = null) {
    const userId = message.author.id;
    const userData = database.getUser(userId);
    const inventory = getInventory(userId);
    const equipped = getEquippedItems(userId);
    const bonuses = calculateEquippedBonuses(userId);
    
    const page = parseInt(args[0]) || 1;
    const itemsPerPage = 5;
    const totalPages = Math.ceil(inventory.length / itemsPerPage) || 1;
    const pageItems = inventory.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    const embed = new EmbedBuilder()
        .setColor(colors.primary)
        .setTitle(`🛡️ ${message.author.username}'s Profile`)
        .setThumbnail(message.author.displayAvatarURL())
        .setDescription(`**AR ${userData.level}** • **WL ${userData.worldLevel || 1}**\n🔥 **Boost:** ${userData.hunt_boost || 0} turns left`)
        .addFields(
            {
                name: '⚔️ Equipment',
                value: `**Weapon:** ${equipped.weapon ? `\`${equipped.weapon.name}\`` : '*None*'}\n**Armor:** ${equipped.armor ? `\`${equipped.armor.name}\`` : '*None*'}\n**Shoes:** ${equipped.shoe ? `\`${equipped.shoe.name}\`` : '*None*'}`,
                inline: true
            },
            {
                name: '📊 Stats',
                value: `❤️ HP: ${bonuses.hp || 0}\n⚔️ ATK: ${bonuses.attack || 0}\n🛡️ DEF: ${bonuses.defense || 0}`,
                inline: true
            },
            {
                name: '🎁 Supplies',
                value: `📦 **Loot Boxes:** ${userData.lootbox || 0}`,
                inline: false
            }
        );

    const inventoryList = pageItems.length > 0 
        ? pageItems.map((item, i) => `**${item.id}** | ${item.name} (${item.rarity})\n└ *${item.perk || 'No perk'}*`).join('\n')
        : '*Your bag is empty.*';

    embed.addFields({ name: `🎒 Bag (Page ${page}/${totalPages})`, value: inventoryList });

    const rows = [];
    if (pageItems.length > 0) {
        rows.push(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('equip_select')
                .setPlaceholder('Select item to equip')
                .addOptions(pageItems.map(item => ({ label: `[${item.id}] ${item.name}`, value: item.id })))
        ));
    }

    const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('open_box').setLabel('Open Box').setEmoji('🎁').setStyle(ButtonStyle.Success).setDisabled(!(userData.lootbox > 0)),
        new ButtonBuilder().setCustomId('un_weapon').setLabel('Unequip Wpn').setStyle(ButtonStyle.Secondary).setDisabled(!equipped.weapon)
    );
    rows.push(actionRow);

    let msg;
    if (existingMsg) msg = await existingMsg.edit({ embeds: [embed], components: rows });
    else msg = await message.reply({ embeds: [embed], components: rows });

    const collector = msg.createMessageComponentCollector({ filter: i => i.user.id === message.author.id, time: 60000 });

    collector.on('collect', async i => {
        let result = { success: false };
        if (i.customId === 'equip_select') {
            result = equipItem(userId, i.values[0]);
        } else if (i.customId === 'open_box') {
            if (userData.lootbox > 0) {
                userData.lootbox--;
                const rand = Math.random();
                if (rand < 0.6) {
                    // Give Lure/Booster
                    userData.hunt_boost = (userData.hunt_boost || 0) + 3;
                    result = { success: true, message: 'You found a **Hunter Lure**! Next 3 hunts are boosted!' };
                } else {
                    // Give Random Weapon
                    const wpns = ["Iron Blade", "Steel Axe", "Hunter Bow", "Void Staff"];
                    const name = wpns[Math.floor(Math.random() * wpns.length)];
                    const mult = Math.max(1, Math.floor(userData.level / 5));
                    const wpnItem = { name: `L-${name}`, type: 'Weapon', rarity: 'Rare', perk: '✨ Looted', bonus: { attack: 15 * mult } };
                    const id = addItemToInventory(userId, wpnItem);
                    result = { success: true, message: `You found a **${name}**! \`[${id}]\`` };
                }
                database.saveUser(userData);
            }
        } else if (i.customId === 'un_weapon') {
            result = unequipItem(userId, 'weapon');
        }

        if (result.success) {
            collector.stop();
            if (i.deferred || i.replied) {} else await i.deferUpdate();
            return showInventory(message, [page], msg);
        } else {
            await i.reply({ content: result.message || 'Error', ephemeral: true });
        }
    });
}

module.exports = {
    name: 'inv',
    aliases: ['inventory', 'item', 'items'],
    description: 'Character Profile, Inventory and Loot Boxes',
    usage: 'inv [page]',
    cooldown: 3000,
    async execute(message, args) {
        await showInventory(message, args);
    },
    addItemToInventory,
    calculateEquippedBonuses
};