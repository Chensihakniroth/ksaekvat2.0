import { useState, useMemo } from 'react';
import { getFallbackEmoji } from '../utils/charImages.js';

// Pre-import all local character icons to resolve them dynamically
const localIcons = import.meta.glob('../assets/char_icon/**/*.png', { eager: true });

export default function CharIcon({ name, game, rarity, emoji, className = "char-icon-img" }) {
  const [error, setError] = useState(false);

  // 1. Determine local path if possible
  // Pattern: ../assets/char_icon/[game]/[rarity]/[Name_With_Underscores].png
  const localUrl = useMemo(() => {
    if (!name || !game || !rarity) return null;
    
    const g = game.toLowerCase();
    const r = String(rarity);
    const n = name.replace(/ /g, '_');
    
    // Check various path possibilities
    const path = `../assets/char_icon/${g}/${r}/${n}.png`;
    return localIcons[path]?.default || null;
  }, [name, game, rarity]);

  // 2. Determine proxy URL as fallback
  const proxyUrl = `/api/characters/icon/${encodeURIComponent(game?.toLowerCase() || 'unknown')}/${encodeURIComponent(name)}`;

  if (error || !name) {
    return (
      <div className="char-icon-fallback">
        {emoji || getFallbackEmoji(rarity)}
      </div>
    );
  }

  return (
    <img
      src={localUrl || proxyUrl}
      alt={name}
      className={className}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={() => {
        if (!localUrl) {
          console.warn(`[CharIcon] Failed to load icon for ${name}. Falling back to emoji.`);
          setError(true);
        }
      }}
      loading="lazy"
    />
  );
}
