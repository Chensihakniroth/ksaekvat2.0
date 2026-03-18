import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Trophy, 
  Sparkles, 
  ArrowRight,
  MessageSquare,
  ChevronRight,
  MousePointer2
} from 'lucide-react';

export default function HomePage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(res => {
        if (res.success) setStats(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="page bg-bg">
      {/* ── Section 1: Ultra-Spacious Hero ── */}
      <section className="relative pt-40 pb-40 overflow-hidden">
        {/* Soft Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.05)_0%,transparent_70%)] pointer-events-none" />
        
        <div className="wrap relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-text-3 text-xs font-bold uppercase tracking-[0.2em] mb-12"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple animate-pulse" />
              Now Live: KsaeKvat v3.0
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl font-black tracking-tighter leading-[1.1] mb-10"
            >
              The ultimate <br />
              <span className="grad">Discord experience.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl text-text-2 leading-relaxed mb-16 max-w-2xl mx-auto"
            >
              Catch Pokémon, collect rare heroes, and dominate the global rankings in a living, breathing economy.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap justify-center gap-6"
            >
              <Link to="/characters" className="btn-v3 btn-v3-primary px-10 py-5 text-lg group">
                <span>Start Collecting</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/leaderboard" className="btn-v3 btn-v3-secondary px-10 py-5 text-lg">
                View Rankings
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Floating Icon Decor */}
        <motion.div 
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-10 opacity-20 hidden xl:block"
        >
          <Sparkles size={80} className="text-purple-light" />
        </motion.div>
        <motion.div 
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/4 right-10 opacity-20 hidden xl:block"
        >
          <Trophy size={100} className="text-cyan-light" />
        </motion.div>
      </section>

      {/* ── Section 2: Clean Live Stats ── */}
      <section className="py-24 border-y border-white/5 bg-white/[0.01]">
        <div className="wrap">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-24">
            <StatItem label="Active Players" value={stats?.totalUsers} />
            <StatItem label="Monsters Caught" value={stats?.totalPokemonCaught} />
            <StatItem label="Hero Collection" value={stats?.totalCharactersOwned} />
            <StatItem label="Daily Commands" value={stats?.stats?.commandsUsed || "15k+"} />
          </div>
        </div>
      </section>

      {/* ── Section 3: Feature Focus 1 ── */}
      <section className="py-40">
        <div className="wrap">
          <div className="flex flex-col lg:flex-row items-center gap-24 lg:gap-40">
            <div className="flex-1 order-2 lg:order-1">
              <div className="w-16 h-16 rounded-2xl bg-purple/10 flex items-center justify-center text-purple-light mb-10">
                <Sparkles size={32} />
              </div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8">Collect your <br /><span className="grad">favorite heroes.</span></h2>
              <p className="text-lg text-text-2 leading-relaxed mb-12 max-w-lg">
                Browse a massive library of 260+ high-quality characters from Genshin, HSR, Wuwa, and ZZZ. Each with unique rarities and values.
              </p>
              <Link to="/characters" className="flex items-center gap-3 text-purple-light font-black uppercase tracking-widest text-sm hover:gap-5 transition-all">
                <span>Enter the Gallery</span>
                <ChevronRight size={18} />
              </Link>
            </div>
            <div className="flex-1 order-1 lg:order-2">
              <div className="aspect-square rounded-[40px] bg-gradient-to-br from-purple/20 to-cyan/20 border border-white/10 flex items-center justify-center relative group">
                <div className="absolute inset-0 bg-purple/10 blur-3xl opacity-0 group-hover:opacity-40 transition-opacity" />
                <Sparkles size={120} className="text-white/20 group-hover:text-purple-light group-hover:scale-110 transition-all duration-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: Feature Focus 2 ── */}
      <section className="py-40 bg-bg-2/30">
        <div className="wrap">
          <div className="flex flex-col lg:flex-row items-center gap-24 lg:gap-40">
            <div className="flex-1">
              <div className="aspect-square rounded-[40px] bg-white/5 border border-white/10 flex items-center justify-center relative group">
                 <Trophy size={120} className="text-white/20 group-hover:text-cyan-light group-hover:scale-110 transition-all duration-500" />
              </div>
            </div>
            <div className="flex-1">
              <div className="w-16 h-16 rounded-2xl bg-cyan/10 flex items-center justify-center text-cyan-light mb-10">
                <Trophy size={32} />
              </div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8">Rise to the <br /><span className="grad">very top.</span></h2>
              <p className="text-lg text-text-2 leading-relaxed mb-12 max-w-lg">
                Our global leaderboard tracks the richest, most experienced, and most dedicated collectors in the realm. Will you be next?
              </p>
              <Link to="/leaderboard" className="flex items-center gap-3 text-cyan-light font-black uppercase tracking-widest text-sm hover:gap-5 transition-all">
                <span>View Rankings</span>
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 5: The "Big" Call to Action ── */}
      <section className="py-60">
        <div className="wrap text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter mb-12 leading-tight">
              Join the <br /> 
              <span className="italic">10,000+ Players</span>
            </h2>
            <p className="text-xl md:text-2xl text-text-3 mb-16 max-w-2xl mx-auto leading-relaxed">
              KsaeKvat is the most active collector bot on Discord. Get started in seconds and build your own digital legacy.
            </p>
            <div className="flex flex-col md:flex-row justify-center items-center gap-8">
               <a href="#" className="btn-v3 btn-v3-primary px-16 py-6 text-xl rounded-2xl shadow-2xl shadow-purple/20">
                  <MessageSquare size={24} className="fill-current" />
                  <span>Add to Discord</span>
               </a>
               <div className="text-text-dim font-bold flex items-center gap-2">
                 <MousePointer2 size={18} />
                 <span>Free to play, forever.</span>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div className="text-center md:text-left">
      <div className="text-4xl md:text-5xl font-black text-text mb-3 tracking-tighter">
        {value?.toLocaleString() || "—"}
      </div>
      <div className="text-xs font-black uppercase tracking-[0.3em] text-text-3">
        {label}
      </div>
    </div>
  );
}
