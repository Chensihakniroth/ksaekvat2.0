import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Trophy, Coins, Star, Dog, Sparkles, ArrowLeft,
  Share2, Zap, Heart, History, Box, Filter, Terminal,
  Layers, BarChart3, Globe, Award, Crosshair, Activity, PawPrint,
  Instagram, Twitter, Github, ExternalLink, Music, Volume2, VolumeX,
  Code, Image as ImageIcon, Mail, MessageSquare, ShoppingBag, ChevronLeft, ChevronRight, Edit3, X
} from 'lucide-react';
import CharIcon from '../components/CharIcon';
import { useAuth } from '../context/AuthContext';

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

// --- MODULAR COMPONENTS ---

function CharacterModal({ char, onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={onClose}>
      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-panel modal-panel-lg" onClick={e => e.stopPropagation()}>
        <button className="bs-close" onClick={onClose}><X size={24} /></button>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '300px', padding: '60px', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
             <div style={{ width: '200px', height: '200px', marginBottom: '30px' }}>
                <CharIcon name={char.name} game={char.game?.toLowerCase()} rarity={char.rarity} />
             </div>
             <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginBottom: '10px' }}>
                   {[...Array(parseInt(char.rarity))].map((_, i) => <Star key={i} size={16} fill="#fbbf24" color="#fbbf24" />)}
                </div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{char.name}</h1>
             </div>
          </div>
          <div style={{ flex: '1.2', minWidth: '300px', padding: '60px' }}>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
              <span style={{ background: 'rgba(34,211,238,0.1)', color: 'var(--accent)', padding: '5px 15px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 900 }}>{char.game?.toUpperCase()}</span>
              <span style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', padding: '5px 15px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 900 }}>{char.element || 'NEUTRAL'}</span>
            </div>
            <h2 style={{ fontSize: '0.75rem', fontWeight: 900, opacity: 0.3, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '20px' }}>Technical Specs</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
               <div className="glass-panel" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.4, marginBottom: '5px' }}>ROLE</div>
                  <div style={{ fontWeight: 800 }}>{char.role || 'ASSET'}</div>
               </div>
               <div className="glass-panel" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.4, marginBottom: '5px' }}>TIER</div>
                  <div style={{ fontWeight: 800, color: 'var(--accent)' }}>LEVEL {char.rarity}</div>
               </div>
            </div>
            <button className="btn-v3 btn-v3-primary w-full" onClick={onClose}>
              <span>CLOSE ARCHIVE</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- MAIN PAGE ---

