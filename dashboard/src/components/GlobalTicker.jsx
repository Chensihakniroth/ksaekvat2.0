import { useState, useEffect } from 'react';
import { Sparkles, Terminal, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GlobalTicker() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = () => {
    console.log('[Ticker] Fetching live neural feed...');
    fetch('/api/gacha/history')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log(`[Ticker] Successfully fetched ${data.data.length} records:`, data.data);
          setHistory(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('[Ticker] Network/Fetch error:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full border-b border-white/5 py-2.5 overflow-hidden bg-black/20"
    >
      <div className="flex items-center">
        {/* --- LABEL --- */}
        <div className="flex items-center gap-2 px-6 border-r border-white/10 bg-black/40 relative z-20 h-full">
          <Sparkles size={14} className="text-cyan animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan whitespace-nowrap">Live Neural Feeds</span>
        </div>
        
        {/* --- TRACK --- */}
        <div className="flex-1 relative overflow-hidden h-5">
          {loading && history.length === 0 ? (
            <div className="flex items-center gap-3 px-8 text-[10px] font-mono text-text-dark uppercase italic animate-pulse">
              <Activity size={12} />
              <span>Establishing_Sync_With_Mainframe...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="flex items-center gap-3 px-8 text-[10px] font-mono text-text-dark uppercase italic">
              <Terminal size={12} />
              <span>No_Active_Signals_Detected_In_Sector</span>
            </div>
          ) : (
            <div className="absolute top-0 left-0 flex animate-ticker whitespace-nowrap">
              {/* Multiply history to ensure infinite loop feels smooth */}
              {[...history, ...history, ...history, ...history].map((pull, idx) => (
                <div key={`${pull?._id}-${idx}`} className="ticker-item">
                  <div className="w-1 h-1 rounded-full bg-cyan shadow-[0_0_8px_var(--cyan)]" />
                  <span className="text-xs font-mono uppercase flex items-center gap-2">
                    <span className="ticker-username">{pull?.username || 'Traveler'}</span> 
                    <span className="ticker-action">intercepted</span> 
                    <span className="ticker-item-name">{pull?.emoji || '✨'} {pull?.itemName || 'Asset'}</span>
                  </span>
                  <span className="ticker-game-badge">
                    {pull?.game?.toUpperCase() || 'SYS'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- VERSION --- */}
        <div className="hidden lg:flex items-center gap-2 px-6 border-l border-white/10 bg-black/40 relative z-20 text-text-dark">
          <Terminal size={12} />
          <span className="text-[10px] font-mono uppercase tracking-tighter">Sync_v3.0.4</span>
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-ticker {
          animation: ticker 60s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </motion.div>
  );
}
