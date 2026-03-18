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
  ChevronRight
} from 'lucide-react';

// --- Animations ---
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

// --- Components ---

function BentoCard({ children, className = "" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={fadeInUp}
      className={`card-glass group relative overflow-hidden p-8 ${className}`}
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
        <div className="text-xs font-bold uppercase tracking-widest text-text-3" style={{ fontSize: '10px' }}>{label}</div>
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
    <div className="page overflow-hidden">
      {/* --- HERO SECTION --- */}
      <section ref={heroRef} className="relative min-h-[90vh] flex items-center pt-20 pb-32">
        <div className="hero-mesh-gradient absolute inset-0 z-0 opacity-50" />
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple/10 border border-purple/20 text-purple-light text-xs font-black uppercase tracking-[0.2em] mb-8"
              >
                <Zap size={14} className="fill-purple-light" />
                <span>Next-Gen Bot Ecosystem</span>
              </motion.div>

              <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-tight mb-8">
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
              <div className="mt-16 flex flex-wrap justify-center lg:justify-start gap-12 opacity-60">
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-text">260+</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-text-3">Characters</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-text">10k+</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-text-3">Players</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-text">99.9%</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-text-3">Uptime</span>
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
                <motion.div 
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="card-glass p-2 border-white/10 shadow-2xl rotate-2"
                >
                   <div className="bg-bg-3 rounded-[18px] p-8 overflow-hidden relative">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple to-cyan" />
                          <div>
                            <div className="text-base font-bold">Acheron</div>
                            <div className="text-xs text-text-3">Legendary • HSR</div>
                          </div>
                        </div>
                        <div className="text-gold"><Star size={20} fill="currentColor" /></div>
                      </div>
                      <div className="aspect-video bg-white/5 rounded-xl flex items-center justify-center mb-6">
                        <Sparkles size={48} className="text-purple-light opacity-20" />
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-bold text-text-3 uppercase tracking-widest">Market Value</div>
                        <div className="text-xl font-black text-gold">✨ 1,200</div>
                      </div>
                   </div>
                </motion.div>

                {/* Floating Elements */}
                <motion.div 
                  animate={{ y: [0, 15, 0], x: [0, -5, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -top-12 -left-12 card-glass p-5 border-purple/30 bg-purple/10 backdrop-blur-xl -rotate-6"
                >
                  <div className="flex items-center gap-4">
                    <TrendingUp className="text-purple-light" size={24} />
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-purple-light mb-1">Economy</div>
                      <div className="text-xl font-black tracking-tighter">Hyperactive</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  animate={{ y: [0, 10, 0], x: [0, 10, 0] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute -bottom-8 -right-8 card-glass p-5 border-cyan/30 bg-cyan/10 backdrop-blur-xl rotate-3"
                >
                  <div className="flex items-center gap-3">
                    <Users className="text-cyan-light" size={20} />
                    <div className="text-sm font-bold">+124 New Players</div>
                  </div>
                </motion.div>
              </div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-purple/20 blur-[120px] rounded-full pointer-events-none" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- BENTO GRID SECTION --- */}
      <section className="py-24 relative bg-bg-2/30">
        <div className="wrap">
          <div className="flex flex-col md:flex-row justify-between items-end gap-12 mb-16 px-2">
            <div className="max-w-2xl">
              <h2 className="text-xs font-black uppercase tracking-[0.4em] text-purple-light mb-4">Ecosystem Hub</h2>
              <h3 className="text-4xl md:text-6xl font-black tracking-tighter">Everything you need<br />at your <span className="grad italic">fingertips.</span></h3>
            </div>
            <Link to="/characters" className="btn-v3 btn-v3-secondary mb-2 group">
              <span>Explore Features</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:h-[650px]">
            {/* Live Economy */}
            <BentoCard className="md:col-span-8">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 text-cyan-light mb-6">
                  <TrendingUp size={24} />
                  <span className="text-xs font-black uppercase tracking-[0.2em]">Live Performance</span>
                </div>
                <h4 className="text-4xl font-black mb-4 tracking-tighter">Dynamic Game Economy</h4>
                <p className="text-text-2 text-lg leading-relaxed max-w-xl mb-12">
                  Every transaction is processed with elite-tier precision. Experience a living, breathing market that reacts to player choices instantly.
                </p>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-auto">
                  <StatBadge icon={Users} label="Active Players" value={stats?.totalUsers} color="var(--purple-light)" />
                  <StatBadge icon={Dog} label="Monsters Caught" value={stats?.totalPokemonCaught} color="var(--cyan)" />
                  <StatBadge icon={Sparkles} label="Rare Heroes" value={stats?.totalCharactersOwned} color="var(--pink)" />
                  <StatBadge icon={Coins} label="Circulation" value={stats?.totalCoinsCirculating} color="var(--green)" />
                </div>
              </div>
            </BentoCard>

            {/* Hall of Fame */}
            <BentoCard className="md:col-span-4 group/card">
              <div className="flex flex-col h-full">
                <div className="w-14 h-14 rounded-2xl bg-purple/10 flex items-center justify-center text-purple-light mb-8 group-hover/card:scale-110 transition-transform">
                  <Trophy size={32} />
                </div>
                <h4 className="text-3xl font-black mb-4 tracking-tighter">Hall of Fame</h4>
                <p className="text-text-2 leading-relaxed mb-10">
                  Rise to the top of global rankings. Compete against the world's elite collectors and titans.
                </p>
                <Link to="/leaderboard" className="mt-auto flex items-center gap-3 text-purple-light font-black text-sm uppercase tracking-widest">
                  <span>View Leaderboard</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </BentoCard>

            {/* Security Card */}
            <BentoCard className="md:col-span-4">
               <div className="flex flex-col">
                <div className="w-14 h-14 rounded-2xl bg-green/10 flex items-center justify-center text-green mb-8">
                  <Shield size={32} />
                </div>
                <h4 className="text-2xl font-black mb-4 tracking-tighter">Fair Play Secure</h4>
                <p className="text-text-2">Advanced anti-exploit protocols ensure that the competitive integrity is maintained 24/7.</p>
              </div>
            </BentoCard>

            {/* Gallery Preview */}
            <BentoCard className="md:col-span-8 group/gallery">
               <div className="flex flex-col md:flex-row h-full gap-12">
                 <div className="flex-1">
                    <div className="w-14 h-14 rounded-2xl bg-cyan/10 flex items-center justify-center text-cyan-light mb-8">
                      <Layout size={32} />
                    </div>
                    <h4 className="text-3xl font-black mb-4 tracking-tighter">Character Vault</h4>
                    <p className="text-text-2 leading-relaxed mb-8">
                      Deep-dive into our extensive roster of 260+ heroes. Filter by game, rarity, and elemental power.
                    </p>
                    <Link to="/characters" className="btn-v3 btn-v3-primary px-8">
                      <span>Enter the Vault</span>
                    </Link>
                 </div>
                 <div className="flex-1 relative hidden lg:block overflow-hidden rounded-2xl bg-bg-3 border border-white/5">
                    <div className="absolute inset-0 grid grid-cols-4 gap-3 p-6 opacity-20 group-hover/gallery:opacity-40 transition-opacity duration-500">
                      {[...Array(12)].map((_, i) => (
                        <div key={i} className="aspect-square rounded-xl bg-white/10 animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Sparkles size={64} className="text-cyan-light drop-shadow-glow" />
                    </div>
                 </div>
               </div>
            </BentoCard>
          </div>
        </div>
      </section>

      {/* --- TOP PLAYERS SHOWCASE --- */}
      {top3.length > 0 && (
        <section className="py-32 relative">
          <div className="wrap">
            <div className="text-center mb-20">
               <h2 className="text-xs font-black uppercase tracking-[0.5em] text-gold mb-4">Elite Titans</h2>
               <h3 className="text-5xl font-black tracking-tighter">Richest in the Realm</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {top3.map((u, i) => {
                const medals = ['🥇','🥈','🥉'];
                const glowColors = ['rgba(251,191,36,0.3)', 'rgba(148,163,184,0.2)', 'rgba(180,83,9,0.2)'];
                return (
                  <motion.div 
                    key={u.userId}
                    whileHover={{ y: -12, scale: 1.02 }}
                    className="card-glass p-10 text-center relative group overflow-hidden"
                    style={{ boxShadow: `0 24px 60px -20px ${glowColors[i]}` }}
                  >
                    <div className="absolute -top-10 -right-10 text-[120px] font-black opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                      {i + 1}
                    </div>
                    <div className="text-6xl mb-8 transform group-hover:scale-110 transition-transform">{medals[i]}</div>
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-white/10 to-transparent mx-auto mb-8 flex items-center justify-center text-4xl font-black border border-white/10 shadow-2xl">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <h4 className="text-2xl font-black mb-3">{u.username}</h4>
                    <div className="flex items-center justify-center gap-2 text-gold font-black text-lg mb-8">
                      <Coins size={20} />
                      <span>{u.balance.toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                      <div className="p-4 bg-bg-3/50 text-center">
                        <div className="text-[10px] font-black text-text-3 uppercase tracking-widest mb-1">Level</div>
                        <div className="text-lg font-black text-purple-light">{u.level}</div>
                      </div>
                      <div className="p-4 bg-bg-3/50 text-center">
                        <div className="text-[10px] font-black text-text-3 uppercase tracking-widest mb-1">Collection</div>
                        <div className="text-lg font-black text-cyan-light">{u.characterCount}</div>
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
      <section className="py-40 relative">
        <div className="wrap">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="card-glass bg-gradient-to-b from-purple/10 to-transparent border-purple/30 p-16 md:p-32 text-center relative overflow-hidden rounded-[40px]"
          >
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.15),transparent_70%)]" />
             <div className="relative z-10">
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-tight">Ready to Start<br />Your <span className="text-purple-light italic">Adventure?</span></h2>
                <p className="text-text-2 text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
                  Join 10,000+ players in the most active Discord economy. 
                  Catch, trade, and dominate today.
                </p>
                <div className="flex flex-wrap justify-center gap-6">
                  <a href="#" className="btn-v3 btn-v3-primary px-12 py-5 text-lg shadow-2xl group">
                    <MessageSquare size={24} className="fill-current" />
                    <span>Add to Discord</span>
                    <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                  </a>
                  <a href="#" className="btn-v3 btn-v3-secondary px-12 py-5 text-lg">
                    <span>Developer API</span>
                  </a>
                </div>
             </div>
          </motion.div>
        </div>
      </section>

      <style>{`
        .hero-mesh-gradient {
          background: 
            radial-gradient(circle at 15% 15%, rgba(139, 92, 246, 0.12) 0%, transparent 40%),
            radial-gradient(circle at 85% 85%, rgba(34, 211, 238, 0.08) 0%, transparent 40%);
          filter: blur(80px);
        }
        .drop-shadow-glow {
          filter: drop-shadow(0 0 20px rgba(34, 211, 238, 0.5));
        }
      `}</style>
    </div>
  );
}
