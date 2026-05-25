import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Search, LogOut } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [currentTime, setCurrentClock] = useState(new Date());

  const { user, login, logout } = useAuth();

  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    const timer = setInterval(() => setCurrentClock(new Date()), 1000);

    window.addEventListener('scroll', handleScroll);
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
    };
    window.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousedown', handleClickOutside);
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const term = search.trim();
    if (term.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const delay = setTimeout(() => {
      fetch(`/api/profile/search?query=${encodeURIComponent(term)}`)
        .then((r) => r.json())
        .then((res) => {
          if (res.success) {
            setResults(res.data);
            setShowResults(true);
          }
        })
        .catch((err) => console.error('[Search] Fetch failed:', err));
    }, 300);
    return () => clearTimeout(delay);
  }, [search]);

  const handleSelect = (userId) => {
    setSearch('');
    setShowResults(false);
    setMobileMenuOpen(false);
    navigate(`/profile/${userId}`);
  };

  return (
    <header className={`zen-nav-wrap ${isScrolled ? 'scrolled' : ''}`}>
      <div className="zen-nav-inner wrap">
        {/* --- BRANDING --- */}
        <div className="nav-left">
          <Link to="/" className="zen-brand" onClick={() => setMobileMenuOpen(false)}>
            <div className="zen-logo-mark">✦</div>
            <span className="zen-brand-name">KSAEKVAT</span>
          </Link>
        </div>

        {/* --- CENTERED NAV --- */}
        <nav className="zen-desktop-nav">
          <NavBtn to="/" label="HOME" />
          <NavBtn to="/leaderboard" label="RANK" />
          <NavBtn to="/shop" label="SHOP" />
        </nav>

        {/* --- RIGHT ACTIONS --- */}
        <div className="nav-right">
          <div className="zen-clock">
            {currentTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })}
          </div>

          {user ? (
            <div className="zen-user-section">
              <button onClick={() => navigate('/dashboard')} className="zen-action-btn">
                EDIT
              </button>
              <div
                className="zen-avatar-wrap"
                onClick={() => navigate(`/profile/${user.slug || user.username}`)}
              >
                <img
                  src={
                    user.avatar
                      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
                      : '/assets/default-avatar.png'
                  }
                  alt=""
                />
              </div>
              <button onClick={logout} className="zen-logout-btn" title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={login} className="zen-login-btn">
              LOGIN
            </button>
          )}

          <button className="zen-mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* --- MOBILE DRAWER --- */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="zen-mobile-overlay"
              onClick={() => setMobileMenuOpen(false)}
            >
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="zen-mobile-menu"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="zen-mobile-links">
                  <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                    HOME
                  </Link>
                  <Link to="/leaderboard" onClick={() => setMobileMenuOpen(false)}>
                    RANK
                  </Link>
                  <Link to="/shop" onClick={() => setMobileMenuOpen(false)}>
                    SHOP
                  </Link>
                  {user ? (
                    <>
                      <Link
                        to={`/profile/${user.username}`}
                        onClick={() => setMobileMenuOpen(false)}
                        style={{ color: 'rgba(255,255,255,0.7)' }}
                      >
                        PROFILE
                      </Link>
                      <Link
                        to="/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        style={{ color: 'rgba(255,255,255,0.6)' }}
                      >
                        EDIT PROFILE
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setMobileMenuOpen(false);
                        }}
                        className="zen-mobile-logout"
                      >
                        LOGOUT
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        login();
                        setMobileMenuOpen(false);
                      }}
                      className="zen-mobile-login"
                    >
                      LOGIN
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .zen-nav-wrap {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 85px;
          z-index: 1000;
          display: flex;
          align-items: center;
          background: transparent;
          border-bottom: 1px solid transparent;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: 'Outfit', sans-serif;
        }
        .zen-nav-wrap.scrolled {
          height: 68px;
          background: rgba(11, 11, 12, 0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .zen-nav-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 48px;
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .zen-logo-mark {
          width: 28px;
          height: 28px;
          background: #fff;
          color: #0b0b0c;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justifyContent: center;
          font-weight: 900;
          font-size: 1.1rem;
          flex-shrink: 0;
        }
        .zen-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }
        .zen-brand-name {
          font-weight: 900;
          font-size: 1.1rem;
          letter-spacing: -0.02em;
          color: #fff;
        }

        .zen-desktop-nav {
          display: flex;
          gap: 36px;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }
        .zen-nav-item { 
          font-size: 0.75rem;
          font-weight: 700;
          color: rgba(255,255,255,0.45); 
          letter-spacing: 0.15em;
          position: relative;
          transition: color 0.3s;
          text-decoration: none;
          padding: 8px 0;
        }
        .zen-nav-item:hover, .zen-nav-item.active {
          color: #fff;
        }

        .zen-clock {
          font-size: 0.75rem;
          font-weight: 400;
          color: rgba(255,255,255,0.4);
          letter-spacing: 0.05em;
        }
        .nav-right {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .zen-user-section {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .zen-action-btn {
          background: none;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          color: rgba(255,255,255,0.7);
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.2s;
          padding: 6px 14px;
        }
        .zen-action-btn:hover {
          color: #fff;
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.25);
        }
        
        .zen-avatar-wrap { 
          width: 32px;
          height: 32px;
          border-radius: 50%;
          overflow: hidden; 
          border: 1px solid rgba(255,255,255,0.15);
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .zen-avatar-wrap:hover {
          transform: scale(1.05);
          border-color: #fff;
        }
        .zen-avatar-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .zen-logout-btn { 
          opacity: 0.4;
          color: rgba(255,255,255,0.6);
          transition: opacity 0.2s;
          background: none;
          border: none;
          padding: 5px;
          cursor: pointer; 
        }
        .zen-logout-btn:hover {
          opacity: 1;
          color: #ff3b5c;
        }

        .zen-login-btn {
          padding: 8px 20px;
          background: #fff;
          color: #0b0b0c;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          border: none;
          transition: all 0.2s;
          cursor: pointer;
        }
        .zen-login-btn:hover {
          background: rgba(255,255,255,0.9);
          transform: translateY(-1px);
        }

        .zen-mobile-toggle { 
          display: none;
          background: none;
          border: none;
          color: #fff;
          padding: 5px;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        .zen-mobile-toggle:hover {
          opacity: 1;
        }

        .zen-mobile-overlay {
          position: fixed;
          inset: 0;
          background: rgba(11,11,12,0.95);
          backdrop-filter: blur(20px);
          z-index: 999;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .zen-mobile-menu {
          text-align: center;
          width: 100%;
        }
        .zen-mobile-links {
          display: flex;
          flex-direction: column;
          gap: 28px;
          align-items: center;
        }
        .zen-mobile-links a {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #fff;
          opacity: 0.5;
          transition: all 0.3s;
          text-decoration: none;
        }
        .zen-mobile-links a:hover {
          opacity: 1;
        }
        .zen-mobile-logout {
          background: none;
          border: none;
          font-size: 1.3rem;
          font-weight: 700;
          letter-spacing: 0.1em; 
          opacity: 0.6;
          color: #ff3b5c;
          cursor: pointer;
          margin-top: 15px;
          transition: all 0.3s;
        }
        .zen-mobile-logout:hover {
          opacity: 1;
        }
        .zen-mobile-login {
          background: #fff;
          color: #0b0b0c;
          border: none;
          padding: 12px 36px;
          border-radius: 6px;
          font-size: 1.1rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          cursor: pointer;
          margin-top: 15px;
          transition: all 0.3s;
        }

        @media (max-width: 1100px) {
          .zen-desktop-nav { display: none; }
          .zen-mobile-toggle { display: block; }
          .zen-clock { display: none; }
          .zen-nav-inner { padding: 0 24px; }
          .zen-action-btn { display: none; }
        }

        @media (max-width: 600px) {
          .zen-brand-name { display: none; }
          .zen-nav-wrap { height: 70px; }
          .zen-nav-wrap.scrolled { height: 60px; }
          .zen-nav-inner { padding: 0 16px; }
          .nav-right { gap: 16px; }
        }
      `}</style>
    </header>
  );
}

function NavBtn({ to, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) => `zen-nav-item ${isActive ? 'active' : ''}`}
    >
      {({ isActive }) => (
        <>
          <span>{label}</span>
          {isActive && (
            <motion.div
              layoutId="navDot"
              style={{
                position: 'absolute',
                bottom: '-15px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '4px',
                height: '4px',
                background: '#fff',
                borderRadius: '50%',
              }}
            />
          )}
        </>
      )}
    </NavLink>
  );
}
