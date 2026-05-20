import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Sparkles, Globe, Sword, Train, Tv, Waves, X, Info, 
  Shield, Zap, Target, Activity, Star, ShoppingBag, 
  ChevronLeft, ChevronRight, PawPrint, Layers, Filter
} from 'lucide-react';
import CharIcon from '../components/CharIcon';
import { useAuth } from '../context/AuthContext';

const RARITY_COLORS = { 
  priceless: '#ef4444', legendary: '#f59e0b', epic: '#a855f7', 
  rare: '#3b82f6', uncommon: '#22c55e', common: '#9ca3af' 
};

// --- MODALS ---

function CharacterModal({ char, onClose, onBuy }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={onClose} style={{ zIndex: 2000, position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(40px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '1000px', borderRadius: '40px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
        <button className="bs-close" onClick={onClose} style={{ position: 'absolute', top: '30px', right: '30px', zIndex: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}><X size={20} /></button>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 280px', minWidth: '280px', padding: '80px 40px', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,0.03)' }}>
             <div style={{ width: '240px', height: '240px', marginBottom: '40px', maxWidth: '100%' }}>
                <CharIcon name={char.name} game={char.game?.toLowerCase()} rarity={char.rarity} />
             </div>
             <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '20px', opacity: 0.5 }}>
                   {[...Array(parseInt(char.rarity))].map((_, i) => <Star key={i} size={14} fill="var(--gold)" color="var(--gold)" />)}
                </div>
                <h1 style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>{char.name}</h1>
             </div>
          </div>
          <div style={{ flex: '1.2 1 280px', minWidth: '280px', padding: '60px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '40px' }}>
              <span style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--accent)', padding: '6px 18px', borderRadius: '50px', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.1em' }}>{char.game?.toUpperCase()}</span>
              <span style={{ background: 'rgba(255,255,255,0.03)', color: '#fff', padding: '6px 18px', borderRadius: '50px', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.1em', opacity: 0.5 }}>{char.element || 'NEUTRAL'}</span>
            </div>
            
            <div style={{ marginBottom: '50px' }}>
              <h2 style={{ fontSize: '0.65rem', fontWeight: 900, opacity: 0.2, textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '25px' }}>Asset Specifications</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                 <div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.3, marginBottom: '8px', textTransform: 'uppercase' }}>Classification</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{char.role || 'Resonator'}</div>
                 </div>
                 <div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.3, marginBottom: '8px', textTransform: 'uppercase' }}>Exchange Rate</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gold)' }}>{char.price?.toLocaleString() ?? 0} DUST</div>
                 </div>
              </div>
            </div>

            <button className="btn-v3 btn-v3-primary w-full" onClick={() => onBuy(char.name)} style={{ padding: '24px' }}>
              <span>ACQUIRE RESONANCE</span>
              <Zap size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- MAIN PAGE ---

