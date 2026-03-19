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
  ChevronRight,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import CharIcon from '../components/CharIcon';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  Tooltip, AreaChart, Area, XAxis, YAxis
} from 'recharts';

const GAME_LABEL = { genshin:'Genshin', hsr:'HSR', wuwa:'Wuwa', zzz:'ZZZ' };
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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/profile/${userId}`)
      .then(r => r.json())
      .then(res => { if (res.success) setP(res.data); else setNotFound(true); setLoading(false); })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [userId]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="page flex-center py-40">
      <div className="spinner" />
    </div>
  );

  if (notFound || !p) return (
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

  const progressData = [
    { name: 'Mon', xp: 400 }, { name: 'Tue', xp: 700 }, { name: 'Wed', xp: 500 },
    { name: 'Thu', xp: 900 }, { name: 'Fri', xp: 1200 }, { name: 'Sat', xp: 1500 },
    { name: 'Sun', xp: p.experience % 2000 },
  ];

  const xpPct = p.experience > 0 ? (p.experience % 1000) / 10 : 0;
  const games = ['all', 'genshin', 'hsr', 'wuwa', 'zzz'];
  const chars = gameFilter === 'all' ? p.characters : p.characters.filter(c => c.game?.toLowerCase() === gameFilter);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page">
      <div className="wrap">
        {/* Breadcrumbs & Share */}
        <div className="flex items-center justify-between gap-2 mb-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-dim">
            <Link to="/leaderboard" className="hover:text-purple-light transition-colors">Leaderboard</Link>
            <ChevronRight size={12} />
            <span className="text-text-3">Profile</span>
            <ChevronRight size={12} />
            <span className="text-purple-light">{p.username}</span>
          </div>

          <button 
            onClick={handleShare}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-3 hover:text-purple-light transition-colors group"
          >
            <Sparkles size={14} className={copied ? "text-green animate-pulse" : "group-hover:animate-bounce"} />
            <span>{copied ? 'Copied Link!' : 'Share Profile'}</span>
          </button>
        </div>

        {/* Profile Header Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="card-glass p-0 mb-12 relative overflow-hidden group"
        >
          <div className="h-24 bg-gradient-to-r from-purple/20 via-cyan/20 to-purple/20 relative">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          </div>

          <div className="p-8 md:p-10 -mt-12 relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-purple to-cyan flex items-center justify-center text-4xl md:text-5xl font-black text-white shadow-2xl shadow-purple/20 border-4 border-bg-2">
                {p.username[0]?.toUpperCase()}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-bg-2 border-2 border-border p-2 rounded-xl text-gold shadow-lg">
                <ShieldCheck size={20} />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left md:mt-12">
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 grad">{p.username}</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-8">
                <span className="badge-v3 bg-purple/10 text-purple-light border-purple/20 px-3 py-1.5 text-xs">Level {p.level}</span>
                <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-1.5 rounded-full text-gold font-bold text-xs">
                  <Coins size={14} /> <span>{p.balance.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-1.5 rounded-full text-cyan-light font-bold text-xs">
                  <Sparkles size={14} /> <span>{p.star_dust.toLocaleString()} Star Dust</span>
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
                    className="h-full bg-gradient-to-r from-purple to-cyan rounded-full" 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 md:flex md:flex-col gap-6 text-center md:text-right md:mt-12">
              <div className="ms-v3">
                <span className="block text-2xl font-black text-text mb-1">{p.characterCount}</span>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-text-3">Characters</span>
              </div>
              <div className="ms-v3">
                <span className="block text-2xl font-black text-text mb-1">{p.pokemonCount?.toLocaleString() || 0}</span>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-text-3">Pokémon</span>
              </div>
              <div className="ms-v3">
                <span className="block text-2xl font-black text-text mb-1">{p.stats?.commandsUsed ?? 0}</span>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-text-3">Commands</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Dashboard */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp size={24} className="text-purple-light" />
            <h2 className="text-xl font-bold uppercase tracking-widest text-text-2">Performance & Stats</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="card-glass p-8 flex flex-col items-center">
              <h3 className="text-sm font-bold uppercase tracking-widest text-text-dim mb-6">Collection Rarity</h3>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statsData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {statsData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[entry.name[0]] || '#8884d8'} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1a1a1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
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

            <div className="card-glass p-8 lg:col-span-2">
              <h3 className="text-sm font-bold uppercase tracking-widest text-text-dim mb-6">Experience Velocity</h3>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={progressData}>
                    <defs>
                      <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#1a1a1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="xp" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorXp)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card-glass p-8 lg:col-span-3 flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1">
                <h3 className="text-sm font-bold uppercase tracking-widest text-text-dim mb-2">Gacha Luck Meter</h3>
                <div className="relative h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 mb-2">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(p.pity ?? 0) / 90 * 100}%` }} className="h-full bg-gradient-to-r from-gold to-yellow-200" />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-text-dim">
                  <span>0 PITY</span><span className="text-gold">{p.pity ?? 0} / 90 PITY</span><span>GUARANTEED</span>
                </div>
              </div>
              <div className="bg-white/5 p-6 rounded-2xl border border-white/5 text-center min-w-[150px]">
                <div className="text-xs font-bold text-text-3 uppercase mb-1">Luck Rating</div>
                <div className="text-3xl font-black text-gold">S+</div>
              </div>
            </div>
          </div>
        </section>

        {/* Characters Grid */}
        <section className="mb-20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <h2 className="text-xl font-bold uppercase tracking-widest text-text-2">Character Collection</h2>
            <div className="flex flex-wrap gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5">
              {games.map(g => (
                <button key={g} className={`btn-tab-v3 px-4 py-2 ${gameFilter === g ? 'active' : ''}`} onClick={() => setGameFilter(g)}>
                  {g === 'all' ? 'All' : GAME_LABEL[g] || g}
                </button>
              ))}
            </div>
          </div>
          {chars.length === 0 ? <p className="text-text-3 text-center py-20">No characters found</p> : (
            <div className="grid-mini-chars">
              {chars.map((c, i) => (
                <div key={i} className={`card-glass p-4 text-center rarity-border-${c.rarity}`}>
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl overflow-hidden border-2 border-white/10">
                    <CharIcon name={c.name} game={c.game} rarity={c.rarity} emoji={c.emoji} />
                  </div>
                  <div className="text-xs font-black truncate">{c.name}</div>
                  <div className="text-[9px] font-black mt-1 text-text-dim uppercase">{c.rarity}★ {c.game}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pokémon Collection */}
        <section>
          <h2 className="text-xl font-bold uppercase tracking-widest text-text-2 mb-8">Pokémon Collection</h2>
          {Object.keys(p.pokemon || {}).length === 0 ? <p className="text-text-3 py-20 text-center">No Pokémon caught yet</p> : (
            <div className="flex flex-col gap-6">
              {Object.entries(p.pokemon).map(([rarity, group]) => (
                <div key={rarity} className="card-glass p-6">
                  <div className="text-xs font-black uppercase text-text-dim mb-4">{rarity}</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(group).map(([name, count]) => (
                      <div key={name} className="bg-white/5 border border-white/5 px-4 py-2 rounded-xl text-xs font-bold text-text-2">
                        {name} {count > 1 && <span className="text-cyan ml-1">×{count}</span>}
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
        .grid-mini-chars { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px; }
        .rarity-border-5 { border-color: rgba(251, 191, 36, 0.3); }
        .rarity-border-4 { border-color: rgba(139, 92, 246, 0.3); }
      `}</style>
    </motion.div>
  );
}
