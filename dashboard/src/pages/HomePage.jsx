import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Dog, 
  Sparkles, 
  Trophy, 
  Coins, 
  ArrowRight,
  TrendingUp,
  Star
} from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

function StatCard({ icon: Icon, value, label, color, delay }) {
  return (
    <motion.div 
      variants={item}
      className="card-glass p-6 flex flex-col items-center text-center"
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${color}15`, color }}>
        <Icon size={24} />
      </div>
      <div className="text-3xl font-extrabold mb-1 tracking-tight" style={{ color }}>
        {value?.toLocaleString() ?? '—'}
      </div>
      <div className="text-xs font-bold uppercase tracking-widest text-text-3">
        {label}
      </div>
    </motion.div>
  );
}

function TopPlayer({ user, rank }) {
  const medals = ['🥇','🥈','🥉'];
  const colors = ['var(--gold)', 'var(--text-2)', '#b45309'];
  
  return (
    <motion.div variants={item}>
      <Link to={`/profile/${user.userId}`} className="card-glass p-6 block relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Trophy size={48} color={colors[rank]} />
        </div>
        <div className="text-3xl mb-3">{medals[rank]}</div>
        <div className="text-lg font-bold mb-1 truncate">{user.username}</div>
        <div className="flex items-center gap-2 text-gold font-bold mb-3">
          <Coins size={14} />
          <span>{user.balance.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-text-3 font-semibold">
          <span className="bg-white/5 px-2 py-1 rounded">Lv.{user.level}</span>
          <span>{user.characterCount} Chars</span>
        </div>
      </Link>
    </motion.div>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState(null);
  const [top3, setTop3] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/stats').then(r => r.json()),
      fetch('/api/leaderboard?sort=balance&limit=3').then(r => r.json()),
    ]).then(([s, lb]) => {
      if (s.success) setStats(s.data);
      else setErr('Could not reach the API.');
      if (lb.success) setTop3(lb.data);
      setLoading(false);
    }).catch(() => { setErr('Could not reach the API. Is the bot online?'); setLoading(false); });
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="page"
    >
      {/* Hero Section */}
      <div className="hero-v3 relative overflow-hidden py-24 mb-12">
        <div className="hero-glow-1" />
        <div className="hero-glow-2" />
        
        <div className="wrap relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple/10 border border-purple/20 text-purple-light text-xs font-bold uppercase tracking-widest mb-8"
          >
            <Sparkles size={14} />
            <span>KsaeKvat Dashboard v3.0</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-tight"
          >
            Play. Collect.<br />
            <span className="grad text-glow">Conquer.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-lg md:text-xl text-text-2 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Dive into the ultimate Discord companion. Track your progress, 
            explore over 260 characters, and climb the global leaderboards.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link to="/leaderboard" className="btn-v3 btn-v3-primary">
              <Trophy size={18} />
              <span>View Leaderboard</span>
            </Link>
            <Link to="/characters" className="btn-v3 btn-v3-secondary">
              <Users size={18} />
              <span>Character Gallery</span>
              <ArrowRight size={18} className="opacity-50" />
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="wrap">
        {/* Stats Section */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="text-purple-light" />
            <h2 className="text-xl font-bold uppercase tracking-widest text-text-2">Live Ecosystem Stats</h2>
          </div>
          
          {err && <div className="api-err-v3">⚠️ {err}</div>}
          
          <motion.div 
            variants={container}
            initial="hidden"
            animate={loading ? "hidden" : "show"}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
          >
            <StatCard icon={Users} value={stats?.totalUsers} label="Players" color="var(--purple-light)" />
            <StatCard icon={Dog} value={stats?.totalPokemonCaught} label="Pokémon" color="var(--cyan)" />
            <StatCard icon={Star} value={stats?.totalCharactersInRegistry} label="Registry" color="var(--gold)" />
            <StatCard icon={Sparkles} value={stats?.totalCharactersOwned} label="Owned" color="var(--pink)" />
            <StatCard icon={Coins} value={stats?.totalCoinsCirculating} label="Coins" color="var(--green)" />
          </motion.div>
        </section>

        {/* Top Players */}
        {top3.length > 0 && (
          <section className="mb-20">
             <div className="flex items-center gap-3 mb-8">
              <Trophy className="text-gold" />
              <h2 className="text-xl font-bold uppercase tracking-widest text-text-2">Richest Players</h2>
            </div>
            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {top3.map((u, i) => <TopPlayer key={u.userId} user={u} rank={i} />)}
            </motion.div>
          </section>
        )}

        {/* Quick Links */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link to="/leaderboard" className="card-glass p-8 group overflow-hidden relative">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                <Trophy size={160} />
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple/10 flex items-center justify-center text-purple-light mb-6">
                <Trophy size={24} />
              </div>
              <h3 className="text-2xl font-bold mb-2">Hall of Fame</h3>
              <p className="text-text-2 mb-6">Compete with players worldwide across multiple categories.</p>
              <div className="flex items-center gap-2 text-purple-light font-bold text-sm">
                <span>Explore Rankings</span>
                <ArrowRight size={16} />
              </div>
            </Link>

            <Link to="/characters" className="card-glass p-8 group overflow-hidden relative">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                <Users size={160} />
              </div>
              <div className="w-12 h-12 rounded-xl bg-cyan/10 flex items-center justify-center text-cyan-light mb-6">
                <Users size={24} />
              </div>
              <h3 className="text-2xl font-bold mb-2">Character Gallery</h3>
              <p className="text-text-2 mb-6">Browse the collection of 260+ characters from your favorite games.</p>
              <div className="flex items-center gap-2 text-cyan-light font-bold text-sm">
                <span>Browse Gallery</span>
                <ArrowRight size={16} />
              </div>
            </Link>
          </div>
        </section>
      </div>

      <style>{`
        .hero-v3 {
          background: radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 70%);
        }
        .hero-glow-1 {
          position: absolute; top: -10%; left: -10%; width: 40%; height: 60%;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%);
          filter: blur(80px); pointer-events: none;
        }
        .hero-glow-2 {
          position: absolute; bottom: -10%; right: -10%; width: 40%; height: 60%;
          background: radial-gradient(circle, rgba(34, 211, 238, 0.1) 0%, transparent 70%);
          filter: blur(80px); pointer-events: none;
        }
        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
        .md\\:grid-cols-3 { @media (min-width: 768px) { grid-template-columns: repeat(3, 1fr); } }
        .lg\\:grid-cols-5 { @media (min-width: 1024px) { grid-template-columns: repeat(5, 1fr); } }
        .gap-4 { gap: 1rem; }
        .gap-6 { gap: 1.5rem; }
        .p-6 { padding: 1.5rem; }
        .p-8 { padding: 2rem; }
        .mb-1 { margin-bottom: 0.25rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-3 { margin-bottom: 0.75rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mb-8 { margin-bottom: 2rem; }
        .mb-10 { margin-bottom: 2.5rem; }
        .mb-12 { margin-bottom: 3rem; }
        .mb-20 { margin-bottom: 5rem; }
        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .items-center { align-items: center; }
        .justify-center { justify-content: center; }
        .text-center { text-align: center; }
        .tracking-tight { letter-spacing: -0.025em; }
        .tracking-tighter { letter-spacing: -0.05em; }
        .tracking-widest { letter-spacing: 0.1em; }
        .uppercase { text-transform: uppercase; }
        .font-extrabold { font-weight: 800; }
        .font-black { font-weight: 900; }
        .leading-tight { line-height: 1.25; }
        .mx-auto { margin-left: auto; margin-right: auto; }
        .max-w-2xl { max-width: 42rem; }
        .w-12 { width: 3rem; }
        .h-12 { height: 3rem; }
        .rounded-xl { border-radius: 0.75rem; }
        .rounded-full { border-radius: 9999px; }
        .bg-purple\\/10 { background-color: rgba(139, 92, 246, 0.1); }
        .border-purple\\/20 { border-color: rgba(139, 92, 246, 0.2); }
        .api-err-v3 {
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.2);
          color: var(--red);
          padding: 1rem;
          border-radius: var(--radius-m);
          margin-bottom: 2rem;
          font-weight: 600;
        }
      `}</style>
    </motion.div>
  );
}
