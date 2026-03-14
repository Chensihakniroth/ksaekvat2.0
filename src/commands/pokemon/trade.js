const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
} = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const registry = require('../../utils/registry.js');

module.exports = {
  name: 'trade',
  aliases: ['swap', 'ktrade'],
  description: 'Trade Pokémon or Gacha characters with another player! 🤝',
  usage: 'trade <@user>',
  async execute(message, args, client) {
    const sender = message.author;
    const target = message.mentions.users.first();

    if (!target) {
      return message.reply({
        content: '🤝 Please mention the player you want to trade with, sweetie! (◕‿◕✿)\nExample: `Ktrade @player`',
      });
    }

    if (target.id === sender.id) {
      return message.reply({
        content: "🤝 You can't trade with yourself, darling! That would be silly. (っ˘ω˘ς)",
      });
    }

    if (target.bot) {
      return message.reply({
        content: "🤝 Bots don't have anything to trade, sweetie! (｡•́︿•̀｡)",
      });
    }

    // --- TRADE STATE ---
    const trade = {
      sender: { id: sender.id, name: sender.username, offer: [], accepted: false },
      target: { id: target.id, name: target.username, offer: [], accepted: false },
      status: 'PENDING', // PENDING, NEGOTIATING, CONFIRMING, COMPLETE, CANCELLED
    };

    const createTradeEmbed = () => {
      const embed = new EmbedBuilder()
        .setColor(colors.primary)
        .setTitle('🤝 Pokémon & Character Trade')
        .setDescription(
          `**${sender.username}** wants to trade with **${target.username}**!\n` +
          `*Both players must add items and then click "Accept Trade".*`
        )
        .addFields(
          {
            name: `📤 ${sender.username}'s Offer`,
            value: trade.sender.offer.length > 0 
              ? trade.sender.offer.map(i => `${i.emoji || '✨'} **${i.name}**`).join('\n') 
              : '*Nothing yet...*',
            inline: true,
          },
          {
            name: `📥 ${target.username}'s Offer`,
            value: trade.target.offer.length > 0 
              ? trade.target.offer.map(i => `${i.emoji || '✨'} **${i.name}**`).join('\n') 
              : '*Nothing yet...*',
            inline: true,
          }
        );

      if (trade.sender.accepted) embed.addFields({ name: '✅ Status', value: `${sender.username} has accepted!`, inline: false });
      if (trade.target.accepted) embed.addFields({ name: '✅ Status', value: `${target.username} has accepted!`, inline: false });

      embed.setFooter({ text: 'Commands: Kadd <item_name> | Kremove <item_name> | Kcancel' });
      return embed;
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('trade_accept').setLabel('Accept Trade').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('trade_cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger)
    );

    const msg = await message.channel.send({
      content: `${target}, **${sender.username}** has invited you to trade!`,
      embeds: [createTradeEmbed()],
      components: [row],
    });

    // We use a persistent message collector for the trade commands
    const textFilter = (m) => [sender.id, target.id].includes(m.author.id);
    const textCollector = message.channel.createMessageCollector({ filter: textFilter, time: 300000 });

    const buttonCollector = msg.createMessageComponentCollector({ time: 300000 });

    const animalsData = await database.loadAnimals();
    const flatRegistry = await database.getAnimalRegistry();

    textCollector.on('collect', async (m) => {
      const isSender = m.author.id === sender.id;
      const player = isSender ? trade.sender : trade.target;
      const content = m.content.toLowerCase();

      if (content.startsWith('kadd ')) {
        const itemName = m.content.slice(5).trim().toLowerCase();
        const userData = await database.getUser(m.author.id, m.author.username);
        
        // Find in Gacha Inventory
        const char = userData.gacha_inventory.find(i => i.name.toLowerCase().includes(itemName));
        // Find in Animals
        let animal = null;
        let rarityFound = null;
        const userAnimals = userData.animals || new Map();
        const rarityEntries = userAnimals instanceof Map ? userAnimals.entries() : Object.entries(userAnimals);
        for (const [rarity, animals] of rarityEntries) {
            const animalEntries = animals instanceof Map ? animals.entries() : Object.entries(animals);
            for (const [key, count] of animalEntries) {
                const def = animalsData[rarity]?.[key] || flatRegistry[key];
                if (def && (def.name.toLowerCase().includes(itemName) || key.toLowerCase().includes(itemName)) && count > 0) {
                    animal = { ...def, key };
                    rarityFound = rarity;
                    break;
                }
            }
            if (animal) break;
        }

        if (char) {
          if (player.offer.find(o => o.name === char.name)) {
              m.reply("You already added that, darling! (｡•́︿•̀｡)").then(rm => setTimeout(() => rm.delete().catch(() => {}), 3000));
          } else {
              player.offer.push({ name: char.name, type: 'character', emoji: '⭐' });
              trade.sender.accepted = false;
              trade.target.accepted = false;
              await msg.edit({ embeds: [createTradeEmbed()] });
          }
        } else if (animal) {
            if (player.offer.find(o => o.name === animal.name)) {
                m.reply("You already added that, darling! (｡•́︿•̀｡)").then(rm => setTimeout(() => rm.delete().catch(() => {}), 3000));
            } else {
                player.offer.push({ name: animal.name, key: animal.key, rarity: rarityFound, type: 'pokemon', emoji: animal.emoji });
                trade.sender.accepted = false;
                trade.target.accepted = false;
                await msg.edit({ embeds: [createTradeEmbed()] });
            }
        } else {
            m.reply("I couldn't find that item in your bag, sweetie! (｡•́︿•̀｡)").then(rm => setTimeout(() => rm.delete().catch(() => {}), 3000));
        }
        
        try { m.delete().catch(() => {}); } catch(_) {}
      } else if (content === 'kcancel') {
          trade.status = 'CANCELLED';
          textCollector.stop();
          buttonCollector.stop();
          await msg.edit({ content: '🤝 Trade cancelled! (っ˘ω˘ς)', embeds: [], components: [] });
      }
    });

    buttonCollector.on('collect', async (i) => {
      if (![sender.id, target.id].includes(i.user.id)) return;

      if (i.customId === 'trade_cancel') {
        trade.status = 'CANCELLED';
        textCollector.stop();
        buttonCollector.stop();
        return i.update({ content: '🤝 Trade cancelled! (っ˘ω˘ς)', embeds: [], components: [] });
      }

      if (i.customId === 'trade_accept') {
        if (i.user.id === sender.id) trade.sender.accepted = true;
        if (i.user.id === target.id) trade.target.accepted = true;

        if (trade.sender.accepted && trade.target.accepted) {
          // --- EXECUTE TRADE ---
          trade.status = 'COMPLETE';
          textCollector.stop();
          buttonCollector.stop();

          const senderData = await database.getUser(sender.id, sender.username);
          const targetData = await database.getUser(target.id, target.username);

          // 1. Move Sender items to Target
          for (const item of trade.sender.offer) {
            if (item.type === 'character') {
                await database.removeGachaItem(sender.id, item.name);
                await database.addGachaItem(target.id, item.name);
            } else {
                await database.removeAnimal(sender.id, item.key, item.rarity);
                await database.addAnimal(target.id, item.key, item.rarity);
            }
          }

          // 2. Move Target items to Sender
          for (const item of trade.target.offer) {
            if (item.type === 'character') {
                await database.removeGachaItem(target.id, item.name);
                await database.addGachaItem(sender.id, item.name);
            } else {
                await database.removeAnimal(target.id, item.key, item.rarity);
                await database.addAnimal(sender.id, item.key, item.rarity);
            }
          }

          await i.update({
            content: `🎊 **TRADE COMPLETE!** 🎊\n${sender.username} and ${target.username} have successfully swapped their friends! (｡♥‿♥｡)`,
            embeds: [createTradeEmbed().setColor('#43B581')],
            components: [],
          });
        } else {
          await i.update({ embeds: [createTradeEmbed()] });
        }
      }
    });

    buttonCollector.on('end', () => {
      if (trade.status === 'PENDING' || trade.status === 'NEGOTIATING') {
        msg.edit({ content: '🤝 Trade timed out! (｡•́︿•̀｡)', embeds: [], components: [] }).catch(() => {});
      }
    });
  },
};
