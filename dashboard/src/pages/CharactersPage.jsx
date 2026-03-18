import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Globe, Sword, Train, Tv, Waves } from 'lucide-react';
import { fetchFandomIconUrl, getFallbackEmoji } from '../utils/charImages.js';
import './CharactersPage.css';

const GAMES = {
  all:    { label: 'All Games', icon: Globe },
  genshin:{ label: 'Genshin',   icon: Sword,  badge: 'badge-genshin' },
  hsr:    { label: 'HSR',       icon: Train,  badge: 'badge-hsr' },
  wuwa:   { label: 'Wuwa',      icon: Waves,  badge: 'badge-wuwa' },
  zzz:    { label: 'ZZZ',       icon: Tv,     badge: 'badge-zzz' },
};

function CharIcon({ name, game, rarity, emoji }) {
  const [iconUrl, setIconUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setIconUrl(null);

    fetchFandomIconUrl(name, game).then((url) => {
      if (!cancelled) {
        setIconUrl(url);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [name, game]);

  if (loading) {
    return <div className="char-icon-fallback loading-shimmer" style={{ background: 'rgba(255,255,255,0.05)' }} />;
  }

  if (!iconUrl) {
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
      className="char-icon-img"
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={() => {
        console.error(`[CharIcon] Failed to load: ${name} (${game}) - URL: ${iconUrl}`);
        setIconUrl(null);
      }}
      loading="lazy"
    />
  );
}

export default function CharactersPage() {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState('all');
  const [rarity, setRarity] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/characters')
      .then(r => r.json())
      .then(res => { if (res.success) setAll(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = all.filter(c =>
    (game === 'all' || c.game?.toLowerCase() === game) &&
    (rarity === 'all' || String(c.rarity) === rarity) &&
    (!search || c.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="page chars-page"
    >
      <div className="container">
        <div className="page-header">
          <motion.h1 className="page-title">
            🎭 <span className="text-gradient">Character Gallery</span>
          </motion.h1>
          <p className="page-subtitle">Explore {all.length} unique characters. Use Star Dust ✨ to unlock them in-game.</p>
        </div>

        {/* Search & Filters */}
        <div className="glass-card filter-card">
          <div className="filter-row">
            <div className="search-wrapper">
              <Search className="search-icon" size={20} />
              <input
                className="search-input"
                placeholder="Search characters by name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            
            <div className="game-tabs">
              {Object.entries(GAMES).map(([k,v]) => {
                const Icon = v.icon;
                return (
                  <button 
                    key={k} 
                    className={`game-tab-btn ${game === k ? 'active' : ''}`}
                    onClick={() => setGame(k)}
                  >
                    <Icon size={16} />
                    <span className="tab-label">{v.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rarity-tabs">
             <button className={`rarity-btn ${rarity==='all'?'active':''}`} onClick={() => setRarity('all')}>All Rarities</button>
             <button className={`rarity-btn ${rarity==='5'?'active':''}`} onClick={() => setRarity('5')}>⭐ 5-Star</button>
             <button className={`rarity-btn ${rarity==='4'?'active':''}`} onClick={() => setRarity('4')}>✨ 4-Star</button>
          </div>
        </div>

        <div className="results-info">
          <p>
            Showing <span>{filtered.length}</span> of {all.length} Characters
          </p>
        </div>

        {loading ? (
          <div className="chars-grid">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="glass-card skeleton-card loading-shimmer" />
            ))}
          </div>
        ) : (
          <motion.div layout className="chars-grid">
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="empty-results"
                >
                  <div className="empty-emoji">😶</div>
                  <p>No characters found</p>
                </motion.div>
              ) : filtered.map((c) => {
                  const gInfo = GAMES[c.game?.toLowerCase()] || {};
                  return (
                    <motion.div
                      layout
                      key={c.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className={`glass-card char-card rarity-border-${c.rarity}`}
                    >
                      <div className="char-img-wrapper">
                        <CharIcon name={c.name} game={c.game?.toLowerCase()} rarity={c.rarity} emoji={c.emoji} />
                        <div className={`char-rarity-badge rarity-bg-${c.rarity}`}>
                          {c.rarity}★
                        </div>
                      </div>
                      <div className="char-info">
                        <h3 className="char-name">{c.name}</h3>
                        <div className="char-badges">
                          {c.game && (
                            <span className={`game-badge ${gInfo.badge || 'badge-default'}`}>
                              {c.game.toUpperCase()}
                            </span>
                          )}
                          {c.element && (
                            <span className="element-badge">
                              {c.element}
                            </span>
                          )}
                        </div>
                        <div className="char-price">
                          <Sparkles size={14} />
                          <span>{c.shopPrice}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              }
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
