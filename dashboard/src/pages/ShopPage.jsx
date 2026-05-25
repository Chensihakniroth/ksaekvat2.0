import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Sparkles,
  X,
  Zap,
  Star,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import CharIcon from '../components/CharIcon';
import { useAuth } from '../context/AuthContext';

const RARITY_COLORS = {
  priceless: '#ef4444',
  legendary: '#f59e0b',
  epic: '#a855f7',
  rare: '#3b82f6',
  uncommon: '#22c55e',
  common: '#9ca3af',
};

// --- REDESIGNED MODAL ---
function CharacterModal({ char, onClose, onBuy }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        zIndex: 2000,
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 5, 5, 0.85)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="matte-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '850px',
          padding: '0px',
          overflow: 'hidden',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="matte-btn"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 10,
            padding: '8px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <X size={16} />
        </button>

        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          
          {/* Left panel - Avatar image */}
          <div
            style={{
              flex: '1 1 300px',
              padding: '60px 40px',
              background: 'rgba(255, 255, 255, 0.01)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRight: '1px solid var(--border-matte)',
            }}
          >
            <div style={{ width: '200px', height: '200px', marginBottom: '30px' }}>
              <CharIcon name={char.name} game={char.game?.toLowerCase()} rarity={char.rarity} />
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginBottom: '15px' }}>
                {[...Array(parseInt(char.rarity) || 5)].map((_, i) => (
                  <Star key={i} size={12} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                {char.name}
              </h2>
            </div>
          </div>

          {/* Right panel - Details & Buy */}
          <div
            style={{
              flex: '1.2 1 320px',
              padding: '50px 40px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '30px'
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-matte)',
                  color: '#fff',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                }}
              >
                {char.game?.toUpperCase()}
              </span>
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-matte)',
                  color: 'var(--text-muted)',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                }}
              >
                {char.element || 'NEUTRAL'}
              </span>
            </div>

            <div>
              <h4
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  marginBottom: '16px',
                }}
              >
                Specifications
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-matte)', borderRadius: '10px', padding: '15px' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Classification
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                    {char.role || 'Resonator'}
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-matte)', borderRadius: '10px', padding: '15px' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Exchange Value
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                    {char.price?.toLocaleString() ?? 0} DUST
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => onBuy(char.name)}
              className="matte-btn matte-btn-primary"
              style={{ padding: '18px', width: '100%', borderRadius: '12px' }}
            >
              <span>Acquire Resonance</span>
              <Zap size={14} />
            </button>

          </div>

        </div>
      </motion.div>
    </motion.div>
  );
}

