import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function StatCard({ icon, value, label, color }) {
  return (
    <div className="card card-p stat-card fade">
      <div className="stat-icon">{icon}</div>
      <div className="stat-val" style={{ color }}>{value?.toLocaleString() ?? '—'}</div>
      <div className="stat-lbl">{label}</div>
    </div>
  );
}

function TopPlayer({ user, rank }) {
  const medals = ['🥇','🥈','🥉'];
  return (
    <Link to={`/profile/${user.userId}`} className="card card-p top-player fade">
      <div className="tp-medal">{medals[rank]}</div>
      <div className="tp-name">{user.username}</div>
      <div className="tp-balance">🪙 {user.balance.toLocaleString()}</div>
      <div className="tp-meta">Lv.{user.level} &nbsp;·&nbsp; {user.characterCount} chars</div>
    </Link>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState(null);
  const [top3, setTop3] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/stats').then(r => r.json()),
      fetch('/api/leaderboard?sort=balance&limit=3').then(r => r.json()),
    ]).then(([s, lb]) => {
      if (s.success) setStats(s.data);
      else setErr('Could not reach the API.');
      if (lb.success) setTop3(lb.data);
      setLoading(false);
    }).catch(() => { setErr('Could not reach the API. Is the bot online?'); setLoading(false); });
  }, []);

  return (
    <div className="page">
      {/* Hero */}
      <div className="hero-wrap">
        <div className="hero-glow" />
        <div className="wrap">
          <div className="hero-badge fade">✦ Bot Dashboard v2.0</div>
          <h1 className="hero-title fade">
            Welcome to<br /><span className="grad">KsaeKvat</span>
          </h1>
          <p className="hero-sub fade">
            Browse the global leaderboard, explore 260+ characters, and look up any player's profile.
          </p>
          <div className="hero-btns fade">
            <Link to="/leaderboard" className="btn btn-primary">🏆 Leaderboard</Link>
            <Link to="/characters" className="btn btn-tab">🎭 Characters</Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="wrap">
        <p className="section-label">Live Server Stats</p>
        {err && <div className="api-err">⚠️ {err}</div>}
        {loading ? <div className="spinner" /> : (
          <div className="g3">
            <StatCard icon="👥" value={stats?.totalUsers} label="Total Players" color="var(--purple-light)" />
            <StatCard icon="🐾" value={stats?.totalPokemonCaught} label="Pokémon Caught" color="var(--cyan)" />
            <StatCard icon="🎭" value={stats?.totalCharactersInRegistry} label="Characters in Registry" color="var(--gold)" />
            <StatCard icon="💎" value={stats?.totalCharactersOwned} label="Characters Owned" color="var(--pink)" />
            <StatCard icon="🪙" value={stats?.totalCoinsCirculating} label="Coins Circulating" color="var(--green)" />
          </div>
        )}

        {/* Top 3 */}
        {top3.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <p className="section-label">Top Players — Richest</p>
            <div className="g3">
              {top3.map((u, i) => <TopPlayer key={u.userId} user={u} rank={i} />)}
            </div>
          </div>
        )}

        {/* Quick nav */}
        <div style={{ marginTop: 48 }}>
          <p className="section-label">Explore</p>
          <div className="g3">
            <Link to="/leaderboard" className="card card-p ql-card fade">
              <div className="ql-icon">🏆</div>
              <div className="ql-t">Leaderboard</div>
              <div className="ql-s">Top players by balance, level & collection</div>
            </Link>
            <Link to="/characters" className="card card-p ql-card fade">
              <div className="ql-icon">🎭</div>
              <div className="ql-t">Character Gallery</div>
              <div className="ql-s">All 260+ characters — filter by game & rarity</div>
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .hero-wrap { position:relative; padding:88px 0 72px; overflow:hidden; }
        .hero-glow { position:absolute;top:-160px;left:50%;transform:translateX(-50%);width:700px;height:500px;background:radial-gradient(circle,rgba(139,92,246,.18) 0%,transparent 70%);pointer-events:none;}
        .hero-badge{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--purple-light);background:var(--purple-dim);border:1px solid var(--border-accent);padding:5px 14px;border-radius:100px;margin-bottom:20px;}
        .hero-title{font-size:clamp(36px,6vw,68px);font-weight:900;letter-spacing:-.03em;line-height:1.08;margin-bottom:18px;}
        .hero-sub{color:var(--text-2);font-size:16px;line-height:1.6;max-width:500px;margin-bottom:28px;}
        .hero-btns{display:flex;gap:10px;flex-wrap:wrap;}
        .api-err{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);color:#f87171;padding:12px 16px;border-radius:var(--radius-s);font-size:13px;margin-bottom:20px;}
        .top-player{display:block;text-align:center;transition:transform .18s;}
        .top-player:hover{transform:translateY(-3px);}
        .tp-medal{font-size:32px;margin-bottom:10px;}
        .tp-name{font-size:15px;font-weight:700;margin-bottom:6px;}
        .tp-balance{font-size:14px;color:var(--gold);font-weight:600;margin-bottom:4px;}
        .tp-meta{font-size:12px;color:var(--text-3);}
        .ql-card{display:block;transition:transform .18s;}
        .ql-card:hover{transform:translateY(-3px);}
        .ql-icon{font-size:32px;margin-bottom:14px;}
        .ql-t{font-size:16px;font-weight:700;margin-bottom:6px;}
        .ql-s{color:var(--text-3);font-size:13px;line-height:1.5;}
        .wrap > .section-label{margin-top:52px;}
        .wrap > .g3{margin-top:0;}
      `}</style>
    </div>
  );
}
