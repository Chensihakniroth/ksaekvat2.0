/**
 * IMAGE UTILITY
 * Centralized logic for fetching character splash arts and assets.
 */

function getCharacterImage(char) {
  if (!char) return 'https://api.dicebear.com/7.x/bottts/svg?seed=Unknown';

  let name = char.name.replace(/\s+/g, '_');
  const game = char.game?.toLowerCase();

  // --- SPECIAL CASE MAPPINGS ---
  const hsrMapping = {
    'Dan_Heng_•_IL': 'Dan_Heng_•_Imbibitor_Lunae',
    'Dan_Heng_•_Imbibitor_Lunae': 'Dan_Heng_•_Imbibitor_Lunae',
    March_7th: 'March_7th',
    'Dr._Ratio': 'Dr._Ratio',
    Topaz: 'Topaz_&_Numby',
    'Trailblazer_(Physical)': 'Trailblazer',
    'Trailblazer_(Fire)': 'Trailblazer',
    'Trailblazer_(Imaginary)': 'Trailblazer',
  };

  const genshinMapping = {
    Raiden_Shogun: 'Raiden_Shogun',
    Kuki_Shinobu: 'Kuki_Shinobu',
    Ayaka: 'Kamisato_Ayaka',
    Itto: 'Arataki_Itto',
    Ayato: 'Kamisato_Ayato',
    Kokomi: 'Sangonomiya_Kokomi',
    Heizou: 'Shikanoin_Heizou',
    Kazuha: 'Kaedehara_Kazuha',
    Sara: 'Kujou_Sara',
    Shinobu: 'Kuki_Shinobu',
    'Traveler_(Aether)': 'Traveler',
    'Traveler_(Lumine)': 'Traveler',
  };

  const wuwaMapping = {
    Rover: 'Rover_(Spectro)',
    The_Shorekeeper: 'The_Shorekeeper',
    Shorekeeper: 'The_Shorekeeper',
  };

  const zzzMapping = {
    Ellen_Joe: 'Ellen_Joe',
    Zhu_Yuan: 'Zhu_Yuan',
    Jane_Doe: 'Jane_Doe',
    Caesar_King: 'Caesar_King',
    Burnice_White: 'Burnice_White',
    Hoshimi_Miyabi: 'Hoshimi_Miyabi',
    Von_Lycaon: 'Von_Lycaon',
    Soldier_11: 'Soldier_11',
  };

  if (game === 'hsr' && hsrMapping[name]) name = hsrMapping[name];
  else if (game === 'genshin' && genshinMapping[name]) name = genshinMapping[name];
  else if (game === 'wuwa' && wuwaMapping[name]) name = wuwaMapping[name];
  else if (game === 'zzz' && zzzMapping[name]) name = zzzMapping[name];

  const width = '?width=1000';

  if (game === 'genshin') {
    return `https://genshin-impact.fandom.com/wiki/Special:FilePath/Character_${name}_Splash_Art.png${width}`;
  } else if (game === 'hsr') {
    return `https://honkai-star-rail.fandom.com/wiki/Special:FilePath/${name}_Splash_Art.png${width}`;
  } else if (game === 'wuwa') {
    return `https://wutheringwaves.fandom.com/wiki/Special:FilePath/${name}_Splash_Art.png${width}`;
  } else if (game === 'zzz') {
    return `https://zenless-zone-zero.fandom.com/wiki/Special:FilePath/Agent_${name}_Portrait.png${width}`;
  }

  return `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`;
}

