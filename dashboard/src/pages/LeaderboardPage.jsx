import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './LeaderboardPage.css';

const TABS = [
  { key: 'balance', label: '🪙 Richest', col: 'balance', format: v => v.toLocaleString() + ' coins' },
  { key: 'level', label: '⭐ Highest Level', col: 'level', format: v => 'Lv. ' + v },
  { key: 'pokemon', label: '🐾 Most Pokémon', col: 'pokemonCount', format: v => v.toLocaleString() + ' caught' },
  { key: 'characters', label: '🎭 Most Characters', col: 'characterCount', format: v => v + ' characters' },
];

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const [sort, setSort] = useState('balance');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?sort=${sort}&limit=20`)
      .then(r => r.json())
      .then(res => {
        if (res.success) setData(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sort]);

  const tab = TABS.find(t => t.key === sort);

  return (
    <div className="lb-page container">
      <div className="page-header">
        <h1>🏆 <span className="gradient-text">Leaderboard</span></h1>
        <p>The greatest adventurers of the KsaeKvat universe</p>
      </div>

      {/* Tab bar */}
      <div className="tab-bar" style={{ marginBottom: 28 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            className={`btn btn-ghost ${sort === t.key ? 'active' : ''}`}
            onClick={() => setSort(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="spinner" />
      ) : (
        <div className="card lb-card fade-in">
          <table className="lb-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Level</th>
                <th>{tab?.label}</th>
                <th>Star Dust</th>
              </tr>
            </thead>
            <tbody>
              {data.map((user, i) => (
                <tr key={user.userId} className={`rank-${i + 1}`}>
                  <td className="rank-cell">
                    {i < 3 ? MEDALS[i] : `#${i + 1}`}
                  </td>
                  <td>
                    <Link to={`/profile/${user.userId}`} className="lb-username">
                      {user.username}
                    </Link>
                  </td>
                  <td>
                    <span className="badge badge-4">Lv.{user.level}</span>
                  </td>
                  <td className="lb-value">{tab?.format(user[tab.col] ?? 0)}</td>
                  <td style={{ color: 'var(--accent-gold)' }}>✨ {user.star_dust.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
