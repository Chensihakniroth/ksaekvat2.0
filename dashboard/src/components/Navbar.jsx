import { Link, NavLink, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <Link to="/" className="nav-brand">
          <span className="nav-logo">✦</span>
          <span className="nav-name">KsaeKvat</span>
          <span className="nav-pill">Dashboard</span>
        </Link>
        <nav className="nav-links">
          <NavLink to="/" end className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')}>Home</NavLink>
          <NavLink to="/leaderboard" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')}>Leaderboard</NavLink>
          <NavLink to="/characters" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')}>Characters</NavLink>
        </nav>
      </div>
    </header>
  );
}
