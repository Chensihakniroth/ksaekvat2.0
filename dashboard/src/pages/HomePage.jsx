import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Trophy, Star, Shield, Zap, Bot, Sparkles, Sword, PawPrint, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const INVITE_LINK = "https://discord.com/oauth2/authorize?client_id=1399459454889754805";

export default function HomePage() {
  const [stats, setStats] = useState(null);
  const { scrollYProgress } = useScroll();
  const yBg = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(res => { if (res.success) setStats(res.data); })
      .catch(() => {});
  }, []);

  const fadeUp = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20 } } };

  return (
    <div className="home-container" style={{ position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Ambience */}
      <motion.div style={{ y: yBg }} className="bg-ambience">
        <div className="bg-orb-giant bg-orb-1" />
        <div className="bg-orb-giant bg-orb-2" />
        <div className="bg-orb-giant bg-orb-3" />
      </motion.div>

      <div className="wrap relative z-10 p-0 m-0">
        
        {/* HERO SECTION */}
        <motion.section 
          initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          className="landing-hero-v4"
        >
          <div className="landing-text-content">
            <motion.div variants={fadeUp} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '50px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', width: 'fit-content', marginBottom: '1rem' }}>
              <Zap size={14} style={{ animation: 'pulse 2s infinite' }} />
              Next-Gen Discord Ecosystem
            </motion.div>
            
            <motion.h1 variants={fadeUp} className="landing-title">
              ELEVATE YOUR <br />
              <span className="landing-title-grad">SERVER EXPERIENCE</span>
            </motion.h1>
            
            <motion.p variants={fadeUp} className="landing-desc">
              KSAEKVAT is the ultimate Anime RPG bot. Collect legendary characters, hunt mystical beasts, battle in strategic combat, and dominate global leaderboards.
            </motion.p>
            
            <motion.div variants={fadeUp} className="landing-actions">
              <a href={INVITE_LINK} target="_blank" rel="noreferrer" className="landing-btn-primary">
                <Bot size={22} />
                <span>Add to Discord</span>
              </a>
              <Link to="/leaderboard" className="landing-btn-secondary">
                <Trophy size={20} />
                <span>View Rankings</span>
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="landing-stats-row">
              <div className="l-stat">
                <span className="l-stat-val cyan">{stats?.totalUsers?.toLocaleString() || "10,000+"}</span>
                <span className="l-stat-lbl">Active Operatives</span>
              </div>
              <div className="l-stat-div" />
              <div className="l-stat">
                <span className="l-stat-val gold">{stats?.totalCharactersOwned?.toLocaleString() || "1M+"}</span>
                <span className="l-stat-lbl">Characters Rolled</span>
              </div>
            </motion.div>
          </div>

          <motion.div variants={fadeUp} className="landing-visual">
            <div className="l-vis-card">
              <div className="l-vis-bg" />
              <div className="l-vis-header">
                <div className="l-vis-hlt">
                  <Shield size={20} color="#22d3ee" />
                  SYSTEM PREVIEW
                </div>
                <div className="l-vis-status">ONLINE</div>
              </div>

              <div className="l-vis-item purple">
                <div className="l-vis-icon purple"><Star size={20} /></div>
                <div className="l-vis-text">
                  <span className="l-vis-title">Genshin & HSR Gacha</span>
                  <span className="l-vis-subtitle">Over 500+ characters to collect</span>
                </div>
              </div>
              
              <div className="l-vis-item red">
                <div className="l-vis-icon red"><Sword size={20} /></div>
                <div className="l-vis-text">
                  <span className="l-vis-title">RPG Boss Raids</span>
                  <span className="l-vis-subtitle">Team up & defeat world bosses</span>
                </div>
              </div>

              <div className="l-vis-item green">
                <div className="l-vis-icon green"><PawPrint size={20} /></div>
                <div className="l-vis-text">
                  <span className="l-vis-title">Ecosystem Hunting</span>
                  <span className="l-vis-subtitle">Catch mystical creatures in the Zoo</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* FEATURES GRID */}
        <section style={{ marginBottom: '8rem' }}>
          <div className="landing-core-title">
            <h2 className="l-core-h2">CORE <span>MODULES</span></h2>
            <p className="landing-desc" style={{ margin: '1rem auto' }}>Engage with meticulously crafted game systems right inside your Discord channels.</p>
          </div>

          <div className="landing-grid">
            <FeatureCard 
              icon={<Star size={32} />}
              title="Anime Gacha"
              desc="Pull your favorite characters from wildly popular anime and games with fully simulated pity and drop rates."
              glowColor="#c084fc"
            />
            <FeatureCard 
              icon={<PawPrint size={32} />}
              title="Biological Hunting"
              desc="Deploy specific commands to capture animals, from common pets to priceless mythological beasts. Build your zoo!"
              glowColor="#34d399"
            />
            <FeatureCard 
              icon={<Sword size={32} />}
              title="Tactical RPG"
              desc="Level up your Discord profile natively. Equip characters, gain EXP, and partake in high-stakes combat."
              glowColor="#f87171"
            />
          </div>
        </section>

        {/* CALL TO ACTION */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="landing-cta"
        >
          <div className="l-cta-icon"><Sparkles size={48} /></div>
          <h2 className="l-cta-title">READY TO INITIATE?</h2>
          <p className="l-cta-desc">Integrate the system into your own server. It takes precisely 5.4 seconds to establish the uplink.</p>
          <a href={INVITE_LINK} target="_blank" rel="noreferrer" className="l-cta-btn">
            <Bot size={24} />
            <span>Invite KSAEKVAT Now</span>
            <ChevronRight size={20} />
          </a>
        </motion.section>
        
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, glowColor }) {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="l-feature-card"
      style={{ '--fc-glow': glowColor, '--fc-glow-dim': glowColor + '33' }}
    >
      <div className="l-feature-icon" style={{ color: glowColor }}>
        {icon}
      </div>
      <h3 className="l-feature-title">{title}</h3>
      <p className="l-feature-desc">{desc}</p>
    </motion.div>
  );
}