function getCharacterIcon(char) {
  if (!char) return 'https://api.dicebear.com/7.x/bottts/svg?seed=Unknown';

  let name = char.name.replace(/\s+/g, '_');
  const game = char.game?.toLowerCase();

  // --- SPECIAL CASE MAPPINGS ---
  const hsrMapping = {
    'Dan_Heng_•_IL': 'Dan_Heng_•_Imbibitor_Lunae',
    March_7th: 'March_7th',
    'Dr._Ratio': 'Dr._Ratio',
    Topaz: 'Topaz_&_Numby',
    'Trailblazer_(Physical)': 'Trailblazer',
    'Trailblazer_(Fire)': 'Trailblazer',
    'Trailblazer_(Imaginary)': 'Trailblazer',
  };

  const genshinMapping = {
    Raiden_Shogun: 'Raiden_Shogun',
    Ayaka: 'Kamisato_Ayaka',
    Itto: 'Arataki_Itto',
    Ayato: 'Kamisato_Ayato',
    Kokomi: 'Sangonomiya_Kokomi',
    Heizou: 'Shikanoin_Heizou',
    Kazuha: 'Kaedehara_Kazuha',
    Sara: 'Kujou_Sara',
    Shinobu: 'Kuki_Shinobu',
  };

  const wuwaMapping = {
    Rover: 'Rover_(Spectro)',
    The_Shorekeeper: 'The_Shorekeeper',
    Shorekeeper: 'The_Shorekeeper',
  };

  const zzzMapping = {
    Anby_Demara: 'Anby_Demara',
    Ellen_Joe: 'Ellen_Joe',
    Zhu_Yuan: 'Zhu_Yuan',
    Jane_Doe: 'Jane_Doe',
    Caesar_King: 'Caesar_King',
  };

  if (game === 'hsr' && hsrMapping[name]) name = hsrMapping[name];
  else if (game === 'genshin' && genshinMapping[name]) name = genshinMapping[name];
  else if (game === 'wuwa' && wuwaMapping[name]) name = wuwaMapping[name];
  else if (game === 'zzz' && zzzMapping[name]) name = zzzMapping[name];

  const width = '?width=200';

  if (game === 'genshin') {
    return `https://genshin-impact.fandom.com/wiki/Special:FilePath/Character_${name}_Icon.png${width}`;
  } else if (game === 'hsr') {
    return `https://honkai-star-rail.fandom.com/wiki/Special:FilePath/Character_${name}_Icon.png${width}`;
  } else if (game === 'wuwa') {
    return `https://wutheringwaves.fandom.com/wiki/Special:FilePath/${name}_Icon.png${width}`;
  } else if (game === 'zzz') {
    return `https://zenless-zone-zero.fandom.com/wiki/Special:FilePath/Agent_${name}_Portrait.png${width}`;
  }

  return `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`;
}

function getCharacterEmoji(char, client) {
  if (!char || !client) return '✨';

  // Derive emoji name: replace one or more non-alphanumeric with a single underscore
  // (Matches Python script's logic for perfect insurance! ｡♥‿♥｡)
  const emojiName = char.name.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  
  // 1. Search in Application Emojis (uploaded to the bot itself)
  let customEmoji = client.application?.emojis.cache.find(e => e.name === emojiName);

  // 2. Fallback to Guild Emojis (if uploaded to a server)
  if (!customEmoji) {
    customEmoji = client.emojis.cache.find(e => e.name === emojiName);
  }
  
  if (customEmoji) {
    return customEmoji.toString();
  }

  // Fallback to original game-based emojis if custom one isn't found
  const game = char.game?.toLowerCase();
  if (game === 'genshin') return '🍃';
  if (game === 'hsr') return '🚂';
  if (game === 'wuwa') return '🌊';
  if (game === 'zzz') return '🎮';
  
  return '✨';
}

function getRarityEmoji(rarity, client) {
  if (!client) return rarity === 5 ? '🟡' : rarity === 4 ? '🟣' : '🔵';

  const emojiName = `${rarity}_star`;
  
  // 1. Search in Application Emojis
  let customEmoji = client.application?.emojis.cache.find(e => e.name === emojiName);

  // 2. Fallback to Guild Emojis
  if (!customEmoji) {
    customEmoji = client.emojis.cache.find(e => e.name === emojiName);
  }

  if (customEmoji) {
    return customEmoji.toString();
  }

  // Fallback to standard stars
  return rarity === 5 ? '🟡' : rarity === 4 ? '🟣' : '🔵';
}

module.exports = {
  getCharacterImage,
  getCharacterIcon,
  getCharacterEmoji,
  getRarityEmoji,
};
