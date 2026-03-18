import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, PawPrint, Info, X, Shield, Zap, TrendingUp } from 'lucide-react';
import './ZooPage.css';

const RARITY_COLORS = {
  common: '#9e9e9e',
  uncommon: '#4caf50',
  rare: '#2196f3',
  epic: '#9c27b0',
  legendary: '#ff9800',
  priceless: '#f44336'
};

export default function ZooPage() {
  const [registry, setRegistry] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/zoo/registry');
        const regData = await response.json();
        setRegistry(regData.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch zoo data:', err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredRegistry = registry.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || a.rarity === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="zoo-loading">
        <Sparkles className="animate-spin" />
        <p>Opening the Zoo Gates...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="zoo-page wrap"
    >
      <header className="zoo-header">
        <div className="zoo-title-section">
          <PawPrint size={40} className="zoo-icon-main" />
          <div>
            <h1>Animal Discovery</h1>
            <p>Track every creature discovered in the KsaeKvat universe.</p>
          </div>
        </div>

        <div className="zoo-controls">
          <div className="search-box">
            <Search size={20} />
            <input 
              type="text" 
              placeholder="Search animals..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="filter-chips">
            {['all', 'common', 'uncommon', 'rare', 'epic', 'legendary', 'priceless'].map(r => (
              <button 
                key={r}
                className={`filter-chip ${filter === r ? 'active' : ''}`}
                onClick={() => setFilter(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="zoo-grid">
        {filteredRegistry.map((animal) => {
          return (
            <motion.div
              key={animal._id}
              layout
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className={`zoo-card rarity-${animal.rarity}`}
              onClick={() => setSelectedAnimal(animal)}
            >
              <div className="animal-sprite-wrapper">
                <img 
                  src={`/api/zoo/sprite/${animal.key}`} 
                  alt={animal.name} 
                  className="animal-sprite" 
                  loading="lazy"
                  onError={(e) => e.target.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png'}
                />
              </div>
              <div className="animal-info">
                <span className="animal-rarity-tag">{animal.rarity}</span>
                <h3 className="animal-name">{animal.name}</h3>
                <div className="animal-value">{animal.value.toLocaleString()} 🪙</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedAnimal && (
          <AnimalModal 
            animal={selectedAnimal} 
            onClose={() => setSelectedAnimal(null)} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AnimalModal({ animal, onClose }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: 50, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.9 }}
        className={`modal-container zoo-modal rarity-${animal.rarity}`}
        onClick={e => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}><X /></button>
        
        <div className="modal-content">
          <div className="modal-visual">
            <div className="modal-image-glow" />
            <img 
              src={`/api/zoo/image/${animal.key}`} 
              alt={animal.name} 
              className="modal-animal-img" 
              onError={(e) => e.target.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png'}
            />
            <div className="modal-rarity" style={{ background: RARITY_COLORS[animal.rarity] }}>
              {animal.rarity.toUpperCase()}
            </div>
          </div>
          
          <div className="modal-details">
            <div className="modal-header">
              <h2 className="modal-title">{animal.name}</h2>
              <div className="modal-subtitle">{animal.emoji} Unique Creature</div>
            </div>
            
            <div className="modal-grid">
              <div className="modal-stat-item">
                <TrendingUp size={18} />
                <div className="stat-label">Market Value</div>
                <div className="stat-value">{animal.value.toLocaleString()} 🪙</div>
              </div>
              <div className="modal-stat-item">
                <Shield size={18} />
                <div className="stat-label">Type</div>
                <div className="stat-value">Ethereal</div>
              </div>
              <div className="modal-stat-item">
                <Zap size={18} />
                <div className="stat-label">Power</div>
                <div className="stat-value">9001+</div>
              </div>
            </div>

            <div className="modal-description">
              <p>One of the many unique creatures found in the KsaeKvat wild. Hunters spend years tracking these creatures across various biomes.</p>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-primary btn-large" style={{ background: RARITY_COLORS[animal.rarity] }} onClick={onClose}>
                <Sparkles size={20} />
                <span>Happy Hunting!</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
