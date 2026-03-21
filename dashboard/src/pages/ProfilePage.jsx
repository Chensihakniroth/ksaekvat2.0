import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Trophy, Coins, Star, Dog, Sparkles, ArrowLeft,
  Share2, Zap, Heart, History, Box, Filter, Terminal,
  Layers, BarChart3, Globe, Award, Crosshair, Activity, PawPrint,
  Instagram, Twitter, Github, ExternalLink, Music, Volume2, VolumeX,
  Code, Image as ImageIcon, Mail, MessageSquare
} from 'lucide-react';
import CharIcon from '../components/CharIcon';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  Tooltip as ReTooltip
} from 'recharts';

const SOCIAL_ICONS = {
  instagram: <Instagram size={18} />,
  twitter: <Twitter size={18} />,
  github: <Github size={18} />,
  website: <ExternalLink size={18} />,
  discord: <MessageSquare size={18} />
};

const RARITY_COLORS = {
  '5': '#fbbf24', // Gold
  '4': '#a78bfa', // Purple
  '3': '#94a3b8'  // Slate
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

export default function ProfilePage() {
  const { userId } = useParams();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('portfolio');
  const [gameFilter, setGameFilter] = useState('all');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [entered, setEntered] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    console.log(`[Profile] Requesting data for UID: ${userId}...`);
    setLoading(true);
    fetch(`/api/profile/${userId}`)
      .then(r => r.json())
      .then(res => { 
        if (res.success) {
          console.log(`[Profile] Successfully loaded data for: ${res.data.username}`);
          setP(res.data); 
        } else { 
          console.error(`[Profile] API Error for ${userId}:`, res.error);
          setNotFound(true); 
        }
        setLoading(false); 
      })
      .catch((err) => { 
        console.error(`[Profile] Network error for ${userId}:`, err);
        setNotFound(true); 
        setLoading(false); 
      });
  }, [userId]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Autoplay blocked:", e));
    }
    setIsPlaying(!isPlaying);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statsData = useMemo(() => {
    if (!p) return [];
    return [
      { name: '5★', value: p.characters.filter(c => c.rarity === '5').length },
      { name: '4★', value: p.characters.filter(c => c.rarity === '4').length },
      { name: '3★', value: p.characters.filter(c => c.rarity === '3').length },
    ].filter(d => d.value > 0);
  }, [p]);

  const filteredChars = useMemo(() => {
    if (!p) return [];
    return p.characters.filter(c => {
      const matchesGame = gameFilter === 'all' || c.game?.toLowerCase() === gameFilter;
      const matchesRarity = rarityFilter === 'all' || c.rarity === rarityFilter;
      return matchesGame && matchesRarity;
    });
  }, [p, gameFilter, rarityFilter]);

  if (loading) return (
    <div className="profile-loading-screen">
      <div className="loading-core">
        <div className="scanner-circle">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="ring ring-outer" />
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="ring ring-inner" />
          <div className="core-icon"><Activity size={24} className="animate-pulse" /></div>
        </div>
        <div className="loading-text glitch-text">Establishing Uplink...</div>
      </div>
    </div>
  );

  if (notFound || !p) return (
    <div className="profile-not-found wrap">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel error-card neon-border">
        <div className="error-icon-wrap"><User size={48} /></div>
        <h2 className="error-title">Target Not Found</h2>
        <p className="error-desc">The specified operative ID does not exist in our central database.</p>
        <Link to="/leaderboard" className="btn-v3 btn-v3-ghost"><ArrowLeft size={16} /> Return to Network</Link>
      </motion.div>
    </div>
  );

  const theme = p.profileTheme || {};
  const accent = theme.accentColor || '#22d3ee';
  const portfolio = theme.portfolio || [];

  const handleEnter = () => {
    setEntered(true);
    if (audioRef.current && theme.music) {
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch(e => console.error("Autoplay blocked:", e));
      setIsPlaying(true);
    }
  };

  return (
    <div className="portfolio-minimal" style={{ 
      '--accent': accent,
      backgroundImage: theme.background ? `url(${theme.background})` : 'none',
    }}>
      <AnimatePresence>
        {!entered && (
           <motion.div exit={{ opacity: 0 }} className="enter-overlay" onClick={handleEnter}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="enter-content"
              >
                <div className="enter-avatar">
                   {theme.avatar ? <img src={theme.avatar} alt="Avatar" /> : <div className="avatar-initial">{p.username[0]}</div>}
                </div>
                <h2 className="enter-username">{p.username}</h2>
                <div className="enter-hint" style={{ color: accent }}>[ CLICK TO DEPLOY ]</div>
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>

      {entered && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="portfolio-content">
          {theme.music && (
            <div className="music-control">
              <button onClick={toggleMusic} className="music-btn" style={{ borderColor: accent }}>
                {isPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <audio ref={audioRef} src={theme.music} loop />
            </div>
          )}

          <div className="share-trigger">
             <button onClick={handleShare} className="share-btn-minimal" title="Copy Uplink">
                <Share2 size={16} />
                {copied && <span className="copied-toast">LINK COPIED</span>}
             </button>
          </div>

          <div className="portfolio-hero">
            <div className="banner-wrap">
               {theme.banner ? <img src={theme.banner} className="portfolio-banner" /> : <div className="banner-placeholder" style={{ background: `linear-gradient(to bottom, ${accent}40, transparent)` }} />}
            </div>
            
            <div className="identity-section">
              <div className="avatar-main" style={{ borderColor: accent }}>
                {theme.avatar ? <img src={theme.avatar} alt="Avatar" /> : <div className="avatar-initial">{p.username[0]}</div>}
              </div>
              <h1 className="name-main glitch-text" data-text={p.username}>{p.username}</h1>
              <p className="bio-main">{theme.bio}</p>
              
              <div className="social-links-wrap">
                {theme.socials && Object.entries(theme.socials).map(([key, val]) => (
                  val && (
                    <a key={key} href={val.startsWith('http') ? val : '#'} target="_blank" rel="noreferrer" className="social-icon-btn" style={{ '--icon-accent': accent }}>
                      {SOCIAL_ICONS[key] || <ExternalLink size={18}/>}
                    </a>
                  )
                ))}
              </div>
            </div>
          </div>

          <div className="portfolio-tabs">
             <button onClick={() => setActiveTab('portfolio')} className={`p-tab ${activeTab === 'portfolio' ? 'active' : ''}`} style={activeTab === 'portfolio' ? { color: accent } : {}}>PORTFOLIO</button>
             {theme.showInventory !== false && <button onClick={() => setActiveTab('inventory')} className={`p-tab ${activeTab === 'inventory' ? 'active' : ''}`} style={activeTab === 'inventory' ? { color: accent } : {}}>ARSENAL</button>}
             {theme.showStats !== false && <button onClick={() => setActiveTab('stats')} className={`p-tab ${activeTab === 'stats' ? 'active' : ''}`} style={activeTab === 'stats' ? { color: accent } : {}}>DATAPAD</button>}
          </div>

          <div className="portfolio-grid-area">
            <AnimatePresence mode="wait">
              {activeTab === 'portfolio' && (
                <motion.div key="portfolio" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="portfolio-items">
                  {portfolio.length > 0 ? portfolio.map((item, idx) => (
                    <motion.div key={idx} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="portfolio-item-card glass-panel">
                       {item.type === 'art' ? (
                         <div className="art-preview">
                           <img src={item.url} alt={item.title} />
                           <div className="art-overlay">
                              <span className="item-title">{item.title}</span>
                              <a href={item.url} target="_blank" rel="noreferrer" className="view-link"><ExternalLink size={14} /></a>
                           </div>
                         </div>
                       ) : (
                         <div className="repo-preview">
                            <div className="repo-header">
                               <Code size={20} style={{ color: accent }} />
                               <span className="item-title">{item.title}</span>
                            </div>
                            <p className="item-desc">{item.description || 'No description provided.'}</p>
                            <a href={item.url} target="_blank" rel="noreferrer" className="repo-link">
                               <Github size={14} /> VIEW REPOSITORY
                            </a>
                         </div>
                       )}
                    </motion.div>
                  )) : (
                    <div className="empty-portfolio">
                       <Award size={48} className="opacity-20 mb-4" />
                       <p>The archives are currently empty.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'inventory' && (
                <motion.div key="inventory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="inventory-view">
                   <div className="tactical-filters glass-panel">
                      {['all', 'genshin', 'hsr', 'wuwa', 'zzz'].map(g => (
                        <button key={g} onClick={() => setGameFilter(g)} className={`filter-btn ${gameFilter === g ? 'active' : ''}`} style={gameFilter === g ? { backgroundColor: accent } : {}}>{g.toUpperCase()}</button>
                      ))}
                   </div>
                   <div className="units-grid">
                      {filteredChars.map((c, i) => (
                        <UnitCard key={i} char={c} accent={accent} />
                      ))}
                   </div>
                </motion.div>
              )}

              {activeTab === 'stats' && (
                <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="stats-view">
                   <div className="stats-grid-minimal">
                      <div className="stat-box glass-panel">
                         <span className="stat-label">COMBAT LEVEL</span>
                         <span className="stat-value" style={{ color: accent }}>{p.level}</span>
                      </div>
                      <div className="stat-box glass-panel">
                         <span className="stat-label">CURRENCY</span>
                         <span className="stat-value" style={{ color: '#fbbf24' }}>{p.balance.toLocaleString()}</span>
                      </div>
                      <div className="stat-box glass-panel">
                         <span className="stat-label">OPERATIONS</span>
                         <span className="stat-value" style={{ color: '#a78bfa' }}>{p.stats?.commandsUsed || 0}</span>
                      </div>
                      <div className="stat-box glass-panel">
                         <span className="stat-label">PITY COUNT</span>
                         <span className="stat-value" style={{ color: '#f472b6' }}>{p.pity}/90</span>
                      </div>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function UnitCard({ char, accent }) {
  return (
    <div className={`char-card-minimal glass-panel ${char.rarity === '5' ? 'r5' : ''}`} style={char.rarity === '5' ? { '--card-accent': accent } : {}}>
       <div className="char-visual">
          <CharIcon name={char.name} game={char.game?.toLowerCase()} rarity={char.rarity} emoji={char.emoji} />
       </div>
       <div className="char-name-tag">{char.name}</div>
    </div>
  );
}
