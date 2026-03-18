import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Coins, Star, Dog, Users, Search, ArrowUpDown } from 'lucide-react';
import './LeaderboardPage.css';

const TABS = [
  { key: 'balance',    label: 'Richest',          icon: Coins,   field: 'balance',        fmt: v => v.toLocaleString() + ' coins' },
  { key: 'level',      label: 'Highest Level',     icon: Star,    field: 'level',          fmt: v => 'Level ' + v },
  { key: 'pokemon',    label: 'Most Pokémon',      icon: Dog,     field: 'pokemonCount',   fmt: v => v.toLocaleString() + ' caught' },
  { key: 'characters', label: 'Most Characters',   icon: Users,   field: 'characterCount', fmt: v => v + ' chars' },
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

  const activeTab = TABS.find(t => t.key === sort);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="page leaderboard-page"
    >
      <div className="container">
        <div className="page-header">
          <motion.h1 className="page-title" initial={{ x: -20 }} animate={{ x: 0 }}>
            🏆 <span className="text-gradient">Leaderboard</span>
          </motion.h1>
          <p className="page-subtitle">{total.toLocaleString()} players ranked worldwide. Updated in real-time.</p>
        </div>

        {/* Sort Tabs */}
        <div className="tabs-container">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button 
                key={t.key} 
                className={`tab-btn ${sort === t.key ? 'active' : ''}`} 
                onClick={() => setSort(t.key)}
              >
                <Icon size={16} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {err && <div className="api-error">⚠️ {err}</div>}

        <div className="glass-card table-wrapper">
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Fetching Rankings...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="lb-table">
                <thead>
                  <tr>
                    <th className="col-rank">Rank</th>
                    <th className="col-player">Player</th>
                    <th className="col-level">Level</th>
                    <th className="col-score">{activeTab?.label}</th>
                    <th className="col-stardust">✨ Star Dust</th>
                  </tr>
                </thead>
                <AnimatePresence mode="wait">
                  <motion.tbody
                    key={sort}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {data.length === 0 ? (
                      <tr><td colSpan={5} className="empty-state">No data yet (っ˘ω˘ς)</td></tr>
                    ) : data.map((u, i) => (
                      <tr key={u.userId} className="lb-row">
                        <td className="col-rank text-center">
                          <span className={i < 3 ? 'rank-medal' : 'rank-number'}>
                            {i < 3 ? MEDAL[i] : `#${i+1}`}
                          </span>
                        </td>
                        <td className="col-player">
                          <Link to={`/profile/${u.userId}`} className="player-link">
                            <div className="player-avatar">
                              {u.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="player-name">
                              {u.username}
                            </span>
                          </Link>
                        </td>
                        <td className="col-level">
                          <span className="level-badge">
                            Lv.{u.level}
                          </span>
                        </td>
                        <td className="col-score score-value">
                          {activeTab?.fmt(u[activeTab.field] ?? 0)}
                        </td>
                        <td className="col-stardust">
                          <div className="stardust-wrapper">
                            <Star size={16} />
                            <span>{u.star_dust.toLocaleString()}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </motion.tbody>
                </AnimatePresence>
              </table>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
