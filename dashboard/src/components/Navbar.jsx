import { Link, NavLink } from 'react-router-dom';
import { LayoutDashboard, Trophy, Users, PawPrint, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import './Navbar.css';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`nav-v3 ${isScrolled ? 'scrolled' : ''}`}>
      <div className="wrap nav-inner-v3">
        <Link to="/" className="nav-brand-v3" onClick={() => setMobileMenuOpen(false)}>
          <div className="nav-logo-v3">✦</div>
          <span className="nav-name-v3">KsaeKvat</span>
        </Link>

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
