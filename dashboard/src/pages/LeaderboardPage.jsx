import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Coins, Star, Dog, Users, Search, ArrowUpDown } from 'lucide-react';

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
      className="page"
    >
      <div className="wrap">
        <div className="ph-v3">
          <motion.h1 initial={{ x: -20 }} animate={{ x: 0 }}>
            🏆 <span className="grad">Leaderboard</span>
          </motion.h1>
          <p>{total.toLocaleString()} players ranked worldwide. Updated in real-time.</p>
        </div>

        {/* Sort Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-surface/50 p-1.5 rounded-full border border-white/5 w-fit">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button 
                key={t.key} 
                className={`btn-tab-v3 flex items-center gap-2 ${sort === t.key ? 'active' : ''}`} 
                onClick={() => setSort(t.key)}
              >
                <Icon size={14} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {err && <div className="api-err-v3">⚠️ {err}</div>}

        <div className="card-glass overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="spinner mx-auto" />
              <p className="text-text-3 mt-4 font-bold uppercase tracking-widest text-xs">Fetching Rankings...</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table-v3">
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>Rank</th>
                    <th>Player</th>
                    <th style={{ width: 120 }}>Level</th>
                    <th>{activeTab?.label}</th>
                    <th style={{ width: 160 }}>✨ Star Dust</th>
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
                      <tr><td colSpan={5} className="empty">No data yet (っ˘ω˘ς)</td></tr>
                    ) : data.map((u, i) => (
                      <tr key={u.userId}>
                        <td className="text-center">
                          <span className={i < 3 ? 'text-2xl' : 'font-bold text-text-dim'}>
                            {i < 3 ? MEDAL[i] : `#${i+1}`}
                          </span>
                        </td>
                        <td>
                          <Link to={`/profile/${u.userId}`} className="flex items-center gap-3 group">
                            <div className="w-8 h-8 rounded-full bg-purple/10 flex items-center justify-center text-purple-light font-bold text-xs border border-purple/20">
                              {u.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold group-hover:text-purple-light transition-colors">
                              {u.username}
                            </span>
                          </Link>
                        </td>
                        <td>
                          <span className="badge-v3 bg-purple/10 text-purple-light border-purple/20">
                            Lv.{u.level}
                          </span>
                        </td>
                        <td className="font-extrabold text-cyan-light">
                          {activeTab?.fmt(u[activeTab.field] ?? 0)}
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5 text-gold font-bold">
                            <Star size={14} />
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

      <style>{`
        .flex { display: flex; }
        .flex-wrap { flex-wrap: wrap; }
        .gap-2 { gap: 0.5rem; }
        .gap-3 { gap: 0.75rem; }
        .mb-8 { margin-bottom: 2rem; }
        .p-1\\.5 { padding: 0.375rem; }
        .rounded-full { border-radius: 9999px; }
        .w-fit { width: fit-content; }
        .bg-surface\\/50 { background-color: rgba(255, 255, 255, 0.025); }
        .text-center { text-align: center; }
        .mx-auto { margin-left: auto; margin-right: auto; }
        .mt-4 { margin-top: 1rem; }
        .p-12 { padding: 3rem; }
        .w-8 { width: 2rem; }
        .h-8 { height: 2rem; }
        .text-2xl { font-size: 1.5rem; line-height: 2rem; }
      `}</style>
    </motion.div>
  );
}
