import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Users, Star, ArrowRight, ChevronRight, Activity, Zap, Target } from 'lucide-react';

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

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="home-container">
      <div className="wrap">
        {/* --- HERO SECTION --- */}
        <motion.section 
          variants={container}
          initial="hidden"
          animate="show"
          className="hero-grid"
        >
          <div className="hero-content">
            <motion.div variants={item} className="status-badge">
              <Activity size={14} />
              <span>Strategic Operations Active</span>
            </motion.div>
            
            <motion.h1 variants={item} className="hero-title">
              MISSION <br/>
              <span className="text-gradient glitch-text">CONTROL</span>
            </motion.h1>
            
            <motion.p variants={item} className="hero-desc">
              Initialize your gaming protocols. Collect elite operatives, dominate global rankings, and secure your position in the KsaeKvat ecosystem.
            </motion.p>
            
            <motion.div variants={item} className="hero-actions">
              <Link to="/characters" className="btn-v3 btn-v3-primary">
                <Target size={18} />
                <span>Initialize Roster</span>
                <ChevronRight size={16} />
              </Link>
              <Link to="/leaderboard" className="btn-v3 btn-v3-ghost">
                <Trophy size={18} />
                <span>Global Rankings</span>
              </Link>
            </motion.div>
          </div>

          <motion.div variants={item} className="hero-visual">
            <div className="visual-glow" />
            <div className="glass-panel neon-border status-card">
              <h3 className="card-title">
                <Zap className="text-cyan" />
                SYSTEM STATUS
              </h3>
              <div className="status-rows">
                <StatusRow label="NEURAL NETWORK" value="OPTIMIZED" color="text-green" />
                <StatusRow label="DATABASE SYNC" value="100% SECURE" color="text-cyan" />
                <StatusRow label="CORE UPTIME" value="99.98%" color="text-purple" />
              </div>
              <div className="status-stats">
                <div className="mini-stat">
                  <div className="stat-label">Active Sessions</div>
                  <div className="stat-value">{stats?.totalUsers?.toLocaleString() || "---"}</div>
                </div>
                <div className="mini-stat">
                  <div className="stat-label">Gacha Pulse</div>
                  <div className="stat-value text-cyan">HIGH</div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* --- STATS GRID --- */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="stats-grid"
        >
          <StatBox 
            icon={<Users size={32} />} 
            label="Total Operatives" 
            value={stats?.totalUsers?.toLocaleString() || "10,000+"} 
            color="purple"
          />
          <StatBox 
            icon={<Star size={32} />} 
            label="Characters Deployed" 
            value={stats?.totalCharactersOwned?.toLocaleString() || "1,000,000+"} 
            color="gold"
          />
          <StatBox 
            icon={<Trophy size={32} />} 
            label="Credits Circulating" 
            value={stats?.totalCoinsCirculating?.toLocaleString() || "50,000,000+"} 
            color="cyan"
          />
        </motion.section>

        {/* --- OBJECTIVES --- */}
        <section className="section-spacer">
          <div className="section-header">
            <h2 className="section-title">MISSION <span className="text-cyan">OBJECTIVES</span></h2>
            <div className="header-line" />
          </div>

          <div className="objective-grid">
            <ObjectiveCard 
              title="ROSTER EXPANSION"
              desc="Pull legendary operatives from Genshin Impact, Honkai Star Rail, and beyond. Build the ultimate tactical squad."
              icon={<Target />}
              link="/characters"
              linkText="Access Roster"
            />
            <ObjectiveCard 
              title="DOMINANCE"
              desc="Climb the global Rankings Terminal. Prove your strategic superiority and earn your place among the elite."
              icon={<Trophy />}
              link="/leaderboard"
              linkText="View Rankings"
            />
          </div>
        </section>

        {/* --- CTA --- */}
        <motion.section 
          initial={{ scale: 0.95, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          className="cta-panel glass-panel"
        >
          <div className="cta-content">
            <h2 className="cta-title">Ready for Deployment?</h2>
            <p className="cta-desc">Join the global network of elite gamers. Initialize the bot and start your mission today.</p>
            <a href="#" className="btn-v3 btn-v3-primary cta-btn">
              <span>Invite to Server</span>
              <ArrowRight size={24} />
            </a>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

function StatusRow({ label, value, color }) {
  return (
    <div className="status-row">
      <span className="row-label">{label}</span>
      <span className={color}>{value}</span>
    </div>
  );
}

function StatBox({ icon, label, value, color }) {
  return (
    <div className={`stat-box glass-panel glow-${color}`}>
      <div className={`stat-icon-wrap icon-${color}`}>
        {icon}
      </div>
      <div className="stat-main-value">{value}</div>
      <div className="stat-main-label">{label}</div>
    </div>
  );
}

function ObjectiveCard({ title, desc, icon, link, linkText }) {
  return (
    <div className="objective-card glass-panel">
      <div className="objective-top">
        <div className="objective-icon">
          {icon}
        </div>
        <div className="objective-id">OBJ.01</div>
      </div>
      <h3 className="objective-title">{title}</h3>
      <p className="objective-desc">{desc}</p>
      <Link to={link} className="objective-link">
        <span>{linkText}</span>
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
