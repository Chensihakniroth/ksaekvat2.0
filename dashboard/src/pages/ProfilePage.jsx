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
  instagram: <Instagram size={20} />,
  twitter: <Twitter size={20} />,
  github: <Github size={20} />,
  website: <ExternalLink size={20} />,
  discord: <MessageSquare size={20} />
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
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('portfolio');
  const [gameFilter, setGameFilter] = useState('all');
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
          setP(res.data); 
        } else { 
          setNotFound(true); 
        }
        setLoading(false); 
      })
      .catch(() => { 
        setNotFound(true); 
        setLoading(false); 
      });
  }, [userId]);

  const theme = p?.profileTheme || {};
  const accent = theme.accentColor || '#22d3ee';
  const portfolio = theme.portfolio || [];

  // Spotify Logic
  const isSpotify = theme.music?.includes('spotify.com');
  const spotifyTrackId = isSpotify ? theme.music.split('/').pop()?.split('?')[0] : null;
  const spotifyEmbedUrl = spotifyTrackId ? `https://open.spotify.com/embed/track/${spotifyTrackId}?utm_source=generator&theme=0` : null;

  // Handle music play on load
  useEffect(() => {
    if (!loading && theme.music && !isSpotify && audioRef.current) {
        audioRef.current.volume = 0.15; // Ambient background volume
        audioRef.current.play().then(() => {
            setIsPlaying(true);
        }).catch(() => {
            console.log("[Audio] Autoplay blocked.");
        });
    }
  }, [loading, theme.music, isSpotify]);

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
    if (theme.music && !isSpotify && !isPlaying && audioRef.current) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSocialHandle = (url) => {
    if (!url) return '';
    if (!url.includes('/')) return url;
    return url.split('/').filter(Boolean).pop();
  };

  const filteredChars = useMemo(() => {
    if (!p) return [];
    return p.characters.filter(c => {
      const matchesGame = gameFilter === 'all' || c.game?.toLowerCase() === gameFilter;
      return matchesGame;
    });
  }, [p, gameFilter]);

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
        <p className="error-desc">The specified operative ID does not exist.</p>
        <Link to="/leaderboard" className="btn-v3 btn-v3-ghost"><ArrowLeft size={16} /> Return to Network</Link>
      </motion.div>
    </div>
  );

  return (
    <div className="portfolio-minimal" onClick={handleGlobalClick} style={{ 
      '--accent': accent,
      backgroundImage: `url(${theme.background || DEFAULT_BG})`,
    }}>
      
      {canGoBack && (
        <button onClick={() => navigate(-1)} className="portfolio-back-fb">
          <ArrowLeft size={20} />
        </button>
      )}

      {/* HERO SECTION: FB STYLE */}
      <div className="portfolio-hero-container">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="portfolio-banner-wrap"
        >
          {theme.banner ? 
            <img src={theme.banner} className="portfolio-banner-img" alt="Banner" /> : 
            <div className="banner-placeholder" style={{ background: `linear-gradient(135deg, ${accent}20, #000)` }} />
          }
        </motion.div>

        <div className="portfolio-identity-bar">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="portfolio-avatar-fb"
          >
            {theme.avatar ? <img src={theme.avatar} alt="Avatar" /> : <div className="avatar-initial-fb">{p.username[0]}</div>}
          </motion.div>

          <div className="portfolio-name-bio">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="portfolio-name-fb"
            >
              {p.username}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="portfolio-bio-fb"
            >
              {theme.bio}
            </motion.p>
          </div>

          <div className="portfolio-actions-fb">
            <button onClick={handleShare} className="share-btn-sidebar">
              <Share2 size={20} />
              <span>{copied ? 'COPIED' : 'SHARE'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT WRAPPER */}
      <div className="portfolio-content-wrap">
        
        {/* LEFT: INFO SIDEBAR */}
        <aside className="portfolio-zen-sidebar">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="zen-info-card"
          >
            <h3 className="zen-card-title">Intro</h3>
            <div className="zen-social-list">
              {theme.socials && Object.entries(theme.socials).map(([key, val]) => (
                val && (
                  <a key={key} href={val.startsWith('http') ? val : `https://${key}.com/${val}`} target="_blank" rel="noreferrer" className="zen-social-item">
                    {SOCIAL_ICONS[key] || <ExternalLink size={20}/>}
                    <span>{getSocialHandle(val)}</span>
                  </a>
                )
              ))}
              <div className="zen-social-item">
                <Globe size={20} />
                <span>Level {p.level} Operative</span>
              </div>
            </div>

            {isSpotify && (
              <div className="spotify-embed-container">
                <iframe 
                  style={{ borderRadius: '12px' }} 
                  src={spotifyEmbedUrl} 
                  width="100%" 
                  height="152" 
                  frameBorder="0" 
                  allowFullScreen="" 
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                  loading="lazy"
                ></iframe>
              </div>
            )}
          </motion.div>
        </aside>

        {/* RIGHT: TABS & CONTENT */}
        <main className="portfolio-zen-main">
          <div className="portfolio-tabs-fb">
             <button onClick={() => setActiveTab('portfolio')} className={`p-tab-fb ${activeTab === 'portfolio' ? 'active' : ''}`}>Portfolio</button>
             {theme.showInventory !== false && <button onClick={() => setActiveTab('inventory')} className={`p-tab-fb ${activeTab === 'inventory' ? 'active' : ''}`}>Arsenal</button>}
             {theme.showStats !== false && <button onClick={() => setActiveTab('stats')} className={`p-tab-fb ${activeTab === 'stats' ? 'active' : ''}`}>Data</button>}
          </div>

          <div className="portfolio-tab-content">
            <AnimatePresence mode="wait">
              {activeTab === 'portfolio' && (
                <motion.div 
                  key="portfolio" 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="portfolio-items-grid-zen"
                >
                  {portfolio.length > 0 ? portfolio.map((item, idx) => (
                    <motion.div 
                      key={idx} 
                      variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
                      className="zen-portfolio-card"
                    >
                       {item.type === 'art' ? (
                         <div className="zen-art-display">
                           <img src={item.url} alt={item.title} />
                         </div>
                       ) : (
                         <div className="zen-card-info">
                            <div className="repo-header-new">
                               <Code size={20} style={{ color: accent }} />
                               <span className="zen-card-name">{item.title}</span>
                            </div>
                            <p className="zen-card-desc">{item.description || 'Source protocols established.'}</p>
                            <a href={item.url} target="_blank" rel="noreferrer" className="repo-link-new">
                               VIEW_SOURCE
                            </a>
                         </div>
                       )}
                       {item.type === 'art' && (
                         <div className="zen-card-info">
                            <span className="zen-card-name">{item.title}</span>
                            <a href={item.url} target="_blank" rel="noreferrer" className="repo-link-new">OPEN_ARCHIVE</a>
                         </div>
                       )}
                    </motion.div>
                  )) : (
                    <div className="empty-portfolio-new" style={{ gridColumn: '1/-1', padding: '100px 0', opacity: 0.1 }}>
                       <p style={{ letterSpacing: '0.5em', fontSize: '0.7rem', fontWeight: 600 }}>ARCHIVE_EMPTY</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'inventory' && (
                <motion.div 
                  key="inventory" 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }} 
                  className="inventory-grid-container"
                >
                   <div className="units-grid-fb">
                      {filteredChars.map((c, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.02 }}
                        >
                          <UnitCard char={c} />
                        </motion.div>
                      ))}
                   </div>
                </motion.div>
              )}

              {activeTab === 'stats' && (
                <motion.div 
                  key="stats" 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -20 }} 
                  className="stats-grid-fb"
                >
                   <StatBox label="Neural Level" value={p.level} />
                   <StatBox label="Network Credits" value={p.balance.toLocaleString()} />
                   <StatBox label="Operations" value={p.stats?.commandsUsed || 0} />
                   <StatBox label="Resonance" value={`${p.pity}/90`} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {theme.music && !isSpotify && (
        <div className="music-control-fb">
          <button onClick={toggleMusic} className="music-btn-fb">
            {isPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
            <span>{isPlaying ? 'TRANSMITTING' : 'MUTED'}</span>
          </button>
          <audio ref={audioRef} src={theme.music} loop />
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="stat-box-fb">
       <span className="stat-lbl-fb">{label}</span>
       <span className="stat-val-fb">{value}</span>
    </div>
  );
}

function UnitCard({ char }) {
  return (
    <div className={`char-card-fb ${char.rarity === '5' ? 'r5' : ''}`}>
       <div className="char-visual-fb">
          <CharIcon name={char.name} game={char.game?.toLowerCase()} rarity={char.rarity} emoji={char.emoji} />
       </div>
       <div className="char-name-fb">{char.name}</div>
    </div>
  );
}
