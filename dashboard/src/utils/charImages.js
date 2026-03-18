/**
 * Character Icon URL generator
 *
 * Sources:
 *  Genshin → enka.network CDN (fast, community-maintained)
 *  HSR     → Mar-7th StarRailRes GitHub CDN (name → numeric ID map)
 *  Wuwa    → wutheringwaves.fandom.com CDN (Resonator_{Name}.png)
 *  ZZZ     → zenless-zone-zero.fandom.com CDN (Agent_{Name}_Icon.png)
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

// ── ZZZ: Fandom CDN — File:Agent_{Name}_Icon.png ─────────────────────────────
// Wiki name differs from display name for some characters
const ZZZ_WIKI_NAME = {
  'Hoshimi Miyabi':  'Miyabi',
  'Koleda Belobog':  'Koleda',
  'Nangong Yu':      'Nangong Yu',
  'Soldier 0 - Anby':'Soldier 0 - Anby',
};

const HSR_BASE  = 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/icon/character';
const ZZZ_CDN   = 'https://static.wikia.nocookie.net/zenless-zone-zero/images';
const WUWA_CDN  = 'https://static.wikia.nocookie.net/wutheringwaves/images';


export function getCharacterImageUrl(name, game) {
  if (!name || !game) return null;

  // Genshin Impact — enka.network
  if (game === 'genshin') {
    const assetName = GI_MAP[name] || name.replace(/['\s]/g, '');
    return `https://enka.network/ui/UI_AvatarIcon_${assetName}.png`;
  }

  // Honkai: Star Rail — Mar-7th StarRailRes
  if (game === 'hsr') {
    let id = HSR_IDS[name];
    if (!id) {
      const fuzzy = name.replace(/[•\.\s]/g, '').toLowerCase();
      for (const [k, v] of Object.entries(HSR_IDS)) {
        if (k.replace(/[•\.\s]/g, '').toLowerCase() === fuzzy) { id = v; break; }
      }
    }
    if (id) return `${HSR_BASE}/${id}.png`;
    return null;
  }

  // Wuthering Waves — wutheringwaves Fandom CDN
  // File pattern: Resonator_{Name}.png
  if (game === 'wuwa') {
    const wikiName = name.includes('Rover') ? 'Rover' : name;
    const filename = `Resonator_${wikiName.replace(/ /g, '_')}.png`;
    // Use /revision/latest which always serves the current version
    return `${WUWA_CDN}/thumb/latest/${filename}/revision/latest`;
  }

  // Zenless Zone Zero — ZZZ Fandom CDN
  // File pattern: Agent_{Name}_Icon.png
  if (game === 'zzz') {
    const wikiName = ZZZ_WIKI_NAME[name] || name;
    const filename = `Agent_${wikiName.replace(/ /g, '_')}_Icon.png`;
    return `${ZZZ_CDN}/thumb/latest/${filename}/revision/latest`;
  }

  return null;
}

export function getFallbackEmoji(rarity) {
  return rarity === '5' ? '⭐' : '✨';
}
