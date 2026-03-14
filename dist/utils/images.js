"use strict";
/**
 * IMAGE UTILITY
 * Centralized logic for fetching character splash arts and assets.
 */
function getCharacterImage(char) {
    if (!char)
        return 'https://api.dicebear.com/7.x/bottts/svg?seed=Unknown';
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
    if (game === 'hsr' && hsrMapping[name])
        name = hsrMapping[name];
    else if (game === 'genshin' && genshinMapping[name])
        name = genshinMapping[name];
    else if (game === 'wuwa' && wuwaMapping[name])
        name = wuwaMapping[name];
    else if (game === 'zzz' && zzzMapping[name])
        name = zzzMapping[name];
    const width = '?width=1000';
    if (game === 'genshin') {
        return `https://genshin-impact.fandom.com/wiki/Special:FilePath/Character_${name}_Splash_Art.png${width}`;
    }
    else if (game === 'hsr') {
        return `https://honkai-star-rail.fandom.com/wiki/Special:FilePath/${name}_Splash_Art.png${width}`;
    }
    else if (game === 'wuwa') {
        return `https://wutheringwaves.fandom.com/wiki/Special:FilePath/${name}_Splash_Art.png${width}`;
    }
    else if (game === 'zzz') {
        return `https://zenless-zone-zero.fandom.com/wiki/Special:FilePath/Agent_${name}_Portrait.png${width}`;
    }
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`;
}
function getCharacterIcon(char) {
    if (!char)
        return 'https://api.dicebear.com/7.x/bottts/svg?seed=Unknown';
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
    if (game === 'hsr' && hsrMapping[name])
        name = hsrMapping[name];
    else if (game === 'genshin' && genshinMapping[name])
        name = genshinMapping[name];
    else if (game === 'wuwa' && wuwaMapping[name])
        name = wuwaMapping[name];
    else if (game === 'zzz' && zzzMapping[name])
        name = zzzMapping[name];
    const width = '?width=200';
    if (game === 'genshin') {
        return `https://genshin-impact.fandom.com/wiki/Special:FilePath/Character_${name}_Icon.png${width}`;
    }
    else if (game === 'hsr') {
        return `https://honkai-star-rail.fandom.com/wiki/Special:FilePath/Character_${name}_Icon.png${width}`;
    }
    else if (game === 'wuwa') {
        return `https://wutheringwaves.fandom.com/wiki/Special:FilePath/${name}_Icon.png${width}`;
    }
    else if (game === 'zzz') {
        return `https://zenless-zone-zero.fandom.com/wiki/Special:FilePath/Agent_${name}_Portrait.png${width}`;
    }
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`;
}
function getItemEmoji(item, client) {
    if (!item || !client)
        return '✨';
    // Derive emoji name: replace one or more non-alphanumeric with a single underscore
    const emojiName = item.name.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    // 1. Search in Application Emojis
    let customEmoji = client.application?.emojis.cache.find(e => e.name === emojiName);
    // 2. Fallback to Guild Emojis
    if (!customEmoji) {
        customEmoji = client.emojis.cache.find(e => e.name === emojiName);
    }
    if (customEmoji) {
        return customEmoji.toString();
    }
    // Fallback to original game-based emojis if custom one isn't found
    const game = item.game?.toLowerCase();
    if (game === 'genshin')
        return '🍃';
    if (game === 'hsr')
        return '🚂';
    if (game === 'wuwa')
        return '🌊';
    if (game === 'zzz')
        return '🎮';
    return '✨';
}
function getRarityEmoji(rarity, client) {
    const emojiMap = {
        priceless: '<:rarity_priceless:1482366975672975463>',
        mythical: '<:rarity_mythical:1482366970589483180>',
        legendary: '<:rarity_legendary:1482366964994408528>',
        epic: '<:rarity_epic:1482366960070164560>',
        rare: '<:rarity_rare:1482366980790157467>',
        uncommon: '<:rarity_uncommon:1482366986498605218>',
        common: '<:rarity_common:1482366954361716776>',
        // Numeric fallbacks for Gacha
        5: '<:rarity_legendary:1482366964994408528>',
        4: '<:rarity_epic:1482366960070164560>',
        3: '<:rarity_rare:1482366980790157467>',
    };
    return emojiMap[rarity] || '✨';
}
function getElementEmoji(item, client) {
    if (!item || !client || !item.element)
        return '';
    const elementName = item.element.trim().replace(/[^a-zA-Z0-9]+/g, '');
    let elementEmoji = client.application?.emojis.cache.find(e => e.name === elementName);
    if (!elementEmoji) {
        elementEmoji = client.emojis.cache.find(e => e.name === elementName);
    }
    if (elementEmoji) {
        return elementEmoji.toString();
    }
    // Fallback Unicode emojis by element name
    const fallbacks = {
        Fire: '🔥',
        Frozen: '❄️',
        Nature: '🌿',
        Lightning: '⚡',
        Dark: '🌑',
        Light: '✨',
        Physical: '💢',
        Ether: '🔮',
        Ice: '❄️',
        Wind: '🌬️',
        Geo: '🪨',
        Electro: '⚡',
        Hydro: '💧',
        Pyro: '🔥',
        Cryo: '❄️',
        Anemo: '🌬️',
        Dendro: '🌿',
    };
    return fallbacks[elementName] || '';
}
function getRoleEmoji(role, client) {
    if (!role || !client)
        return '';
    // Normalize: trim, uppercase for lookup
    const roleName = role.trim().toUpperCase().replace(/[-\s]+/g, '_');
    // Map common variants to emoji names
    const nameMap = {
        'DPS': 'DPS',
        'S_DPS': 'SDPS',
        'SDPS': 'SDPS',
        'SUPPORT': 'SUPPORT',
        'HEAL': 'HEAL',
        'HEALER': 'HEAL',
        'TANK': 'TANK',
    };
    const emojiName = nameMap[roleName] || roleName;
    let customEmoji = client.application?.emojis.cache.find(e => e.name === emojiName);
    if (!customEmoji) {
        customEmoji = client.emojis.cache.find(e => e.name === emojiName);
    }
    if (customEmoji)
        return customEmoji.toString();
    // Unicode fallbacks
    const fallbacks = {
        'DPS': '⚔️',
        'SDPS': '🗡️',
        'SUPPORT': '🔮',
        'HEAL': '💚',
        'HEALER': '💚',
        'TANK': '🛡️',
    };
    return fallbacks[roleName] || '✨';
}
module.exports = {
    getCharacterImage,
    getCharacterIcon,
    getItemEmoji,
    getRarityEmoji,
    getElementEmoji,
    getRoleEmoji,
};
