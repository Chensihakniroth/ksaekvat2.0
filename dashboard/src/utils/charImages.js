/**
 * charImages.js — fetch character ICONS from Fandom wikis (async, cached)
 *
 * Wiki sources:
 *   Genshin → genshin-impact.fandom.com     File:{Name}_Icon.png
 *   HSR     → honkai-star-rail.fandom.com   File:Character_{Name}_Icon.png
 *   WuWa    → wutheringwaves.fandom.com     File:Resonator_{Name}.png
 *   ZZZ     → zenless-zone-zero.fandom.com  File:Agent_{Name}_Icon.png
 */

// ─── Wiki config per game ────────────────────────────────────────────────────
const WIKI_CONFIG = {
  genshin: {
    wiki: 'genshin-impact',
    // File: {wikiName}_Icon.png
    getFilename: (name) => `${toWikiName_GI(name)}_Icon.png`,
  },
  hsr: {
    wiki: 'honkai-star-rail',
    // File: Character_{wikiName}_Icon.png
    getFilename: (name) => `Character_${toWikiName_HSR(name)}_Icon.png`,
  },
  wuwa: {
    wiki: 'wutheringwaves',
    // File: Resonator_{Name}.png
    getFilename: (name) => `Resonator_${toWikiName_WuWa(name)}.png`,
  },
  zzz: {
    wiki: 'zenless-zone-zero',
    // File: Agent_{Name}_Icon.png
    getFilename: (name) => `Agent_${toWikiName_ZZZ(name)}_Icon.png`,
  },
};

// ─── Name normalisation helpers ──────────────────────────────────────────────

// Genshin: display name → wiki asset name (spaces → underscores, special cases)
const GI_OVERRIDES = {
  'Hu Tao':               'Hu_Tao',
  'Yae Miko':             'Yae_Miko',
  'Kaedehara Kazuha':     'Kaedehara_Kazuha',
  'Kamisato Ayaka':       'Kamisato_Ayaka',
  'Kamisato Ayato':       'Kamisato_Ayato',
  'Raiden Shogun':        'Raiden_Shogun',
  'Sangonomiya Kokomi':   'Sangonomiya_Kokomi',
  'Shikanoin Heizou':     'Shikanoin_Heizou',
  'Yun Jin':              'Yun_Jin',
  'Kujou Sara':           'Kujou_Sara',
  'Lan Yan':              'Lan_Yan',
  'Dan Heng':             'Dan_Heng',
};
function toWikiName_GI(name) {
  return GI_OVERRIDES[name] || name.replace(/ /g, '_');
}

// HSR: display name → wiki name (spaces → underscores, special chars stripped)
const HSR_OVERRIDES = {
  'Dan Heng • IL': 'Dan_Heng_Imbibitor_Lunae',
  'Topaz & Numby': 'Topaz_and_Numby',
  'Dr. Ratio':     'Dr._Ratio',
  'The Herta':     'The_Herta',
};
function toWikiName_HSR(name) {
  return HSR_OVERRIDES[name] || name.replace(/ /g, '_');
}

// WuWa: display name → wiki name
const WUWA_OVERRIDES = {
  'Rover (Spectro/Havoc/Aero)': 'Rover',
  'Xiangli Yao':  'Xiangli_Yao',
  'Luuk Herssen': 'Luuk_Herssen',
};
function toWikiName_WuWa(name) {
  return WUWA_OVERRIDES[name] || name.replace(/ /g, '_');
}

// ZZZ: display name → wiki name
const ZZZ_OVERRIDES = {
  'Hoshimi Miyabi':  'Miyabi',
  'Koleda Belobog':  'Koleda',
  'Soldier 0 - Anby':'Soldier_0_-_Anby',
  'Orphie & Magus':  'Orphie_%26_Magus',
};
function toWikiName_ZZZ(name) {
  return ZZZ_OVERRIDES[name] || name.replace(/ /g, '_');
}

// ─── Fandom MediaWiki API fetcher ────────────────────────────────────────────

// Module-level URL cache: `${game}:${name}` → CDN URL string | null
const _cache = new Map();
// In-flight promise cache to avoid duplicate simultaneous fetches
const _inFlight = new Map();

/**
 * Fetch the icon CDN URL for a character from the appropriate Fandom wiki.
 * Results are cached forever for the lifecycle of the page.
 *
 * @param {string} name  — display name (e.g. "Hu Tao")
 * @param {string} game  — one of: genshin | hsr | wuwa | zzz
 * @returns {Promise<string|null>}
 */
export async function fetchFandomIconUrl(name, game) {
  if (!name || !game) return null;

  const config = WIKI_CONFIG[game];
  if (!config) return null;

  const cacheKey = `${game}:${name}`;

  // Return cached result
  if (_cache.has(cacheKey)) return _cache.get(cacheKey);

  // Return in-flight promise (deduplicate parallel calls for same char)
  if (_inFlight.has(cacheKey)) return _inFlight.get(cacheKey);

  const promise = (async () => {
    try {
      const filename = config.getFilename(name);
      const apiUrl = `https://${config.wiki}.fandom.com/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&format=json&origin=*`;

      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const pages = data?.query?.pages;
      if (!pages) return null;

      const page = Object.values(pages)[0];
      // page.missing === '' means file not found on wiki
      if (page.missing !== undefined) return null;

      const url = page.imageinfo?.[0]?.url || null;
      _cache.set(cacheKey, url);
      return url;
    } catch (err) {
      console.warn(`[charImages] API fetch failed for ${name} (${game}), using Special:FilePath fallback.`, err);
      // Fallback: Use Special:FilePath which Wikia handles as a redirect in browsers
      const filename = config.getFilename(name);
      const fallbackUrl = `https://${config.wiki}.fandom.com/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
      _cache.set(cacheKey, fallbackUrl); 
      return fallbackUrl;
    } finally {
      _inFlight.delete(cacheKey);
    }
  })();

  _inFlight.set(cacheKey, promise);
  return promise;
}

export function getFallbackEmoji(rarity) {
  return rarity === '5' ? '⭐' : '✨';
}
