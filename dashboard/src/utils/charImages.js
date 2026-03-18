/**
 * Character Icon URL generator
 *
 * Sources:
 *  Genshin → enka.network CDN (fast, community-maintained)
 *  HSR     → Mar-7th StarRailRes GitHub CDN (name → numeric ID map)
 *  Wuwa    → api.resonance.rest (unofficial but reliable REST API)
 *  ZZZ     → Fandom wiki Special:FilePath redirect (img-tag safe)
 */

// ── Genshin: enka.network ────────────────────────────────────────────────────
// Asset name differs from display name for some characters
const GI_MAP = {
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
  'Baizhu': 'Baizhuer',
  'Lyney': 'Lyney',
  'Lynette': 'Lynette',
  'Xianyun': 'Liuyun',
  'Alhaitham': 'Alhatham',
  'Emilie': 'Emily',
  'Lan Yan': 'Lanyan',
  'Wanderer': 'Wanderer',
};

// ── HSR: Mar-7th StarRailRes ──────────────────────────────────────────────────
// URL: https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/icon/character/{ID}.png
const HSR_IDS = {
  'March 7th':                  1001,
  'Dan Heng':                   1002,
  'Himeko':                     1003,
  'Welt':                       1004,
  'Kafka':                      1005,
  'Silver Wolf':                1006,
  'Arlan':                      1008,
  'Asta':                       1009,
  'Herta':                      1013,
  'Archer':                     1015,
  'Bronya':                     1101,
  'Seele':                      1102,
  'Serval':                     1103,
  'Gepard':                     1104,
  'Natasha':                    1105,
  'Pela':                       1106,
  'Clara':                      1107,
  'Sampo':                      1108,
  'Hook':                       1109,
  'Lynx':                       1110,
  'Luka':                       1111,
  'Topaz & Numby':              1112,
  'Qingque':                    1201,
  'Tingyun':                    1202,
  'Luocha':                     1203,
  'Jing Yuan':                  1204,
  'Blade':                      1205,
  'Sushang':                    1206,
  'Yukong':                     1207,
  'Fu Xuan':                    1208,
  'Yanqing':                    1209,
  'Guinaifen':                  1210,
  'Bailu':                      1211,
  'Jingliu':                    1212,
  'Dan Heng • IL':              1213,
  'Xueyi':                      1214,
  'Hanya':                      1215,
  'Huohuo':                     1217,
  'Jiaoqiu':                    1218,
  'Feixiao':                    1220,
  'Lingsha':                    1222,
  'Moze':                       1223,
  'Fugue':                      1225,
  'Gallagher':                  1301,
  'Argenti':                    1302,
  'Ruan Mei':                   1303,
  'Aventurine':                 1304,
  'Dr. Ratio':                  1305,
  'Sparkle':                    1306,
  'Black Swan':                 1307,
  'Acheron':                    1308,
  'Robin':                      1309,
  'Firefly':                    1310,
  'Misha':                      1312,
  'Sunday':                     1313,
  'Jade':                       1314,
  'Boothill':                   1315,
  'Rappa':                      1317,
  'The Herta':                  1401,
  'Aglaea':                     1402,
  'Tribbie':                    1403,
  'Anaxa':                      1405,
  'Cipher':                     1406,
  'Castorice':                  1407,
  'Phainon':                    1408,
  'Hyacine':                    1409,
  'Cerydra':                    1412,
  'Sparxie':                    1501,
  'Yao Guang':                  1502,
};

// ── ZZZ: Fandom Special:FilePath (browser follows redirect) ──────────────────
const ZZZ_FILENAMES = {
  'Rina':           'Rina',
  'Anby Demara':    'Anby Demara',
  'Anton Ivanov':   'Anton',
  'Billy Kid':      'Billy Kid',
  'Burnice White':  'Burnice',
  'Caesar King':    'Caesar',
  'Corin Wickes':   'Corin',
  'Ellen Joe':      'Ellen',
  'Grace Howard':   'Grace',
  'Hoshimi Miyabi': 'Miyabi',
  'Jane Doe':       'Jane Doe',
  'Koleda Belobog': 'Koleda',
  'Lighter':        'Lighter',
  'Lucy':           'Lucy',
  'Nangong Yu':     'Harumasa',
  'Nekomata':       'Nicole', // alias
  'Nicole Demara':  'Nicole',
  'Piper Wheel':    'Piper',
  'Qingyi':         'Qingyi',
  'Seth Lowell':    'Seth',
  'Soukaku':        'Soukaku',
  'Von Lycaon':     'Von Lycaon',
  'Yanagi':         'Yanagi',
  'Zhu Yuan':       'Zhu Yuan',
  'Evelyn Chevalier': 'Evelyn',
  'Soldier 11':     'Soldier 11',
  'Astra Yao':      'Astra Yao',
};

const HSR_BASE = 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/icon/character';
const WUWA_BASE = 'https://api.resonance.rest/characters';
const ZZZ_WIKI  = 'https://zenless-zone-zero.fandom.com/wiki/Special:FilePath';

export function getCharacterImageUrl(name, game) {
  if (!name || !game) return null;

  // Genshin Impact
  if (game === 'genshin') {
    const assetName = GI_MAP[name] || name.replace(/['\s]/g, '');
    return `https://enka.network/ui/UI_AvatarIcon_${assetName}.png`;
  }

  // Honkai: Star Rail
  if (game === 'hsr') {
    // Try exact name match first, then fuzzy (remove "Dan Heng • IL" variants)
    let id = HSR_IDS[name];
    if (!id) {
      // Fuzzy: strip bullets and special chars
      const fuzzy = name.replace(/[•\.\s]/g, '').toLowerCase();
      for (const [k, v] of Object.entries(HSR_IDS)) {
        if (k.replace(/[•\.\s]/g, '').toLowerCase() === fuzzy) { id = v; break; }
      }
    }
    if (id) return `${HSR_BASE}/${id}.png`;
    return null; // Unknown HSR char → fallback to emoji
  }

  // Wuthering Waves — api.resonance.rest/{Name}/icon
  if (game === 'wuwa') {
    // Handle special name "Rover (Spectro/Havoc/Aero)" → "Rover"
    let wuwaName = name.includes('Rover') ? 'Rover' : name;
    return `${WUWA_BASE}/${encodeURIComponent(wuwaName)}/icon`;
  }

  // Zenless Zone Zero — Fandom wiki Special:FilePath
  if (game === 'zzz') {
    const filename = ZZZ_FILENAMES[name] || name;
    return `${ZZZ_WIKI}/${encodeURIComponent(filename)}_Profile.png`;
  }

  return null;
}

export function getFallbackEmoji(rarity) {
  return rarity === '5' ? '⭐' : '✨';
}
