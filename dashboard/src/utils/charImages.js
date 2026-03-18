/**
 * Returns a character icon URL from public CDNs, based on game + name.
 * Falls back to null if no URL can be constructed.
 */

// Genshin: Enka Network CDN (reliable, updated regularly)
// Names like "Hu Tao" → "Hutao", "Yae Miko" → "Yae"
const GENSHIN_OVERRIDES = {
  'Hu Tao': 'Hutao',
  'Yae Miko': 'Yae',
  'Kaedehara Kazuha': 'Kazuha',
  'Kamisato Ayaka': 'Ayaka',
  'Kamisato Ayato': 'Ayato',
  'Raiden Shogun': 'Shougun',
  'Sangonomiya Kokomi': 'Kokomi',
  'Arataki Itto': 'Itto',
  'Shikanoin Heizou': 'Heizo',
  'Yun Jin': 'Yunjin',
  'Thoma': 'Tohma',
  'Kujou Sara': 'Sara',
  'Gorou': 'Gorou',
  'Shenhe': 'Shenhe',
  'Traveler': 'PlayerBoy',
  'Wanderer': 'Wanderer',
  'Alhaitham': 'Alhatham',
  'Nahida': 'Nahida',
  'Layla': 'Layla',
  'Nilou': 'Nilou',
  'Cyno': 'Cyno',
  'Candace': 'Candace',
  'Collei': 'Collei',
  'Tighnari': 'Tighnari',
  'Dori': 'Dori',
  'Kaveh': 'Kaveh',
  'Baizhu': 'Baizhuer',
  'Lyney': 'Lyney',
  'Lynette': 'Lynette',
  'Freminet': 'Freminet',
  'Furina': 'Furina',
  'Charlotte': 'Charlotte',
  'Navia': 'Navia',
  'Chevreuse': 'Chevreuse',
  'Xianyun': 'Liuyun',
  'Gaming': 'Gaming',
  'Chiori': 'Chiori',
  'Arlecchino': 'Arlecchino',
  'Sethos': 'Sethos',
  'Clorinde': 'Clorinde',
  'Sigewinne': 'Sigewinne',
  'Emilie': 'Emily',
  'Kachina': 'Kachina',
  'Kinich': 'Kinich',
  'Mualani': 'Mualani',
  'Xilonen': 'Xilonen',
  'Chasca': 'Chasca',
  'Ororon': 'Ororon',
  'Citlali': 'Citlali',
  'Mavuika': 'Mavuika',
  'Lan Yan': 'Lanyan',
};

const HSR_OVERRIDES = {
  'Trailblazer (Fire)': 'TrailblazerFire',
  'Trailblazer (Physical)': 'TrailblazerPhysical',
  'Trailblazer (Ice)': 'TrailblazerIce',
  'Trailblazer (Harmony)': 'TrailblazerHarmony',
};

export function getCharacterImageUrl(name, game) {
  if (!name || !game) return null;

  if (game === 'genshin') {
    const mapped = GENSHIN_OVERRIDES[name] || name.replace(/\s+/g, '');
    return `https://enka.network/ui/UI_AvatarIcon_${mapped}.png`;
  }

  if (game === 'hsr') {
    // Mar-7th StarRail CDN using character name slug
    const mapped = HSR_OVERRIDES[name] || name.replace(/[\s\-'.()]/g, '');
    return `https://raw.githubusercontent.com/FrontRailgun/StarRailData/master/icon/character/${mapped}.png`;
  }

  if (game === 'wuwa') {
    // Wuthering Waves wiki: name as-is, spaces to underscores
    const slug = name.replace(/\s+/g, '_');
    return `https://wiki.wutheringwaves.gg/Special:FilePath/${slug}_Icon.png`;
  }

  if (game === 'zzz') {
    // ZZZ wiki image pattern
    const slug = name.replace(/\s+/g, '_');
    return `https://zzz.gg/wp-content/uploads/characters/${slug.toLowerCase()}.png`;
  }

  return null;
}

// Fallback emoji when image fails or is unavailable
export function getFallbackEmoji(rarity) {
  return rarity === '5' ? '⭐' : '✨';
}
