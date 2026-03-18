import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import './GlobalTicker.css';

export default function GlobalTicker() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = () => {
      fetch('/api/gacha/history')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setHistory(data.data);
          }
        })
        .catch(err => console.error('Failed to fetch ticker history:', err));
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, []);

  if (history.length === 0) return null;

  return (
    <div className="global-ticker-container">
      <div className="ticker-label">
        <Sparkles size={14} className="sparkle-icon" />
        <span>LIVE PULLS</span>
      </div>
      <div className="ticker-viewport">
        <div className="ticker-track">
          {/* Duplicate for infinite loop effect */}
          {[...history, ...history].map((pull, idx) => (
            <div key={`${pull._id}-${idx}`} className="ticker-item">
              <span className="ticker-user">{pull.username}</span>
              <span className="ticker-action">obtained</span>
              <span className="ticker-item-name">
                {pull.emoji} {pull.itemName}
              </span>
              <span className="ticker-game badge-mini">{pull.game?.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
