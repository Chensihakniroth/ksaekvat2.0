const { EmbedBuilder } = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const AnimalService =
  require('../../services/AnimalService.js').default || require('../../services/AnimalService.js');
const EconomyService =
  require('../../services/EconomyService').default || require('../../services/EconomyService');

module.exports = {
  name: 'sell',
  aliases: ['sellpokemon', 'release'],
  description: 'Release Pokémon from your collection for coins!',
  usage: 'sell <pokemon_name> or sell all',
  async execute(message, args, client) {
    if (args.length === 0) {
      return message.reply({
        embeds: [
          {
            color: colors.error,
            title: '(◕‸ ◕✿) Sweetie, you forgot something!',
            description:
              'Please tell Mommy which Pokémon you want to release! (｡•́︿•̀｡)\n\n**Usage:**\n`Ksell <pokemon_name>` - Release a specific Pokémon\n`Ksell all` - Release all Pokémon',
          },
        ],
      });
    }

    const userData = await database.getUser(message.author.id, message.author.username);
    const animalsData = await database.loadAnimals();
    const flatRegistry = await database.getAnimalRegistry();
    const userAnimals = userData.animals || new Map();

    // Check if user has any animals with Map-safe logic! (｡♥‿♥｡)
    let totalPokemon = 0;
    const rarityEntries =
      userAnimals instanceof Map ? userAnimals.entries() : Object.entries(userAnimals);
    for (const [rarity, rarityAnimals] of rarityEntries) {
      const animalEntries =
        rarityAnimals instanceof Map
          ? rarityAnimals.entries()
          : Object.entries(rarityAnimals || {});
      for (const [animal, count] of animalEntries) {
        totalPokemon += Number(count) || 0;
      }
    }

    if (totalPokemon === 0) {
      return message.reply({
        embeds: [
          {
            color: colors.error,
            title: '(｡•́︿•̀｡) No Pokémon to release...',
            description:
              "You don't have any Pokémon to release, darling! (っ˘ω˘ς) Try using `Khunt` to catch some!",
          },
        ],
      });
    }

    const sellArg = args[0].toLowerCase();
    const sellAll = sellArg === 'all';
    const sellRarity = Object.keys(config.hunting.rarities).includes(sellArg) ? sellArg : null;

    if (sellAll) {
      // Sell all animals
      let totalValue = 0;
      let pokemonSold = 0;
      const soldPokemon = [];

      const rarityEntriesAll =
        userAnimals instanceof Map ? userAnimals.entries() : Object.entries(userAnimals);
      for (const [rarity, animals] of rarityEntriesAll) {
        const animalEntries = animals instanceof Map ? animals.entries() : Object.entries(animals);
        for (const [animalKey, count] of animalEntries) {
          const animal = animalsData[rarity]?.[animalKey] || flatRegistry[animalKey];
          if (animal && count > 0) {
            const { getRarityEmoji } = require('../../utils/images.js');
            const rarityEmoji = getRarityEmoji(rarity, client);
            const baseValue = animal.value || config.hunting.rarities[rarity]?.value || 100;
            const value = baseValue * count;
            totalValue += value;
            pokemonSold += count;
            soldPokemon.push(
              `${rarityEmoji} **${animal.name}** x${count} - ${EconomyService.format(value)} ${config.economy.currency}`
            );
          }
        }
      }

      if (pokemonSold === 0) {
        return message.reply({
          embeds: [
            {
              color: colors.error,
              title: '(｡•́︿•̀｡) Nothing to release, sweetie',
              description: "You don't have any valid Pokémon for Mommy to release. (っ˘ω˘ς)",
            },
          ],
        });
      }

      // Confirmation warning
      const confirmEmbed = new EmbedBuilder()
        .setColor('#ffaa00')
        .setTitle('⚠️ Wait, are you sure?')
        .setDescription(
          `You are about to release **ALL ${pokemonSold}** of your Pokémon!\n\nThis will give you **${EconomyService.format(totalValue)}** ${config.economy.currency}, but it **cannot be undone!**\n\nType \`confirm\` in the next 15 seconds to proceed.`
        );

      await message.reply({ embeds: [confirmEmbed] });

      try {
        const filter = (m) =>
          m.author.id === message.author.id && m.content.toLowerCase() === 'confirm';
        const collected = await message.channel.awaitMessages({
          filter,
          max: 1,
          time: 15000,
          errors: ['time'],
        });
        if (!collected.first()) return;
      } catch (e) {
        return message.channel.send('(っ˘ω˘ς) Release cancelled. Your Pokémon are safe!');
      }

      // Clear all animals and add money
      userData.animals = new Map();
      userData.balance += totalValue;
      userData.markModified('animals');
      await database.saveUser(userData);

      const embed = new EmbedBuilder()
        .setColor(colors.success)
        .setTitle('ヽ(>∀<☆)ノ All Released!')
        .setDescription(
          `Mommy helped you release **${pokemonSold}** Pokémon for **${EconomyService.format(totalValue)}** ${config.economy.currency}! (｡♥‿♥｡)`
        )
        .addFields({
          name: '(◕‿◕✿) Pokémon Released',
          value:
            soldPokemon.slice(0, 10).join('\n') +
            (soldPokemon.length > 10 ? `\n*...and ${soldPokemon.length - 10} more*` : ''),
          inline: false,
        })
        .addFields({
          name: '(｡♥‿♥｡) New Balance',
          value: `${EconomyService.format(userData.balance)} ${config.economy.currency}`,
          inline: true,
        });

      // Update command usage statistics
      await database.updateStats(message.author.id, 'command');

      return message.reply({ embeds: [embed] });
    } else if (sellRarity) {
      // Sell all animals of a specific rarity
      let totalValue = 0;
      let pokemonSold = 0;
      const soldPokemon = [];

      let rarityAnimals = null;
      if (userAnimals instanceof Map) {
        rarityAnimals = userAnimals.get(sellRarity);
      } else {
        rarityAnimals = userAnimals[sellRarity];
      }

      if (rarityAnimals) {
        const animalEntries =
          rarityAnimals instanceof Map ? rarityAnimals.entries() : Object.entries(rarityAnimals);
        for (const [animalKey, count] of animalEntries) {
          const animal = animalsData[sellRarity]?.[animalKey] || flatRegistry[animalKey];
          if (animal && count > 0) {
            const { getRarityEmoji } = require('../../utils/images.js');
            const rarityEmoji = getRarityEmoji(sellRarity, client);
            const baseValue = animal.value || config.hunting.rarities[sellRarity]?.value || 100;
            const value = baseValue * count;
            totalValue += value;
            pokemonSold += count;
            soldPokemon.push(
              `${rarityEmoji} **${animal.name}** x${count} - ${EconomyService.format(value)} ${config.economy.currency}`
            );
          }
        }
      }

      if (pokemonSold === 0) {
        return message.reply({
          embeds: [
            {
              color: colors.error,
              title: '(｡•́︿•̀｡) Nothing to release, sweetie',
              description: `You don't have any **${sellRarity}** Pokémon for Mommy to release. (っ˘ω˘ς)`,
            },
          ],
        });
      }

      // Confirmation warning
      const confirmEmbed = new EmbedBuilder()
        .setColor('#ffaa00')
        .setTitle('⚠️ Wait, are you sure?')
        .setDescription(
          `You are about to release **ALL ${pokemonSold}** of your ${sellRarity} Pokémon!\n\nThis will give you **${EconomyService.format(totalValue)}** ${config.economy.currency}, but it **cannot be undone!**\n\nType \`confirm\` in the next 15 seconds to proceed.`
        );

      await message.reply({ embeds: [confirmEmbed] });

      try {
        const filter = (m) =>
          m.author.id === message.author.id && m.content.toLowerCase() === 'confirm';
        const collected = await message.channel.awaitMessages({
          filter,
          max: 1,
          time: 15000,
          errors: ['time'],
        });
        if (!collected.first()) return;
      } catch (e) {
        return message.channel.send('(っ˘ω˘ς) Release cancelled. Your Pokémon are safe!');
      }

      // Clear the specific rarity and add money
      if (userAnimals instanceof Map) {
        userAnimals.delete(sellRarity);
      } else {
        delete userAnimals[sellRarity];
      }
      userData.balance += totalValue;
      userData.markModified('animals');
      await database.saveUser(userData);

      const rarityInfo = config.hunting.rarities[sellRarity];

      const embed = new EmbedBuilder()
        .setColor(parseInt(rarityInfo.color.slice(1), 16))
        .setTitle(`ヽ(>∀<☆)ノ ${rarityInfo.name} Released!`)
        .setDescription(
          `Mommy helped you release **${pokemonSold}** ${rarityInfo.name} Pokémon for **${EconomyService.format(totalValue)}** ${config.economy.currency}! (｡♥‿♥｡)`
        )
        .addFields({
          name: '(◕‿◕✿) Pokémon Released',
          value:
            soldPokemon.slice(0, 10).join('\n') +
            (soldPokemon.length > 10 ? `\n*...and ${soldPokemon.length - 10} more*` : ''),
          inline: false,
        })
        .addFields({
          name: '(｡♥‿♥｡) New Balance',
          value: `${EconomyService.format(userData.balance)} ${config.economy.currency}`,
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

      // Search for the animal in user's collection with Map-safe logic! (｡♥‿♥｡)
      const rarityEntriesSingle =
        userAnimals instanceof Map ? userAnimals.entries() : Object.entries(userAnimals);
      for (const [rarity, animals] of rarityEntriesSingle) {
        const animalEntries = animals instanceof Map ? animals.entries() : Object.entries(animals);
        for (const [animalKey, count] of animalEntries) {
          const animal = animalsData[rarity]?.[animalKey] || flatRegistry[animalKey];
          if (animal && count > 0) {
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

      if (!foundAnimal) {
        return message.reply({
          embeds: [
            {
              color: colors.error,
              title: '(｡•́︿•̀｡) Pokémon Not Found',
              description: `You don't have a Pokémon named "${args.join(' ')}" for Mommy to release. (っ˘ω˘ς)\n\nUse \`Kzoo\` to check your Pokédex!`,
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

      const sellValue = foundAnimal.value || config.hunting.rarities[foundRarity]?.value || 100;
      userData.balance += sellValue;
      userData.markModified('animals');
      await database.saveUser(userData);

      const imgData = await AnimalService.getPokemonImageBuffer(foundKey);
      const rarityInfo = config.hunting.rarities[foundRarity];
      const { getRarityEmoji } = require('../../utils/images.js');
      const rarityEmoji = getRarityEmoji(foundRarity, client);
      const files = [];

      const embed = new EmbedBuilder()
        .setColor(parseInt(rarityInfo.color.slice(1), 16))
        .setTitle('ヽ(>∀<☆)ノ Released!')
        .setDescription(
          `Mommy helped you release your ${rarityEmoji} **${foundAnimal.name}** for **${EconomyService.format(sellValue)}** ${config.economy.currency}! (｡♥‿♥｡)`
        )
        .addFields({
          name: '(◕‿◕✿) Release Details',
          value: `**Pokémon:** ${rarityEmoji} ${foundAnimal.name}\n**Rarity:** ${rarityInfo.name}\n**Credit:** ${EconomyService.format(sellValue)} ${config.economy.currency}\n**Remaining:** ${currentCount - 1}`,
          inline: true,
        })
        .addFields({
          name: '(｡♥‿♥｡) New Balance',
          value: `${EconomyService.format(userData.balance)} ${config.economy.currency}`,
          inline: true,
        });

      if (imgData && imgData.buffer) {
        files.push(
          new (require('discord.js').AttachmentBuilder)(imgData.buffer, { name: imgData.fileName })
        );
        embed.setThumbnail(`attachment://${imgData.fileName}`);
      }

      // Update command usage statistics
      await database.updateStats(message.author.id, 'command');

      return message.reply({ embeds: [embed], files });
    }
  },
};
