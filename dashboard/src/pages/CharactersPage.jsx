import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Globe, Sword, Train, Tv, Waves, X, Info, Shield, Zap, Target, Activity, Star } from 'lucide-react';
import CharIcon from '../components/CharIcon';

const GAMES = {
  all:    { label: 'All Systems', icon: Globe },
  genshin:{ label: 'Genshin',   icon: Sword,  color: 'text-purple-400' },
  hsr:    { label: 'HSR',       icon: Train,  color: 'text-cyan-400' },
  wuwa:   { label: 'Wuwa',      icon: Waves,  color: 'text-green-400' },
  zzz:    { label: 'ZZZ',       icon: Tv,     color: 'text-pink' },
};

function CharacterModal({ char, onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={onClose}>
      <motion.div initial={{ y: 100, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 100, opacity: 0, scale: 0.9 }} className="glass-panel modal-panel-lg neon-border" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}><X size={24} /></button>
        <div className="modal-content-split">
          <div className="modal-visual-side">
             <div className="visual-bg-glow" />
             <div className="visual-char-icon">
                <CharIcon name={char.name} game={char.game?.toLowerCase()} rarity={char.rarity} emoji={char.emoji} />
             </div>
             <div className="visual-footer">
                <div className="visual-stars">
                   {[...Array(char.rarity)].map((_, i) => <Star key={i} size={16} className="text-gold" />)}
                </div>
                <div className="visual-name glitch-text">{char.name}</div>
             </div>
          </div>
          <div className="modal-details-side">
            <div className="details-header">
              <span className="game-tag">{char.game?.toUpperCase()}</span>
              <span className="element-tag">{char.element || 'NEUTRAL'}</span>
            </div>
            <h2 className="details-subtitle">Tactical Specifications</h2>
            <div className="details-grid">
              <div className="spec-box glass-panel">
                <div className="spec-label"><Shield size={14} /> ROLE</div>
                <div className="spec-val">{char.role || 'ASSET'}</div>
              </div>
              <div className="spec-box glass-panel">
                <div className="spec-label"><Zap size={14} /> COST</div>
                <div className="spec-val">{char.shopPrice} SD</div>
              </div>
            </div>
            <div className="details-bio glass-panel">
              <p>"High-performance operative secured from the {char.game?.toUpperCase()} mainframe. Integrated with advanced neural protocols for peak combat efficiency."</p>
            </div>
            <button className="btn-v3 btn-v3-primary w-full" onClick={onClose}>
              <span>Initialize Deployment</span>
              <Target size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function CharactersPage() {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState('all');
  const [rarity, setRarity] = useState('all');
  const [search, setSearch] = useState('');
  const [displayCount, setDisplayCount] = useState(30);
  const [selectedChar, setSelectedChar] = useState(null);

  useEffect(() => {
    fetch('/api/characters').then(r => r.json()).then(res => { if (res.success) setAll(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = all.filter(c =>
    (game === 'all' || c.game?.toLowerCase() === game) &&
    (rarity === 'all' || String(c.rarity) === rarity) &&
    (!search || c.name.toLowerCase().includes(search.toLowerCase()))
  );

  const displayed = filtered.slice(0, displayCount);

  return (
    <div className="chars-container">
      <div className="wrap">
        <div className="chars-header">
          <div className="header-info">
            <div className="header-badge">
              <Target size={16} className="text-purple-400" />
              <span>Tactical Asset Roster</span>
            </div>
            <h1 className="header-title">OPERATIVE <span className="text-gradient">DATABASE</span></h1>
          </div>
          <div className="header-meta glass-panel">
            <Activity size={12} className="text-green-400" />
            <span>{all.length} Units Indexed</span>
          </div>
        </div>

        <div className="filter-bar glass-panel">
          <div className="search-wrap">
            <Search className="search-icon" size={18} />
            <input className="search-input" placeholder="Filter by name or ID..." value={search} onChange={e => { setSearch(e.target.value); setDisplayCount(30); }} />
          </div>
          <div className="game-filters">
            {Object.entries(GAMES).map(([k,v]) => (
              <button key={k} className={`game-btn ${game === k ? 'active' : ''}`} onClick={() => { setGame(k); setDisplayCount(30); }}>
                <v.icon size={16} className={game === k ? v.color : ''} />
                <span className="btn-label">{v.label}</span>
              </button>
            ))}
          </div>
          <div className="rarity-filters">
             {['all', '5', '4'].map(r => (
               <button key={r} className={`rarity-btn ${rarity === r ? 'active' : ''}`} onClick={() => { setRarity(r); setDisplayCount(30); }}>
                 {r === 'all' ? 'All Tiers' : `${r}★`}
               </button>
             ))}
          </div>
        </div>

        {loading ? (
          <div className="chars-grid-loading">
            {[...Array(12)].map((_, i) => <div key={i} className="skeleton-card glass-panel" />)}
          </div>
        ) : (
          <>
            <div className="chars-grid">
              <AnimatePresence mode="popLayout">
                {displayed.map((c, i) => (
                  <motion.div layout key={c.name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: (i % 30) * 0.01 }} className="char-card-wrap" onClick={() => setSelectedChar(c)}>
                    <div className="char-card glass-panel">
                      <div className="char-card-visual">
                         <CharIcon name={c.name} game={c.game?.toLowerCase()} rarity={c.rarity} emoji={c.emoji} />
                      </div>
                      <div className="char-card-info">
                         <div className="char-card-top">
                            <span className="char-game-label">{c.game?.toUpperCase()}</span>
                            <div className="char-stars">
                               {[...Array(c.rarity)].map((_, i) => <Star key={i} size={8} className="text-gold" />)}
                            </div>
                         </div>
                         <h3 className="char-card-name">{c.name}</h3>
                         <div className="char-card-price">
                            <Zap size={10} className="text-cyan-400" />
                            <span>{c.shopPrice} SD</span>
                         </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {displayCount < filtered.length && (
              <div className="flex justify-center mt-32 pb-24">
                <button
                  className="btn-v3 btn-v3-ghost group neon-border"                  onClick={() => setDisplayCount(prev => prev + 30)}
                >
                  <Activity size={16} className="text-cyan group-hover:animate-pulse" />
                  <span>Synchronize More Assets ({filtered.length - displayCount} Remaining)</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <AnimatePresence>
        {selectedChar && <CharacterModal char={selectedChar} onClose={() => setSelectedChar(null)} />}
      </AnimatePresence>
    </div>
  );
}
