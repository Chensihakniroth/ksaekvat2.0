import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { 
  Users, 
  Dog, 
  Sparkles, 
  Trophy, 
  Coins, 
  ArrowRight,
  TrendingUp,
  Star,
  MessageSquare,
  Shield,
  Zap,
  Layout,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

// --- Animations ---
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

// --- Components ---

function BentoCard({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={fadeInUp}
      className={`card-glass group relative overflow-hidden p-6 ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10 h-full flex flex-col">
        {children}
      </div>
    </motion.div>
  );
}

function StatBadge({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, color }}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-text-3">{label}</div>
        <div className="text-sm font-black text-text">{value?.toLocaleString() ?? '—'}</div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState(null);
  const [top3, setTop3] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    Promise.all([
      fetch('/api/stats').then(r => r.json()).catch(() => ({ success: false })),
      fetch('/api/leaderboard?sort=balance&limit=3').then(r => r.json()).catch(() => ({ success: false })),
    ]).then(([s, lb]) => {
      if (s.success) setStats(s.data);
      if (lb.success) setTop3(lb.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="page overflow-x-hidden">
      {/* --- HERO SECTION --- */}
      <section ref={heroRef} className="relative min-h-[90vh] flex items-center pt-20 pb-32">
        <div className="hero-mesh-gradient" />
        <div className="wrap relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            {/* Left Content */}
            <motion.div 
              style={{ y: heroY, opacity: heroOpacity }}
              className="flex-1 text-center lg:text-left"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple/10 border border-purple/20 text-purple-light text-[10px] font-black uppercase tracking-[0.2em] mb-8"
              >
                <Zap size={12} className="fill-purple-light" />
                <span>Next-Gen Bot Ecosystem</span>
              </motion.div>

              <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8">
                Build Your<br />
                <span className="grad italic text-glow">Legacy.</span>
              </h1>

              <p className="text-lg md:text-xl text-text-2 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed font-medium">
                The ultimate Discord companion for collectors and gamers. 
                Experience a living economy with <span className="text-text font-bold">260+ characters</span> to unlock.
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                <Link to="/characters" className="btn-v3 btn-v3-primary px-8 py-4 text-base group">
                  <span>Start Collecting</span>
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/leaderboard" className="btn-v3 btn-v3-secondary px-8 py-4 text-base">
                  <Trophy size={18} />
                  <span>Hall of Fame</span>
                </Link>
              </div>

              {/* Quick Stats Row */}
              <div className="mt-16 flex flex-wrap justify-center lg:justify-start gap-8 opacity-60">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-text">260+</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-3">Characters</span>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-text">10k+</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-3">Players</span>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-text">99.9%</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-3">Uptime</span>
                </div>
              </div>
            </motion.div>

            {/* Right Visual (Floating UI) */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="flex-1 relative hidden lg:block"
            >
              <div className="relative z-10">
                {/* Main Card Preview */}
                <motion.div 
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="card-glass p-1 border-white/10 shadow-2xl rotate-2"
                >
                   <div className="bg-bg-3 rounded-[18px] p-6 overflow-hidden relative">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple to-cyan" />
                          <div>
                            <div className="text-sm font-bold">Acheron</div>
                            <div className="text-[10px] text-text-3">Legendary • HSR</div>
                          </div>
                        </div>
                        <div className="text-gold"><Star size={16} fill="currentColor" /></div>
                      </div>
                      <div className="aspect-[4/3] bg-white/5 rounded-xl flex items-center justify-center mb-4">
                        <Sparkles size={40} className="text-purple-light opacity-20" />
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-xs font-bold text-text-3">Star Dust Value</div>
                        <div className="text-gold font-black">✨ 1,200</div>
                      </div>
                   </div>
                </motion.div>

                {/* Floating Stat Card */}
                <motion.div 
                  animate={{ y: [0, 15, 0], x: [0, -5, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -top-12 -left-12 card-glass p-4 border-purple/30 bg-purple/10 backdrop-blur-xl -rotate-6"
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp className="text-purple-light" size={18} />
                    <div>
                      <div className="text-[10px] font-black uppercase text-purple-light">Global Economy</div>
                      <div className="text-lg font-black tracking-tight">Active</div>
                    </div>
                  </div>
                </motion.div>

                {/* Floating User Card */}
                <motion.div 
                  animate={{ y: [0, 10, 0], x: [0, 10, 0] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute -bottom-8 -right-8 card-glass p-4 border-cyan/30 bg-cyan/10 backdrop-blur-xl rotate-3"
                >
                  <div className="flex items-center gap-3">
                    <Users className="text-cyan-light" size={18} />
                    <div className="text-sm font-bold">+124 New Players</div>
                  </div>
                </motion.div>
              </div>

              {/* Decorative Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-purple/10 blur-[120px] rounded-full pointer-events-none" />
            </motion.div>

          </div>
        </div>
      </section>

      {/* --- BENTO GRID SECTION --- */}
      <section className="py-24 relative">
        <div className="wrap">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
            <div className="ph-v3 mb-0">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-purple-light mb-4">Ecosystem Hub</h2>
              <h3 className="text-4xl md:text-5xl font-black tracking-tighter">Everything you need<br />at your <span className="grad">fingertips.</span></h3>
            </div>
            <Link to="/characters" className="btn-v3 btn-v3-secondary mb-2">
              <span>Explore Features</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 grid-rows-2 gap-4 h-auto md:h-[600px]">
            {/* Main Stats (Large) */}
            <BentoCard className="md:col-span-8 md:row-span-1">
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center gap-2 text-cyan-light mb-4">
                    <TrendingUp size={20} />
                    <span className="text-xs font-black uppercase tracking-widest">Live Performance</span>
                  </div>
                  <h4 className="text-3xl font-black mb-2 tracking-tight">Real-time Game Economy</h4>
                  <p className="text-text-3 max-w-md">Our specialized worker nodes ensure that every hunt, trade, and pull is processed with sub-millisecond latency.</p>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                  <StatBadge icon={Users} label="Total Players" value={stats?.totalUsers} color="var(--purple-light)" />
                  <StatBadge icon={Dog} label="Pokémon Caught" value={stats?.totalPokemonCaught} color="var(--cyan)" />
                  <StatBadge icon={Sparkles} label="Characters" value={stats?.totalCharactersOwned} color="var(--pink)" />
                  <StatBadge icon={Coins} label="Circulation" value={stats?.totalCoinsCirculating} color="var(--green)" />
                </div>
              </div>
            </BentoCard>

            {/* Quick Link: Leaderboard */}
            <BentoCard className="md:col-span-4 md:row-span-1 hover:border-purple/40">
              <div className="flex flex-col h-full">
                <div className="w-12 h-12 rounded-2xl bg-purple/10 flex items-center justify-center text-purple-light mb-6">
                  <Trophy size={24} />
                </div>
                <h4 className="text-2xl font-black mb-2">Hall of Fame</h4>
                <p className="text-text-3 text-sm mb-8">Compete for the top spot in global rankings. Richest, highest level, and master collectors.</p>
                <Link to="/leaderboard" className="mt-auto flex items-center gap-2 text-purple-light font-bold text-sm group">
                  <span>View Rankings</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </BentoCard>

            {/* Feature: Security */}
            <BentoCard className="md:col-span-4 md:row-span-1">
               <div className="flex flex-col h-full">
                <div className="w-12 h-12 rounded-2xl bg-green/10 flex items-center justify-center text-green mb-6">
                  <Shield size={24} />
                </div>
                <h4 className="text-2xl font-black mb-2">Fair Play</h4>
                <p className="text-text-3 text-sm">Anti-cheat systems and secure trading protocols keep the economy healthy and fun for everyone.</p>
              </div>
            </BentoCard>

            {/* Feature: Character Gallery (Medium) */}
            <BentoCard className="md:col-span-8 md:row-span-1 group/gallery">
               <div className="flex flex-col md:flex-row h-full gap-8">
                 <div className="flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-cyan/10 flex items-center justify-center text-cyan-light mb-6">
                      <Layout size={24} />
                    </div>
                    <h4 className="text-2xl font-black mb-2">Character Gallery</h4>
                    <p className="text-text-3 text-sm mb-6">Browse the massive roster of heroes from Genshin Impact, HSR, Wuwa, and ZZZ.</p>
                    <Link to="/characters" className="btn-v3 btn-v3-primary w-fit">
                      <span>Browse 260+ Chars</span>
                    </Link>
                 </div>
                 <div className="flex-1 relative hidden lg:block overflow-hidden rounded-xl bg-white/5 border border-white/10">
                    <div className="absolute inset-0 flex flex-wrap gap-2 p-4 opacity-40 group-hover/gallery:opacity-60 transition-opacity">
                      {[...Array(12)].map((_, i) => (
                        <div key={i} className="w-10 h-10 rounded-lg bg-white/10 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Sparkles size={48} className="text-cyan-light" />
                    </div>
                 </div>
               </div>
            </BentoCard>
          </div>
        </div>
      </section>

      {/* --- TOP PLAYERS SHOWCASE --- */}
      {top3.length > 0 && (
        <section className="py-24 bg-surface/30 border-y border-white/5">
          <div className="wrap">
            <div className="text-center mb-16">
               <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gold mb-4">Elite Players</h2>
               <h3 className="text-4xl font-black tracking-tight">The Richest in the Realm</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {top3.map((u, i) => {
                const medals = ['🥇','🥈','🥉'];
                const glowColors = ['rgba(251,191,36,0.2)', 'rgba(148,163,184,0.15)', 'rgba(180,83,9,0.15)'];
                return (
                  <motion.div 
                    key={u.userId}
                    whileHover={{ y: -10 }}
                    className="card-glass p-8 text-center relative group"
                    style={{ boxShadow: `0 20px 40px -20px ${glowColors[i]}` }}
                  >
                    <div className="text-5xl mb-6">{medals[i]}</div>
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/10 to-transparent mx-auto mb-6 flex items-center justify-center text-3xl font-black border border-white/10">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <h4 className="text-xl font-black mb-2">{u.username}</h4>
                    <div className="flex items-center justify-center gap-2 text-gold font-bold mb-6">
                      <Coins size={16} />
                      <span>{u.balance.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-center gap-4 py-3 px-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-center">
                        <div className="text-[10px] font-bold text-text-3 uppercase tracking-widest">Level</div>
                        <div className="text-sm font-black">{u.level}</div>
                      </div>
                      <div className="w-px h-6 bg-white/10" />
                      <div className="text-center">
                        <div className="text-[10px] font-bold text-text-3 uppercase tracking-widest">Chars</div>
                        <div className="text-sm font-black">{u.characterCount}</div>
                      </div>
                    </div>
                    <Link to={`/profile/${u.userId}`} className="absolute inset-0 z-10" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* --- COMMUNITY CTA --- */}
      <section className="py-32">
        <div className="wrap">
          <div className="card-glass bg-purple/10 border-purple/30 p-12 md:p-20 text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.15),transparent_70%)]" />
             <div className="relative z-10">
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">Ready to Join<br />the <span className="text-purple-light">Community?</span></h2>
                <p className="text-text-2 text-lg max-w-xl mx-auto mb-10">
                  Connect with thousands of players, participate in global events, 
                  and get exclusive character drops.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <a href="#" className="btn-v3 btn-v3-primary px-10 py-4 text-base">
                    <MessageSquare size={20} />
                    <span>Add to Discord</span>
                  </a>
                  <a href="#" className="btn-v3 btn-v3-secondary px-10 py-4 text-base">
                    <span>Read Documentation</span>
                  </a>
                </div>
             </div>
          </div>
        </div>
      </section>

      <style>{`
        .hero-mesh-gradient {
          position: absolute; top: 0; left: 0; right: 0; height: 100%;
          background: 
            radial-gradient(circle at 10% 20%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 90% 80%, rgba(34, 211, 238, 0.05) 0%, transparent 50%);
          filter: blur(60px); pointer-events: none;
        }
        
        /* Grid Helpers */
        .grid { display: grid; }
        .grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
        .grid-rows-2 { grid-template-rows: repeat(2, 1fr); }
        
        @media (min-width: 768px) {
          .md\\:grid-cols-12 { grid-template-columns: repeat(12, 1fr); }
          .md\\:row-span-1 { grid-row: span 1 / span 1; }
          .md\\:col-span-8 { grid-column: span 8 / span 8; }
          .md\\:col-span-4 { grid-column: span 4 / span 4; }
          .md\\:h-\\[600px\\] { height: 600px; }
        }

        /* Typography & Utilities */
        .tracking-tighter { letter-spacing: -0.05em; }
        .tracking-tight { letter-spacing: -0.025em; }
        .tracking-widest { letter-spacing: 0.1em; }
        .font-black { font-weight: 900; }
        .font-bold { font-weight: 700; }
        .italic { font-style: italic; }
        
        /* Layout */
        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .items-center { align-items: center; }
        .justify-center { justify-content: center; }
        .text-center { text-align: center; }
        .relative { position: relative; }
        .absolute { position: absolute; }
        .overflow-hidden { overflow: hidden; }
        .z-10 { z-index: 10; }
        .mx-auto { margin-left: auto; margin-right: auto; }
        .max-w-xl { max-width: 36rem; }
        .max-w-md { max-width: 28rem; }
        .h-full { height: 100%; }
        .w-fit { width: fit-content; }
        
        /* Tailored Classes */
        .grad { background: linear-gradient(135deg, var(--purple-light), var(--cyan-light)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .text-glow { text-shadow: 0 0 30px rgba(139, 92, 246, 0.4); }
        
        /* Spacing */
        .p-1 { padding: 0.25rem; }
        .p-3 { padding: 0.75rem; }
        .p-4 { padding: 1rem; }
        .p-6 { padding: 1.5rem; }
        .p-8 { padding: 2rem; }
        .p-12 { padding: 3rem; }
        .md\\:p-20 { @media (min-width: 768px) { padding: 5rem; } }
        .pt-20 { padding-top: 5rem; }
        .pb-32 { padding-bottom: 8rem; }
        .py-24 { padding-top: 6rem; padding-bottom: 6rem; }
        .py-32 { padding-top: 8rem; padding-bottom: 8rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mb-8 { margin-bottom: 2rem; }
        .mb-10 { margin-bottom: 2.5rem; }
        .mb-12 { margin-bottom: 3rem; }
        .mb-16 { margin-bottom: 4rem; }
        .mt-auto { margin-top: auto; }
        .mt-8 { margin-top: 2rem; }
        .mt-16 { margin-top: 4rem; }
        .gap-2 { gap: 0.5rem; }
        .gap-3 { gap: 0.75rem; }
        .gap-4 { gap: 1rem; }
        .gap-8 { gap: 2rem; }
        .gap-16 { gap: 4rem; }
      `}</style>
    </div>
  );
}