// --- MAIN SHOP PAGE ---
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
        .then((r) => r.json())
        .then((res) => {
          if (res.success) setStarDust(res.data.star_dust);
        });
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      game: filter.game,
      rarity: filter.rarity,
      search: filter.search,
      limit: '12',
    });

    const endpoint = activeCategory === 'characters' ? '/api/shop/characters' : '/api/zoo/registry';

    fetch(`${endpoint}?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setData(res.data);
          setPages(res.pages || 1);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeCategory, page, filter]);

  const handleBuy = async (name) => {
    if (!user) return alert('Authorization required for asset exchange.');
    if (!window.confirm(`Confirm exchange for ${name}?`)) return;

    try {
      const res = await fetch('/api/shop/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterName: name }),
      });
      const resData = await res.json();
      if (resData.success) {
        setStarDust(resData.newBalance);
        setSelectedItem(null);
      } else {
        alert(resData.error);
      }
    } catch (err) {
      alert('Neural synchronization failed.');
    }
  };

  return (
    <div className="shop-page-container" style={{ paddingBottom: '120px' }}>
      <div className="wrap">
        
        {/* HEADER BLOCK */}
        <header style={{ padding: '80px 0 60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', opacity: 0.5 }}>
            <ShoppingBag size={14} />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              Resonance Exchange Terminal
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, letterSpacing: '-0.04em', color: '#fff', margin: 0 }}>
            THE EXCHANGE
          </h1>

          <div 
            style={{ 
              background: 'var(--card-matte)', 
              border: '1px solid var(--border-matte)',
              borderRadius: '16px',
              padding: '12px 24px',
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginTop: '10px'
            }}
          >
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
              Your Balance
            </span>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
              {starDust.toLocaleString()} DUST
            </span>
          </div>

        </header>

        {/* CATEGORY SWITCHER */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
          <div 
            style={{ 
              display: 'flex', 
              background: 'var(--card-matte)', 
              border: '1px solid var(--border-matte)', 
              borderRadius: '12px',
              padding: '6px'
            }}
          >
            <button
              onClick={() => {
                setActiveCategory('characters');
                setPage(1);
              }}
              className="matte-btn"
              style={{ 
                border: 'none', 
                background: activeCategory === 'characters' ? 'rgba(255,255,255,0.05)' : 'transparent',
                color: activeCategory === 'characters' ? '#fff' : 'var(--text-muted)',
                padding: '10px 24px',
                borderRadius: '8px'
              }}
            >
              Resonators
            </button>
            <button
              onClick={() => {
                setActiveCategory('zoo');
                setPage(1);
              }}
              className="matte-btn"
              style={{ 
                border: 'none', 
                background: activeCategory === 'zoo' ? 'rgba(255,255,255,0.05)' : 'transparent',
                color: activeCategory === 'zoo' ? '#fff' : 'var(--text-muted)',
                padding: '10px 24px',
                borderRadius: '8px'
              }}
            >
              Specimens
            </button>
          </div>
        </div>

        {/* FILTERS CONTAINER */}
        <div
          className="matte-card"
          style={{
            padding: '20px',
            display: 'flex',
            gap: '15px',
            marginBottom: '40px',
            flexWrap: 'wrap',
            borderRadius: '16px'
          }}
        >
          <div style={{ flex: '2 1 300px', position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                opacity: 0.3,
              }}
            />
            <input
              className="matte-input"
              placeholder="Search registry database..."
              value={filter.search}
              onChange={(e) => {
                setFilter({ ...filter, search: e.target.value });
                setPage(1);
              }}
              style={{
                paddingLeft: '45px',
                height: '46px',
                borderRadius: '10px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flex: '1 1 300px' }}>
            {activeCategory === 'characters' && (
              <select
                className="matte-input"
                style={{ 
                  flex: '1 1 120px', 
                  fontSize: '0.8rem', 
                  height: '46px', 
                  borderRadius: '10px',
                  paddingRight: '10px'
                }}
                value={filter.game}
                onChange={(e) => {
                  setFilter({ ...filter, game: e.target.value });
                  setPage(1);
                }}
              >
                <option value="all">ALL ORIGINS</option>
                <option value="genshin">GENSHIN</option>
                <option value="hsr">HSR</option>
                <option value="wuwa">WUWA</option>
                <option value="zzz">ZZZ</option>
              </select>
            )}

            <select
              className="matte-input"
              style={{ 
                flex: '1 1 120px', 
                fontSize: '0.8rem', 
                height: '46px', 
                borderRadius: '10px',
                paddingRight: '10px'
              }}
              value={filter.rarity}
              onChange={(e) => {
                setFilter({ ...filter, rarity: e.target.value });
                setPage(1);
              }}
            >
              <option value="all">ALL TIERS</option>
              <option value="5">LEGENDARY (5★)</option>
              <option value="4">RARE (4★)</option>
            </select>
          </div>
        </div>

        {/* LOADING & GRID */}
        {loading ? (
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
              gap: '24px' 
            }}
          >
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="matte-card"
                style={{ height: '240px', borderRadius: '16px', opacity: 0.15 }}
              />
            ))}
          </div>
        ) : (
          <>
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
                gap: '24px' 
              }}
            >
              <AnimatePresence mode="popLayout">
                {data.map((item, i) => (
                  <motion.div
                    layout
                    key={item.name}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3, ease: 'easeOut', delay: (i % 12) * 0.01 }}
                    className="matte-card"
                    onClick={() => activeCategory === 'characters' && setSelectedItem(item)}
                    style={{
                      cursor: activeCategory === 'characters' ? 'pointer' : 'default',
                      padding: '30px 20px',
                      borderRadius: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ width: '100px', height: '100px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {activeCategory === 'characters' ? (
                        <CharIcon
                          name={item.name}
                          game={item.game?.toLowerCase()}
                          rarity={item.rarity}
                        />
                      ) : (
                        <img
                          src={`/api/zoo/image/${item.key}`}
                          alt={item.name}
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                      )}
                    </div>
                    
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', marginBottom: '8px', letterSpacing: '-0.01em' }}>
                      {item.name}
                    </h3>

                    {activeCategory === 'characters' ? (
                      <div
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#fff',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--border-matte)',
                          padding: '4px 10px',
                          borderRadius: '6px'
                        }}
                      >
                        {item.price.toLocaleString()} DUST
                      </div>
                    ) : (
                      <div
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: RARITY_COLORS[item.rarity] || '#fff',
                          background: `${RARITY_COLORS[item.rarity]}10`,
                          border: `1px solid ${RARITY_COLORS[item.rarity]}25`,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          textTransform: 'uppercase'
                        }}
                      >
                        {String(item.rarity).toUpperCase()}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* PAGINATION */}
            {pages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '24px',
                  marginTop: '60px',
                }}
              >
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="matte-btn"
                  style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%' }}
                >
                  <ChevronLeft size={16} />
                </button>
                
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.15em',
                  }}
                >
                  PAGE {page} OF {pages}
                </span>
                
                <button
                  disabled={page === pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="matte-btn"
                  style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {selectedItem && activeCategory === 'characters' && (
          <CharacterModal
            char={selectedItem}
            onClose={() => setSelectedItem(null)}
            onBuy={handleBuy}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
