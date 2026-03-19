import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Coins, Star, Dog, Users, Terminal, Zap, Activity, ChevronRight } from 'lucide-react';

const TABS = [
  { key: 'balance',    label: 'Economy',      icon: Coins,   field: 'balance',        fmt: v => v.toLocaleString() + ' CC', color: 'text-gold' },
  { key: 'level',      label: 'Prestige',     icon: Star,    field: 'level',          fmt: v => 'Level ' + v, color: 'text-purple-400' },
  { key: 'pokemon',    label: 'Bio-Data',      icon: Dog,     field: 'pokemonCount',   fmt: v => v.toLocaleString() + ' Units', color: 'text-green-400' },
  { key: 'characters', label: 'Roster',   icon: Users,   field: 'characterCount', fmt: v => v + ' Assets', color: 'text-cyan-400' },
];

const MEDAL_COLORS = ['text-gold', 'text-text-dim', 'text-red'];

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
        else setErr(res.error || 'Failed to sync with terminal.');
        setLoading(false);
      })
      .catch(() => { setErr('Terminal connection lost.'); setLoading(false); });
  }, [sort]);

  const activeTab = TABS.find(t => t.key === sort);

  return (
    <div className="leaderboard-container">
      <div className="wrap">
        {/* --- HEADER --- */}
        <div className="terminal-header">
          <div className="terminal-badge">
            <Terminal size={16} />
            <span>Global Rankings Terminal</span>
          </div>
          
          <div className="header-main">
            <div className="header-titles">
              <h1 className="terminal-title">
                RANKINGS <span className="text-gradient">TERMINAL</span>
              </h1>
              <div className="terminal-stats">
                <div className="stat-item">
                  <Activity size={12} className="text-green-400" />
                  <span>{total.toLocaleString()} Operatives Indexed</span>
                </div>
                <div className="stat-item">
                  <Zap size={12} className="text-purple-400" />
                  <span>Neural Sync Active</span>
                </div>
              </div>
            </div>

            <div className="terminal-tabs glass-panel">
              {TABS.map(t => {
                const Icon = t.icon;
                const isActive = sort === t.key;
                return (
                  <button 
                    key={t.key} 
                    onClick={() => setSort(t.key)}
                    className={`tab-btn ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={14} className={isActive ? t.color : ''} />
                    <span className="tab-label">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* --- TABLE --- */}
        <div className="glass-panel terminal-card neon-border">
          {loading ? (
            <div className="terminal-loading">
              <div className="spinner" />
              <div className="loading-text">Syncing Neural Database...</div>
            </div>
          ) : err ? (
            <div className="terminal-error">
              <div className="error-msg">CRITICAL ERROR: {err}</div>
              <button onClick={() => window.location.reload()} className="btn-v3 btn-v3-ghost">Reboot Terminal</button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="terminal-table">
                <thead>
                  <tr>
                    <th className="col-pos">Pos</th>
                    <th className="col-op">Operative</th>
                    <th className="col-rank">Rank</th>
                    <th className="col-score">{activeTab?.label}</th>
                    <th className="col-dust">Star Dust</th>
                    <th className="col-action"></th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {data.map((u, i) => (
                      <motion.tr 
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={u.userId} 
                        className="table-row"
                      >
                        <td>
                          <div className={`pos-id ${i < 3 ? MEDAL_COLORS[i] : ''}`}>
                            {i < 3 ? `0${i+1}` : i + 1}
                          </div>
                        </td>
                        <td>
                          <Link to={`/profile/${u.userId}`} className="op-link">
                            <div className="op-avatar">
                              {u.username[0].toUpperCase()}
                            </div>
                            <div className="op-info">
                              <span className="op-name">{u.username}</span>
                              <span className="op-id">ID_{u.userId}</span>
                            </div>
                          </Link>
                        </td>
                        <td className="text-center">
                          <div className="rank-badge">Level {u.level}</div>
                        </td>
                        <td className="text-right">
                          <div className={`score-val ${activeTab?.color || ''}`}>
                            {activeTab?.fmt(u[activeTab.field] ?? 0)}
                          </div>
                        </td>
                        <td className="text-right">
                          <div className="dust-val">
                            <Star size={14} className="text-gold" />
                            <span>{u.star_dust.toLocaleString()}</span>
                          </div>
                        </td>
                        <td>
                          <Link to={`/profile/${u.userId}`} className="row-action">
                            <ChevronRight size={18} />
                          </Link>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="terminal-footer">
          <div className="footer-meta">
            <span>Security_Clearance: Level_03</span>
            <span className="separator">|</span>
            <span>Encryption: AES-256</span>
          </div>
          <div className="footer-timestamp">Transmission // {new Date().toLocaleTimeString()}</div>
        </div>
      </div>
    </div>
  );
}
