/**
 * charImages.js — simplified utility that routes icon requests to the backend proxy
 */

/**
 * Get the proxy URL for a character icon.
 * @param {string} name 
 * @param {string} game 
 * @returns {string}
 */
export function getCharacterIconUrl(name, game) {
  if (!name || !game) return null;
  return `/api/characters/icon/${encodeURIComponent(game.toLowerCase())}/${encodeURIComponent(name)}`;
}

export function getFallbackEmoji(rarity) {
  return rarity === '5' ? '⭐' : '✨';
}

// Keep export for backward compatibility during transition if needed
export async function fetchFandomIconUrl(name, game) {
  return getCharacterIconUrl(name, game);
}
