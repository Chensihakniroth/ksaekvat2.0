import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const GAME_LABEL = { genshin:'Genshin', hsr:'HSR', wuwa:'Wuwa', zzz:'ZZZ' };
const GAME_BADGE = { genshin:'b-g', hsr:'b-h', wuwa:'b-w', zzz:'b-z' };

export default function ProfilePage() {
  const { userId } = useParams();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [gameFilter, setGameFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/profile/${userId}`)
      .then(r => r.json())
      .then(res => { if (res.success) setP(res.data); else setNotFound(true); setLoading(false); })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [userId]);

  if (loading) return <div className="spinner" style={{ marginTop: 100 }} />;
  if (notFound) return (
    <div className="page wrap" style={{ textAlign:'center', paddingTop:100 }}>
      <div style={{ fontSize:56 }}>😢</div>
      <h2 style={{ margin:'16px 0 8px' }}>Player not found</h2>
      <p style={{ color:'var(--text-3)', marginBottom:24 }}>This user hasn't played yet or the ID is wrong.</p>
      <Link to="/leaderboard" className="btn btn-primary">← Back to Leaderboard</Link>
    </div>
  );

  const xpPct = Math.min(100, Math.round((p.experience % 1000) / 10));
  const games = ['all', ...new Set(p.characters.map(c => c.game))];
  const chars = gameFilter === 'all' ? p.characters : p.characters.filter(c => c.game === gameFilter);

  const totalPoke = Object.values(p.pokemon).reduce((a, g) =>
    a + Object.values(g).reduce((s, c) => s + c, 0), 0);

  return (
    <div className="page">
      <div className="wrap">
        {/* Profile Card */}
        <div className="card card-p prof-card fade" style={{ marginBottom:32, marginTop:32 }}>
          <div className="prof-avatar">{p.username[0]?.toUpperCase()}</div>
          <div className="prof-info">
            <h1 style={{ fontSize:26, fontWeight:800, marginBottom:10 }}>{p.username}</h1>
            <div style={{ display:'flex', flexWrap:'wrap', gap:10, alignItems:'center', marginBottom:16 }}>
              <span className="badge b-4">Lv.{p.level}</span>
              <span style={{ color:'var(--gold)', fontSize:14, fontWeight:600 }}>🪙 {p.balance.toLocaleString()}</span>
              <span style={{ color:'var(--gold)', fontSize:14, fontWeight:600 }}>✨ {p.star_dust.toLocaleString()} Star Dust</span>
            </div>
            <div className="xp-track" style={{ maxWidth:360, marginBottom:6 }}>
              <div className="xp-fill" style={{ width:`${xpPct}%` }} />
            </div>
            <div style={{ fontSize:11, color:'var(--text-3)' }}>{p.experience.toLocaleString()} XP</div>
          </div>
          <div className="prof-mini-stats">
            <div className="ms"><span>{p.characterCount}</span>Characters</div>
            <div className="ms"><span>{totalPoke.toLocaleString()}</span>Pokémon</div>
            <div className="ms"><span>{p.stats?.commandsUsed ?? 0}</span>Commands</div>
          </div>
        </div>

        {/* Characters */}
        <div style={{ marginBottom:40 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10, marginBottom:16 }}>
            <p className="section-label" style={{ margin:0 }}>Character Collection ({p.characterCount})</p>
            <div className="tags">
              {games.map(g => (
                <button key={g} className={`btn btn-tab ${gameFilter===g?'active':''}`} onClick={() => setGameFilter(g)}>
                  {g==='all'?'All':GAME_LABEL[g]||g}
                </button>
              ))}
            </div>
          </div>
          {chars.length === 0
            ? <div className="empty"><div className="empty-icon">🎭</div>No characters match this filter.</div>
            : <div className="g5">
                {chars.map((c,i) => (
                  <div key={i} className="card char-mini fade">
                    <div className={`char-rarity-bar rarity-${c.rarity}`} />
                    <div style={{ padding:'14px 12px 12px', textAlign:'center' }}>
                      <div style={{ fontSize:26, marginBottom:6 }}>{c.emoji || '✨'}</div>
                      <div style={{ fontSize:12, fontWeight:700, marginBottom:6, lineHeight:1.3 }}>{c.name}</div>
                      <div style={{ display:'flex', gap:4, justifyContent:'center', flexWrap:'wrap' }}>
                        <span className={`badge b-${c.rarity}`}>{c.rarity}★</span>
                        {c.game && <span className={`badge ${GAME_BADGE[c.game]||''}`}>{GAME_LABEL[c.game]||c.game}</span>}
                      </div>
                      {c.count > 1 && <div style={{ fontSize:11, color:'var(--text-3)', marginTop:4 }}>×{c.count}</div>}
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Pokémon */}
        <div>
          <p className="section-label">Pokémon Collection ({totalPoke.toLocaleString()} caught)</p>
          {Object.keys(p.pokemon).length === 0
            ? <div className="empty"><div className="empty-icon">🐾</div>No Pokémon yet. Try `khunt`!</div>
            : <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {Object.entries(p.pokemon).map(([rarity, group]) => (
                  <div key={rarity} className="card card-p fade">
                    <div className="section-label" style={{ marginBottom:10 }}>{rarity}</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {Object.entries(group).map(([name, count]) => (
                        <span key={name} style={{ background:'var(--bg-2)', border:'1px solid var(--border)', padding:'3px 10px', borderRadius:'100px', fontSize:12, color:'var(--text-2)', display:'flex', gap:5, alignItems:'center' }}>
                          {name}
                          {count > 1 && <span style={{ color:'var(--cyan)', fontWeight:700 }}>×{count}</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>

      <style>{`
        .prof-card { display:grid; grid-template-columns:auto 1fr auto; gap:24px; align-items:start; }
        @media(max-width:700px){ .prof-card { grid-template-columns:1fr; } }
        .prof-avatar { width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,var(--purple),var(--cyan));display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:900;color:#fff;flex-shrink:0; }
        .prof-mini-stats { display:flex; gap:24px; align-items:start; }
        .ms { text-align:center; font-size:12px; color:var(--text-3); }
        .ms span { display:block; font-size:22px; font-weight:800; color:var(--text); margin-bottom:2px; }
        .char-mini { overflow:hidden; }
        .char-rarity-bar { height:3px; }
        .rarity-5 { background:linear-gradient(90deg,var(--gold),#fde68a); }
        .rarity-4 { background:linear-gradient(90deg,var(--purple),var(--purple-light)); }
      `}</style>
    </div>
  );
}
