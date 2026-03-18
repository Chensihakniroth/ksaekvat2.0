import { useState, useEffect } from 'react';
import { getCharacterImageUrl, getFallbackEmoji } from '../utils/charImages.js';

const GAMES = {
  all:    { label: '🌐 All' },
  genshin:{ label: '⚔️ Genshin', badge: 'b-g' },
  hsr:    { label: '🚂 HSR',     badge: 'b-h' },
  wuwa:   { label: '🌊 Wuwa',   badge: 'b-w' },
  zzz:    { label: '📺 ZZZ',    badge: 'b-z' },
};

function CharIcon({ name, game, rarity, emoji }) {
  const [failed, setFailed] = useState(false);
  const url = getCharacterImageUrl(name, game);

  if (!url || failed) {
    return (
      <div className="char-icon-fallback">
        {emoji || getFallbackEmoji(rarity)}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={name}
      className="char-icon-img"
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
    (rarity === 'all' || c.rarity === rarity) &&
    (!search || c.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="page">
      <div className="wrap">
        <div className="ph">
          <h1>🎭 <span className="grad">Characters</span></h1>
          <p>{all.length} characters available · Purchase with Star Dust in-game</p>
        </div>

        {/* Filter bar */}
        <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:24 }}>
          <input
            className="input"
            placeholder="🔍  Search by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 300 }}
          />
          <div className="tags">
            {Object.entries(GAMES).map(([k,v]) => (
              <button key={k} className={`btn btn-tab ${game===k?'active':''}`} onClick={() => setGame(k)}>
                {v.label}
              </button>
            ))}
          </div>
          <div className="tags">
            <button className={`btn btn-tab ${rarity==='all'?'active':''}`} onClick={() => setRarity('all')}>All Rarities</button>
            <button className={`btn btn-tab ${rarity==='5'?'active':''}`} onClick={() => setRarity('5')}>⭐ 5-Star</button>
            <button className={`btn btn-tab ${rarity==='4'?'active':''}`} onClick={() => setRarity('4')}>✨ 4-Star</button>
          </div>
        </div>

        <p style={{ fontSize:12, color:'var(--text-3)', marginBottom:20 }}>
          Showing <strong style={{color:'var(--text)'}}>{filtered.length}</strong> of {all.length} characters
        </p>

        {loading ? <div className="spinner" /> : (
          <div className="char-grid fade">
            {filtered.length === 0
              ? <div className="empty" style={{ gridColumn:'1/-1' }}>
                  <div className="empty-icon">😶</div>
                  No characters match these filters.
                </div>
              : filtered.map((c, i) => {
                  const gInfo = GAMES[c.game] || {};
                  return (
                    <div key={i} className={`card char-card rarity-border-${c.rarity}`}>
                      <div className={`cr-bar rarity-${c.rarity}`} />
                      <div className="char-icon-wrap">
                        <CharIcon name={c.name} game={c.game} rarity={c.rarity} emoji={c.emoji} />
                      </div>
                      <div className="char-body">
                        <div className="char-name">{c.name}</div>
                        <div style={{ display:'flex', gap:4, justifyContent:'center', flexWrap:'wrap', marginBottom:6 }}>
                          <span className={`badge b-${c.rarity}`}>{c.rarity}★</span>
                          {c.game && <span className={`badge ${gInfo.badge||''}`}>{c.game.toUpperCase()}</span>}
                        </div>
                        {c.element && <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:4 }}>{c.element}</div>}
                        <div style={{ fontSize:12, color:'var(--gold)', fontWeight:700 }}>✨ {c.shopPrice}</div>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        )}
      </div>

      <style>{`
        .char-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 12px;
        }
        .char-card {
          overflow: hidden;
          transition: transform .18s, box-shadow .18s;
          display: flex;
          flex-direction: column;
        }
        .char-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0,0,0,.4);
        }
        .cr-bar { height: 3px; flex-shrink: 0; }
        .rarity-5 { background: linear-gradient(90deg, var(--gold), #fde68a); }
        .rarity-4 { background: linear-gradient(90deg, var(--purple), var(--purple-light)); }
        .char-icon-wrap {
          width: 100%;
          aspect-ratio: 1;
          overflow: hidden;
          background: linear-gradient(160deg, var(--bg-3) 0%, var(--bg-2) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .char-icon-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top center;
          transition: transform .3s ease;
        }
        .char-card:hover .char-icon-img {
          transform: scale(1.06);
        }
        .char-icon-fallback {
          font-size: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }
        .char-body {
          padding: 10px 10px 12px;
          text-align: center;
          flex: 1;
        }
        .char-name {
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 6px;
          line-height: 1.3;
          color: var(--text);
        }
        .rarity-border-5 { border-color: rgba(245,158,11,.2); }
        .rarity-border-4 { border-color: rgba(139,92,246,.15); }
      `}</style>
    </div>
  );
}
