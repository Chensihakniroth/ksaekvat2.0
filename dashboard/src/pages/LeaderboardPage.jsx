import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Star, Users, Gift, Activity, ChevronRight, BarChart2 } from 'lucide-react';

const TABS = [
  {
    key: 'balance',
    label: 'Resources',
    icon: Coins,
    field: 'balance',
    fmt: (v) => v.toLocaleString() + ' CC',
    badgeBg: 'rgba(245, 158, 11, 0.08)',
    badgeColor: '#f59e0b',
  },
  {
    key: 'level',
    label: 'Prestige',
    icon: Star,
    field: 'level',
    fmt: (v) => 'Level ' + v,
    badgeBg: 'rgba(168, 85, 247, 0.08)',
    badgeColor: '#a855f7',
  },
  {
    key: 'collection',
    label: 'Collection',
    icon: Users,
    field: 'collectionCount',
    fmt: (v) => v.toLocaleString() + ' Units',
    badgeBg: 'rgba(59, 130, 246, 0.08)',
    badgeColor: '#3b82f6',
  },
  {
    key: 'donations',
    label: 'Patrons',
    icon: Gift,
    field: 'totalDonated',
    fmt: (v) => (v || 0).toLocaleString() + ' CC',
    badgeBg: 'rgba(239, 68, 68, 0.08)',
    badgeColor: '#ef4444',
  },
];

const RANK_COLORS = {
  0: '#f59e0b', // Gold
  1: '#9ca3af', // Silver
  2: '#b45309', // Bronze
};

export default function LeaderboardPage() {
  const [sort, setSort] = useState('balance');
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    setLoading(true);
    setErr(null);
    fetch(`/api/leaderboard?sort=${sort}&limit=10`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setData(res.data);
          setTotal(res.total || 0);
        } else setErr(res.error || 'Failed to synchronize archives.');
        setLoading(false);
      })
      .catch(() => {
        setErr('Connection to archive lost.');
        setLoading(false);
      });
  }, [sort]);

  const activeTab = TABS.find((t) => t.key === sort);

  return (
    <div className="leaderboard-container" style={{ paddingBottom: '120px' }}>
      <div className="wrap" style={{ maxWidth: '850px' }}>
        
        {/* HEADER BLOCK */}
        <header style={{ marginBottom: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', opacity: 0.5 }}>
            <BarChart2 size={16} />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              Global Resonance Leaderboard
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, letterSpacing: '-0.04em', color: '#fff', margin: 0 }}>
            ARCHIVES
          </h1>

          {/* Tab Selection */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '15px' }}>
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = sort === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setSort(t.key)}
                  className="matte-btn"
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    background: isActive ? '#ffffff' : 'transparent',
                    color: isActive ? '#0b0b0c' : 'var(--text-muted)',
                    borderColor: isActive ? '#ffffff' : 'var(--border-matte)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Icon size={14} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </header>

        {/* ROSTER ROW LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? (
            <div style={{ padding: '80px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
              <Activity className="animate-pulse" size={24} style={{ color: 'var(--text-muted)' }} />
              <div style={{ fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>
                SYNCHRONIZING DATABANKS...
              </div>
            </div>
          ) : err ? (
            <div className="matte-card" style={{ padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <div style={{ color: '#ff3b5c', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.02em' }}>
                {err}
              </div>
              <button
                onClick={() => window.location.reload()}
                className="matte-btn matte-btn-danger"
              >
                Retry Uplink
              </button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {data.map((u, i) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02, duration: 0.4, ease: 'easeOut' }}
                  key={u.userId}
                >
                  <Link to={`/profile/${u.slug || u.username}`} style={{ display: 'block' }}>
                    <div 
                      className="matte-card"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '40px 1.5fr 1fr 1fr 30px',
                        alignItems: 'center',
                        gap: '20px',
                        padding: '16px 24px',
                        borderRadius: '12px'
                      }}
                    >
                      {/* Rank Position */}
                      <div
                        style={{
                          fontSize: '1.2rem',
                          fontWeight: 900,
                          fontFamily: 'monospace',
                          color: RANK_COLORS[i] || 'rgba(255,255,255,0.15)',
                        }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </div>

                      {/* Operative Bio */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div 
                          style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '8px', 
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border-matte)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.9rem',
                            fontWeight: 800,
                            color: '#fff',
                            flexShrink: 0
                          }}
                        >
                          {u.username[0].toUpperCase()}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {u.username}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
                            Prestige Lvl {u.level}
                          </span>
                        </div>
                      </div>

                      {/* Primary Stat Block */}
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                          {activeTab?.label}
                        </span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                          {activeTab?.fmt(u[activeTab.field] ?? 0)}
                        </span>
                      </div>

                      {/* Secondary Stat Block (Star Dust) */}
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                          Star Dust
                        </span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                          {u.star_dust.toLocaleString()}
                        </span>
                      </div>

                      {/* Row Action Arrow */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', opacity: 0.25 }}>
                        <ChevronRight size={16} style={{ color: '#fff' }} />
                      </div>

                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* DATA ARCHIVE FOOTER */}
        <footer
          style={{
            marginTop: '60px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: 0.3,
          }}
        >
          <div
            style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.25em',
              color: 'var(--text-muted)'
            }}
          >
            Verified Registry Archive // {total.toLocaleString()} Operatives Indexed
          </div>
        </footer>

      </div>
    </div>
  );
}
