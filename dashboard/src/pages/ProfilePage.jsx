import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './ProfilePage.css';

const GAME_COLORS = {
  genshin: 'badge-genshin',
  hsr: 'badge-hsr',
  wuwa: 'badge-wuwa',
  zzz: 'badge-zzz',
};
const GAME_LABELS = { genshin: 'Genshin', hsr: 'HSR', wuwa: 'Wuwa', zzz: 'ZZZ' };

export default function ProfilePage() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [charFilter, setCharFilter] = useState('all');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/profile/${userId}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) setProfile(res.data);
        else setNotFound(true);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [userId]);

  if (loading) return <div className="spinner" />;
  if (notFound) return (
    <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
      <div style={{ fontSize: 64 }}>😢</div>
      <h2 style={{ marginTop: 16, marginBottom: 8 }}>Player not found</h2>
      <p style={{ color: 'var(--text-muted)' }}>This user hasn't played yet, or the ID is wrong.</p>
      <Link to="/leaderboard" className="btn btn-primary" style={{ marginTop: 24 }}>← Back to Leaderboard</Link>
    </div>
  );

  const expPercent = Math.min(100, Math.round((profile.experience % 1000) / 10));
  const games = ['all', ...new Set(profile.characters.map(c => c.game))];
  const filteredChars = charFilter === 'all' ? profile.characters : profile.characters.filter(c => c.game === charFilter);

  const totalPokemon = Object.values(profile.pokemon).reduce((acc, group) => {
    return acc + Object.values(group).reduce((s, c) => s + c, 0);
  }, 0);

  return (
    <div className="profile-page container">
      {/* Header */}
      <div className="profile-header card fade-in">
        <div className="profile-avatar">{profile.username[0]?.toUpperCase()}</div>
        <div className="profile-info">
          <h1>{profile.username}</h1>
          <div className="profile-meta">
            <span className="badge badge-4">Lv. {profile.level}</span>
            <span>🪙 {profile.balance.toLocaleString()} coins</span>
            <span>✨ {profile.star_dust.toLocaleString()} Star Dust</span>
          </div>
          <div className="xp-bar-wrap">
            <div className="xp-bar-fill" style={{ width: `${expPercent}%` }} />
          </div>
          <div className="xp-label">{profile.experience.toLocaleString()} total XP</div>
        </div>
        <div className="profile-stats-row">
          <div className="p-stat"><span>{profile.characterCount}</span> Characters</div>
          <div className="p-stat"><span>{totalPokemon.toLocaleString()}</span> Pokémon</div>
          <div className="p-stat"><span>{profile.stats?.commandsUsed ?? 0}</span> Commands</div>
        </div>
      </div>

      {/* Characters */}
      <section className="profile-section">
        <div className="section-header">
          <h2>🎭 Character Collection</h2>
          <div className="tab-bar">
            {games.map(g => (
              <button
                key={g}
                className={`btn btn-ghost ${charFilter === g ? 'active' : ''}`}
                onClick={() => setCharFilter(g)}
              >
                {g === 'all' ? 'All' : (GAME_LABELS[g] || g)}
              </button>
            ))}
          </div>
        </div>
        {filteredChars.length === 0 ? (
          <p className="empty-msg">No characters yet. Visit the shop to get some! ✨</p>
        ) : (
          <div className="char-grid">
            {filteredChars.map((c, i) => (
              <div key={i} className="char-card card">
                <div className="char-emoji">{c.emoji || '✨'}</div>
                <div className="char-name">{c.name}</div>
                <div className="char-meta">
                  <span className={`badge badge-${c.rarity}`}>{c.rarity}★</span>
                  <span className={`badge ${GAME_COLORS[c.game] || ''}`}>{GAME_LABELS[c.game] || c.game}</span>
                </div>
                {c.count > 1 && <div className="char-count">×{c.count}</div>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pokémon */}
      <section className="profile-section">
        <h2>🐾 Pokémon Collection ({totalPokemon.toLocaleString()} caught)</h2>
        {Object.keys(profile.pokemon).length === 0 ? (
          <p className="empty-msg">No Pokémon yet. Try `khunt` to catch some! 🎣</p>
        ) : (
          <div className="pokemon-grid">
            {Object.entries(profile.pokemon).map(([rarity, group]) => (
              <div key={rarity} className="card poke-rarity-group">
                <div className="poke-rarity-label">{rarity.charAt(0).toUpperCase() + rarity.slice(1)}</div>
                <div className="poke-list">
                  {Object.entries(group).map(([name, count]) => (
                    <span key={name} className="poke-pill">
                      {name}
                      {count > 1 && <span className="poke-count">×{count}</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
