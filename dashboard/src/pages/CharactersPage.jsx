import { useState, useEffect } from 'react';

const GAMES = {
  all:    { label: '🌐 All', badge: '' },
  genshin:{ label: '⚔️ Genshin', badge: 'b-g' },
  hsr:    { label: '🚂 HSR', badge: 'b-h' },
  wuwa:   { label: '🌊 Wuwa', badge: 'b-w' },
  zzz:    { label: '📺 ZZZ', badge: 'b-z' },
};

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
            onChange={e => { setSearch(e.target.value); }}
            style={{ maxWidth: 300 }}
          />
          <div className="tags">
            {Object.entries(GAMES).map(([k,v]) => (
              <button key={k} className={`btn btn-tab ${game===k?'active':''}`} onClick={() => setGame(k)}>{v.label}</button>
            ))}
          </div>
          <div className="tags">
            <button className={`btn btn-tab ${rarity==='all'?'active':''}`} onClick={() => setRarity('all')}>All Rarities</button>
            <button className={`btn btn-tab ${rarity==='5'?'active':''}`} onClick={() => setRarity('5')}>⭐ 5-Star</button>
            <button className={`btn btn-tab ${rarity==='4'?'active':''}`} onClick={() => setRarity('4')}>✨ 4-Star</button>
          </div>
        </div>

        <p style={{ fontSize:12, color:'var(--text-3)', marginBottom:16 }}>
          Showing <strong style={{color:'var(--text)'}}>{filtered.length}</strong> of {all.length} characters
        </p>

        {loading ? <div className="spinner" /> : (
          <div className="g5 fade">
            {filtered.length === 0
              ? <div className="empty" style={{ gridColumn:'1/-1' }}>
                  <div className="empty-icon">😶</div>
                  No characters match these filters.
                </div>
              : filtered.map((c, i) => {
                  const gBadge = GAMES[c.game]?.badge || '';
                  return (
                    <div key={i} className="card char-card">
                      <div className={`cr-bar rarity-${c.rarity}`} />
                      <div style={{ padding:'16px 12px 14px', textAlign:'center' }}>
                        <div style={{ fontSize:28, marginBottom:8 }}>{c.emoji || (c.rarity==='5'?'⭐':'✨')}</div>
                        <div style={{ fontSize:12, fontWeight:700, marginBottom:8, lineHeight:1.3 }}>{c.name}</div>
                        <div style={{ display:'flex', gap:4, justifyContent:'center', flexWrap:'wrap', marginBottom:8 }}>
                          <span className={`badge b-${c.rarity}`}>{c.rarity}★</span>
                          {c.game && <span className={`badge ${gBadge}`}>{c.game.toUpperCase()}</span>}
                        </div>
                        {c.element && <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:6 }}>{c.element}</div>}
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
        .char-card { overflow:hidden; }
        .cr-bar { height:3px; }
        .rarity-5 { background:linear-gradient(90deg,var(--gold),#fde68a); }
        .rarity-4 { background:linear-gradient(90deg,var(--purple),var(--purple-light)); }
        .char-card:hover { transform:translateY(-2px); }
        .char-card { transition:transform .18s; }
      `}</style>
    </div>
  );
}
