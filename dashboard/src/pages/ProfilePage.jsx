import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Trophy, 
  Coins, 
  Star, 
  Dog, 
  Sparkles, 
  ArrowLeft,
  Terminal,
  ChevronRight,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area
} from 'recharts';

const GAME_LABEL = { genshin:'Genshin', hsr:'HSR', wuwa:'Wuwa', zzz:'ZZZ' };
const GAME_BADGE = { 
  genshin:'bg-green/10 text-green border-green/20', 
  hsr:'bg-pink/10 text-pink border-pink/20', 
  wuwa:'bg-cyan/10 text-cyan border-cyan/20', 
  zzz:'bg-gold/10 text-gold border-gold/20' 
};

const COLORS = {
  '5': '#fbbf24', // Gold
  '4': '#a78bfa', // Purple
  '3': '#94a3b8'  // Slate
};

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

  if (loading) return (
    <div className="page flex-center py-40">
      <div className="spinner" />
    </div>
  );

  if (notFound) return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="page wrap text-center py-40"
    >
      <div className="text-6xl mb-6">😢</div>
      <h2 className="text-3xl font-black mb-4">Player not found</h2>
      <p className="text-text-3 max-w-md mx-auto mb-10">This user hasn't played yet or the ID is incorrect. Try searching on the leaderboard!</p>
      <Link to="/leaderboard" className="btn-v3 btn-v3-primary">
        <ArrowLeft size={18} />
        <span>Back to Leaderboard</span>
      </Link>
    </motion.div>
  );

  const statsData = [
    { name: '5★', value: p.characters.filter(c => c.rarity === '5').length },
    { name: '4★', value: p.characters.filter(c => c.rarity === '4').length },
    { name: '3★', value: p.characters.filter(c => c.rarity === '3').length },
  ].filter(d => d.value > 0);

  // Mock progression data for the chart
  const progressData = [
    { name: 'Mon', xp: 400 },
    { name: 'Tue', xp: 700 },
    { name: 'Wed', xp: 500 },
    { name: 'Thu', xp: 900 },
    { name: 'Fri', xp: 1200 },
    { name: 'Sat', xp: 1500 },
    { name: 'Sun', xp: p.experience % 2000 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="page"
    >
      <div className="wrap">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-dim mb-8">
          <Link to="/leaderboard" className="hover:text-purple-light transition-colors">Leaderboard</Link>
          <ChevronRight size={12} />
          <span className="text-text-3">Profile</span>
          <ChevronRight size={12} />
          <span className="text-purple-light">{p.username}</span>
        </div>

        {/* Profile Header Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="card-glass p-8 md:p-10 mb-12 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none transform group-hover:scale-110 transition-transform duration-700">
            <User size={200} />
          </div>
          
          <div className="flex flex-col md:flex-row gap-10 items-center md:items-start relative z-10">
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-purple to-cyan flex items-center justify-center text-4xl md:text-5xl font-black text-white shadow-2xl shadow-purple/20 border-4 border-white/10">
                {p.username[0]?.toUpperCase()}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-bg-2 border-2 border-border p-2 rounded-xl text-gold shadow-lg">
                <ShieldCheck size={20} />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 grad">{p.username}</h1>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-8">
                <span className="badge-v3 bg-purple/10 text-purple-light border-purple/20 px-3 py-1.5 text-xs">
                  Level {p.level}
                </span>
                <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-1.5 rounded-full text-gold font-bold text-xs">
                  <Coins size={14} />
                  <span>{p.balance.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-1.5 rounded-full text-cyan-light font-bold text-xs">
                  <Sparkles size={14} />
                  <span>{p.star_dust.toLocaleString()} Star Dust</span>
                </div>
              </div>

              <div className="max-w-md mx-auto md:mx-0">
                <div className="flex justify-between items-end mb-2 text-xs font-bold uppercase tracking-widest text-text-3">
                  <span>Experience</span>
                  <span className="text-purple-light">{p.experience.toLocaleString()} XP</span>
                </div>
                <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPct}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-purple to-cyan rounded-full" 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 md:flex md:flex-col gap-8 text-center md:text-right">
              <div className="ms-v3">
                <span className="block text-2xl font-black text-text mb-1">{p.characterCount}</span>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-text-3">Characters</span>
              </div>
              <div className="ms-v3">
                <span className="block text-2xl font-black text-text mb-1">{totalPoke.toLocaleString()}</span>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-text-3">Pokémon</span>
              </div>
              <div className="ms-v3">
                <span className="block text-2xl font-black text-text mb-1">{p.stats?.commandsUsed ?? 0}</span>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-text-3">Commands</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* --- Stats Dashboard --- */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp size={24} className="text-purple-light" />
            <h2 className="text-xl font-bold uppercase tracking-widest text-text-2">Performance & Stats</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Rarity Chart */}
            <div className="card-glass p-8 flex flex-col items-center">
              <h3 className="text-sm font-bold uppercase tracking-widest text-text-dim mb-6">Collection Rarity</h3>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statsData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name[0]] || '#8884d8'} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#1a1a1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 mt-4">
                {statsData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[d.name[0]] }} />
                    <span className="text-[10px] font-bold text-text-3">{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Chart */}
            <div className="card-glass p-8 lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-text-dim">Experience Velocity</h3>
                <span className="text-[10px] font-bold text-cyan bg-cyan/10 px-2 py-1 rounded">+24% this week</span>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={progressData}>
                    <defs>
                      <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ background: '#1a1a1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    />
                    <Area type="monotone" dataKey="xp" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorXp)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gacha Luck Gauge */}
            <div className="card-glass p-8 lg:col-span-3 flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1">
                <h3 className="text-sm font-bold uppercase tracking-widest text-text-dim mb-2">Gacha Luck Meter</h3>
                <p className="text-xs text-text-3 mb-6">Current 5★ Pity Status: You are getting closer to a legendary pull!</p>
                <div className="relative h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 mb-2">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(p.pity ?? 0) / 90 * 100}%` }}
                    className="h-full bg-gradient-to-r from-gold to-yellow-200 shadow-[0_0_15px_rgba(251,191,36,0.4)]"
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-text-dim">
                  <span>0 PITY</span>
                  <span className="text-gold">{p.pity ?? 0} / 90 PITY</span>
                  <span>GUARANTEED</span>
                </div>
              </div>
              <div className="bg-white/5 p-6 rounded-2xl border border-white/5 text-center min-w-[150px]">
                <div className="text-xs font-bold text-text-3 uppercase mb-1">Luck Rating</div>
                <div className="text-3xl font-black text-gold">S+</div>
                <div className="text-[10px] font-bold text-text-dim mt-2">Top 5% Players</div>
              </div>
            </div>
          </div>
        </section>

        {/* Characters Grid */}
        <section className="mb-20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div className="flex items-center gap-3">
              <Sparkles className="text-purple-light" />
              <h2 className="text-xl font-bold uppercase tracking-widest text-text-2">Character Collection</h2>
            </div>
            
            <div className="flex flex-wrap gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5">
              {games.map(g => (
                <button 
                  key={g} 
                  className={`btn-tab-v3 px-4 py-2 ${gameFilter === g ? 'active' : ''}`}
                  onClick={() => setGameFilter(g)}
                >
                  {g === 'all' ? 'All' : GAME_LABEL[g] || g}
                </button>
              ))}
            </div>
          </div>

          {chars.length === 0 ? (
            <div className="card-glass p-20 text-center">
              <div className="text-4xl mb-4">🎭</div>
              <p className="text-text-3 font-bold uppercase tracking-widest text-xs">No characters in this category</p>
            </div>
          ) : (
            <div className="grid-mini-chars">
              {chars.map((c, i) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={i} 
                  className={`card-glass overflow-hidden group hover:border-purple/30 transition-all rarity-border-${c.rarity}`}
                >
                  <div className={`h-1 bg-gradient-to-r ${c.rarity === 5 ? 'from-gold to-yellow-200' : 'from-purple to-purple-light'}`} />
                  <div className="p-4 text-center">
                    <div className="text-4xl mb-3 group-hover:scale-125 transition-transform duration-300 transform-gpu">
                      {c.emoji || '✨'}
                    </div>
                    <div className="text-xs font-black mb-2 truncate">{c.name}</div>
                    <div className="flex flex-wrap justify-center gap-1">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${c.rarity === 5 ? 'border-gold/30 text-gold bg-gold/5' : 'border-purple/30 text-purple-light bg-purple/5'}`}>
                        {c.rarity}★
                      </span>
                      {c.game && (
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border border-white/5 bg-white/5 text-text-dim`}>
                          {c.game.toUpperCase()}
                        </span>
                      )}
                    </div>
                    {c.count > 1 && (
                      <div className="mt-2 inline-block bg-cyan/10 text-cyan text-[10px] font-black px-2 py-0.5 rounded-full border border-cyan/20">
                        ×{c.count} Owned
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Pokémon Collection */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <Dog className="text-cyan-light" />
            <h2 className="text-xl font-bold uppercase tracking-widest text-text-2">Pokémon Collection</h2>
          </div>

          {Object.keys(p.pokemon).length === 0 ? (
            <div className="card-glass p-20 text-center">
              <div className="text-4xl mb-4">🐾</div>
              <p className="text-text-3 font-bold uppercase tracking-widest text-xs">No Pokémon caught yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {Object.entries(p.pokemon).map(([rarity, group]) => (
                <div key={rarity} className="card-glass p-6">
                  <div className="text-xs font-black uppercase tracking-widest text-text-dim mb-4 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${rarity.toLowerCase().includes('legendary') ? 'bg-gold' : 'bg-cyan'}`} />
                    {rarity}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(group).map(([name, count]) => (
                      <div 
                        key={name} 
                        className="bg-white/5 border border-white/5 px-4 py-2 rounded-xl text-xs font-bold text-text-2 hover:border-cyan/30 transition-colors flex items-center gap-2"
                      >
                        {name}
                        {count > 1 && (
                          <span className="bg-cyan-light/10 text-cyan-light px-1.5 py-0.5 rounded text-[10px] font-black border border-cyan-light/20">
                            ×{count}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <style>{`
        .grid-mini-chars {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 12px;
        }
        .from-purple { --tw-gradient-from: #8b5cf6; --tw-gradient-to: rgb(139 92 246 / 0); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
        .to-cyan { --tw-gradient-to: #22d3ee; }
        .bg-gradient-to-br { background-image: linear-gradient(to bottom right, var(--tw-gradient-stops)); }
        .bg-gradient-to-r { background-image: linear-gradient(to right, var(--tw-gradient-stops)); }
        .shadow-purple\\/20 { box-shadow: 0 20px 25px -5px rgba(139, 92, 246, 0.2), 0 8px 10px -6px rgba(139, 92, 246, 0.2); }
        .rarity-border-5 { border-color: rgba(251, 191, 36, 0.2); }
        .rarity-border-4 { border-color: rgba(139, 92, 246, 0.2); }
      `}</style>
    </motion.div>
  );
}
