import { Github, Twitter, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="footer-v4"
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '100px 0 40px',
        background: 'transparent',
      }}
    >
      {/* Flat matte top border */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'rgba(255,255,255,0.06)',
        }}
      />

      <div className="wrap">
        <div
          className="footer-grid-matte"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
            gap: '60px',
            marginBottom: '80px',
          }}
        >
          <div className="footer-brand">
            <Link
              to="/"
              style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  background: '#fff',
                  color: '#000',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '1.2rem',
                }}
              >
                ✦
              </div>
              <span
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 900,
                  letterSpacing: '-0.05em',
                  color: '#fff',
                }}
              >
                KSAEKVAT
              </span>
            </Link>
            <p
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                maxWidth: '280px',
                marginBottom: '30px',
              }}
            >
              The infinite resonance ecosystem. High-performance digital assets and strategic
              combat.
            </p>
            <div style={{ display: 'flex', gap: '20px' }}>
              <SocialBtn icon={<MessageSquare size={16} />} href="#" />
              <SocialBtn icon={<Twitter size={16} />} href="#" />
              <SocialBtn icon={<Github size={16} />} href="#" />
            </div>
          </div>

          <FooterNav
            title="ARCHIVES"
            links={[
              { label: 'HOME', to: '/' },
              { label: 'RANK', to: '/leaderboard' },
              { label: 'SHOP', to: '/shop' },
            ]}
          />

          <FooterNav
            title="PROTOCOLS"
            links={[
              { label: 'WHITEPAPER', to: '#' },
              { label: 'NEURAL LINK', to: '#' },
              { label: 'SUPPORT', to: '#' },
            ]}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h4
              style={{
                fontSize: '0.65rem',
                fontWeight: 900,
                letterSpacing: '0.3em',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
              }}
            >
              SYSTEM STATUS
            </h4>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 15px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-matte)',
              }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#4ade80',
                }}
              />
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  letterSpacing: '0.1em',
                  color: '#4ade80',
                }}
              >
                ONLINE
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: '40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.2em', color: 'var(--text-muted)' }}
          >
            © {currentYear} THE INFINITE ARCHIVE.
          </div>
          <div
            style={{
              display: 'flex',
              gap: '30px',
              fontSize: '0.65rem',
              fontWeight: 900,
              letterSpacing: '0.2em',
            }}
          >
            <a href="#" style={{ color: 'var(--text-muted)', transition: '0.3s' }}>
              PRIVACY
            </a>
            <a href="#" style={{ color: 'var(--text-muted)', transition: '0.3s' }}>
              TERMS
            </a>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>V_4.0</span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-grid-matte {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
        }
      `}</style>
    </footer>
  );
}

function SocialBtn({ icon, href }) {
  return (
    <motion.a
      whileHover={{ y: -2 }}
      href={href}
      style={{
        color: 'var(--text-muted)',
        transition: '0.3s',
        padding: '10px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {icon}
    </motion.a>
  );
}

function FooterNav({ title, links }) {
  return (
    <div>
      <h4
        style={{
          fontSize: '0.65rem',
          fontWeight: 900,
          letterSpacing: '0.3em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          marginBottom: '30px',
        }}
      >
        {title}
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {links.map((l) => (
          <Link
            key={l.label}
            to={l.to}
            style={{
              fontSize: '0.8rem',
              fontWeight: 800,
              letterSpacing: '0.1em',
              color: 'var(--text-muted)',
              transition: '0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.color = '#fff')}
            onMouseLeave={(e) => (e.target.style.color = 'var(--text-muted)')}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
