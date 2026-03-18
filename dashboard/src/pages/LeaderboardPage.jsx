import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const TABS = [
  { key: 'balance',    label: '🪙 Richest',          field: 'balance',        fmt: v => v.toLocaleString() + ' coins' },
  { key: 'level',      label: '⭐ Highest Level',     field: 'level',          fmt: v => 'Level ' + v },
  { key: 'pokemon',    label: '🐾 Most Pokémon',      field: 'pokemonCount',   fmt: v => v.toLocaleString() + ' caught' },
  { key: 'characters', label: '🎭 Most Characters',   field: 'characterCount', fmt: v => v + ' chars' },
];

const MEDAL = ['🥇','🥈','🥉'];

export default function LeaderboardPage() {
  const [sort, setSort] = useState('balance');
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    setLoading(true);
    setErr(null);
    fetch(`/api/leaderboard?sort=${sort}&limit=20`)
      .then(r => r.json())
      .then(res => {
        if (res.success) { setData(res.data); setTotal(res.total || 0); }
        else setErr(res.error || 'Failed to load data.');
        setLoading(false);
      })
      .catch(() => { setErr('Could not reach the API.'); setLoading(false); });
  }, [sort]);

  const tab = TABS.find(t => t.key === sort);

  return (
    <div className="page">
      <div className="wrap">
        <div className="ph">
          <h1>🏆 <span className="grad">Leaderboard</span></h1>
          <p>{total.toLocaleString()} players ranked worldwide</p>
        </div>

        {/* Sort tabs */}
        <div className="tags" style={{ marginBottom: 24 }}>
          {TABS.map(t => (
            <button key={t.key} className={`btn btn-tab ${sort === t.key ? 'active' : ''}`} onClick={() => setSort(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {err && <div style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.25)',color:'#f87171',padding:'12px 16px',borderRadius:'var(--radius-s)',fontSize:'13px',marginBottom:20}}>⚠️ {err}</div>}

        {loading ? <div className="spinner" /> : (
          <div className="card fade" style={{ overflow: 'hidden' }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 56 }}>#</th>
                  <th>Player</th>
                  <th style={{ width: 90 }}>Level</th>
                  <th>{tab?.label}</th>
                  <th style={{ width: 140 }}>✨ Star Dust</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan={5} className="empty">No data yet (っ˘ω˘ς)</td></tr>
                ) : data.map((u, i) => (
                  <tr key={u.userId} className={i < 3 ? `r${i+1}` : ''}>
                    <td style={{ fontWeight: 700, fontSize: i < 3 ? 20 : 14, color: i < 3 ? undefined : 'var(--text-3)' }}>
                      {i < 3 ? MEDAL[i] : `#${i+1}`}
                    </td>
                    <td>
                      <Link to={`/profile/${u.userId}`} style={{ fontWeight: 600, color: 'var(--text)' }}
                        onMouseOver={e => e.target.style.color='var(--purple-light)'}
                        onMouseOut={e => e.target.style.color='var(--text)'}
                      >
                        {u.username}
                      </Link>
                    </td>
                    <td><span className="badge b-4">Lv.{u.level}</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--cyan)' }}>{tab?.fmt(u[tab.field] ?? 0)}</td>
                    <td style={{ color: 'var(--gold)', fontWeight: 600 }}>{u.star_dust.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
