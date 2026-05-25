import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Sword,
  PawPrint,
  Star,
  Coins,
  Trophy,
  ArrowRight,
  Github,
  MessageSquare,
  Terminal,
  Users,
  Layers,
  Award,
  Sparkles,
  ExternalLink,
  Calendar,
  History
} from 'lucide-react';
import { Link } from 'react-router-dom';

const INVITE_LINK = 'https://discord.com/oauth2/authorize?client_id=1399459454889754805';

export default function HomePage() {
  const [stats, setStats] = useState(null);
  const [activeFeature, setActiveFeature] = useState('combat');

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setStats(res.data);
      })
      .catch(() => {});
  }, []);

  const features = {
    combat: {
      title: 'Turn-Based Combat',
      icon: <Sword size={20} />,
      command: 'k combat duel',
      response: `» Challenging Shadow Assassin (Level 42)
» [k] Attack | [s] Skill | [f] Flee
» Critical Hit! Shadow Assassin takes 2,450 damage.
» Battle Won! +450 Exp, +1,200 Gold.`,
      stats: { Mode: 'PVE / Raid Bosses', Scaling: 'Exponential', Rewards: 'Gold & EXP' },
    },
    gacha: {
      title: 'Resonance Gacha',
      icon: <Star size={20} />,
      command: 'k pull standard 10',
      response: `» Performing 10x Pull on Resonance Banner...
» ✦✦✦✦✦ Acheron [HSR] (S-Rank) - NEW!
» ✦✦✦✦ Dan Heng [HSR]
» ✦✦✦ Razor [Genshin]
» Soft Pity reset to 0. Standard pity: 12.`,
      stats: { 'Base Rate': '0.6%', 'Soft Pity': '75 Pulls', 'Hard Pity': '90 Pulls' },
    },
    hunting: {
      title: 'Specimen Hunting',
      icon: <PawPrint size={20} />,
      command: 'k hunt forest',
      response: `» Traps deployed in Whisperwood Forest...
» Wild Pikachu (Rarity: Uncommon) caught!
» Registered to Zoo. Total Specimens: 142/350.
» Milestones: Hunter Badge IV unlocked.`,
      stats: { Location: 'Biomes Grid', Captures: '350+ Creatures', Milestones: 'Custom Badges' },
    },
    economy: {
      title: 'Sleek Economy',
      icon: <Coins size={20} />,
      command: 'k daily',
      response: `» Operative Mo claimed daily ration.
» Received: +5,000 Credits.
» Daily Streak: 12 days (+1,200 bonus credits).
» Current Balance: 42,950 Credits.`,
      stats: { Claim: 'Daily / Weekly', Minigames: 'Gambling & Work', Currency: 'Credits' },
    },
  };

  const journeyTimeline = [
    {
      date: 'Jan 2025',
      title: 'The Spark — KSAEKVAT 1.0 Alpha',
      desc: 'First codebase release. Initializing core Discord handlers, simple database schemas, and text-based specimen hunting commands.',
    },
    {
      date: 'Mar 2025',
      title: 'Combat & Economy Integration',
      desc: 'Added fully functional RPG PVE combat systems, boss levels, dynamic stat calculations, and the daily claims claim engine.',
    },
    {
      date: 'May 2025',
      title: 'The UI Dimension',
      desc: 'Shipped a comprehensive Vite + React 19 dashboard featuring real-time live database search and interactive user profile bios.',
    },
    {
      date: 'June 2025',
      title: 'Version 2.0 — Cozy Matte Revamp',
      desc: 'A complete aesthetic redesign. Replacing neon cyberpunk glows with a clean, matte, flat-studio layout optimized for clarity.',
    },
  ];

  return (
    <div className="home-container" style={{ minHeight: '100vh', paddingBottom: '100px' }}>
      <div className="wrap relative z-10">
        
        {/* HERO SECTION - SPLIT PANE */}
        <section className="hero-split">
          
          {/* LEFT PANE: CREATOR INTRO CARD */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}
          >
            <div className="matte-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Creator Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div 
                  style={{ 
                    width: '64px', 
                    height: '64px', 
                    borderRadius: '16px', 
                    background: '#1a1a1e',
                    border: '1px solid var(--border-matte)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    fontWeight: 800
                  }}
                >
                  M
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>@_callme_.mo</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    Lead Architect & Bot Creator
                  </p>
                </div>
              </div>

              {/* Biography */}
              <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                Building immersive digital worlds, one line of TypeScript at a time. Mo designed KSAEKVAT 
                to connect RPG systems, live Gacha, and collectible hunting directly inside Discord.
              </p>

              {/* Tech Badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['TypeScript', 'Discord.js', 'React 19', 'MongoDB'].map((tech) => (
                  <span 
                    key={tech}
                    style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 600, 
                      padding: '4px 10px', 
                      background: 'rgba(255,255,255,0.03)', 
                      border: '1px solid var(--border-matte)',
                      borderRadius: '6px',
                      color: 'rgba(255,255,255,0.6)'
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* Creator Social Links */}
              <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--border-matte)', paddingTop: '20px' }}>
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="matte-btn"
                  style={{ padding: '8px 16px', fontSize: '0.75rem', flex: 1 }}
                >
                  <Github size={14} />
                  <span>GitHub</span>
                </a>
                <a 
                  href="https://discord.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="matte-btn"
                  style={{ padding: '8px 16px', fontSize: '0.75rem', flex: 1 }}
                >
                  <MessageSquare size={14} />
                  <span>Discord</span>
                </a>
              </div>

            </div>

            {/* BOT CALL TO ACTIONS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, color: '#fff' }}>
                KSAEKVAT BOT
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '480px' }}>
                Deploy advanced RPG combat, hunting registers, and banner pulls onto your Discord server with absolute ease.
              </p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <a 
                  href={INVITE_LINK} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="matte-btn matte-btn-primary"
                  style={{ padding: '16px 32px' }}
                >
                  <Zap size={16} />
                  <span>Invite to Server</span>
                </a>
                <Link 
                  to="/leaderboard" 
                  className="matte-btn" 
                  style={{ padding: '16px 32px' }}
                >
                  <span>View Leaderboard</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

          </motion.div>

          {/* RIGHT PANE: INTERACTIVE BOT FEATURE SHOWCASE */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            <div className="matte-card" style={{ padding: '0px', overflow: 'hidden' }}>
              
              {/* Tab Header */}
              <div 
                style={{ 
                  display: 'flex', 
                  borderBottom: '1px solid var(--border-matte)', 
                  background: 'rgba(255,255,255,0.01)',
                  overflowX: 'auto',
                  whiteSpace: 'nowrap'
                }}
              >
                {Object.keys(features).map((key) => (
                  <button
                    key={key}
                    onClick={() => setActiveFeature(key)}
                    style={{
                      flex: 1,
                      padding: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: activeFeature === key ? '#fff' : 'var(--text-muted)',
                      borderBottom: activeFeature === key ? '2px solid #fff' : '2px solid transparent',
                      background: activeFeature === key ? 'rgba(255,255,255,0.02)' : 'transparent',
                    }}
                  >
                    {features[key].icon}
                    <span>{features[key].title}</span>
                  </button>
                ))}
              </div>

              {/* Console Body */}
              <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Command Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Terminal size={14} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)' }}>
                    Command Execution
                  </span>
                </div>

                <div 
                  style={{ 
                    background: '#09090b', 
                    border: '1px solid var(--border-matte)', 
                    borderRadius: '12px',
                    padding: '20px',
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    position: 'relative'
                  }}
                >
                  <div style={{ color: '#fff', marginBottom: '12px', display: 'flex', gap: '8px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>$</span>
                    <span>{features[activeFeature].command}</span>
                  </div>
                  
                  <AnimatePresence mode="wait">
                    <motion.pre
                      key={activeFeature}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2 }}
                      style={{ 
                        color: 'rgba(255,255,255,0.7)', 
                        lineHeight: 1.7, 
                        whiteSpace: 'pre-wrap',
                        margin: 0
                      }}
                    >
                      {features[activeFeature].response}
                    </motion.pre>
                  </AnimatePresence>
                </div>

                {/* Feature Attributes */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                  {Object.entries(features[activeFeature].stats).map(([k, v]) => (
                    <div 
                      key={k} 
                      style={{ 
                        background: 'rgba(255,255,255,0.01)', 
                        border: '1px solid var(--border-matte)',
                        borderRadius: '10px',
                        padding: '12px',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                        {k}
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                        {v}
                      </div>
                    </div>
                  ))}
                </div>

              </div>

            </div>
          </motion.div>

        </section>

        {/* STATS SECTION */}
        <section style={{ padding: '80px 0 40px' }}>
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
              gap: '24px' 
            }}
          >
            <div className="matte-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Users size={20} style={{ color: 'var(--text-muted)' }} />
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginTop: '10px' }}>
                {stats?.totalUsers?.toLocaleString() || '12,482'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Active Operatives
              </div>
            </div>
            
            <div className="matte-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Layers size={20} style={{ color: 'var(--text-muted)' }} />
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginTop: '10px' }}>
                {stats?.totalCharactersOwned?.toLocaleString() || '1,208,491'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Characters Owned
              </div>
            </div>

            <div className="matte-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Award size={20} style={{ color: 'var(--text-muted)' }} />
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginTop: '10px' }}>
                {stats?.totalGuilds?.toLocaleString() || '482'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Discord Command Uplinks
              </div>
            </div>
          </div>
        </section>

        {/* JOURNEY TIMELINE SECTION */}
        <section style={{ padding: '80px 0' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', opacity: 0.5, marginBottom: '12px' }}>
              <History size={16} />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                Project Archives
              </span>
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>
              The Journey of KSAEKVAT
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '8px' }}>
              Documenting the design iterations and milestones behind the ecosystem.
            </p>
          </div>

          <div className="timeline-container">
            {journeyTimeline.map((item, idx) => (
              <motion.div 
                key={idx}
                className="timeline-item"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
              >
                <div className="timeline-dot" />
                <div className="timeline-date">{item.date}</div>
                <div className="timeline-content">
                  <h4 className="timeline-title">{item.title}</h4>
                  <p className="timeline-desc">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

        </section>

      </div>
    </div>
  );
}
