import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

function StatCard({ value, label, icon, color }) {
  return (
    <div className="card stat-item fade-in" style={{ '--accent': color }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value" style={{ color }}>{value?.toLocaleString() ?? '...'}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState(null);
  const [top3, setTop3] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/stats').then(r => r.json()),
      fetch('/api/leaderboard?sort=balance&limit=3').then(r => r.json()),
    ]).then(([s, lb]) => {
      if (s.success) setStats(s.data);
      if (lb.success) setTop3(lb.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-glow" />
        <div className="container hero-content">
          <div className="hero-badge">✦ Bot Dashboard v2.0</div>
          <h1>
            <span className="gradient-text">KsaeKvat</span>
            <br />Bot Universe
          </h1>
          <p className="hero-desc">
            Explore your collection, dominate the leaderboard, and discover all 260+ characters from Genshin, HSR, Wuwa & ZZZ.
          </p>
          <div className="hero-actions">
            <Link to="/leaderboard" className="btn btn-primary">🏆 View Leaderboard</Link>
            <Link to="/characters" className="btn btn-ghost">🎭 Character Gallery</Link>
          </div>
        </div>
      </section>

      {/* Live Stats */}
      <section className="section container">
        <h2 className="section-title">📊 Live Server Stats</h2>
        {loading ? <div className="spinner" /> : (
          <div className="grid-3">
            <StatCard icon="👥" value={stats?.totalUsers} label="Total Players" color="var(--accent-purple-light)" />
            <StatCard icon="🐾" value={stats?.totalPokemonCaught} label="Pokémon Caught" color="var(--accent-cyan)" />
            <StatCard icon="🎭" value={stats?.totalCharactersInRegistry} label="Characters Available" color="var(--accent-gold)" />
            <StatCard icon="💎" value={stats?.totalCharactersOwned} label="Characters Owned" color="var(--accent-pink)" />
            <StatCard icon="🪙" value={stats?.totalCoinsCirculating} label="Coins in Circulation" color="#34d399" />
          </div>
        )}
      </section>

      {/* Top 3 Players */}
      {top3.length > 0 && (
        <section className="section container">
          <h2 className="section-title">👑 Top Players</h2>
          <div className="podium">
            {top3.map((user, i) => (
              <Link to={`/profile/${user.userId}`} key={user.userId} className={`podium-card card rank-${i + 1}`}>
                <div className="podium-rank">{['🥇', '🥈', '🥉'][i]}</div>
                <div className="podium-name">{user.username}</div>
                <div className="podium-stat">🪙 {user.balance.toLocaleString()}</div>
                <div className="podium-stat secondary">Lv.{user.level} · {user.characterCount} chars</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Quick links */}
      <section className="section container">
        <div className="quick-links">
          <Link to="/leaderboard" className="ql-card card">
            <div className="ql-icon">🏆</div>
            <div className="ql-title">Leaderboard</div>
            <div className="ql-sub">See the richest & strongest players</div>
          </Link>
          <Link to="/characters" className="ql-card card">
            <div className="ql-icon">🎭</div>
            <div className="ql-title">Character Gallery</div>
            <div className="ql-sub">Browse all 260+ characters</div>
          </Link>
        </div>
      </section>
    </div>
  );
}
