import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Trophy, Coins, Star, Dog, Sparkles, ArrowLeft,
  Share2, Zap, Heart, History, Box, Filter, Terminal,
  Layers, BarChart3, Globe, Award, Crosshair, Activity, PawPrint,
  Instagram, Twitter, Github, ExternalLink, Music, Volume2, VolumeX,
  Code, Image as ImageIcon, Mail, MessageSquare
} from 'lucide-react';
import CharIcon from '../components/CharIcon';

const SOCIAL_ICONS = {
  instagram: <Instagram size={18} />,
  twitter: <Twitter size={18} />,
  github: <Github size={18} />,
  website: <ExternalLink size={18} />,
  discord: <MessageSquare size={18} />
};

const DEFAULT_BG = "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

export default function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('portfolio');
  const [gameFilter, setGameFilter] = useState('all');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // Check if we can go back (came from internal link)
  const canGoBack = window.history.length > 2;

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

  // Attempt to play music on mount/data load
  useEffect(() => {
    if (!loading && p?.profileTheme?.music && audioRef.current) {
        audioRef.current.volume = 0.5;
        audioRef.current.play().then(() => {
            setIsPlaying(true);
        }).catch(() => {
            console.log("[Audio] Autoplay blocked. Waiting for interaction.");
        });
    }
  }, [loading, p]);

  const toggleMusic = (e) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Play failed:", e));
    }
    setIsPlaying(!isPlaying);
  };

  const handleGlobalClick = () => {
    if (p?.profileTheme?.music && !isPlaying && audioRef.current) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  return (
    <div className="portfolio-minimal" onClick={handleGlobalClick} style={{ 
      '--accent': accent,
      backgroundImage: `url(${theme.background || DEFAULT_BG})`,
    }}>
      
      {canGoBack && (
        <button onClick={() => navigate(-1)} className="portfolio-back-btn">
          <ArrowLeft size={18} />
          <span>BACK</span>
        </button>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="portfolio-grid-layout">
        
        {/* LEFT COLUMN: FIXED IDENTITY */}
        <aside className="portfolio-left">
          <div className="portfolio-hero-sidebar">
            <div className="banner-wrap-sidebar">
               {theme.banner ? <img src={theme.banner} className="portfolio-banner" alt="Banner" /> : <div className="banner-placeholder" style={{ background: `linear-gradient(to bottom, ${accent}40, transparent)` }} />}
            </div>
            
            <div className="identity-section-sidebar">
              <div className="avatar-main-sidebar" style={{ borderColor: accent }}>
                {theme.avatar ? <img src={theme.avatar} alt="Avatar" /> : <div className="avatar-initial-sidebar">{p.username[0]}</div>}
              </div>
              <h1 className="name-main-sidebar glitch-text" data-text={p.username}>{p.username}</h1>
              <p className="bio-main-sidebar">{theme.bio}</p>
              
              <div className="social-links-wrap-sidebar">
                {theme.socials && Object.entries(theme.socials).map(([key, val]) => (
                  val && (
                    <a key={key} href={val.startsWith('http') ? val : '#'} target="_blank" rel="noreferrer" className="social-icon-btn" style={{ '--icon-accent': accent }}>
                      {SOCIAL_ICONS[key] || <ExternalLink size={18}/>}
                    </a>
                  )
                ))}
              </div>

              <div className="identity-footer-sidebar">
                <button onClick={handleShare} className="share-btn-sidebar" title="Copy Uplink">
                  <Share2 size={16} />
                  <span>SHARE PROFILE</span>
                  {copied && <span className="copied-toast-sidebar">COPIED!</span>}
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT COLUMN: SCROLLABLE CONTENT */}
        <main className="portfolio-right">
          <div className="portfolio-tabs-sticky">
             <button onClick={() => setActiveTab('portfolio')} className={`p-tab ${activeTab === 'portfolio' ? 'active' : ''}`} style={activeTab === 'portfolio' ? { color: accent } : {}}>PORTFOLIO</button>
             {theme.showInventory !== false && <button onClick={() => setActiveTab('inventory')} className={`p-tab ${activeTab === 'inventory' ? 'active' : ''}`} style={activeTab === 'inventory' ? { color: accent } : {}}>ARSENAL</button>}
             {theme.showStats !== false && <button onClick={() => setActiveTab('stats')} className={`p-tab ${activeTab === 'stats' ? 'active' : ''}`} style={activeTab === 'stats' ? { color: accent } : {}}>DATAPAD</button>}
          </div>

          <div className="portfolio-content-view">
            <AnimatePresence mode="wait">
              {activeTab === 'portfolio' && (
                <motion.div key="portfolio" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="portfolio-items-grid">
                  {portfolio.length > 0 ? portfolio.map((item, idx) => (
                    <motion.div key={idx} variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }} className="portfolio-item-card-new glass-panel">
                       {item.type === 'art' ? (
                         <div className="art-preview-new">
                           <img src={item.url} alt={item.title} />
                           <div className="art-overlay-new">
                              <span className="item-title-new">{item.title}</span>
                              <a href={item.url} target="_blank" rel="noreferrer" className="view-link-new"><ExternalLink size={14} /></a>
                           </div>
                         </div>
                       ) : (
                         <div className="repo-preview-new">
                            <div className="repo-header-new">
                               <Code size={20} style={{ color: accent }} />
                               <span className="item-title-new">{item.title}</span>
                            </div>
                            <p className="item-desc-new">{item.description || 'No description provided.'}</p>
                            <a href={item.url} target="_blank" rel="noreferrer" className="repo-link-new" style={{ borderColor: `${accent}40`, color: accent }}>
                               <Github size={14} /> VIEW REPOSITORY
                            </a>
                         </div>
                       )}
                    </motion.div>
                  )) : (
                    <div className="empty-portfolio-new">
                       <Award size={48} className="opacity-10 mb-4" />
                       <p>NO ARCHIVES INDEXED</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'inventory' && (
                <motion.div key="inventory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="inventory-view-new">
                   <div className="tactical-filters-new glass-panel">
                      {['all', 'genshin', 'hsr', 'wuwa', 'zzz'].map(g => (
                        <button key={g} onClick={() => setGameFilter(g)} className={`filter-btn-new ${gameFilter === g ? 'active' : ''}`} style={gameFilter === g ? { backgroundColor: accent } : {}}>{g.toUpperCase()}</button>
                      ))}
                   </div>
                   <div className="units-grid-new">
                      {filteredChars.map((c, i) => (
                        <UnitCard key={i} char={c} accent={accent} />
                      ))}
                   </div>
                </motion.div>
              )}

              {activeTab === 'stats' && (
                <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="stats-view-new">
                   <div className="stats-grid-new">
                      <div className="stat-box-new glass-panel">
                         <span className="stat-label-new">NEURAL LEVEL</span>
                         <span className="stat-value-new" style={{ color: accent }}>{p.level}</span>
                      </div>
                      <div className="stat-box-new glass-panel">
                         <span className="stat-label-new">CREDITS</span>
                         <span className="stat-value-new" style={{ color: '#fbbf24' }}>{p.balance.toLocaleString()}</span>
                      </div>
                      <div className="stat-box-new glass-panel">
                         <span className="stat-label-new">OPERATIONS</span>
                         <span className="stat-value-new" style={{ color: '#a78bfa' }}>{p.stats?.commandsUsed || 0}</span>
                      </div>
                      <div className="stat-box-new glass-panel">
                         <span className="stat-label-new">5★ RESONANCE</span>
                         <span className="stat-value-new" style={{ color: '#f472b6' }}>{p.pity}/90</span>
                      </div>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </motion.div>

      {theme.music && (
        <div className="music-control-fixed">
          <button onClick={toggleMusic} className="music-btn-minimal" style={{ borderColor: accent, color: accent }}>
            {isPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span className="music-status-text">{isPlaying ? 'TRANSMITTING' : 'MUTED'}</span>
          </button>
          <audio ref={audioRef} src={theme.music} loop />
        </div>
      )}
    </div>
  );
}

function UnitCard({ char, accent }) {
  return (
    <div className={`char-card-new glass-panel ${char.rarity === '5' ? 'r5' : ''}`} style={char.rarity === '5' ? { '--card-accent': accent } : {}}>
       <div className="char-visual-new">
          <CharIcon name={char.name} game={char.game?.toLowerCase()} rarity={char.rarity} emoji={char.emoji} />
       </div>
       <div className="char-name-tag-new">{char.name}</div>
    </div>
  );
}
