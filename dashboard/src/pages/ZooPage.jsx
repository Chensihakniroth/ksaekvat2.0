import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, PawPrint, Shield, Activity, X } from 'lucide-react';

const RARITY_COLORS = { priceless: '#ef4444', legendary: '#f59e0b', epic: '#a855f7', rare: '#3b82f6', uncommon: '#22c55e', common: '#9ca3af' };
const RARITIES = ['all', 'common', 'uncommon', 'rare', 'epic', 'legendary', 'priceless'];

export default function ZooPage() {
  const [registry, setRegistry] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/zoo/registry')
      .then(r => r.json())
      .then(res => { setRegistry(res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = registry.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) && (filter === 'all' || a.rarity === filter)
  );

  return (
    <div className="zoo-container">
      <div className="bg-ambience">
         <div className="bg-orb-cyan" />
      </div>

      <div className="wrap relative z-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="zoo-hero-v4">
          <div className="zoo-title-wrap">
            <div className="header-badge mb-4">
              <PawPrint size={14} className="text-cyan-400" />
              <span>Bio-Research Facility</span>
            </div>
            <h1 className="zoo-title-v4">ZOO <span className="text-cyan-400">REGISTRY</span></h1>
          </div>
          
          <div className="zoo-hud-stats">
            <div className="hud-box">
              <span className="hud-label">Total Species</span>
              <span className="hud-val text-cyan-400">{registry.length}</span>
            </div>
            <div className="hud-box">
              <span className="hud-label">Legendary</span>
              <span className="hud-val legendary">{registry.filter(a => a.rarity === 'legendary').length}</span>
            </div>
            <div className="hud-box">
              <span className="hud-label">Mythical</span>
              <span className="hud-val priceless">{registry.filter(a => a.rarity === 'priceless').length}</span>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="filter-bar-v4">
          <div className="search-wrapper">
            <div className="search-icon-v4-wrap">
              <Search size={18} />
            </div>
            <input 
              className="search-input-v4" 
              placeholder="Query biological signatures..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          <div className="rarity-pills">
            {RARITIES.map(r => (
              <button 
                key={r} 
                className={`rarity-pill ${filter === r ? 'active' : ''}`}
                style={{ color: filter === r ? RARITY_COLORS[r] || '#22d3ee' : '' }}
                onClick={() => setFilter(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </motion.div>

        {loading ? (
          <div className="zoo-grid-v3">
            {[...Array(12)].map((_, i) => <div key={i} className="skeleton-square glass-panel" />)}
          </div>
        ) : (
          <div className="zoo-grid-v3">
            <AnimatePresence mode="popLayout">
              {filtered.map((animal, i) => {
                const color = RARITY_COLORS[animal.rarity] || '#ffffff';
                return (
                  <motion.div 
                    layout 
                    key={animal._id} 
                    initial={{ opacity: 0, scale: 0.8, y: 30 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.8 }} 
                    transition={{ delay: (i % 20) * 0.03, type: 'spring', damping: 20 }} 
                    onClick={() => setSelectedAnimal(animal)}
                  >
                    <div 
                      className="specimen-card"
                      style={{ 
                        '--card-glow': color, 
                        '--card-glow-dim': `${color}44` 
                      }}
                    >
                      <div className="rarity-badge-v4" style={{ color: color }}>
                        {animal.rarity}
                      </div>

                      <div className="specimen-visual">
                        <div className="specimen-ring"></div>
                        <img src={`/api/zoo/image/${animal.key}`} alt={animal.name} loading="lazy" />
                      </div>

                      <div className="specimen-info">
                         <h3 className="specimen-name">{animal.name}</h3>
                         <div className="specimen-meta">
                            <Activity size={10} style={{ color }} />
                            <span>VALUE / {animal.value.toLocaleString()}</span>
                         </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedAnimal && <BioScanModal animal={selectedAnimal} onClose={() => setSelectedAnimal(null)} />}
      </AnimatePresence>
    </div>
  );
}

function BioScanModal({ animal, onClose }) {
  const color = RARITY_COLORS[animal.rarity] || '#fff';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bioscan-modal" onClick={onClose}>
      <motion.div 
        initial={{ y: 50, opacity: 0, scale: 0.95, rotateX: 10 }} 
        animate={{ y: 0, opacity: 1, scale: 1, rotateX: 0 }} 
        exit={{ y: 20, opacity: 0, scale: 0.95 }} 
        transition={{ type: 'spring', damping: 25 }}
        className="bioscan-panel" 
        onClick={e => e.stopPropagation()}
        style={{ '--modal-glow': color }}
      >
        <button className="bs-close" onClick={onClose}><X size={20} /></button>
        
        <div className="bioscan-display">
           <div className="scan-line" />
           <div className="radar-ring" />
           <img src={`/api/zoo/image/${animal.key}`} alt={animal.name} className="bioscan-target" />
        </div>
        
        <div className="bioscan-details">
          <div className="bs-header">
            <span className="bs-tag" style={{ color: color, background: `${color}22` }}>
              {animal.rarity} CLASS
            </span>
            <span className="bs-tag" style={{ color: '#22d3ee', background: 'rgba(34,211,238,0.1)' }}>
              ETHEREAL
            </span>
          </div>

          <p className="bs-subtitle">Specimen Designation</p>
          <h2 className="bs-title" style={{ textShadow: `0 0 20px ${color}66` }}>
             {animal.name}
          </h2>

          <div className="bs-databox">
            <div className="bs-grid">
              <div className="bs-stat">
                <span className="bs-stat-label">
                  <Activity size={12} color={color} /> THREAT LEVEL
                </span>
                <span className="bs-stat-val">CLASS-S</span>
              </div>
              <div className="bs-stat">
                <span className="bs-stat-label">
                  <Shield size={12} color="#22d3ee" /> MARKET EST.
                </span>
                <span className="bs-stat-val">{animal.value.toLocaleString()} CR</span>
              </div>
            </div>

            <p className="bs-desc">
              "Biological signature confirmed. This unique lifeform originates from the 
              <span className="text-cyan-400"> KSAEKVAT</span> wild zones. 
              High concentration of ethereal energy detected within its core matrix."
            </p>
          </div>

          <button className="btn-v3 w-full" style={{ background: color, border: 'none', color: '#fff', boxShadow: `0 10px 30px ${color}66` }} onClick={onClose}>
            <span>Log Observation</span>
            <Sparkles size={16} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
