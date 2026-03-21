import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Trophy, Users, PawPrint, Menu, X, Search, Clock, Shield, Activity } from 'lucide-react';
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
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
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
    <header className={`navbar-v3 ${isScrolled ? 'scrolled' : ''}`}>
      <div className="wrap navbar-inner">
        
        {/* --- BRANDING --- */}
        <div className="nav-left">
          <Link to="/" className="navbar-brand" onClick={() => setMobileMenuOpen(false)}>
            <div className="brand-logo-v3">
              <div className="logo-pulse" />
              ✦
            </div>
            <div className="brand-info">
              <span className="brand-name">KSAEKVAT</span>
              <span className="brand-status"><Activity size={8} /> SYSTEM_ONLINE</span>
            </div>
          </Link>
        </div>

        {/* --- DESKTOP NAV --- */}
        <nav className="desktop-nav-v3">
          <NavBtn to="/" icon={<LayoutDashboard size={16} />} label="Mission" />
          <NavBtn to="/leaderboard" icon={<Trophy size={16} />} label="Rankings" />
          <NavBtn to="/characters" icon={<Users size={16} />} label="Arsenal" />
          <NavBtn to="/zoo" icon={<PawPrint size={16} />} label="Bio-Data" />
        </nav>

        {/* --- ACTIONS & SEARCH --- */}
        <div className="nav-right">
          <div className="navbar-search-v3" ref={searchRef}>
            <div className={`search-box-v4 ${search.length > 0 ? 'active' : ''}`}>
              <Search className="search-icon-v4" size={14} />
              <input 
                type="text" 
                className="search-input-v4" 
                placeholder="Find Operative..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                onFocus={() => search.length >= 2 && setShowResults(true)} 
              />
            </div>

            <AnimatePresence>
              {showResults && (
                <motion.div initial={{ opacity: 0, y: 15, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="search-results-v4 glass-panel neon-border">
                  <div className="results-header">BIOMETRIC_SCAN_RESULTS</div>
                  <div className="results-list">
                    {results.length === 0 ? (
                      <div className="search-empty">NO_MATCH_FOUND</div>
                    ) : (
                      results.map(r => (
                        <div key={r.userId} className="search-result-v4" onClick={() => handleSelect(r.userId)}>
                          <div className="res-avatar">{r.username[0]}</div>
                          <div className="res-info">
                            <div className="res-name">{r.username}</div>
                            <div className="res-meta">LVL_{r.level} // UID_{r.userId.slice(-6)}</div>
                          </div>
                          <Shield size={12} className="res-icon" />
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="nav-clock glass-panel">
            <Clock size={12} className="text-cyan" />
            <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</span>
          </div>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '8px' }}>
              <Link to="/dashboard" className="nav-dash-link" title="Configuration">
                <Shield size={18} className="text-cyan hover:text-white transition-colors" />
              </Link>
              <img 
                src={user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : '/assets/default-avatar.png'} 
                alt="Profile" 
                style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid rgba(34,211,238,0.5)', cursor: 'pointer' }}
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate(`/profile/${user.id}`);
                }}
              />
              <button 
                onClick={logout} 
                className="nav-logout-btn" 
                style={{ fontSize: '9px', fontWeight: 900, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={login} 
              style={{ fontSize: '10px', fontWeight: 900, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)', padding: '4px 10px', borderRadius: '8px', cursor: 'pointer', marginLeft: '8px' }}
            >
              Authorize
            </button>
          )}

          <button className="mobile-toggle-v3" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* --- MOBILE OVERLAY --- */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mobile-overlay-v3" onClick={() => setMobileMenuOpen(false)}>
              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }} className="mobile-drawer glass-panel" onClick={e => e.stopPropagation()}>
                <div className="drawer-header">COMMAND_MENU</div>
                <div className="mobile-links-v3">
                  <MobileLink to="/" label="Mission Control" icon={<LayoutDashboard/>} onClick={() => setMobileMenuOpen(false)} />
                  <MobileLink to="/leaderboard" label="Rankings Terminal" icon={<Trophy/>} onClick={() => setMobileMenuOpen(false)} />
                  <MobileLink to="/characters" label="Arsenal Database" icon={<Users/>} onClick={() => setMobileMenuOpen(false)} />
                  <MobileLink to="/zoo" label="Bio-Registry" icon={<PawPrint/>} onClick={() => setMobileMenuOpen(false)} />
                </div>
                <div className="drawer-footer">Authorized Personnel Only</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

function NavBtn({ to, icon, label }) {
  return (
    <NavLink to={to} end={to === '/'} className={({isActive}) => `nav-item-v3 ${isActive ? 'active' : ''}`}>
      {({ isActive }) => (
        <>
          <div className="nav-icon-wrap">{icon}</div>
          <span className="nav-label-v3">{label}</span>
          {isActive && <motion.div layoutId="navGlow" className="nav-active-glow" />}
        </>
      )}
    </NavLink>
  );
}

function MobileLink({ to, label, icon, onClick }) {
  return (
    <NavLink to={to} end={to === '/'} className={({isActive}) => `mobile-btn-v3 ${isActive ? 'active' : ''}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
