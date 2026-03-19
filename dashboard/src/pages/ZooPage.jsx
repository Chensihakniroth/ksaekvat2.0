import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, PawPrint, Info, X, Shield, Zap, TrendingUp, ChevronRight, Activity } from 'lucide-react';

const RARITY_COLORS = { priceless: '#ef4444', legendary: '#f59e0b', epic: '#a855f7', rare: '#3b82f6', uncommon: '#22c55e', common: '#9ca3af' };

export default function ZooPage() {
  const [registry, setRegistry] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/zoo/registry').then(r => r.json()).then(res => { setRegistry(res.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = registry.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) && (filter === 'all' || a.rarity === filter)
  );

  return (
    <div className="zoo-container">
      <div className="wrap">
        <div className="zoo-header-v3">
          <div className="header-info">
            <div className="header-badge">
              <PawPrint size={16} className="text-green-400" />
              <span>Biological Research Center</span>
            </div>
            <h1 className="header-title">ZOO <span className="text-gradient">REGISTRY</span></h1>
          </div>
          <div className="header-meta glass-panel">
            <Activity size={12} className="text-green-400" />
            <span>{registry.length} Species Cataloged</span>
          </div>
        </div>

        <div className="filter-bar glass-panel">
          <div className="search-wrap">
            <Search className="search-icon" size={18} />
            <input className="search-input" placeholder="Search biological signatures..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="rarity-filters">
            {['all', 'common', 'uncommon', 'rare', 'epic', 'legendary', 'priceless'].map(r => (
              <button key={r} className={`rarity-btn ${filter === r ? 'active' : ''}`} onClick={() => setFilter(r)}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="zoo-grid-loading">
            {[...Array(10)].map((_, i) => <div key={i} className="skeleton-square glass-panel" />)}
          </div>
        ) : (
          <div className="zoo-grid-v3">
            <AnimatePresence mode="popLayout">
              {filtered.map((animal, i) => (
                <motion.div layout key={animal._id} initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: (i % 20) * 0.02 }} className="animal-card-wrap" onClick={() => setSelectedAnimal(animal)}>
                  <div className="animal-card-v3 glass-panel">
                    <div className="animal-visual-v3">
                      <img src={`/api/zoo/image/${animal.key}`} alt={animal.name} className="animal-img-v3 animate-float" loading="lazy" />
                    </div>
                    <div className="animal-rarity-tag" style={{ color: RARITY_COLORS[animal.rarity] }}>{animal.rarity}</div>
                    <div className="animal-info-v3">
                       <h3 className="animal-name-v3">{animal.name}</h3>
                       <div className="animal-meta-v3">
                          <span>VALUE: {animal.value.toLocaleString()}</span>
                          <ChevronRight size={12} />
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedAnimal && <AnimalModal animal={selectedAnimal} onClose={() => setSelectedAnimal(null)} />}
      </AnimatePresence>
    </div>
  );
}

function AnimalModal({ animal, onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={onClose}>
      <motion.div initial={{ y: 100, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 100, opacity: 0, scale: 0.9 }} className="glass-panel modal-panel-lg neon-border" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}><X size={24} /></button>
        <div className="modal-content-split">
          <div className="modal-visual-side">
             <div className="visual-bg-glow" style={{ background: `radial-gradient(circle, ${RARITY_COLORS[animal.rarity]}33, transparent 70%)` }} />
             <div className="visual-animal">
                <img src={`/api/zoo/image/${animal.key}`} alt={animal.name} className="modal-animal-img" />
             </div>
          </div>
          <div className="modal-details-side">
            <div className="details-header">
              <span className="rarity-tag-v3" style={{ background: `${RARITY_COLORS[animal.rarity]}22`, color: RARITY_COLORS[animal.rarity], border: `1px solid ${RARITY_COLORS[animal.rarity]}44` }}>{animal.rarity.toUpperCase()}</span>
              <span className="type-tag">ETHEREAL</span>
            </div>
            <h2 className="details-subtitle">Biological Data</h2>
            <div className="details-grid">
              <div className="spec-box glass-panel">
                <div className="spec-label"><TrendingUp size={14} /> MARKET VALUE</div>
                <div className="spec-val">{animal.value.toLocaleString()} Credits</div>
              </div>
              <div className="spec-box glass-panel">
                <div className="spec-label"><Shield size={14} /> THREAT</div>
                <div className="spec-val">CLASS-S</div>
              </div>
            </div>
            <div className="details-bio glass-panel">
              <p>"Biological signature confirmed. This unique lifeform originates from the KsaeKvat wild zones. High concentration of ethereal energy detected within its core."</p>
            </div>
            <button className="btn-v3 btn-v3-primary w-full" onClick={onClose}>
              <span>Finalize Observation</span>
              <Sparkles size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
