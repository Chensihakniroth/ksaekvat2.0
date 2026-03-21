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
    const handleClickOutside = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false); };
    window.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousedown', handleClickOutside);
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const term = search.trim();
    if (term.length < 2) { setResults([]); setShowResults(false); return; }
    
    const delay = setTimeout(() => {
      fetch(`/api/profile/search?query=${encodeURIComponent(term)}`).then(r => r.json()).then(res => {
        if (res.success) {
          setResults(res.data); setShowResults(true);
        }
      }).catch(err => console.error('[Search] Fetch failed:', err));
    }, 300);
    return () => clearTimeout(delay);
  }, [search]);

  const handleSelect = (userId) => {
    setSearch(''); setShowResults(false); setMobileMenuOpen(false);
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
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </div>

          {user ? (
            <div className="zen-user-section">
              <button onClick={() => navigate('/dashboard')} className="zen-action-btn">
                EDIT
              </button>
              <div className="zen-avatar-wrap" onClick={() => navigate(`/profile/${user.id}`)}>
                <img src={user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : '/assets/default-avatar.png'} alt="" />
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="zen-mobile-overlay" onClick={() => setMobileMenuOpen(false)}>
              <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="zen-mobile-menu" onClick={e => e.stopPropagation()}>
                <div className="zen-mobile-links">
                  <Link to="/" onClick={() => setMobileMenuOpen(false)}>HOME</Link>
                  <Link to="/leaderboard" onClick={() => setMobileMenuOpen(false)}>RANK</Link>
                  <Link to="/shop" onClick={() => setMobileMenuOpen(false)}>SHOP</Link>
                  {user ? (
                    <>
                      <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--cyber-yellow)' }}>EDIT PROFILE</Link>
                      <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="zen-mobile-logout">LOGOUT</button>
                    </>
                  ) : (
                    <button onClick={() => { login(); setMobileMenuOpen(false); }} className="zen-mobile-login">LOGIN</button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .zen-nav-wrap {
          position: fixed; top: 0; left: 0; right: 0; height: 100px; z-index: 1000;
          display: flex; align-items: center; transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: 'Outfit', sans-serif;
        }
        .zen-nav-wrap.scrolled {
          height: 80px;
        }
        .zen-nav-inner {
          display: flex; justify-content: space-between; align-items: center;
          padding: 0 40px; transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          width: 100%;
        }
        .zen-nav-wrap.scrolled .zen-nav-inner {
          background: rgba(10, 10, 10, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 50px;
          margin-top: 15px;
          height: 60px;
          width: calc(100% - 40px);
          max-width: 1200px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          padding: 0 25px;
        }

        .zen-logo-mark {
          width: 32px; height: 32px; background: var(--cyber-yellow); color: #000;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-weight: 900; font-size: 1.2rem; box-shadow: 0 0 15px rgba(252, 238, 10, 0.3);
          flex-shrink: 0;
        }
        .zen-brand { display: flex; align-items: center; gap: 12px; text-decoration: none; }
        .zen-brand-name { font-weight: 900; font-size: 1.1rem; letter-spacing: -0.04em; color: #fff; text-shadow: 0 0 10px rgba(255,255,255,0.2); }

        .zen-desktop-nav { display: flex; gap: 40px; position: absolute; left: 50%; transform: translateX(-50%); }
        .zen-nav-item { 
          font-size: 0.75rem; font-weight: 900; color: rgba(255,255,255,0.4); 
          letter-spacing: 0.2em; position: relative; transition: color 0.4s; text-decoration: none;
        }
        .zen-nav-item:hover, .zen-nav-item.active { color: #fff; text-shadow: 0 0 10px rgba(255,255,255,0.5); }

        .zen-search { position: relative; }
        .zen-search-box {
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
          border-radius: 50px; padding: 8px 15px 8px 40px; position: relative; width: 160px;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .zen-search-box:focus-within { width: 220px; border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); }
        .zen-search-icon { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); opacity: 0.3; transition: opacity 0.4s; }
        .zen-search-box:focus-within .zen-search-icon { opacity: 0.8; }
        .zen-search-box input { 
          background: transparent; border: none; outline: none; color: #fff; 
          font-size: 0.75rem; font-weight: 600; width: 100%; letter-spacing: 0.05em;
        }
        .zen-search-box input::placeholder { color: rgba(255,255,255,0.2); }

        .zen-search-results {
          position: absolute; top: 55px; right: 0; width: 280px;
          background: rgba(15, 15, 15, 0.95); backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 20px;
          padding: 8px; z-index: 100; box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }
        .zen-res-item {
          display: flex; align-items: center; gap: 12px; padding: 10px;
          border-radius: 12px; transition: 0.3s; cursor: pointer;
        }
        .zen-res-item:hover { background: rgba(255,255,255,0.03); }
        .zen-res-avatar { 
          width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.05); 
          display: flex; align-items: center; justify-content: center; font-size: 0.8rem;
          color: #fff; font-weight: bold;
        }
        .zen-res-info { display: flex; flex-direction: column; }
        .zen-res-name { font-weight: 800; font-size: 0.85rem; color: #fff; }
        .zen-res-lvl { font-size: 0.65rem; opacity: 0.4; font-weight: 900; letter-spacing: 0.1em; }
        .zen-empty { padding: 15px; font-size: 0.75rem; color: rgba(255,255,255,0.3); text-align: center; font-weight: 800; letter-spacing: 0.1em; }

        .zen-clock { font-size: 0.75rem; font-weight: 300; opacity: 0.4; letter-spacing: 0.1em; }
        .nav-right { display: flex; align-items: center; gap: 20px; }

        .zen-user-section { display: flex; align-items: center; gap: 12px; }
        .zen-action-btn {
          background: none; border: none; color: rgba(255,255,255,0.4);
          font-size: 0.65rem; font-weight: 900; letter-spacing: 0.15em;
          cursor: pointer; transition: color 0.3s; padding: 4px 8px;
        }
        .zen-action-btn:hover { color: #fff; text-shadow: 0 0 10px rgba(255,255,255,0.3); }
        
        .zen-avatar-wrap { 
          width: 34px; height: 34px; border-radius: 50%; overflow: hidden; 
          border: 1px solid rgba(255,255,255,0.1); cursor: pointer; transition: 0.4s;
          flex-shrink: 0;
        }
        .zen-avatar-wrap:hover { transform: scale(1.1); border-color: var(--cyber-cyan); box-shadow: 0 0 15px rgba(0,243,255,0.2); }
        .zen-avatar-wrap img { width: 100%; height: 100%; object-fit: cover; }
        
        .zen-logout-btn { 
          opacity: 0.3; color: var(--cyber-pink); transition: 0.3s; background: none; border: none; padding: 5px; cursor: pointer; 
        }
        .zen-logout-btn:hover { opacity: 1; transform: scale(1.1); }

        .zen-login-btn {
          padding: 10px 24px; background: #fff; color: #000; border-radius: 50px;
          font-size: 0.7rem; font-weight: 900; letter-spacing: 0.15em; border: none;
          transition: 0.4s; cursor: pointer;
        }
        .zen-login-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(255,255,255,0.15); }

        .zen-mobile-toggle { 
          display: none; background: none; border: none; color: #fff; padding: 5px; cursor: pointer;
          opacity: 0.6; transition: 0.3s;
        }
        .zen-mobile-toggle:hover { opacity: 1; }

        .zen-mobile-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(20px);
          z-index: 999; display: flex; align-items: center; justify-content: center;
        }
        .zen-mobile-menu { text-align: center; width: 100%; }
        .zen-mobile-links { display: flex; flex-direction: column; gap: 30px; align-items: center; }
        .zen-mobile-links a { font-size: 1.8rem; font-weight: 900; letter-spacing: 0.15em; color: #fff; opacity: 0.4; transition: 0.4s; text-decoration: none; }
        .zen-mobile-links a:hover { opacity: 1; letter-spacing: 0.25em; text-shadow: 0 0 20px rgba(255,255,255,0.3); }
        .zen-mobile-logout {
          background: none; border: none; font-size: 1.5rem; font-weight: 900; letter-spacing: 0.15em; 
          opacity: 0.5; color: var(--cyber-pink); cursor: pointer; margin-top: 20px; transition: 0.4s;
        }
        .zen-mobile-logout:hover { opacity: 1; letter-spacing: 0.2em; text-shadow: 0 0 20px rgba(255,0,60,0.3); }
        .zen-mobile-login {
          background: #fff; color: #000; border: none; padding: 15px 40px; border-radius: 50px;
          font-size: 1.2rem; font-weight: 900; letter-spacing: 0.15em; cursor: pointer; margin-top: 20px; transition: 0.4s;
        }

        @media (max-width: 1100px) {
          .zen-desktop-nav { display: none; }
          .zen-mobile-toggle { display: block; }
          .zen-clock { display: none; }
          .zen-nav-inner { padding: 0 25px; }
          .zen-action-btn { display: none; }
        }

        @media (max-width: 600px) {
          .zen-brand-name { display: none; }
          .zen-search { display: none; }
          .zen-nav-wrap.scrolled .zen-nav-inner {
             width: calc(100% - 20px);
             margin-top: 10px;
             padding: 0 15px;
          }
          .nav-right { gap: 15px; }
        }
      `}</style>
    </header>
  );
}

function NavBtn({ to, label }) {
  return (
    <NavLink to={to} end={to === '/'} className={({isActive}) => `zen-nav-item ${isActive ? 'active' : ''}`}>
      {({ isActive }) => (
        <>
          <span>{label}</span>
          {isActive && (
            <motion.div 
              layoutId="navDot" 
              style={{ 
                position: 'absolute', bottom: '-15px', left: '50%', 
                transform: 'translateX(-50%)', width: '4px', height: '4px', 
                background: '#fff', borderRadius: '50%', boxShadow: '0 0 10px #fff'
              }} 
            />
          )}
        </>
      )}
    </NavLink>
  );
}

