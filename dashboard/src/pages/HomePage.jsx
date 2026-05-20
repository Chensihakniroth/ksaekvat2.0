import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Trophy, Star, Shield, Zap, Bot, Sparkles, Sword, 
  PawPrint, ChevronRight, Activity, Globe, Layout, 
  Cpu, Users, Terminal as TerminalIcon, Fingerprint
} from 'lucide-react';
import { Link } from 'react-router-dom';

const INVITE_LINK = "https://discord.com/oauth2/authorize?client_id=1399459454889754805";

export default function HomePage() {
  const [stats, setStats] = useState(null);
  const { scrollYProgress } = useScroll();
  const yBg = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(res => { if (res.success) setStats(res.data); })
      .catch(() => {});
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="home-container" style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
      
      <div className="wrap relative z-10">
        
        {/* HERO SECTION */}
        <motion.section 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="landing-hero-v4"
          style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', paddingTop: '80px' }}
        >
          <motion.div variants={itemVariants} style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.6 }}>
            <div style={{ width: '40px', height: '1px', background: 'var(--cyber-cyan)', boxShadow: '0 0 10px var(--cyber-cyan)' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em', color: 'var(--cyber-cyan)', textShadow: '0 0 8px rgba(0,243,255,0.5)' }}>The Infinite Archive</span>
            <div style={{ width: '40px', height: '1px', background: 'var(--cyber-cyan)', boxShadow: '0 0 10px var(--cyber-cyan)' }} />
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="landing-title" style={{ fontSize: 'clamp(3.5rem, 12vw, 8rem)', fontWeight: 900, letterSpacing: '-0.06em', lineHeight: 0.9, marginBottom: '2rem' }}>
            BEYOND <br />
            <span className="landing-title-grad" style={{ background: 'linear-gradient(to right, #fff, var(--cyber-cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0 0 20px rgba(0, 243, 255, 0.4)' }}>RESONANCE</span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="landing-desc" style={{ fontSize: '1.1rem', fontWeight: 400, color: 'var(--text-dim)', maxWidth: '550px', margin: '0 auto 4rem', lineHeight: 1.6 }}>
            Architecting the future of Discord-based RPG ecosystems. Secure legendary assets and dominate the digital landscape with KSAEKVAT.
          </motion.p>
          
          <motion.div variants={itemVariants} className="landing-actions" style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={INVITE_LINK} target="_blank" rel="noreferrer" className="btn-v3" style={{ padding: '20px 48px', background: 'var(--cyber-cyan)', color: '#000', border: 'none', boxShadow: '0 0 20px rgba(0, 243, 255, 0.3)' }}>
              <Zap size={18} />
              <span>INVITE DISCORD BOT</span>
            </a>
            <Link to="/leaderboard" className="btn-v3 btn-v3-ghost" style={{ padding: '20px 48px', borderColor: 'rgba(255,255,255,0.1)' }}>
              <Fingerprint size={18} />
              <span>ARCHIVES</span>
            </Link>
          </motion.div>

          <motion.div variants={itemVariants} className="landing-stats-row" style={{ marginTop: '100px', display: 'flex', gap: '40px', opacity: 0.6, flexWrap: 'wrap', justifyContent: 'center' }}>
            <div className="l-stat">
              <span className="l-stat-val" style={{ fontSize: '1.5rem', fontWeight: 900 }}>{stats?.totalUsers?.toLocaleString() || "12.4K"}</span>
              <span className="l-stat-lbl" style={{ display: 'block', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: '8px' }}>OPERATIVES</span>
            </div>
            <div className="l-stat">
              <span className="l-stat-val" style={{ fontSize: '1.5rem', fontWeight: 900 }}>{stats?.totalCharactersOwned?.toLocaleString() || "1.2M"}</span>
              <span className="l-stat-lbl" style={{ display: 'block', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: '8px' }}>ASSETS</span>
            </div>
          </motion.div>
        </motion.section>

        {/* ZEN FEATURES */}
        <section style={{ padding: '160px 0' }}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            style={{ textAlign: 'center', marginBottom: '80px' }}
          >
            <h2 style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5em', opacity: 0.3, marginBottom: '20px' }}>CORE PROTOCOLS</h2>
            <p style={{ fontSize: '1.5rem', fontWeight: 200, maxWidth: '700px', margin: '0 auto' }}>Meticulously engineered systems designed for high-performance strategic engagement.</p>
          </motion.div>

          <div className="landing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
            <FeatureCard 
              icon={<Star size={24} />}
              title="RESONANCE"
              desc="Simulated acquisition protocols with accurate drop rates and multi-tier parity systems."
              accent="var(--purple)"
            />
            <FeatureCard 
              icon={<PawPrint size={24} />}
              title="SPECIMEN"
              desc="Deploy biological capture units to secure rare specimens for your private registry."
              accent="var(--green)"
            />
            <FeatureCard 
              icon={<Sword size={24} />}
              title="COMBAT"
              desc="Advanced turn-based strategic engine with deep scaling and level progression."
              accent="var(--red)"
            />
          </div>
        </section>

        {/* MINIMAL CTA */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="glass-panel"
          style={{ padding: '100px 60px', borderRadius: '40px', textAlign: 'center', border: '1px solid rgba(0, 243, 255, 0.1)', background: 'rgba(0, 243, 255, 0.02)', boxShadow: '0 0 40px rgba(0, 243, 255, 0.05)', marginBottom: '120px' }}
        >
          <div style={{ display: 'inline-flex', padding: '15px', borderRadius: '50%', background: 'rgba(0, 243, 255, 0.1)', marginBottom: '30px', boxShadow: '0 0 20px rgba(0, 243, 255, 0.2)' }}>
             <Sparkles size={32} color="var(--cyber-cyan)" />
          </div>
          <h2 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '1.5rem', color: '#fff', textShadow: '0 0 10px rgba(255,255,255,0.2)' }}>START YOUR JOURNEY.</h2>
          <p style={{ color: 'var(--text-dim)', maxWidth: '500px', margin: '0 auto 4rem', fontSize: '1.1rem' }}>Synchronize your server with the infinite archive instantly.</p>
          <a href={INVITE_LINK} target="_blank" rel="noreferrer" className="btn-v3" style={{ padding: '22px 64px', fontSize: '1rem', background: 'var(--cyber-cyan)', color: '#000', border: 'none', boxShadow: '0 0 20px rgba(0, 243, 255, 0.3)' }}>
            <span>INVITE DISCORD BOT</span>
          </a>
        </motion.section>
        
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, accent }) {
  return (
    <motion.div 
      whileHover={{ y: -5, background: 'rgba(255,255,255,0.02)', borderColor: accent, boxShadow: `0 0 20px ${accent}30` }}
      className="glass-panel"
      style={{ padding: '50px 40px', borderRadius: '24px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.03)', transition: '0.4s' }}
    >
      <div style={{ color: accent, marginBottom: '30px', opacity: 0.8, filter: `drop-shadow(0 0 10px ${accent})` }}>
        {icon}
      </div>
      <h3 style={{ fontSize: '1rem', fontWeight: 900, letterSpacing: '0.2em', marginBottom: '1.5rem', color: '#fff', textShadow: `0 0 10px ${accent}40` }}>{title}</h3>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', lineHeight: 1.6, fontWeight: 400 }}>{desc}</p>
    </motion.div>
  );
}

