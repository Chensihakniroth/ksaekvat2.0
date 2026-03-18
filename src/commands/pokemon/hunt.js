const { EmbedBuilder } = require('discord.js');
const database = require('../../services/DatabaseService');
const colors = require('../../utils/colors.js');
const config = require('../../config/config.js');
const AnimalService = require('../../services/AnimalService.js').default || require('../../services/AnimalService.js');

module.exports = {
  name: 'hunt',
  aliases: ['hunting', 'catch'],
  description: 'Hunt for Pokémon. Chance for Loot Boxes!',
  usage: 'hunt',
  cooldown: 10000,
  async execute(message, args, client) {
    try { await message.channel.sendTyping(); } catch (_) {}
    
    // Parallelize DB calls for speed! (｡♥‿♥｡)
    const [userData, animalsData] = await Promise.all([
      database.getUser(message.author.id, message.author.username),
      database.loadAnimals()
    ]);

    // Check for active one-time balls
    const boosters = userData.boosters || new Map();
    const activePokeball = boosters.get('pokeball')?.active && boosters.get('pokeball')?.oneTime;
    const activeUltraball = boosters.get('ultraball')?.active && boosters.get('ultraball')?.oneTime;
    const activeMasterball = boosters.get('masterball')?.active && boosters.get('masterball')?.oneTime;

    const activeBall = activeMasterball || activeUltraball || activePokeball;
    let activeBallType = activeMasterball ? 'masterball' : activeUltraball ? 'ultraball' : activePokeball ? 'pokeball' : null;

    let distractionChance = config.hunting.distractionChance;
    if (activeMasterball || activeUltraball) distractionChance = 0;
    else if (activePokeball) distractionChance = 0.1;

    if (Math.random() < distractionChance) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.warning)
            .setTitle('(っ˘ω˘ς) Oh no, little one...')
            .setDescription(
              "You got a little distracted and didn't catch any Pokémon this time. Mommy's here to comfort you! (っ˘ω˘ς)"
            ),
        ],
      });
    }

    // --- RARITY LOGIC ---
    const rarities = config.hunting.rarities;
    let totalWeight = 0;
    for (const [key, r] of Object.entries(rarities)) {
      // Filter rarities based on active ball
      if (activeMasterball || activeUltraball) {
        if (!['epic', 'legendary', 'mythical', 'priceless'].includes(key)) continue;
      }

      let weight = r.weight;
      // Master ball has 5x mythical chance
      if (activeMasterball && key === 'mythical') weight *= 5;

      totalWeight += weight;
    }

    const random = Math.random() * totalWeight;
    let currentWeight = 0;
    let selectedRarity = 'common';

    for (const [key, r] of Object.entries(rarities)) {
      if (activeMasterball || activeUltraball) {
        if (!['epic', 'legendary', 'mythical', 'priceless'].includes(key)) continue;
      }

      let weight = r.weight;
      if (activeMasterball && key === 'mythical') weight *= 5;

      currentWeight += weight;
      if (random <= currentWeight) {
        selectedRarity = key;
        break;
      }
    }

    const available = animalsData[selectedRarity];
    if (!available || Object.keys(available).length === 0) {
      return message.reply(
        "(｡•́︿•̀｡) Mommy can't find any Pokémon right now. Something is wrong... (っ˘ω˘ς)"
      );
    }
    const animalKey =
      Object.keys(available)[Math.floor(Math.random() * Object.keys(available).length)];
    const animal = available[animalKey];

    // --- REWARDS ---
    const catchResult = await database.addAnimal(message.author.id, animalKey, selectedRarity);
    const expReward = Math.floor(rarities[selectedRarity].value / 25) + 5;
    const expRes = await database.addExperience(message.author.id, expReward);

    // Consume the ball flag (One-time use!)
    if (activeBallType) {
        await database.clearOneTimeBall(message.author.id, activeBallType);
    }

    const imgData = await AnimalService.getPokemonImageBuffer(animalKey);
    const files = [];
    
    let statusText = '';
    if (activeMasterball) statusText += ` | 🟣 Master Ball Active`;
    else if (activeUltraball) statusText += ` | 🟡 Ultraball Active`;
    else if (activePokeball) statusText += ` | ⚪ Pokeball Active`;

    const { getRarityEmoji } = require('../../utils/images.js');
    const rarityEmoji = getRarityEmoji(selectedRarity, client);

    const embed = new EmbedBuilder()
      .setColor(parseInt(rarities[selectedRarity].color.slice(1), 16))
      .setTitle(`${rarityEmoji} ${animal.name}`)
      .setDescription(`*${rarities[selectedRarity].name} Rarity*`)
      .setFooter({ text: `+${expReward} XP${statusText}${expRes.leveledUp ? ` | 🎊 Rank Up: ${expRes.newLevel}!` : ''}` });

    if (imgData) {
        const attachment = new (require('discord.js').AttachmentBuilder)(imgData.buffer, { name: imgData.fileName });
        embed.setImage(`attachment://${imgData.fileName}`);
        files.push(attachment);
    }

    await database.updateStats(message.author.id, 'command');
    await database.updateStats(message.author.id, 'hunt_success', 1);
    
    // Update Quest Progress! (｡♥‿♥｡)
    const QuestService = require('../../services/QuestService').default || require('../../services/QuestService');
    await QuestService.updateProgress(message.author.id, 'HUNT', 1);

    message.reply({ embeds: [embed], files });
  },
};
