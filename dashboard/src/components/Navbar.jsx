import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Trophy, Users, PawPrint, Menu, X, Search } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import './Navbar.css';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced search
  useEffect(() => {
    const term = search.trim();
    if (term.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const delay = setTimeout(() => {
      fetch(`/api/profile/search?query=${encodeURIComponent(term)}`)
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            setResults(res.data);
            setShowResults(true);
          }
        });
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
    <header className={`nav-v3 ${isScrolled ? 'scrolled' : ''}`}>
      <div className="wrap nav-inner-v3">
        <Link to="/" className="nav-brand-v3" onClick={() => setMobileMenuOpen(false)}>
          <div className="nav-logo-v3">✦</div>
          <span className="nav-name-v3">KsaeKvat</span>
        </Link>

        {/* Global Search */}
        <div className="nav-search-v3" ref={searchRef}>
          <div className="search-input-wrapper">
            <Search className="search-icon-nav" size={16} />
            <input 
              type="text" 
              className="search-field" 
              placeholder="Find player..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => search.length >= 2 && setShowResults(true)}
            />
          </div>

          {showResults && (
            <div className="search-results-v3">
              {results.length === 0 ? (
                <div className="no-res">No players found (ᗒᗣᗕ)</div>
              ) : (
                results.map(r => (
                  <div 
                    key={r.userId} 
                    className="search-result-item" 
                    onClick={() => handleSelect(r.userId)}
                  >
                    <div className="res-avatar">{r.username[0]?.toUpperCase()}</div>
                    <div className="res-info">
                      <span className="res-name">{r.username}</span>
                      <span className="res-meta">Level {r.level} • ID: {r.userId}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Desktop Links */}
        <nav className="nav-links-v3">
          <NavBtn to="/" icon={<LayoutDashboard size={18} />} label="Home" />
          <NavBtn to="/leaderboard" icon={<Trophy size={18} />} label="Leaderboard" />
          <NavBtn to="/characters" icon={<Users size={18} />} label="Characters" />
          <NavBtn to="/zoo" icon={<PawPrint size={18} />} label="Zoo" />
        </nav>

        {/* Mobile Toggle */}
        <button className="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="mobile-menu-v3 glass">
            <NavLink to="/" onClick={() => setMobileMenuOpen(false)} className="mobile-link">Home</NavLink>
            <NavLink to="/leaderboard" onClick={() => setMobileMenuOpen(false)} className="mobile-link">Leaderboard</NavLink>
            <NavLink to="/characters" onClick={() => setMobileMenuOpen(false)} className="mobile-link">Characters</NavLink>
            <NavLink to="/zoo" onClick={() => setMobileMenuOpen(false)} className="mobile-link">Zoo</NavLink>
          </div>
        )}
      </div>
    </header>
  );
}

function NavBtn({ to, icon, label }) {
  return (
    <NavLink to={to} end={to === '/'} className={({isActive}) => `nav-link-v3 ${isActive ? 'active' : ''}`}>
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
