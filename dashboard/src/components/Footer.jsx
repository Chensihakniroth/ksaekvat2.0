import { Github, Twitter, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer-v4" style={{ position: 'relative', overflow: 'hidden', padding: '100px 0 40px', background: 'transparent' }}>
      {/* Sharp neon top line instead of blurry glow */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, var(--cyber-cyan), transparent)', opacity: 0.5 }} />

      <div className="wrap">
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '60px', marginBottom: '80px' }}>
          
          <div className="footer-brand">
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
              <div style={{ width: '32px', height: '32px', background: 'var(--cyber-yellow)', color: '#000', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem' }}>✦</div>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.05em', color: '#fff', textShadow: '0 0 10px rgba(255,255,255,0.2)' }}>KSAEKVAT</span>
            </Link>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '280px', marginBottom: '30px' }}>
              The infinite resonance ecosystem. High-performance digital assets and strategic combat.
            </p>
            <div style={{ display: 'flex', gap: '20px' }}>
              <SocialBtn icon={<MessageSquare size={16} />} href="#" />
              <SocialBtn icon={<Twitter size={16} />} href="#" />
              <SocialBtn icon={<Github size={16} />} href="#" />
            </div>
          </div>

          <FooterNav title="ARCHIVES" links={[
            { label: 'HOME', to: '/' },
            { label: 'RANK', to: '/leaderboard' },
            { label: 'SHOP', to: '/shop' }
          ]} />
          
          <FooterNav title="PROTOCOLS" links={[
            { label: 'WHITEPAPER', to: '#' },
            { label: 'NEURAL LINK', to: '#' },
            { label: 'SUPPORT', to: '#' }
          ]} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h4 style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.3em', opacity: 0.3, textTransform: 'uppercase' }}>SYSTEM STATUS</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', borderRadius: '8px', background: 'rgba(5, 255, 161, 0.05)', border: '1px solid rgba(5, 255, 161, 0.2)' }}>
              {/* Solid color instead of blur for status indicator */}
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--cyber-green)' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.1em', color: 'var(--cyber-green)' }}>ONLINE</span>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.2em', opacity: 0.3 }}>
            © {currentYear} THE INFINITE ARCHIVE.
          </div>
          <div style={{ display: 'flex', gap: '30px', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.2em' }}>
            <a href="#" style={{ opacity: 0.4, transition: '0.3s' }}>PRIVACY</a>
            <a href="#" style={{ opacity: 0.4, transition: '0.3s' }}>TERMS</a>
            <span style={{ color: 'var(--cyber-cyan)' }}>V_4.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialBtn({ icon, href }) {
  return (
    <motion.a 
      whileHover={{ y: -3, color: 'var(--cyber-cyan)' }} 
      href={href} 
      style={{ color: 'var(--text-dim)', transition: '0.3s', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      {icon}
    </motion.a>
  );
}

function FooterNav({ title, links }) {
  return (
    <div>
      <h4 style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.3em', opacity: 0.3, textTransform: 'uppercase', marginBottom: '30px' }}>{title}</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {links.map(l => (
          <Link 
            key={l.label} 
            to={l.to} 
            style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-dim)', transition: '0.2s' }}
            onMouseEnter={e => e.target.style.color = 'var(--cyber-cyan)'}
            onMouseLeave={e => e.target.style.color = 'var(--text-dim)'}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
