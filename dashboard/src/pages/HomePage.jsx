import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Sword,
  PawPrint,
  Star,
  Coins,
  ArrowRight,
  Terminal,
  Users,
  Layers,
  Award,
  History,
  Pencil,
  Copy,
  Check,
  ChevronRight,
  MinusCircle,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

const INVITE_LINK = 'https://discord.com/oauth2/authorize?client_id=1399459454889754805';
const MO_DISCORD_ID = '886';
const MO_PROFILE_LINK = 'https://ksaekvat.up.railway.app/profile/mo';

export default function HomePage() {
  const [stats, setStats] = useState(null);
  const [activeFeature, setActiveFeature] = useState('combat');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setStats(res.data);
      })
      .catch(() => {});
  }, []);

  const handleCopyId = () => {
    navigator.clipboard.writeText(MO_DISCORD_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          
          {/* LEFT PANE: DISCORD PROFILE POPOUT */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}
          >
            {/* Discord-style profile card */}
            <div style={{
              background: '#111214',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.06)',
              maxWidth: '380px',
              width: '100%'
            }}>
              
              {/* Banner */}
              <div style={{
                height: '120px',
                background: 'linear-gradient(135deg, #1a0508 0%, #3d0a15 40%, #2a0810 100%)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Decorative skulls/pattern overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(circle at 30% 50%, rgba(120,20,30,0.4) 0%, transparent 60%), radial-gradient(circle at 70% 40%, rgba(80,10,20,0.5) 0%, transparent 50%)',
                }} />
                {/* Subtle noise texture */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0.15,
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
                }} />
              </div>

              {/* Avatar overlapping banner */}
              <div style={{ position: 'relative', padding: '0 20px' }}>
                <div style={{
                  position: 'absolute',
                  top: '-40px',
                  left: '20px',
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  border: '5px solid #111214',
                  background: '#2b2d31',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {/* Avatar placeholder - manga style dark silhouette */}
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(180deg, #1a1a1e 0%, #2a2a30 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    color: 'rgba(255,255,255,0.2)',
                    fontWeight: 300
                  }}>
                    M
                  </div>
                  
                  {/* DND status indicator */}
                  <div style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#111214',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#f23f43',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div style={{
                        width: '6px',
                        height: '2px',
                        background: '#111214',
                        borderRadius: '1px'
                      }} />
                    </div>
                  </div>
                </div>

                {/* Discord badges row - top right */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '4px',
                  paddingTop: '10px'
                }}>
                  {/* Active Developer badge */}
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: 'rgba(88, 101, 242, 0.15)',
                    border: '1px solid rgba(88, 101, 242, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.55rem',
                    color: '#5865f2'
                  }}>
                    {'</>'}
                  </div>
                  {/* Nitro badge */}
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: 'rgba(235, 69, 158, 0.15)',
                    border: '1px solid rgba(235, 69, 158, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    color: '#eb459e'
                  }}>
                    ✦
                  </div>
                  {/* Boost badge */}
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: 'rgba(244, 127, 255, 0.15)',
                    border: '1px solid rgba(244, 127, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.6rem',
                    color: '#f47fff'
                  }}>
                    ⚡
                  </div>
                </div>
              </div>

              {/* Name & username section */}
              <div style={{ padding: '12px 20px 0' }}>
                <div style={{
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  color: '#ed4245',
                  fontStyle: 'italic',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2
                }}>
                  bawlsag
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: 'rgba(255,255,255,0.6)',
                  fontWeight: 500,
                  marginTop: '2px'
                }}>
                  bombaclat_._.
                </div>
              </div>

              {/* Separator */}
              <div style={{ margin: '14px 20px', height: '1px', background: 'rgba(255,255,255,0.06)' }} />

              {/* Profile link */}
              <div style={{ padding: '0 20px' }}>
                <a 
                  href={MO_PROFILE_LINK}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: '0.8rem',
                    color: '#00a8fc',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    textDecoration: 'none'
                  }}
                >
                  ksaekvat.up.railway.app/profile/mo
                  <ExternalLink size={10} style={{ opacity: 0.6 }} />
                </a>
              </div>

              {/* Separator */}
              <div style={{ margin: '14px 20px', height: '1px', background: 'rgba(255,255,255,0.06)' }} />

              {/* User Reviews */}
              <div style={{ padding: '0 20px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem'
                }}>
                  <span style={{ fontWeight: 700, color: '#fff' }}>User Reviews</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 500, fontSize: '0.75rem' }}>No reviews yet</span>
                </div>
              </div>

              {/* Separator */}
              <div style={{ margin: '14px 20px', height: '1px', background: 'rgba(255,255,255,0.06)' }} />

              {/* Menu items */}
              <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                
                {/* Edit Profile */}
                <Link 
                  to="/dashboard"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.8)',
                    transition: 'background 0.15s',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Pencil size={16} style={{ opacity: 0.5 }} />
                  <span>Edit Profile</span>
                </Link>

                {/* Do Not Disturb */}
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.8)',
                    cursor: 'default'
                  }}
                >
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    background: '#f23f43',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <MinusCircle size={10} color="#111214" />
                  </div>
                  <span>Do Not Disturb</span>
                  <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.3 }} />
                </div>

                {/* Copy User ID */}
                <div 
                  onClick={handleCopyId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.8)',
                    cursor: 'pointer',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {copied ? <Check size={16} style={{ color: '#4ade80' }} /> : <Copy size={16} style={{ opacity: 0.5 }} />}
                  <span>{copied ? 'Copied!' : 'Copy User ID'}</span>
                </div>

              </div>

              {/* Discord Profile Info footer */}
              <div style={{
                padding: '12px 20px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px'
              }}>
                <div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                    Username
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>
                    bombaclat_._.
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                    User ID
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', fontFamily: 'monospace' }}>
                    {MO_DISCORD_ID}
                  </div>
                </div>
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
