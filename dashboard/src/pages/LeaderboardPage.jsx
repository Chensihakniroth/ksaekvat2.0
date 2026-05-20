import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Coins, Star, Users, Gift, Activity, ChevronRight, BarChart2 } from 'lucide-react';

const TABS = [
  { key: 'balance',    label: 'RESOURCES',    icon: Coins,   field: 'balance',        fmt: v => v.toLocaleString() + ' CC', color: 'var(--cyber-yellow)' },
  { key: 'level',      label: 'PRESTIGE',     icon: Star,    field: 'level',          fmt: v => 'Level ' + v, color: 'var(--cyber-purple)' },
  { key: 'collection', label: 'COLLECTION',   icon: Users,   field: 'collectionCount',fmt: v => v.toLocaleString() + ' Units', color: 'var(--cyber-cyan)' },
  { key: 'donations',  label: 'PATRONS',      icon: Gift,    field: 'totalDonated',   fmt: v => (v || 0).toLocaleString() + ' CC', color: 'var(--cyber-pink)' },
];

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
      .then(r => r.json())
      .then(res => {
        if (res.success) { setData(res.data); setTotal(res.total || 0); }
        else setErr(res.error || 'Failed to synchronize archives.');
        setLoading(false);
      })
      .catch(() => { setErr('Connection to archive lost.'); setLoading(false); });
  }, [sort]);

  const activeTab = TABS.find(t => t.key === sort);

  return (
    <div className="leaderboard-container" style={{ paddingBottom: '120px' }}>
      <div className="wrap" style={{ maxWidth: '1000px' }}>
        
        <header style={{ marginBottom: '80px', textAlign: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-50px', left: '50%', transform: 'translateX(-50%)', width: '200px', height: '200px', background: 'var(--cyber-cyan)', filter: 'blur(150px)', opacity: 0.1, zIndex: -1 }} />
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', opacity: 0.8, marginBottom: '20px' }}
          >
            <BarChart2 size={16} color="var(--cyber-cyan)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em', color: 'var(--cyber-cyan)', textShadow: '0 0 10px rgba(0,243,255,0.5)' }}>Global Resonance</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', fontWeight: 900, letterSpacing: '-0.06em', marginBottom: '50px', color: '#fff', textShadow: '0 0 20px rgba(255,255,255,0.2)' }}
          >
            ARCHIVES
          </motion.h1>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
            {TABS.map(t => {
              const Icon = t.icon;
              const isActive = sort === t.key;
              return (
                <button 
                  key={t.key} 
                  onClick={() => setSort(t.key)}
                  style={{
                    padding: '14px 28px',
                    borderRadius: '50px',
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    letterSpacing: '0.15em',
                    background: isActive ? 'var(--cyber-cyan)' : 'rgba(255,255,255,0.02)',
                    color: isActive ? '#000' : 'var(--text-dim)',
                    border: `1px solid ${isActive ? 'transparent' : 'rgba(255,255,255,0.05)'}`,
                    boxShadow: isActive ? '0 0 20px rgba(0,243,255,0.3)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  <Icon size={16} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </header>

        <div className="roster-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {loading ? (
            <div style={{ padding: '100px', textAlign: 'center', opacity: 0.5 }}>
              <Activity className="animate-pulse" style={{ margin: '0 auto 20px', color: 'var(--cyber-cyan)' }} size={32} />
              <div style={{ fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.4em', color: 'var(--cyber-cyan)' }}>SYNCHRONIZING DATABANKS...</div>
            </div>
          ) : err ? (
            <div style={{ padding: '100px', textAlign: 'center' }}>
              <div style={{ color: 'var(--cyber-pink)', fontWeight: 900, fontSize: '1.2rem', marginBottom: '20px', letterSpacing: '0.1em' }}>{err}</div>
              <button onClick={() => window.location.reload()} className="btn-v3" style={{ background: 'rgba(255,0,60,0.1)', border: '1px solid var(--cyber-pink)', color: 'var(--cyber-pink)' }}>Retry Uplink</button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {data.map((u, i) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  key={u.userId}
                >
                  <Link to={`/profile/${u.slug || u.username}`} style={{ display: 'block' }}>
                    <div className="roster-card">
                      {/* Rank Number */}
                      <div className="roster-rank" style={{ 
                        color: i === 0 ? 'var(--cyber-yellow)' : i === 1 ? '#e2e8f0' : i === 2 ? '#cd7f32' : 'rgba(255,255,255,0.1)',
                        textShadow: i < 3 ? `0 0 15px ${i === 0 ? 'var(--cyber-yellow)' : 'rgba(255,255,255,0.5)'}` : 'none',
                      }}>
                        {String(i + 1).padStart(2, '0')}
                      </div>

                      {/* Operative Info */}
                      <div className="roster-info">
                        <div className="roster-avatar">
                          {u.username[0].toUpperCase()}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.02em', color: '#fff' }}>{u.username}</span>
                          <span style={{ fontSize: '0.65rem', opacity: 0.4, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase' }}>LVL {u.level} // OPR_{u.userId.slice(-4)}</span>
                        </div>
                      </div>

                      {/* Primary Stat */}
                      <div className="roster-stat">
                        <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.3, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>{activeTab?.label}</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: activeTab?.color, textShadow: `0 0 15px ${activeTab?.color}40` }}>
                          {activeTab?.fmt(u[activeTab.field] ?? 0)}
                        </div>
                      </div>

                      {/* Star Dust */}
                      <div className="roster-dust">
                        <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.3, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>DUST</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)' }}>
                          <Star size={12} color="var(--cyber-yellow)" />
                          <span style={{ fontSize: '1rem', fontWeight: 700 }}>{u.star_dust.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="roster-action">
                        <ChevronRight size={24} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        <footer style={{ marginTop: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: 0.2 }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em' }}>
            Data Integrity Verified // {total.toLocaleString()} Operatives Indexed // {new Date().toLocaleDateString()}
          </div>
        </footer>
      </div>
    </div>
  );
}

