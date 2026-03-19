import { Github, Twitter, MessageSquare, Terminal, Heart, Cpu, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import GlobalTicker from './GlobalTicker';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer-v3 glass-panel">
      <GlobalTicker />
      <div className="wrap footer-grid">
        {/* --- BRANDING --- */}
        <div className="footer-brand">
          <Link to="/" className="brand-wrap">
            <div className="footer-logo">✦</div>
            <span className="footer-name">KsaeKvat</span>
          </Link>
          <p className="footer-tagline">
            High-performance Discord utility designed for elite collectors and strategic competitors.
          </p>
          <div className="footer-socials">
            <SocialBtn icon={<MessageSquare size={18} />} href="#" />
            <SocialBtn icon={<Twitter size={18} />} href="#" />
            <SocialBtn icon={<Github size={18} />} href="#" />
          </div>
        </div>

        {/* --- LINKS --- */}
        <div className="footer-links-grid">
          <FooterNav title="Core Systems" links={[
            { label: 'Mission Hub', to: '/' },
            { label: 'Rankings', to: '/leaderboard' },
            { label: 'Roster', to: '/characters' },
            { label: 'Zoo Registry', to: '/zoo' }
          ]} />
          
          <FooterNav title="Resources" links={[
            { label: 'Command Log', to: '#' },
            { label: 'Neural Link', to: '#' },
            { label: 'Protocol Support', to: '#' }
          ]} />
        </div>

        {/* --- STATUS --- */}
        <div className="footer-status-panel glass-panel neon-border">
          <h4 className="status-panel-title">System Integrity</h4>
          <div className="status-items">
            <StatusItem icon={<Cpu size={14} />} label="Core Engine" val="Optimal" color="text-cyan" />
            <StatusItem icon={<ShieldCheck size={14} />} label="Security" val="Verified" color="text-green" />
            <StatusItem icon={<Zap size={14} />} label="Uptime" val="99.9%" color="text-purple" />
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="wrap bottom-inner">
          <div className="copyright">
            © {currentYear} KsaeKvat Terminal. Synthesized with <Heart size={10} className="text-red animate-pulse" /> for operatives worldwide.
          </div>
          <div className="bottom-meta">
            <span className="ver">VER_3.4.0_STABLE</span>
            <span className="sep">|</span>
            <div className="legal-links">
              <a href="#">Privacy_Policy</a>
              <a href="#">Terms_of_Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialBtn({ icon, href }) {
  return (
    <motion.a whileHover={{ y: -3, scale: 1.1 }} href={href} className="social-btn-v3">
      {icon}
    </motion.a>
  );
}

function FooterNav({ title, links }) {
  return (
    <div className="footer-nav">
      <h4 className="nav-title">{title}</h4>
      <div className="nav-links">
        {links.map(l => (
          <Link key={l.label} to={l.to} className="nav-link-item">{l.label}</Link>
        ))}
      </div>
    </div>
  );
}

function StatusItem({ icon, label, val, color }) {
  return (
    <div className="status-item-v3">
      <div className="status-label-wrap">
        {icon}
        <span>{label}</span>
      </div>
      <span className={`status-val ${color}`}>{val}</span>
    </div>
  );
}
