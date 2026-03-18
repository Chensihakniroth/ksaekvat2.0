import { Link, NavLink } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">✦</span>
          <span className="brand-name">KsaeKvat</span>
          <span className="brand-tag">Dashboard</span>
        </Link>
        <div className="navbar-links">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Home</NavLink>
          <NavLink to="/leaderboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>🏆 Leaderboard</NavLink>
          <NavLink to="/characters" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>🎭 Characters</NavLink>
        </div>
      </div>
    </nav>
  );
}
