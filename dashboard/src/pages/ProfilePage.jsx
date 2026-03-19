import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Trophy, Coins, Star, Dog, Sparkles, ArrowLeft,
  Share2, Zap, Heart, History, Box, Filter,
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
    setLoading(true);
    fetch(`/api/profile/${userId}`)
      .then(r => r.json())
      .then(res => { 
        if (res.success) setP(res.data); 
        else setNotFound(true); 
        setLoading(false); 
      })
      .catch(() => { setNotFound(true); setLoading(false); });
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
    <div className="profile-overhaul flex items-center justify-center min-h-[80vh]">
      <div className="relative flex flex-col items-center gap-6">
        <div className="w-24 h-24 relative">
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-t-2 border-r-2 border-cyan-400 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.3)]"
          />
          <motion.div 
            animate={{ rotate: -360 }} 
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-2 border-b-2 border-l-2 border-purple-500 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.3)]"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity size={24} className="text-white animate-pulse" />
          </div>
        </div>
        <div className="text-[10px] font-black text-white uppercase tracking-[0.3em] glitch-text">Establishing Uplink...</div>
      </div>
    </div>
  );

  if (notFound || !p) return (
    <div className="profile-overhaul wrap py-40 text-center flex flex-col items-center">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel p-16 rounded-[40px] border-red-500/20 max-w-lg w-full relative overflow-hidden neon-border">
        <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />
        <div className="w-24 h-24 bg-red-500/10 rounded-full border border-red-500/20 flex items-center justify-center text-red-500 mx-auto mb-8 relative z-10 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <User size={48} />
        </div>
        <h2 className="text-3xl font-black text-white tracking-widest uppercase mb-4 relative z-10">Target Not Found</h2>
        <p className="text-text-dim text-sm uppercase tracking-widest leading-relaxed mb-10 relative z-10">The specified operative ID does not exist in our central database. They may be off-grid.</p>
        <Link to="/leaderboard" className="inline-flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all relative z-10">
          <ArrowLeft size={16} /> Return to Network
        </Link>
      </motion.div>
    </div>
  );

  const xpProgress = (p.experience % 1000) / 10;
  const nextXp = 1000 - (p.experience % 1000);

  return (
    <div className="profile-overhaul min-h-screen pb-32">
      {/* Immersive Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#030305]">
        <div className="absolute inset-0 cyber-grid opacity-30" />
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[180px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-600/10 blur-[180px] rounded-full mix-blend-screen" />
      </div>

      <div className="wrap relative z-10 pt-10">
        {/* Top Header / Actions */}
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center justify-between mb-10">
           <Link to="/leaderboard" className="flex items-center gap-3 text-[11px] font-black text-text-dim hover:text-white transition-colors uppercase tracking-[0.2em] bg-black/40 px-5 py-2.5 rounded-full border border-white/5 backdrop-blur-md">
             <ArrowLeft size={14} /> Leaderboard
           </Link>
           <button onClick={handleShare} className="flex items-center gap-3 text-[11px] font-black text-cyan-400 hover:text-white transition-colors uppercase tracking-[0.2em] bg-black/40 px-5 py-2.5 rounded-full border border-cyan-400/20 hover:border-cyan-400/50 backdrop-blur-md shadow-[0_0_15px_rgba(34,211,238,0.1)] group">
             <Share2 size={14} className={copied ? "text-green-400" : "group-hover:rotate-12 transition-transform"} />
             {copied ? 'Uplink Copied!' : 'Share Profile'}
           </button>
        </motion.div>

        {/* HERO PASSPORT */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="glass-panel rounded-[32px] p-1 relative overflow-hidden mb-12 neon-border">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-purple-500/10 via-transparent to-transparent pointer-events-none blur-3xl" />
          
          <div className="relative z-10 p-8 lg:p-12 flex flex-col lg:flex-row gap-12 items-center lg:items-start">
            
            {/* Left: Avatar & ID */}
            <div className="flex flex-col items-center">
              <div className="relative group mb-6">
                <div className="w-36 h-36 rounded-[2rem] p-1 bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 shadow-[0_0_30px_rgba(168,85,247,0.3)] animate-spin-slow">
                  <div className="w-full h-full rounded-[1.8rem] bg-[#0a0a0f] border-4 border-transparent flex items-center justify-center text-6xl font-black text-white relative overflow-hidden antirotate">
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent pointer-events-none" />
                    <span className="relative z-10 drop-shadow-lg">{p.username[0]?.toUpperCase()}</span>
                  </div>
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-[#050508] border border-white/20 rounded-full flex items-center gap-2 shadow-[0_5px_20px_rgba(0,0,0,0.8)]">
                  <span className="text-[9px] font-black text-purple-400 uppercase tracking-[0.3em]">RANK</span>
                  <span className="text-sm font-black text-white">{p.level}</span>
                </div>
              </div>
              <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase text-cyan-400 tracking-[0.3em] flex items-center gap-2">
                <Globe size={12} /> World Level {p.worldLevel || 1}
              </div>
            </div>

            {/* Middle & Right: Data Core */}
            <div className="flex-1 w-full text-center lg:text-left">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-10 border-b border-white/5 pb-10">
                <div>
                  <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight glitch-text mb-3">{p.username}</h1>
                  <div className="text-[10px] font-black uppercase text-text-dim tracking-[0.3em] flex items-center justify-center lg:justify-start gap-2">
                    <Zap size={12} className="text-gold" /> Operative ID: <span className="text-white/70">{userId}</span>
                  </div>
                </div>
                
                <div className="flex gap-6 justify-center lg:justify-end">
                  <div className="bg-black/40 border border-white/5 p-4 rounded-2xl min-w-[120px]">
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-text-dim mb-2 flex items-center justify-center lg:justify-end gap-1.5"><Coins size={12} className="text-gold" /> Credits</div>
                    <div className="text-2xl font-black text-white">{p.balance.toLocaleString()}</div>
                  </div>
                  <div className="bg-black/40 border border-white/5 p-4 rounded-2xl min-w-[120px]">
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-text-dim mb-2 flex items-center justify-center lg:justify-end gap-1.5"><Sparkles size={12} className="text-cyan-400" /> Dust</div>
                    <div className="text-2xl font-black text-white">{p.star_dust.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* EXP Bar */}
              <div>
                <div className="flex justify-between items-end mb-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-text-dim">Combat Experience</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">{p.experience.toLocaleString()} <span className="text-text-dim">TOTAL</span></span>
                </div>
                <div className="h-3 bg-black/60 rounded-full border border-white/5 overflow-hidden relative p-0.5 shadow-inner">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${xpProgress}%` }} className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full relative shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgNDBsNDAtNDBIMHoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9zdmc+')] opacity-50" />
                  </motion.div>
                </div>
                <div className="text-right mt-2 text-[8px] font-black text-text-dim uppercase tracking-[0.3em]">{nextXp} XP UNTIL PROMOTION</div>
              </div>

            </div>
          </div>
        </motion.div>

        {/* QUICK STATS GRID */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <QuickStat icon={<Layers />} label="Arsenal" value={p.characterCount} color="purple" />
          <QuickStat icon={<Dog />} label="Bestiary" value={p.pokemonCount} color="cyan" />
          <QuickStat icon={<Zap />} label="Operations" value={(p.stats?.commandsUsed ?? 0).toLocaleString()} color="gold" />
          <QuickStat icon={<Trophy />} label="5★ Pity" value={`${p.pity ?? 0}/90`} color="pink" sub="Guar. at 90" />
        </motion.div>

        {/* HIGH-TECH TABS */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-[#0a0a0f]/80 backdrop-blur-xl border border-white/10 rounded-full p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            {['units', 'zoo', 'stats'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`relative flex items-center gap-2 px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${activeTab === tab ? 'text-white' : 'text-text-dim hover:text-white/80'}`}
              >
                {activeTab === tab && (
                  <motion.div layoutId="activeTab" className="absolute inset-0 bg-gradient-to-r from-purple-600/80 to-cyan-600/80 rounded-full shadow-[0_0_20px_rgba(139,92,246,0.3)] border border-white/10" />
                )}
                <span className="relative z-10 flex items-center gap-2">{TAB_ICONS[tab]} {tab}</span>
              </button>
            ))}
          </div>
        </div>

        {/* TAB CONTENT PORTAL */}
        <div className="min-h-[500px]">
          <AnimatePresence mode="wait">
            {activeTab === 'units' && (
              <motion.div 
                key="units"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                {/* Tactical Filters */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-black/40 border border-white/5 p-4 rounded-2xl backdrop-blur-md">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['all', 'genshin', 'hsr', 'wuwa', 'zzz'].map(g => (
                      <button 
                        key={g}
                        onClick={() => setGameFilter(g)}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${gameFilter === g ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'bg-transparent border-white/5 text-text-dim hover:border-white/20 hover:text-white'}`}
                      >
                        {g === 'all' ? 'All Realms' : GAME_LABEL[g] || g}
                      </button>
                    ))}
                  </div>
                  
                  <div className="relative">
                    <select 
                      value={rarityFilter} 
                      onChange={(e) => setRarityFilter(e.target.value)}
                      className="bg-[#0a0a0f] border border-white/10 rounded-xl px-5 py-2.5 text-[10px] font-black text-white uppercase tracking-widest outline-none focus:border-cyan-400/50 transition-colors cursor-pointer appearance-none min-w-[180px]"
                    >
                      <option value="all">All Rarities</option>
                      <option value="5">Legendary (5★)</option>
                      <option value="4">Epic (4★)</option>
                      <option value="3">Rare (3★)</option>
                    </select>
                    <Filter size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
                  </div>
                </div>

                {/* Unit Grid */}
                <div className="grid-units-overhaul">
                  {filteredChars.length > 0 ? filteredChars.map((c, i) => (
                    <UnitCard key={`${c.name}-${i}`} char={c} />
                  )) : (
                    <div className="col-span-full py-32 text-center glass-panel rounded-[32px] border-dashed border-white/10">
                       <Box size={48} className="mx-auto text-white/5 mb-6" />
                       <p className="text-text-dim font-black uppercase tracking-[0.3em] text-xs">No assets match current filters</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'zoo' && (
              <motion.div 
                key="zoo"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                {Object.keys(p.pokemon || {}).length > 0 ? Object.entries(p.pokemon).sort((a, b) => {
                  const order = { 'priceless': 0, 'mythic': 1, 'legendary': 2, 'rare': 3, 'uncommon': 4, 'common': 5 };
                  return (order[a[0]] ?? 99) - (order[b[0]] ?? 99);
                }).map(([rarity, animals]) => (
                  <div key={rarity} className="glass-panel p-6 md:p-8 rounded-[32px] mb-8 neon-border relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
                       <span className="text-6xl md:text-8xl font-black uppercase tracking-tighter" style={{ color: getRarityColor(rarity) }}>{rarity}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-8 relative z-10">
                       <div className="w-3 h-3 rounded-sm rotate-45 shadow-[0_0_10px_currentColor]" style={{ backgroundColor: getRarityColor(rarity), color: getRarityColor(rarity) }} />
                       <h3 className="text-sm md:text-base font-black uppercase tracking-[0.4em] text-white drop-shadow-md">{rarity} TIER</h3>
                       <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 relative z-10">
                      {Object.entries(animals).map(([name, data]) => (
                        <motion.div whileHover={{ scale: 1.05, y: -5 }} key={name} className="bg-[#050508]/80 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 group hover:border-white/20 transition-all hover:bg-white/5 shadow-lg">
                          <div className="w-16 h-16 relative flex items-center justify-center drop-shadow-xl group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all">
                            {data.sprite ? (
                              <img src={data.sprite} alt={name} className="w-full h-full object-contain pixel-art animate-float" />
                            ) : (
                              <Dog size={24} className="text-text-dim" />
                            )}
                          </div>
                          <div className="text-center w-full">
                            <div className="text-[10px] font-black text-white truncate capitalize tracking-wider mb-1">{name}</div>
                            <div className="inline-block px-2 py-0.5 bg-black/50 border border-white/10 rounded text-[9px] font-bold text-text-dim uppercase tracking-widest group-hover:border-cyan-500/30 group-hover:text-cyan-400 transition-colors">
                              QTY: {data.count}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )) : (
                  <div className="py-32 text-center glass-panel rounded-[32px] border-dashed border-white/10">
                    <PawPrint size={48} className="mx-auto text-white/5 mb-6" />
                    <p className="text-white font-black uppercase tracking-[0.3em] text-sm mb-2">Wilderness Empty</p>
                    <p className="text-text-dim text-[10px] uppercase tracking-[0.2em]">Deploy hunters to gather specimens</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div 
                key="stats"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                 {/* Left Panel: Composition */}
                 <div className="col-span-1 lg:col-span-5 glass-panel p-8 md:p-10 rounded-[32px] relative overflow-hidden neon-border">
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-transparent pointer-events-none" />
                    <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-10 flex items-center gap-3 relative z-10">
                      <Crosshair size={16} className="text-purple-400" /> Tactical Composition
                    </h3>
                    
                    <div className="h-[280px] w-full relative z-10 mb-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={statsData} innerRadius={85} outerRadius={115} paddingAngle={6} dataKey="value" stroke="none" cornerRadius={6}>
                            {statsData.map((e, i) => <Cell key={`c-${i}`} fill={RARITY_COLORS[e.name[0]]} style={{ filter: `drop-shadow(0px 0px 8px ${RARITY_COLORS[e.name[0]]}60)` }} />)}
                          </Pie>
                          <ReTooltip 
                            contentStyle={{ background: 'rgba(5,5,8,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                            itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                            cursor={{fill: 'transparent'}}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{p.characterCount}</span>
                        <span className="text-[9px] font-black text-purple-400 uppercase tracking-[0.4em] mt-2">Total Assets</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 relative z-10">
                      {statsData.map(d => (
                        <div key={d.name} className="bg-black/40 p-4 rounded-2xl border border-white/5 text-center">
                           <div className="text-[10px] font-black mb-1.5" style={{ color: RARITY_COLORS[d.name[0]] }}>{d.name} Rarity</div>
                           <div className="text-xl font-black text-white">{d.value}</div>
                        </div>
                      ))}
                    </div>
                 </div>

                 {/* Right Panel: Operations Log */}
                 <div className="col-span-1 lg:col-span-7 glass-panel p-8 md:p-10 rounded-[32px] relative overflow-hidden flex flex-col neon-border">
                    <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-600/10 via-transparent to-transparent pointer-events-none" />
                    <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-10 flex items-center gap-3 relative z-10">
                      <Activity size={16} className="text-cyan-400" /> Operations Log
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 relative z-10 flex-1 content-center">
                      <StatBlock label="Commands Executed" value={(p.stats?.commandsUsed ?? 0).toLocaleString()} icon={<History/>} glow="cyan" />
                      <StatBlock label="Legendary Acquisitions" value={p.characters.filter(c => c.rarity === '5').length} icon={<Star/>} glow="gold" />
                      <StatBlock label="Pity Accumulation" value={`${p.pity || 0}/90`} icon={<Box/>} glow="purple" />
                      <StatBlock label="Network Join Date" value={p.joinedAt ? new Date(p.joinedAt).toLocaleDateString() : 'Unknown Origin'} icon={<Globe/>} glow="pink" />
                    </div>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        .profile-overhaul { 
          background-color: #030305; 
          color: #fff; 
          font-family: 'Inter', sans-serif; 
        }
        .cyber-grid {
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 50px 50px;
          background-position: center center;
        }
        .glitch-text {
          text-shadow: 0 0 15px rgba(139, 92, 246, 0.6), 0 0 30px rgba(34, 211, 238, 0.3);
        }
        .glass-panel {
          background: linear-gradient(135deg, rgba(20, 20, 25, 0.6) 0%, rgba(5, 5, 8, 0.8) 100%);
          backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        .neon-border {
          position: relative;
        }
        .neon-border::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(45deg, rgba(139, 92, 246, 0.3), rgba(34, 211, 238, 0.3), transparent 60%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        .animate-spin-slow {
          animation: spin 10s linear infinite;
        }
        .antirotate {
          animation: antirotate 10s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes antirotate {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .wrap { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        .grid-units-overhaul { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 16px; }
        .pixel-art { image-rendering: pixelated; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @media (max-width: 640px) {
          .grid-units-overhaul { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 12px; }
        }
      `}</style>
    </div>
  );
}

function QuickStat({ icon, label, value, color, sub }) {
  const colorMap = {
    purple: 'text-purple-400 border-purple-500/30 bg-purple-500/5 shadow-[0_0_15px_rgba(168,85,247,0.15)]',
    cyan: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5 shadow-[0_0_15px_rgba(34,211,238,0.15)]',
    gold: 'text-gold border-gold/30 bg-gold/5 shadow-[0_0_15px_rgba(251,191,36,0.15)]',
    pink: 'text-pink-400 border-pink-400/30 bg-pink-400/5 shadow-[0_0_15px_rgba(244,114,182,0.15)]'
  };

  return (
    <div className="glass-panel p-5 rounded-2xl flex flex-col relative overflow-hidden group hover:-translate-y-1 transition-transform border-white/5">
      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-current to-transparent opacity-[0.05] rounded-bl-[40px] ${colorMap[color].split(' ')[0]}`} />
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${colorMap[color]} border backdrop-blur-md`}>
        {icon}
      </div>
      <div className="text-[9px] font-black text-text-dim uppercase tracking-[0.2em] mb-1">{label}</div>
      <div className="text-2xl font-black text-white">{value}</div>
      {sub && <div className="text-[8px] font-bold text-text-dim uppercase tracking-[0.2em] mt-1.5 bg-black/30 w-fit px-2 py-0.5 rounded border border-white/5">{sub}</div>}
    </div>
  );
}

function StatBlock({ label, value, icon, glow }) {
  const glowColors = {
    cyan: 'group-hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] text-cyan-400 group-hover:border-cyan-400/30',
    gold: 'group-hover:shadow-[0_0_20px_rgba(251,191,36,0.15)] text-gold group-hover:border-gold/30',
    purple: 'group-hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] text-purple-400 group-hover:border-purple-500/30',
    pink: 'group-hover:shadow-[0_0_20px_rgba(244,114,182,0.15)] text-pink-400 group-hover:border-pink-400/30'
  };

  return (
    <div className={`bg-black/50 border border-white/5 p-5 rounded-2xl flex items-center gap-5 transition-all duration-300 group hover:bg-white/5 ${glowColors[glow].split(' ')[0]} ${glowColors[glow].split(' ')[2]}`}>
      <div className={`w-12 h-12 rounded-xl bg-[#0a0a0f] flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform ${glowColors[glow].split(' ')[1]}`}>
        {icon}
      </div>
      <div>
        <div className="text-[9px] font-black text-text-dim uppercase tracking-[0.2em] mb-1.5">{label}</div>
        <div className="text-xl font-black text-white">{value}</div>
      </div>
    </div>
  );
}

function UnitCard({ char }) {
  const is5Star = char.rarity === '5';
  const glowColor = is5Star ? 'rgba(251, 191, 36, 0.4)' : 'rgba(168, 85, 247, 0.4)';
  const borderColor = is5Star ? 'border-gold/30' : 'border-purple-500/30';
  
  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.05 }}
      className={`glass-panel rounded-2xl p-2.5 relative group cursor-pointer overflow-hidden transition-all duration-300`}
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} style={{ background: `radial-gradient(circle at top right, ${glowColor}, transparent 70%)` }} />
      
      <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-[#050508] border border-white/10 group-hover:border-white/20 transition-colors">
        <CharIcon name={char.name} game={char.game} rarity={char.rarity} emoji={char.emoji} />
        
        <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded text-[8px] font-black text-white uppercase tracking-wider bg-black/60 backdrop-blur-md border border-white/10">
          {char.game}
        </div>
        
        {char.count > 1 && (
          <div className="absolute bottom-1.5 left-1.5 bg-white/10 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded border border-white/20 shadow-lg">
            E{char.count - 1}
          </div>
        )}
      </div>
      
      <div className="text-center px-1 pb-1 relative z-10">
        <div className="text-[11px] font-black text-white truncate mb-1.5 tracking-widest">{char.name}</div>
        <div className="flex justify-center gap-0.5">
          {[...Array(parseInt(char.rarity))].map((_, i) => (
            <Star key={i} size={8} fill={RARITY_COLORS[char.rarity]} stroke="none" className="drop-shadow-[0_0_5px_currentColor]" />
          ))}
        </div>
      </div>
      
      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 border-2 ${borderColor} pointer-events-none transition-opacity shadow-[inset_0_0_20px_currentColor]`} style={{ color: is5Star ? '#fbbf24' : '#a855f7' }} />
    </motion.div>
  );
}

function getRarityColor(rarity) {
  const colors = {
    priceless: '#ef4444', // red-500
    legendary: '#f59e0b', // amber-500
    rare: '#3b82f6', // blue-500
    uncommon: '#22c55e', // green-500
    common: '#9ca3af' // slate-400
  };
  return colors[rarity] || '#fff';
}
