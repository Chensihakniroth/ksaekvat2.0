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
    
    if (equipped[slot]) {
        inventory.push(equipped[slot]);
    }
    
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
    const inventory = getInventory(userId);
    const equipped = getEquippedItems(userId);
    const bonuses = calculateEquippedBonuses(userId);
    
    const page = parseInt(args[0]) || 1;
    const itemsPerPage = 5;
    const totalPages = Math.ceil(inventory.length / itemsPerPage) || 1;
    const pageItems = inventory.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    const embed = new EmbedBuilder()
        .setColor(colors.primary)
        .setTitle(`🛡️ ${message.author.username}'s Character Profile`)
        .setThumbnail(message.author.displayAvatarURL())
        .setDescription(`**AR ${database.getUser(userId).level}** • **WL ${database.getUser(userId).worldLevel || 1}**`)
        .addFields(
            {
                name: '⚔️ Equipped Gear',
                value: [
                    `**Weapon:** ${equipped.weapon ? `\`${equipped.weapon.name}\`` : '*Empty*'}`,
                    `**Armor:** ${equipped.armor ? `\`${equipped.armor.name}\`` : '*Empty*'}`,
                    `**Shoes:** ${equipped.shoe ? `\`${equipped.shoe.name}\`` : '*Empty*'}`,
                    `**Trinket:** ${equipped.accessory ? `\`${equipped.accessory.name}\`` : '*Empty*'}`
                ].join('\n'),
                inline: true
            },
            {
                name: '📊 Combat Stats',
                value: [
                    `❤️ **HP:** ${bonuses.hp || 0}`,
                    `⚔️ **ATK:** ${bonuses.attack || 0}`,
                    `🛡️ **DEF:** ${bonuses.defense || 0}`,
                    `⚡ **SPD:** ${bonuses.speed || 0}`
                ].join('\n'),
                inline: true
            }
        );

    const inventoryList = pageItems.length > 0 
        ? pageItems.map((item, i) => `**${item.id}** | ${item.name} (${item.rarity})\n└ *${item.perk || 'No perk'}*`).join('\n')
        : '*Your bag is empty.*';

    embed.addFields({ name: `🎒 Bag (${inventory.length} items) - Page ${page}/${totalPages}`, value: inventoryList });

    const row = new ActionRowBuilder();
    if (pageItems.length > 0) {
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('equip_select')
            .setPlaceholder('Select an item to equip')
            .addOptions(pageItems.map(item => ({
                label: `[${item.id}] ${item.name}`,
                description: `${item.rarity} ${item.type}`,
                value: item.id
            })));
        row.addComponents(selectMenu);
    }

    const unequipRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('un_weapon').setLabel('Unequip Wpn').setStyle(ButtonStyle.Secondary).setDisabled(!equipped.weapon),
        new ButtonBuilder().setCustomId('un_armor').setLabel('Unequip Arm').setStyle(ButtonStyle.Secondary).setDisabled(!equipped.armor),
        new ButtonBuilder().setCustomId('un_shoe').setLabel('Unequip Shoe').setStyle(ButtonStyle.Secondary).setDisabled(!equipped.shoe)
    );

    const components = pageItems.length > 0 ? [row, unequipRow] : [unequipRow];
    
    let msg;
    if (existingMsg) {
        msg = await existingMsg.edit({ embeds: [embed], components });
    } else {
        msg = await message.reply({ embeds: [embed], components });
    }

    const collector = msg.createMessageComponentCollector({
        filter: i => i.user.id === message.author.id,
        time: 60000
    });

    collector.on('collect', async i => {
        let result;
        if (i.customId === 'equip_select') {
            result = equipItem(userId, i.values[0]);
        } else if (i.customId.startsWith('un_')) {
            const slot = i.customId.split('_')[1];
            result = unequipItem(userId, slot);
        }

        if (result && result.success) {
            collector.stop();
            await i.deferUpdate(); // Prevent interaction fail
            return showInventory(message, [page], msg); // Edit same message
        } else {
            await i.reply({ content: result?.message || 'Error', ephemeral: true });
        }
    });
}

module.exports = {
    name: 'inv',
    aliases: ['inventory', 'item', 'items'],
    description: 'MMO-style Character Profile and Inventory',
    usage: 'inv [page]',
    cooldown: 3000,
    async execute(message, args) {
        const subCommand = args[0]?.toLowerCase();
        if (subCommand === 'equip' && args[1]) {
            const res = equipItem(message.author.id, args[1]);
            return message.reply(res.success ? `Equipped ${res.item.name}!` : res.message);
        }
        await showInventory(message, args);
    },
    addItemToInventory,
    calculateEquippedBonuses
};