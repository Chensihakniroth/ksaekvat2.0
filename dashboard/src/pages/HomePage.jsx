import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Users, Star, ArrowRight, Gamepad2, Sparkles, ChevronRight } from 'lucide-react';
import './HomePage.css'; // Make sure we are importing the newly styled CSS

export default function HomePage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(res => {
        if (res.success) setStats(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="home-page">
      {/* --- HERO SECTION --- */}
      <section className="hero-section">
        <div className="hero-glow" />
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <Sparkles size={16} />
              <span>KSAEKVAT V3.0 ONLINE</span>
            </div>
            
            <h1 className="hero-title">
              Your Ultimate <br/>
              <span className="text-gradient">Gaming Companion</span>
            </h1>
            
            <p className="hero-subtitle">
              Collect 260+ characters, battle players worldwide, and rise to the top of the global leaderboards. The ultimate gacha experience on Discord.
            </p>
            
            <div className="hero-actions">
              <Link to="/characters" className="btn btn-primary">
                <Gamepad2 size={24} />
                <span>Start Collecting</span>
              </Link>
              <Link to="/leaderboard" className="btn btn-secondary">
                <Trophy size={24} />
                <span>View Leaderboard</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- STATS SECTION --- */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="glass-card stat-card">
              <div className="stat-icon-wrapper purple">
                <Users size={40} />
              </div>
              <div className="stat-value">{stats?.totalUsers?.toLocaleString() || "10k+"}</div>
              <div className="stat-label">Active Players</div>
            </div>
            
            <div className="glass-card stat-card">
              <div className="stat-icon-wrapper gold">
                <Star size={40} />
              </div>
              <div className="stat-value">{stats?.totalCharactersOwned?.toLocaleString() || "1M+"}</div>
              <div className="stat-label">Characters Collected</div>
            </div>
            
            <div className="glass-card stat-card">
              <div className="stat-icon-wrapper cyan">
                <Trophy size={40} />
              </div>
              <div className="stat-value">{stats?.totalCoinsCirculating?.toLocaleString() || "50M+"}</div>
              <div className="stat-label">Economy Value</div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section className="features-section">
        <div className="container">
          <div className="feature-block">
            <div className="feature-content">
              <h2 className="feature-title">Build Your Dream Team</h2>
              <p className="feature-desc">
                From Genshin Impact to Honkai Star Rail. Pull your favorite 5-star characters, build your roster, and show off your legendary collection. Experience smooth gameplay with high-quality visual designs.
              </p>
              <Link to="/characters" className="feature-link">
                <span>Explore The Roster</span>
                <ArrowRight size={24} />
              </Link>
            </div>
            
            <div className="feature-visual">
              <div className="visual-card">
                <div className="visual-avatar">✨</div>
                <div className="visual-info">
                  <h4>Legendary Pull</h4>
                  <p>Ultra Rare Drop</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="cta-section">
        <div className="container">
          <div className="glass-card cta-content">
            <h2 className="cta-title">Ready to Dominate?</h2>
            <p className="cta-desc">Join thousands of players right now. It's completely free to play, highly rewarding, and insanely addictive.</p>
            <a href="#" className="btn btn-primary btn-large">
              <span>Invite Bot to Discord</span>
              <ChevronRight size={24} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
