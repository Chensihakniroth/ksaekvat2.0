"use strict";
const { EmbedBuilder } = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const AnimalService = require('../../services/AnimalService.js').default || require('../../services/AnimalService.js');
module.exports = {
    name: 'buddy',
    aliases: ['kb', 'kbuddy', 'fav'],
    description: 'Set your favorite Pokémon as your profile buddy! (｡♥‿♥｡)',
    usage: 'buddy <pokemon_name>',
    async execute(message, args, client) {
        const userId = message.author.id;
        const pokemonName = args.join(' ').toLowerCase().trim();
        if (!pokemonName) {
            return message.reply('Please provide the name of the Pokémon you want to set as your buddy, darling! (｡•́︿•̀｡)');
        }
        const userData = await database.getUser(userId, message.author.username);
        const animalRegistry = await database.getAnimalRegistry();
        // Find animal by name or key
        const animal = Object.entries(animalRegistry).find(([key, data]) => key.toLowerCase() === pokemonName || data.name.toLowerCase() === pokemonName);
        if (!animal) {
            return message.reply(`I couldn't find a Pokémon named **${pokemonName}**. Are you sure you spelled it right? (・_・ヾ`);
        }
        const [animalKey, animalData] = animal;
        // Check if user owns it
        let owned = false;
        if (userData.animals) {
            // Handle both Map and plain object
            const rarities = userData.animals instanceof Map ? userData.animals : new Map(Object.entries(userData.animals));
            for (const [rarity, speciesMap] of rarities.entries()) {
                const species = speciesMap instanceof Map ? speciesMap : new Map(Object.entries(speciesMap));
                if (species.has(animalKey) && species.get(animalKey) > 0) {
                    owned = true;
                    break;
                }
            }
        }
        if (!owned) {
            return message.reply(`You don't have a **${animalData.emoji} ${animalData.name}** in your Zoo yet! Go hunt one first! (≧◡≦)`);
        }
        // Set as favorite
        const success = await database.setFavorite(userId, 'animal', animalKey);
        if (success) {
            const pokemonImageUrl = await AnimalService.getPokemonImage(animalKey);
            const embed = new EmbedBuilder()
                .setColor(colors.primary)
                .setTitle('✨ New Buddy Set!')
                .setDescription(`Your profile buddy has been set to **${animalData.emoji} ${animalData.name}**! It looks so cute on your trainer card! (｡♥‿♥｡)`)
                .setThumbnail(pokemonImageUrl || client.user.displayAvatarURL());
            return message.reply({ embeds: [embed] });
        }
        else {
            return message.reply('Something went wrong while setting your buddy... (ಥ﹏ಥ)');
        }
    },
};
