import { useState, useEffect } from 'react';
import './CharactersPage.css';

const GAME_LABELS = { genshin: '⚔️ Genshin Impact', hsr: '🚂 HSR', wuwa: '🌊 Wuwa', zzz: '📺 ZZZ' };
const GAME_BADGE = { genshin: 'badge-genshin', hsr: 'badge-hsr', wuwa: 'badge-wuwa', zzz: 'badge-zzz' };

export default function CharactersPage() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState('all');
  const [rarity, setRarity] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/characters')
      .then(r => r.json())
      .then(res => {
        if (res.success) setCharacters(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = characters.filter(c => {
    if (game !== 'all' && c.game !== game) return false;
    if (rarity !== 'all' && c.rarity !== rarity) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const games = ['all', ...new Set(characters.map(c => c.game))];

  return (
    <div className="chars-page container">
      <div className="page-header">
        <h1>🎭 <span className="gradient-text">Character Gallery</span></h1>
        <p>{characters.length} characters available · Use Star Dust to purchase in-game</p>
      </div>

      {/* Filters */}
      <div className="chars-filters">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search character..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="tab-bar">
          <button className={`btn btn-ghost ${rarity === 'all' ? 'active' : ''}`} onClick={() => setRarity('all')}>All</button>
          <button className={`btn btn-ghost ${rarity === '5' ? 'active' : ''}`} onClick={() => setRarity('5')}>⭐ 5-Star</button>
          <button className={`btn btn-ghost ${rarity === '4' ? 'active' : ''}`} onClick={() => setRarity('4')}>✨ 4-Star</button>
        </div>
        <div className="tab-bar">
          {games.map(g => (
            <button
              key={g}
              className={`btn btn-ghost ${game === g ? 'active' : ''}`}
              onClick={() => setGame(g)}
            >
              {g === 'all' ? '🌐 All Games' : (GAME_LABELS[g] || g)}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="chars-count fade-in">
        Showing <strong>{filtered.length}</strong> characters
      </p>

      {loading ? <div className="spinner" /> : (
        <div className="chars-grid fade-in">
          {filtered.map((c, i) => (
            <div key={i} className="cg-card card">
              <div className="cg-emoji">{c.emoji || (c.rarity === '5' ? '⭐' : '✨')}</div>
              <div className={`cg-rarity-bar rarity-${c.rarity}`} />
              <div className="cg-body">
                <div className="cg-name">{c.name}</div>
                <div className="cg-badges">
                  <span className={`badge badge-${c.rarity}`}>{c.rarity}★</span>
                  <span className={`badge ${GAME_BADGE[c.game] || ''}`}>{c.game?.toUpperCase()}</span>
                </div>
                {c.element && (
                  <div className="cg-element">{c.element}</div>
                )}
                <div className="cg-price">✨ {c.shopPrice} Star Dust</div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>
              No characters match your filters. (｡•́︿•̀｡)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
