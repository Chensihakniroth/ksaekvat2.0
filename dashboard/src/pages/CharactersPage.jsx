import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Sparkles, Globe, Sword, Train, Tv, Waves } from 'lucide-react';
import { getCharacterImageUrl, getFallbackEmoji } from '../utils/charImages.js';

const GAMES = {
  all:    { label: 'All Games', icon: Globe },
  genshin:{ label: 'Genshin',   icon: Sword,  badge: 'bg-green/10 text-green border-green/20' },
  hsr:    { label: 'HSR',       icon: Train,  badge: 'bg-pink/10 text-pink border-pink/20' },
  wuwa:   { label: 'Wuwa',      icon: Waves,  badge: 'bg-cyan/10 text-cyan border-cyan/20' },
  zzz:    { label: 'ZZZ',       icon: Tv,     badge: 'bg-gold/10 text-gold border-gold/20' },
};

function CharIcon({ name, game, rarity, emoji }) {
  const [failed, setFailed] = useState(false);
  const url = getCharacterImageUrl(name, game);

  if (!url || failed) {
    return (
      <div className="char-icon-fallback-v3">
        {emoji || getFallbackEmoji(rarity)}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={name}
      className="char-icon-img-v3"
      onError={() => setFailed(true)}
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
    (game === 'all' || c.game === game) &&
    (rarity === 'all' || String(c.rarity) === rarity) &&
    (!search || c.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="page"
    >
      <div className="wrap">
        <div className="ph-v3">
          <h1>🎭 <span className="grad">Character Gallery</span></h1>
          <p>Explore {all.length} unique characters. Use Star Dust ✨ to unlock them in-game.</p>
        </div>

        {/* Search & Filters */}
        <div className="card-glass p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-3" size={18} />
              <input
                className="input-v3 w-full pl-12"
                placeholder="Search characters by name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                {Object.entries(GAMES).map(([k,v]) => {
                  const Icon = v.icon;
                  return (
                    <button 
                      key={k} 
                      className={`btn-tab-v3 px-4 py-2 flex items-center gap-2 ${game === k ? 'active' : ''}`}
                      onClick={() => setGame(k)}
                    >
                      <Icon size={14} />
                      <span className="hidden lg:inline">{v.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
             <button className={`btn-tab-v3 ${rarity==='all'?'active':''}`} onClick={() => setRarity('all')}>All Rarities</button>
             <button className={`btn-tab-v3 ${rarity==='5'?'active':''}`} onClick={() => setRarity('5')}>⭐ 5-Star</button>
             <button className={`btn-tab-v3 ${rarity==='4'?'active':''}`} onClick={() => setRarity('4')}>✨ 4-Star</button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6 px-2">
          <p className="text-xs font-bold uppercase tracking-widest text-text-3">
            Showing <span className="text-text">{filtered.length}</span> of {all.length} Characters
          </p>
        </div>

        {loading ? (
          <div className="grid-chars">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="card-glass aspect-[4/5] loading-shimmer" />
            ))}
          </div>
        ) : (
          <motion.div 
            layout
            className="grid-chars"
          >
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-20 text-center"
                >
                  <div className="text-4xl mb-4">😶</div>
                  <p className="text-text-3 font-bold uppercase tracking-widest text-xs">No characters found</p>
                </motion.div>
              ) : filtered.map((c) => {
                  const gInfo = GAMES[c.game] || {};
                  return (
                    <motion.div
                      layout
                      key={c.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className={`card-glass char-card-v3 rarity-border-${c.rarity}`}
                    >
                      <div className="char-img-wrap-v3">
                        <CharIcon name={c.name} game={c.game} rarity={c.rarity} emoji={c.emoji} />
                        <div className="char-rarity-badge">
                          {c.rarity}★
                        </div>
                      </div>
                      <div className="p-4 text-center">
                        <h3 className="font-bold text-sm mb-2 truncate">{c.name}</h3>
                        <div className="flex flex-wrap justify-center gap-1.5 mb-3">
                          {c.game && (
                            <span className={`badge-v3 ${gInfo.badge || 'bg-white/5'}`}>
                              {c.game.toUpperCase()}
                            </span>
                          )}
                          {c.element && (
                            <span className="badge-v3 bg-white/5 text-text-3">
                              {c.element}
                            </span>
                          )}
                        </div>
                        <div className="text-gold font-black text-sm flex items-center justify-center gap-1">
                          <Sparkles size={12} />
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

      <style>{`
        .grid-chars {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 16px;
        }
        .input-v3 {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 12px 16px;
          color: var(--text);
          font-family: inherit;
          font-weight: 600;
          outline: none;
          transition: all 0.2s;
        }
        .input-v3:focus {
          border-color: var(--purple);
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
        }
        .char-card-v3 {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .char-img-wrap-v3 {
          position: relative;
          aspect-ratio: 1;
          overflow: hidden;
          background: var(--bg-3);
        }
        .char-icon-img-v3 {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .char-card-v3:hover .char-icon-img-v3 {
          transform: scale(1.1);
        }
        .char-rarity-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          padding: 2px 8px;
          border-radius: 100px;
          font-size: 10px;
          font-weight: 800;
          color: var(--gold);
          border: 1px solid rgba(251, 191, 36, 0.3);
        }
        .char-icon-fallback-v3 {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
        }
        .rarity-border-5 { border-color: rgba(251, 191, 36, 0.2); }
        .rarity-border-4 { border-color: rgba(139, 92, 246, 0.2); }
        
        .col-span-full { grid-column: 1 / -1; }
        .w-full { width: 100%; }
        .pl-12 { padding-left: 3rem; }
      `}</style>
    </motion.div>
  );
}
