import { useState, useEffect } from 'react';
import { Sparkles, Terminal, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GlobalTicker() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = () => {
    fetch('/api/gacha/history')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setHistory(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('[Ticker] Fetch error:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="ticker-container"
    >
      <div className="flex items-center h-full">
        {/* --- LABEL --- */}
        <div className="ticker-label">
          <Sparkles size={14} className="text-cyan animate-pulse" />
          <span className="ticker-label-text">Live Neural Feeds</span>
        </div>
        
        {/* --- TRACK --- */}
        <div className="ticker-track-viewport">
          {loading && history.length === 0 ? (
            <div className="ticker-status">
              <Activity size={12} />
              <span>Establishing_Sync_With_Mainframe...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="ticker-status">
              <Terminal size={12} />
              <span>No_Active_Signals_Detected_In_Sector</span>
            </div>
          ) : (
            <div className="animate-ticker">
              {/* Triple the array to ensure seamless looping */}
              {[...history, ...history, ...history].map((pull, idx) => {
                const isFiveStar = pull?.rarity === 5;
                const rarityColor = isFiveStar ? '#FFB13F' : '#A256FF';
                const rarityShadow = isFiveStar ? 'rgba(250,177,63,0.6)' : 'rgba(162,86,255,0.6)';

                return (
                  <div key={`${pull.id || pull._id}-${idx}`} className="ticker-item">
                    <div 
                      className="ticker-dot" 
                      style={{ backgroundColor: rarityColor, boxShadow: `0 0 8px ${rarityShadow}` }}
                    />
                    <span className="ticker-content">
                      <span className="ticker-username" style={{ '--hover-color': rarityColor }}>
                        {pull?.username || 'Traveler'}
                      </span>
                      <span className="ticker-action">INTERCEPTED</span> 
                      <span className="ticker-item-name" style={{ color: rarityColor }}>
                        {pull?.emoji || '✨'} {pull?.itemName || (isFiveStar ? 'LEGENDARY' : 'EPIC')}
                      </span>
                    </span>
                    <span className="ticker-game-badge">
                      {pull?.game?.toUpperCase() || 'SYS'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* --- VERSION --- */}
        <div className="ticker-version">
          <Terminal size={12} />
          <span>Sync_v3.0.4</span>
        </div>
      </div>

      <style>{`
        .ticker-container {
          width: 100%;
          height: 40px;
          background: rgba(0, 0, 0, 0.6);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          overflow: hidden;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 2000;
        }

        .ticker-label {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 24px;
          height: 100%;
          background: rgba(0, 0, 0, 0.6);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          position: relative;
          z-index: 50;
        }

        .ticker-label-text {
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: #00f2ff;
          white-space: nowrap;
        }

        .ticker-track-viewport {
          flex: 1;
          position: relative;
          overflow: hidden;
          height: 100%;
        }

        .animate-ticker {
          display: flex;
          white-space: nowrap;
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          align-items: center;
          animation: ticker-swipe 60s linear infinite;
        }

        .animate-ticker:hover {
          animation-play-state: paused;
        }

        @keyframes ticker-swipe {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }

        .ticker-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 0 32px;
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          height: 100%;
        }

        .ticker-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          transition: transform 0.2s ease;
        }

        .ticker-item:hover .ticker-dot {
          transform: scale(1.5);
        }

        .ticker-content {
          font-family: monospace;
          font-size: 12px;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ticker-username {
          color: #ffffff;
          font-weight: bold;
          letter-spacing: 0.05em;
          transition: color 0.2s ease;
        }

        .ticker-item:hover .ticker-username {
          color: var(--hover-color);
        }

        .ticker-action {
          color: rgba(255, 255, 255, 0.2);
          font-style: italic;
          font-size: 10px;
        }

        .ticker-item-name {
          font-weight: 900;
          letter-spacing: 0.02em;
        }

        .ticker-game-badge {
          font-size: 9px;
          font-weight: 900;
          color: rgba(255, 255, 255, 0.2);
          letter-spacing: 0.1em;
          padding: 2px 6px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }

        .ticker-status {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 32px;
          font-family: monospace;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.3);
          text-transform: uppercase;
          font-style: italic;
          height: 100%;
        }

        .ticker-version {
          display: none;
          align-items: center;
          gap: 8px;
          padding: 0 24px;
          background: rgba(0, 0, 0, 0.6);
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.3);
          font-family: monospace;
          font-size: 10px;
          height: 100%;
        }

        @media (min-width: 1024px) {
          .ticker-version {
            display: flex;
          }
        }

        .text-cyan { color: #00f2ff; }
      `}</style>
    </motion.div>
  );
}
