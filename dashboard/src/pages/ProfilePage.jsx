import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Trophy, Coins, Star, Dog, Sparkles, ArrowLeft,
  Share2, Zap, Heart, History, Box, Filter, Terminal,
  Layers, BarChart3, Globe, Award, Crosshair, Activity, PawPrint
} from 'lucide-react';
import CharIcon from '../components/CharIcon';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  Tooltip as ReTooltip
} from 'recharts';

const GAME_LABEL = { 
  genshin: 'Genshin Impact', 
  hsr: 'Honkai: Star Rail', 
  wuwa: 'Wuthering Waves', 
  zzz: 'Zenless Zone Zero' 
};

const RARITY_COLORS = {
  '5': '#fbbf24', // Gold
  '4': '#a78bfa', // Purple
  '3': '#94a3b8'  // Slate
};

const TAB_ICONS = {
  units: <Layers size={16} />,
  zoo: <Dog size={16} />,
  stats: <BarChart3 size={16} />
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03 }
  }
};

export default function ProfilePage() {
  const { userId } = useParams();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('units');
  const [gameFilter, setGameFilter] = useState('all');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    console.log(`[Profile] Requesting data for UID: ${userId}...`);
    setLoading(true);
    fetch(`/api/profile/${userId}`)
      .then(r => r.json())
      .then(res => { 
        if (res.success) {
          console.log(`[Profile] Successfully loaded data for: ${res.data.username}`);
          setP(res.data); 
        } else { 
          console.error(`[Profile] API Error for ${userId}:`, res.error);
          setNotFound(true); 
        }
        setLoading(false); 
      })
      .catch((err) => { 
        console.error(`[Profile] Network error for ${userId}:`, err);
        setNotFound(true); 
        setLoading(false); 
      });
  }, [userId]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statsData = useMemo(() => {
    if (!p) return [];
    return [
      { name: '5★', value: p.characters.filter(c => c.rarity === '5').length },
      { name: '4★', value: p.characters.filter(c => c.rarity === '4').length },
      { name: '3★', value: p.characters.filter(c => c.rarity === '3').length },
    ].filter(d => d.value > 0);
  }, [p]);

  const filteredChars = useMemo(() => {
    if (!p) return [];
    return p.characters.filter(c => {
      const matchesGame = gameFilter === 'all' || c.game?.toLowerCase() === gameFilter;
      const matchesRarity = rarityFilter === 'all' || c.rarity === rarityFilter;
      return matchesGame && matchesRarity;
    });
  }, [p, gameFilter, rarityFilter]);

  if (loading) return (
    <div className="profile-loading-screen">
      <div className="loading-core">
        <div className="scanner-circle">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="ring ring-outer" />
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="ring ring-inner" />
          <div className="core-icon"><Activity size={24} className="animate-pulse" /></div>
        </div>
        <div className="loading-text glitch-text">Establishing Uplink...</div>
      </div>
    </div>
  );

  if (notFound || !p) return (
    <div className="profile-not-found wrap">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel error-card neon-border">
        <div className="error-icon-wrap"><User size={48} /></div>
        <h2 className="error-title">Target Not Found</h2>
        <p className="error-desc">The specified operative ID does not exist in our central database. They may be off-grid.</p>
        <Link to="/leaderboard" className="btn-v3 btn-v3-ghost"><ArrowLeft size={16} /> Return to Network</Link>
      </motion.div>
    </div>
  );

  const xpProgress = (p.experience % 1000) / 10;
  const nextXp = 1000 - (p.experience % 1000);

  return (
    <div className="profile-container">
      <div className="wrap">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="profile-nav">
           <Link to="/leaderboard" className="nav-back-btn"><ArrowLeft size={14} /> <span>Leaderboard</span></Link>
           <button onClick={handleShare} className={`share-btn ${copied ? 'copied' : ''}`}><Share2 size={14} /><span>{copied ? 'Uplink Copied!' : 'Share Profile'}</span></button>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="glass-panel profile-hero neon-border">
          <div className="hero-grid-layout">
            <div className="hero-avatar-section">
              <div className="avatar-ring-wrap">
                <div className="avatar-ring animate-spin-slow">
                  <div className="avatar-core"><span className="avatar-initial">{p.username[0]?.toUpperCase()}</span></div>
                </div>
                <div className="rank-tag"><span className="label">RANK</span><span className="val">{p.level}</span></div>
              </div>
              <div className="world-level-badge"><Globe size={12} /> <span>World Level {p.worldLevel || 1}</span></div>
            </div>

            <div className="hero-info-section">
              <div className="info-header">
                <div className="info-titles">
                  <h1 className="profile-username glitch-text">{p.username}</h1>
                  <div className="profile-id-tag"><Zap size={12} className="text-gold" /> <span>Operative ID: <span className="id-val">{userId}</span></span></div>
                </div>
                <div className="profile-balances">
                  <div className="balance-item glass-panel">
                    <div className="label"><Coins size={12} className="text-gold" /> Credits</div>
                    <div className="val">{p.balance.toLocaleString()}</div>
                  </div>
                  <div className="balance-item glass-panel">
                    <div className="label"><Sparkles size={12} className="text-cyan" /> Dust</div>
                    <div className="val">{p.star_dust.toLocaleString()}</div>
                  </div>
                </div>
              </div>
              <div className="xp-section">
                <div className="xp-labels"><span className="xp-title">Combat Experience</span><span className="xp-total">{p.experience.toLocaleString()} <span className="dim">TOTAL</span></span></div>
                <div className="xp-bar-container"><motion.div initial={{ width: 0 }} animate={{ width: `${xpProgress}%` }} className="xp-bar-fill" /></div>
                <div className="xp-footer">{nextXp} XP UNTIL PROMOTION</div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="profile-quick-stats">
          <QuickStat icon={<Layers />} label="Arsenal" value={p.characterCount} color="purple" />
          <QuickStat icon={<Dog />} label="Bestiary" value={p.pokemonCount} color="cyan" />
          <QuickStat icon={<Zap />} label="Operations" value={(p.stats?.commandsUsed ?? 0).toLocaleString()} color="gold" />
          <QuickStat icon={<Trophy />} label="5★ Pity" value={`${p.pity ?? 0}/90`} color="pink" sub="Guar. at 90" />
        </div>

        <div className="profile-tabs-container">
          <div className="tabs-track glass-panel">
            {['units', 'zoo', 'stats'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`profile-tab-btn ${activeTab === tab ? 'active' : ''}`}>
                {TAB_ICONS[tab]} <span>{tab}</span>
                {activeTab === tab && <motion.div layoutId="profileActiveTab" className="active-tab-bg" />}
              </button>
            ))}
          </div>
        </div>

        <div className="profile-content-area">
          <AnimatePresence mode="wait">
            {activeTab === 'units' && (
              <motion.div key="units" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
                <div className="tactical-filters glass-panel">
                  <div className="filter-group">
                    {['all', 'genshin', 'hsr', 'wuwa', 'zzz'].map(g => (
                      <button key={g} onClick={() => setGameFilter(g)} className={`filter-btn ${gameFilter === g ? 'active' : ''}`}>{g === 'all' ? 'All Realms' : g.toUpperCase()}</button>
                    ))}
                  </div>
                  <div className="select-wrap">
                    <select value={rarityFilter} onChange={(e) => setRarityFilter(e.target.value)} className="rarity-select">
                      <option value="all">All Rarities</option>
                      <option value="5">Legendary (5★)</option>
                      <option value="4">Epic (4★)</option>
                      <option value="3">Rare (3★)</option>
                    </select>
                    <Filter size={12} className="select-icon" />
                  </div>
                </div>

                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="units-grid">
                  {filteredChars.length > 0 ? filteredChars.map((c, i) => (
                    <UnitCard key={`${c.name}-${i}`} char={c} />
                  )) : (
                    <div className="empty-state-panel glass-panel col-span-full">
                       <Box size={48} className="empty-icon" />
                       <p className="empty-text">No assets match current filters</p>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'zoo' && (
              <motion.div key="zoo" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
                {Object.keys(p.pokemon || {}).length > 0 ? Object.entries(p.pokemon).sort((a, b) => {
                  const order = { 'priceless': 0, 'mythic': 1, 'legendary': 2, 'rare': 3, 'uncommon': 4, 'common': 5 };
                  return (order[a[0]] ?? 99) - (order[b[0]] ?? 99);
                }).map(([rarity, animals]) => (
                  <div key={rarity} className="zoo-tier-section glass-panel neon-border">
                    <div className="tier-header">
                       <div className="tier-marker" style={{ backgroundColor: getRarityColor(rarity) }} />
                       <h3 className="tier-title">{rarity} TIER</h3>
                       <div className="tier-line" />
                    </div>
                    <div className="animals-subgrid">
                      {Object.entries(animals).map(([name, data]) => (
                        <div key={name} className="animal-card-mini">
                          <div className="animal-sprite-wrap">
                            {data.sprite ? <img src={data.sprite} alt={name} className="animal-sprite animate-float" /> : <Dog size={24} className="placeholder-icon" />}
                          </div>
                          <div className="animal-mini-info">
                            <div className="animal-mini-name">{name}</div>
                            <div className="animal-qty">QTY: {data.count}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )) : (
                  <div className="empty-state-panel glass-panel">
                    <PawPrint size={48} className="empty-icon" />
                    <p className="empty-text">Wilderness Empty</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div key="stats" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="stats-tab-v3">
                 
                 {/* --- LEFT: COMPOSITION ANALYTICS --- */}
                 <div className="stats-panel-v3 glass-panel neon-border">
                    <div className="panel-header-v3">
                       <div className="panel-title-wrap">
                          <Crosshair size={18} className="text-purple" />
                          <h3 className="panel-title">Tactical Composition</h3>
                       </div>
                       <div className="neural-sync-v3">
                          <span className="sync-label">NEURAL_SYNC</span>
                          <div className="sync-bar-wrap">
                             <div className="sync-bar-fill" style={{ width: `${Math.min(100, 80 + p.level)}%` }} />
                          </div>
                          <span className="sync-val">{Math.min(100, 80 + p.level)}%</span>
                       </div>
                    </div>

                    <div className="chart-focus-v3">
                      <div className="chart-container-v3">
                        <ResponsiveContainer width="100%" height={280}>
                          <PieChart>
                            <Pie 
                              data={statsData} 
                              innerRadius={90} 
                              outerRadius={115} 
                              paddingAngle={10} 
                              dataKey="value" 
                              stroke="none"
                              cornerRadius={6}
                            >
                              {statsData.map((e, i) => (
                                <Cell 
                                  key={`c-${i}`} 
                                  fill={RARITY_COLORS[e.name[0]]} 
                                  style={{ filter: `drop-shadow(0 0 12px ${RARITY_COLORS[e.name[0]]}40)` }}
                                />
                              ))}
                            </Pie>
                            <ReTooltip 
                              contentStyle={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                              itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="chart-overlay-v3">
                          <div className="overlay-scanline" />
                          <span className="total-count">{p.characterCount}</span>
                          <span className="total-label">ACTIVE_UNITS</span>
                        </div>
                      </div>

                      <div className="rarity-legend-v3">
                        {['5', '4', '3'].map(r => {
                          const count = p.characters.filter(c => c.rarity === r).length;
                          const percent = Math.round((count / (p.characterCount || 1)) * 100);
                          return (
                            <div key={r} className="legend-item-v3 glass-panel">
                               <div className="legend-rarity" style={{ borderLeftColor: RARITY_COLORS[r] }}>
                                  <span className="r-tier">{r}★ TIER</span>
                                  <span className="r-count">{count}</span>
                               </div>
                               <div className="legend-progress">
                                  <div className="l-bar" style={{ width: `${percent}%`, backgroundColor: RARITY_COLORS[r] }} />
                               </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                 </div>

                 {/* --- RIGHT: OPERATIONS & COMBAT --- */}
                 <div className="stats-main-v3">
                    {/* Log Grid */}
                    <div className="ops-log-v3 glass-panel neon-border">
                       <div className="ops-header-v3">
                          <Activity size={18} className="text-cyan" />
                          <h3 className="panel-title">Operations Log</h3>
                       </div>
                       <div className="log-grid-v3">
                       <LogData label="Global_Interaction" val={(p.stats?.commandsUsed ?? 0).toLocaleString()} sub="Total Commands" icon={<Terminal size={18}/>} color="cyan" />
                       <LogData label="Roster_Sync" val={p.characters.length} sub="Asset Acquisitions" icon={<Layers size={18}/>} color="purple" />
                       <LogData label="Gacha_Resonance" val={`${p.pity || 0}/90`} sub="Guaranteed 5★" icon={<Zap size={18}/>} color="gold" />
                       <LogData label="Network_Entry" val={p.joinedAt ? new Date(p.joinedAt).toLocaleDateString() : 'UNKNOWN'} sub="Deployment Date" icon={<Globe size={18}/>} color="pink" />
                    </div>
                    </div>

                    {/* Combat & Credits Row */}
                    <div className="combat-row-v3">
                       <div className="combat-box-v3 glass-panel">
                          <div className="combat-header">
                             <span className="c-label">Combat Win Rate</span>
                             <span className="c-val text-green">{p.stats?.totalWon ? Math.round((p.stats.totalWon / (p.stats.totalWon + p.stats.totalLost || 1)) * 100) : 0}%</span>
                          </div>
                          <div className="combat-bar">
                             <div className="c-fill bg-green" style={{ width: `${p.stats?.totalWon ? Math.round((p.stats.totalWon / (p.stats.totalWon + p.stats.totalLost || 1)) * 100) : 0}%` }} />
                          </div>
                          <div className="combat-meta">SUCCESSFUL_ENGAGEMENTS: {p.stats?.totalWon || 0}</div>
                       </div>

                       <div className="combat-box-v3 glass-panel">
                          <div className="combat-header">
                             <span className="c-label">Credits Circulated</span>
                             <span className="c-val text-gold">{(p.stats?.totalGambled ?? 0).toLocaleString()}</span>
                          </div>
                          <div className="token-id">
                             <span className="t-label">DIAGNOSTIC_TOKEN</span>
                             <span className="t-val">0x{userId.slice(-4).toUpperCase()}</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function QuickStat({ icon, label, value, color, sub }) {
  return (
    <div className={`quick-stat-card glass-panel glow-${color}`}>
      <div className={`stat-icon-box icon-${color}`}>{icon}</div>
      <div className="stat-info"><div className="stat-label">{label}</div><div className="stat-value">{value}</div>{sub && <div className="stat-sub">{sub}</div>}</div>
    </div>
  );
}

function StatLogBlock({ label, value, icon, glow, sub }) {
  return (
    <div className={`log-block glass-panel hover-${glow}`}>
      <div className="log-icon">{icon}</div>
      <div className="log-info">
        <div className="log-label">{label}</div>
        <div className="log-value">{value}</div>
        {sub && <div className="stat-log-block-sub">{sub}</div>}
      </div>
    </div>
  );
}

function LogData({ label, val, sub, icon, color }) {
  return (
    <div className={`log-data-v3 glass-panel border-${color}/20`}>
       <div className="l-top">
          <div className={`l-icon text-${color}`}>{icon}</div>
          <span className="l-tag">{label}</span>
       </div>
       <div className="l-main">
          <span className="l-val">{val}</span>
          <span className="l-sub">{sub}</span>
       </div>
    </div>
  );
}

function UnitCard({ char }) {
  return (
    <motion.div variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }} whileHover={{ y: -8 }} className="char-card-wrap">
      <div className={`char-card glass-panel ${char.rarity === '5' ? 'rarity-5' : ''}`}>
        <div className="char-card-visual">
           <CharIcon name={char.name} game={char.game?.toLowerCase()} rarity={char.rarity} emoji={char.emoji} />
        </div>
        <div className="char-card-info">
          <div className="char-card-top">
            <span className="char-game-label">{char.game?.toUpperCase()}</span>
            <div className="char-stars">{[...Array(parseInt(char.rarity))].map((_, i) => <Star key={i} size={8} className="text-gold" />)}</div>
          </div>
          <h3 className="char-card-name">{char.name}</h3>
          <div className="char-card-price"><Zap size={10} className="text-cyan-400" /><span>{char.count > 1 ? `E${char.count - 1} ACTIVE` : 'READY'}</span></div>
        </div>
      </div>
    </motion.div>
  );
}

function getRarityColor(rarity) {
  const colors = { priceless: '#ef4444', legendary: '#f59e0b', rare: '#3b82f6', uncommon: '#22c55e', common: '#9ca3af' };
  return colors[rarity] || '#fff';
}
