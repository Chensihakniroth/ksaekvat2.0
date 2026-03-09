const { EmbedBuilder } = require('discord.js');
const database = require('../../utils/database.js');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');

module.exports = {
  name: 'sell',
  aliases: ['sellpet', 'sellanimals'],
  description: 'Sell animals from your collection',
  usage: 'sell <animal_name> or sell all',
  async execute(message, args, client) {
    if (args.length === 0) {
      return message.reply({
        embeds: [
          {
            color: colors.error,
            title: '(◕‸ ◕✿) Sweetie, you forgot something!',
            description:
              'Please tell Mommy what you want to sell! (｡•́︿•̀｡)\n\n**Usage:**\n`Ksell <animal_name>` - Sell a specific animal\n`Ksell all` - Sell all animals',
          },
        ],
      });
    }

    const userData = await database.getUser(message.author.id, message.author.username);
    const animalsData = await database.loadAnimals();
    const userAnimals = userData.animals || {};

    // Check if user has any animals
    let totalAnimals = 0;
    for (const rarity of Object.keys(userAnimals)) {
      const rarityAnimals = userAnimals[rarity] || {};
      for (const animal of Object.keys(rarityAnimals)) {
        totalAnimals +=
          (rarityAnimals instanceof Map ? rarityAnimals.get(animal) : rarityAnimals[animal]) || 0;
      }
    }

    if (totalAnimals === 0) {
      return message.reply({
        embeds: [
          {
            color: colors.error,
            title: '(｡•́︿•̀｡) No friends to sell...',
            description:
              "You don't have any animals to sell, darling! (っ˘ω˘ς) Try using `Khunt` to find some!",
          },
        ],
      });
    }

    const sellAll = args[0].toLowerCase() === 'all';

    if (sellAll) {
      // Sell all animals
      let totalValue = 0;
      let animalsSold = 0;
      const soldAnimals = [];

      for (const [rarity, animals] of Object.entries(userAnimals)) {
        if (animalsData[rarity]) {
          const animalEntries =
            animals instanceof Map ? animals.entries() : Object.entries(animals);
          for (const [animalKey, count] of animalEntries) {
            if (animalsData[rarity][animalKey] && count > 0) {
              const animal = animalsData[rarity][animalKey];
              const value = animal.value * count;
              totalValue += value;
              animalsSold += count;
              soldAnimals.push(
                `${animal.emoji} **${animal.name}** x${count} - ${value.toLocaleString()} ${config.economy.currency}`
              );
            }
          }
        }
      }

      if (animalsSold === 0) {
        return message.reply({
          embeds: [
            {
              color: colors.error,
              title: '(｡•́︿•̀｡) Nothing to sell, sweetie',
              description: "You don't have any valid animals for Mommy to sell. (っ˘ω˘ς)",
            },
          ],
        });
      }

      // Clear all animals and add money
      userData.animals = new Map();
      userData.balance += totalValue;
      await database.saveUser(userData);

      const embed = new EmbedBuilder()
        .setColor(colors.success)
        .setTitle('ヽ(>∀<☆)ノ All Sold!')
        .setDescription(
          `Mommy helped you sell **${animalsSold}** of your friends for **${totalValue.toLocaleString()}** ${config.economy.currency}! (｡♥‿♥｡)`
        )
        .addFields({
          name: '(◕‿◕✿) Animals Sold',
          value:
            soldAnimals.slice(0, 10).join('\n') +
            (soldAnimals.length > 10 ? `\n*...and ${soldAnimals.length - 10} more*` : ''),
          inline: false,
        })
        .addFields({
          name: '(｡♥‿♥｡) New Balance',
          value: `${userData.balance.toLocaleString()} ${config.economy.currency}`,
          inline: true,
        });

      // Update command usage statistics
      await database.updateStats(message.author.id, 'command');

      return message.reply({ embeds: [embed] });
    } else {
      // Sell specific animal
      const animalName = args.join(' ').toLowerCase();
      let foundAnimal = null;
      let foundRarity = null;
      let foundKey = null;

      // Search for the animal in user's collection
      for (const [rarity, animals] of Object.entries(userAnimals)) {
        if (animalsData[rarity]) {
          const animalEntries =
            animals instanceof Map ? animals.entries() : Object.entries(animals);
          for (const [animalKey, count] of animalEntries) {
            if (animalsData[rarity][animalKey] && count > 0) {
              const animal = animalsData[rarity][animalKey];
              if (
                animal.name.toLowerCase().includes(animalName) ||
                animalKey.toLowerCase().includes(animalName)
              ) {
                foundAnimal = animal;
                foundRarity = rarity;
                foundKey = animalKey;
                break;
              }
            }
          }
          if (foundAnimal) break;
        }
      }

      if (!foundAnimal) {
        return message.reply({
          embeds: [
            {
              color: colors.error,
              title: '(｡•́︿•̀｡) Animal Not Found',
              description: `You don't have an animal named "${args.join(' ')}" for Mommy to sell. (っ˘ω˘ς)\n\nUse \`Kzoo\` to see your friends!`,
            },
          ],
        });
      }

      // Sell one of the animal
      let currentCount = 0;
      if (userAnimals instanceof Map) {
        const rarityMap = userAnimals.get(foundRarity);
        currentCount = rarityMap.get(foundKey);
        rarityMap.set(foundKey, currentCount - 1);
        if (rarityMap.get(foundKey) <= 0) {
          rarityMap.delete(foundKey);
          if (rarityMap.size === 0) userAnimals.delete(foundRarity);
        }
      } else {
        currentCount = userAnimals[foundRarity][foundKey];
        userAnimals[foundRarity][foundKey] -= 1;
        if (userAnimals[foundRarity][foundKey] <= 0) {
          delete userAnimals[foundRarity][foundKey];
          if (Object.keys(userAnimals[foundRarity]).length === 0) {
            delete userAnimals[foundRarity];
          }
        }
      }

      const sellValue = foundAnimal.value;
      userData.balance += sellValue;
      await database.saveUser(userData);

      const rarityInfo = config.hunting.rarities[foundRarity];
      const embed = new EmbedBuilder()
        .setColor(rarityInfo.color)
        .setTitle('ヽ(>∀<☆)ノ Sold!')
        .setDescription(
          `Mommy helped you sell ${foundAnimal.emoji} **${foundAnimal.name}** for **${sellValue.toLocaleString()}** ${config.economy.currency}! (｡♥‿♥｡)`
        )
        .addFields({
          name: '(◕‿◕✿) Sale Details',
          value: `**Animal:** ${foundAnimal.emoji} ${foundAnimal.name}\n**Rarity:** ${rarityInfo.name}\n**Price:** ${sellValue.toLocaleString()} ${config.economy.currency}\n**Remaining:** ${currentCount - 1}`,
          inline: true,
        })
        .addFields({
          name: '(｡♥‿♥｡) New Balance',
          value: `${userData.balance.toLocaleString()} ${config.economy.currency}`,
          inline: true,
        });

      // Update command usage statistics
      await database.updateStats(message.author.id, 'command');

      return message.reply({ embeds: [embed] });
    }
  },
};
