const { EmbedBuilder } = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const AnimalService = require('../../services/AnimalService.js').default || require('../../services/AnimalService.js');
const EconomyService = require('../../services/EconomyService').default || require('../../services/EconomyService');

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
    const rarityEntries = userAnimals instanceof Map ? userAnimals.entries() : Object.entries(userAnimals);
    for (const [rarity, rarityAnimals] of rarityEntries) {
      const animalEntries = rarityAnimals instanceof Map ? rarityAnimals.entries() : Object.entries(rarityAnimals || {});
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

    const sellAll = args[0].toLowerCase() === 'all';

    if (sellAll) {
      // Sell all animals
      let totalValue = 0;
      let pokemonSold = 0;
      const soldPokemon = [];

      const rarityEntriesAll = userAnimals instanceof Map ? userAnimals.entries() : Object.entries(userAnimals);
      for (const [rarity, animals] of rarityEntriesAll) {
        const animalEntries =
          animals instanceof Map ? animals.entries() : Object.entries(animals);
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
    } else {
      // Sell specific animal
      const animalName = args.join(' ').toLowerCase();
      let foundAnimal = null;
      let foundRarity = null;
      let foundKey = null;

      // Search for the animal in user's collection with Map-safe logic! (｡♥‿♥｡)
      const rarityEntriesSingle = userAnimals instanceof Map ? userAnimals.entries() : Object.entries(userAnimals);
      for (const [rarity, animals] of rarityEntriesSingle) {
        const animalEntries =
          animals instanceof Map ? animals.entries() : Object.entries(animals);
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

      const imageUrl = await AnimalService.getPokemonImage(foundKey);
      const rarityInfo = config.hunting.rarities[foundRarity];
      const { getRarityEmoji } = require('../../utils/images.js');
      const rarityEmoji = getRarityEmoji(foundRarity, client);

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

      if (imageUrl) embed.setThumbnail(imageUrl);

      // Update command usage statistics
      await database.updateStats(message.author.id, 'command');

      return message.reply({ embeds: [embed] });
    }
  },
};
