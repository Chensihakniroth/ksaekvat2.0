import { useState } from 'react';
import { getFallbackEmoji } from '../utils/charImages.js';

export default function CharIcon({ name, game, rarity, emoji, className = "char-icon-img" }) {
  const iconUrl = `/api/characters/icon/${encodeURIComponent(game?.toLowerCase() || 'unknown')}/${encodeURIComponent(name)}`;
  const [error, setError] = useState(false);

  if (error || !name) {
    return (
      <div className="char-icon-fallback">
        {emoji || getFallbackEmoji(rarity)}
      </div>
    );
  }

  return (
    <img
      src={iconUrl}
      alt={name}
      className={className}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={() => {
        console.warn(`[CharIcon] Failed to load icon for ${name}. Falling back to emoji.`);
        setError(true);
      }}
      loading="lazy"
    />
  );
}