export default function ShopPage() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('characters');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filter, setFilter] = useState({ game: 'all', rarity: 'all', search: '' });
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [starDust, setStarDust] = useState(0);

  useEffect(() => {
    if (user) {
      fetch(`/api/profile/${user.id}`)
        .then(r => r.json())
        .then(res => { if (res.success) setStarDust(res.data.star_dust); });
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      game: filter.game,
      rarity: filter.rarity,
      search: filter.search,
      limit: '12'
    });

    const endpoint = activeCategory === 'characters' ? '/api/shop/characters' : '/api/zoo/registry';
    
    fetch(`${endpoint}?${params}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setData(res.data);
          setPages(res.pages || 1);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeCategory, page, filter]);

  const handleBuy = async (name) => {
    if (!user) return alert("Authorization required for asset exchange.");
    if (!window.confirm(`Confirm exchange for ${name}?`)) return;

    try {
      const res = await fetch('/api/shop/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterName: name })
      });
      const resData = await res.json();
      if (resData.success) {
        setStarDust(resData.newBalance);
        setSelectedItem(null);
      } else {
        alert(resData.error);
      }
    } catch (err) {
      alert("Neural synchronization failed.");
    }
  };

  return (
    <div className="shop-page-container" style={{ paddingBottom: '120px' }}>
      <div className="wrap">
        
        <header style={{ padding: '80px 0', textAlign: 'center' }}>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', opacity: 0.3, marginBottom: '20px' }}
          >
            <ShoppingBag size={14} />
            <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em' }}>Resonance Exchange Terminal</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', fontWeight: 900, letterSpacing: '-0.05em', marginBottom: '40px' }}
          >
            THE <span className="landing-title-grad">EXCHANGE</span>
          </motion.h1>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', opacity: 0.6 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.4, letterSpacing: '0.2em', marginBottom: '5px' }}>AVAILABLE RESONANCE</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--gold)' }}>{starDust.toLocaleString()} DUST</div>
            </div>
          </div>
        </header>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '60px' }}>
          <div className="portfolio-tabs-fb" style={{ border: 'none', gap: '40px' }}>
             <button onClick={() => { setActiveCategory('characters'); setPage(1); }} className={`p-tab-fb ${activeCategory === 'characters' ? 'active' : ''}`} style={{ padding: '15px 0' }}>RESONATORS</button>
             <button onClick={() => { setActiveCategory('zoo'); setPage(1); }} className={`p-tab-fb ${activeCategory === 'zoo' ? 'active' : ''}`} style={{ padding: '15px 0' }}>SPECIMENS</button>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '30px', borderRadius: '24px', display: 'flex', gap: '20px', marginBottom: '60px', border: '1px solid rgba(255,255,255,0.03)', background: 'rgba(255,255,255,0.01)', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', opacity: 0.2 }} />
            <input 
              className="dash-input" 
              placeholder="Filter archives..." 
              value={filter.search} 
              onChange={e => { setFilter({...filter, search: e.target.value}); setPage(1); }}
              style={{ paddingLeft: '50px', background: 'transparent', border: 'none', width: '100%' }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flex: '1 1 300px' }}>
            {activeCategory === 'characters' && (
              <select className="dash-input" style={{ flex: '1 1 140px', fontSize: '0.75rem' }} value={filter.game} onChange={e => { setFilter({...filter, game: e.target.value}); setPage(1); }}>
                <option value="all">ALL ORIGINS</option>
                <option value="genshin">GENSHIN</option>
                <option value="hsr">HSR</option>
                <option value="wuwa">WUWA</option>
                <option value="zzz">ZZZ</option>
              </select>
            )}

            <select className="dash-input" style={{ flex: '1 1 140px', fontSize: '0.75rem' }} value={filter.rarity} onChange={e => { setFilter({...filter, rarity: e.target.value}); setPage(1); }}>
              <option value="all">ALL TIERS</option>
              <option value="5">LEGENDARY</option>
              <option value="4">RARE</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="units-grid-fb">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="glass-panel" style={{ height: '320px', borderRadius: '32px', opacity: 0.1 }} />
            ))}
          </div>
        ) : (
          <>
            <div className="units-grid-fb">
              <AnimatePresence mode="popLayout">
                {data.map((item, i) => (
                  <motion.div 
                    layout 
                    key={item.name} 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.95 }} 
                    transition={{ delay: (i % 12) * 0.02 }}
                    className="char-card-fb"
                    onClick={() => activeCategory === 'characters' && setSelectedItem(item)}
                    style={{ 
                      cursor: activeCategory === 'characters' ? 'pointer' : 'default',
                      padding: '40px 30px',
                      borderRadius: '32px',
                      border: '1px solid rgba(255,255,255,0.03)',
                      background: 'rgba(255,255,255,0.01)'
                    }}
                  >
                    <div style={{ width: '120px', height: '120px', margin: '0 auto 30px' }}>
                       {activeCategory === 'characters' ? (
                         <CharIcon name={item.name} game={item.game?.toLowerCase()} rarity={item.rarity} />
                       ) : (
                         <img src={`/api/zoo/image/${item.key}`} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                       )}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '10px', letterSpacing: '-0.02em' }}>{item.name}</div>
                    
                    {activeCategory === 'characters' ? (
                      <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--gold)', opacity: 0.8 }}>
                        {item.price.toLocaleString()} DUST
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.65rem', fontWeight: 900, color: RARITY_COLORS[item.rarity], opacity: 0.6 }}>
                        {String(item.rarity).toUpperCase()}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px', marginTop: '80px' }}>
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-v3 btn-v3-ghost" style={{ width: '50px', height: '50px', padding: 0, borderRadius: '50%' }}><ChevronLeft size={20} /></button>
                <span style={{ fontSize: '0.7rem', fontWeight: 900, opacity: 0.2, letterSpacing: '0.4em' }}>ARCHIVE {page} / {pages}</span>
                <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="btn-v3 btn-v3-ghost" style={{ width: '50px', height: '50px', padding: 0, borderRadius: '50%' }}><ChevronRight size={20} /></button>
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {selectedItem && activeCategory === 'characters' && (
          <CharacterModal char={selectedItem} onClose={() => setSelectedItem(null)} onBuy={handleBuy} />
        )}
      </AnimatePresence>
    </div>
  );
}