export default function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('portfolio');
  const [selectedChar, setSelectedChar] = useState(null);

  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const isOwner = authUser?.id === userId;
  const canGoBack = window.history.length > 2;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/profile/${userId}`)
      .then(r => r.json())
      .then(res => { 
        if (res.success) { setP(res.data); } 
        else { setNotFound(true); }
        setLoading(false); 
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [userId]);

  const theme = p?.profileTheme || {};
  const accent = theme.accentColor || '#22d3ee';
  const portfolio = theme.portfolio || [];
  const favorites = theme.favorites || [];

  const isSpotify = theme.music && typeof theme.music === 'string' && theme.music.includes('spotify.com');
  const spotifyTrackId = isSpotify ? theme.music.split('/').filter(Boolean).pop()?.split('?')[0] : null;
  const spotifyEmbedUrl = spotifyTrackId ? `https://open.spotify.com/embed/track/${spotifyTrackId}?utm_source=generator&theme=0` : null;

  useEffect(() => {
    if (!loading && theme.music && !isSpotify && audioRef.current) {
        audioRef.current.volume = 0.15;
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [loading, theme.music, isSpotify]);

  const getSocialHandle = (url) => {
    if (!url) return '';
    if (!url.includes('/')) return url;
    return url.split('/').filter(Boolean).pop();
  };

  if (loading) return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-deep)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        style={{ width: '80px', height: '80px', border: '2px dashed rgba(0, 243, 255, 0.2)', borderTopColor: 'var(--cyber-cyan)', borderRadius: '50%', marginBottom: '40px' }}
      />
      <div style={{ fontSize: '0.85rem', fontWeight: 900, letterSpacing: '0.4em', color: 'var(--cyber-cyan)', textTransform: 'uppercase', textShadow: '0 0 15px rgba(0, 243, 255, 0.5)' }}>
        SYNCING UPLINK...
      </div>
    </div>
  );
  if (notFound || !p) return <div className="profile-not-found wrap"><h2 className="error-title">ID_NOT_FOUND</h2><Link to="/leaderboard" className="btn-v3 btn-v3-ghost">RETURN</Link></div>;

  return (
    <div className="portfolio-minimal" onClick={() => !isSpotify && !isPlaying && audioRef.current?.play().then(()=>setIsPlaying(true))} style={{ 
      '--accent': accent,
      backgroundImage: `url(${theme.background || DEFAULT_BG})`,
    }}>
      
      {canGoBack && <button onClick={() => navigate(-1)} className="portfolio-back-fb"><ArrowLeft size={20} /></button>}

      <div className="portfolio-hero-container">
        <div className="portfolio-banner-wrap">
          {theme.banner ? <img src={theme.banner} className="portfolio-banner-img" alt="Banner" /> : <div className="banner-placeholder" style={{ background: `linear-gradient(135deg, ${accent}20, #000)` }} />}
        </div>

        <div className="portfolio-identity-bar">
          <div className="portfolio-avatar-fb">
            {theme.avatar ? <img src={theme.avatar} alt="Avatar" /> : <div className="avatar-initial-fb">{p.username[0]}</div>}
          </div>

          <div className="portfolio-name-bio">
            <h1 className="portfolio-name-fb">{p.username}</h1>
            <p className="portfolio-bio-fb">{theme.bio}</p>
          </div>

          <div className="portfolio-actions-fb">
            {isOwner && (
              <Link to="/dashboard" className="btn-v3" style={{ backgroundColor: accent, color: '#000', borderColor: accent }}>
                <Edit3 size={18} />
                <span>EDIT PROFILE</span>
              </Link>
            )}
            <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(()=>setCopied(false), 2000); }} className="btn-v3 btn-v3-ghost">
              <Share2 size={20} />
              <span>{copied ? 'COPIED' : 'SHARE'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="portfolio-content-wrap">
        <aside className="portfolio-zen-sidebar">
          <div className="zen-info-card glass-panel">
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
                <Star size={20} style={{ color: '#fbbf24' }} />
                <span>{p.star_dust.toLocaleString()} Star Dust</span>
              </div>
              <div className="zen-social-item">
                <Globe size={20} />
                <span>Level {p.level} Operative</span>
              </div>
            </div>

            {isSpotify && (
              <div className="spotify-embed-container">
                <iframe style={{ borderRadius: '12px' }} src={spotifyEmbedUrl} width="100%" height="152" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
              </div>
            )}
          </div>
        </aside>

        <main className="portfolio-zen-main">
          <div className="portfolio-tabs-fb">
             <button onClick={() => setActiveTab('portfolio')} className={`p-tab-fb ${activeTab === 'portfolio' ? 'active' : ''}`}>Portfolio</button>
             <button onClick={() => setActiveTab('favorites')} className={`p-tab-fb ${activeTab === 'favorites' ? 'active' : ''}`}>Favorites</button>
          </div>

          <div className="portfolio-tab-content">
            <AnimatePresence mode="wait">
              {activeTab === 'portfolio' && (
                <motion.div key="portfolio" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="portfolio-items-grid-zen">
                  {portfolio.length > 0 ? portfolio.map((item, idx) => (
                    <motion.div key={idx} variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }} className="zen-portfolio-card">
                       {item.type === 'art' ? <div className="zen-art-display"><img src={item.url} alt={item.title} /></div> : 
                         <div className="zen-card-info">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}><Code size={20} style={{ color: accent }} /><span className="zen-card-name">{item.title}</span></div>
                            <p className="zen-card-desc">{item.description || 'Source protocols established.'}</p>
                            <a href={item.url} target="_blank" rel="noreferrer" className="btn-v3 btn-v3-ghost" style={{ marginTop: '20px', width: '100%' }}>VIEW_SOURCE</a>
                         </div>
                       }
                       {item.type === 'art' && <div className="zen-card-info"><span className="zen-card-name">{item.title}</span><a href={item.url} target="_blank" rel="noreferrer" className="btn-v3 btn-v3-ghost" style={{ marginTop: '15px', width: '100%' }}>OPEN_ARCHIVE</a></div>}
                    </motion.div>
                  )) : <div className="glass-panel empty-state-zen"><p>ARCHIVE_EMPTY</p></div>}
                </motion.div>
              )}

              {activeTab === 'favorites' && (
                <motion.div key="favorites" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="units-grid-fb">
                   {favorites.length > 0 ? favorites.map((fav, i) => (
                     <div key={i} className={`char-card-fb ${fav.rarity === '5' ? 'r5' : ''}`} onClick={() => fav.type === 'character' && setSelectedChar(fav)} style={{ cursor: fav.type === 'character' ? 'pointer' : 'default' }}>
                        <div className="char-visual-fb">
                           {fav.type === 'character' ? (
                             <CharIcon name={fav.name} game={fav.game?.toLowerCase()} rarity={fav.rarity} />
                           ) : (
                             <img src={fav.sprite} alt={fav.name} className="char-icon-img" />
                           )}
                        </div>
                        <div className="char-name-fb">{fav.name}</div>
                        <div className="zen-type-tag">{fav.type}</div>
                     </div>
                   )) : (
                     <div className="glass-panel empty-state-zen">
                        <p>NO_FAVORITES_INDEXED</p>
                     </div>
                   )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {theme.music && !isSpotify && (
        <div className="music-control-fb">
          <button onClick={() => { if(audioRef.current) { if(isPlaying) audioRef.current.pause(); else audioRef.current.play(); setIsPlaying(!isPlaying); }}} className="music-btn-fb">
            {isPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
            <span>{isPlaying ? 'TRANSMITTING' : 'MUTED'}</span>
          </button>
          <audio ref={audioRef} src={theme.music} loop />
        </div>
      )}

      <AnimatePresence>
        {selectedChar && <CharacterModal char={selectedChar} onClose={() => setSelectedChar(null)} />}
      </AnimatePresence>
    </div>
  );
}
