import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, Share2, Edit3, X, ExternalLink, MessageSquare, 
  Instagram, Twitter, Github, Facebook, Linkedin, Music as SpotifyIcon,
  ExternalLink as LinkIcon, Globe, Volume2, VolumeX, Code, 
  Image as ImageIcon, ArrowLeft, User
} from 'lucide-react';
import CharIcon from '../components/CharIcon';
import { useAuth } from '../context/AuthContext';

const SOCIAL_ICONS = {
  instagram: <Instagram size={20} />,
  twitter: <Twitter size={20} />,
  github: <Github size={20} />,
  website: <ExternalLink size={20} />,
  discord: <MessageSquare size={20} />,
  facebook: <Facebook size={20} />,
  linkedin: <Linkedin size={20} />,
  spotify: <SpotifyIcon size={20} />
};

const DEFAULT_BG = "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

function CharacterModal({ char, onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={onClose} style={{ zIndex: 2000, position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(40px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '800px', borderRadius: '40px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
        <button className="bs-close" onClick={onClose} style={{ position: 'absolute', top: '30px', right: '30px', zIndex: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}><X size={20} /></button>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px', padding: '60px', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,0.03)' }}>
             <div style={{ width: '200px', height: '200px', marginBottom: '30px' }}>
                <CharIcon name={char.name} game={char.game?.toLowerCase()} rarity={char.rarity} />
             </div>
             <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginBottom: '15px', opacity: 0.5 }}>
                   {[...Array(parseInt(char.rarity))].map((_, i) => <Star key={i} size={14} fill="var(--gold)" color="var(--gold)" />)}
                </div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.04em' }}>{char.name}</h1>
             </div>
          </div>
          <div style={{ flex: '1.2 1 300px', padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
              <span style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--cyber-cyan)', padding: '6px 18px', borderRadius: '50px', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.1em' }}>{char.game?.toUpperCase()}</span>
              <span style={{ background: 'rgba(255,255,255,0.03)', color: '#fff', padding: '6px 18px', borderRadius: '50px', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.1em', opacity: 0.5 }}>{char.element || 'NEUTRAL'}</span>
            </div>
            <h2 style={{ fontSize: '0.65rem', fontWeight: 900, opacity: 0.2, textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '25px' }}>Asset Specifications</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
               <div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.3, marginBottom: '8px' }}>ROLE</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{char.role || 'ASSET'}</div>
               </div>
               <div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.3, marginBottom: '8px' }}>TIER</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--cyber-cyan)' }}>LEVEL {char.rarity}</div>
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
  const accent = theme.accentColor || '#00f3ff';
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
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} style={{ width: '80px', height: '80px', border: '2px dashed rgba(0, 243, 255, 0.2)', borderTopColor: 'var(--cyber-cyan)', borderRadius: '50%', marginBottom: '40px' }} />
      <div style={{ fontSize: '0.85rem', fontWeight: 900, letterSpacing: '0.4em', color: 'var(--cyber-cyan)', textTransform: 'uppercase', textShadow: '0 0 15px rgba(0, 243, 255, 0.5)' }}>SYNCING UPLINK...</div>
    </div>
  );

  if (notFound || !p) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '0.5em', marginBottom: '30px', opacity: 0.5 }}>ID_NOT_FOUND</h2>
        <Link to="/leaderboard" className="btn-v3 btn-v3-ghost">RETURN TO ARCHIVES</Link>
      </div>
    </div>
  );

  return (
    <div className="portfolio-minimal" onClick={() => !isSpotify && !isPlaying && audioRef.current?.play().then(()=>setIsPlaying(true))} style={{ 
      '--accent': accent,
      backgroundImage: `url(${theme.background || DEFAULT_BG})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      minHeight: '100vh',
    }}>
      
      {canGoBack && <button onClick={() => navigate(-1)} className="portfolio-back-fb"><ArrowLeft size={20} /></button>}

      <div className="portfolio-hero-container">
        <div className="portfolio-banner-wrap">
          {theme.banner ? <img src={theme.banner} className="portfolio-banner-img" style={{ objectPosition: `center ${theme.bannerPosition || '50%'}` }} alt="Banner" /> : <div className="banner-placeholder" style={{ background: `linear-gradient(135deg, ${accent}20, #000)` }} />}
        </div>

        <div className="portfolio-identity-bar">
          <div className="portfolio-avatar-fb">
            {theme.avatar ? 
              <img src={theme.avatar} alt="Avatar" /> :
              p.avatar ? 
                <img src={`https://cdn.discordapp.com/avatars/${p.userId}/${p.avatar}.png`} alt="Avatar" /> :
                <div className="avatar-initial-fb">{p.username[0]}</div>
            }
          </div>

          <div className="portfolio-name-bio">
            <h1 className="portfolio-name-fb">{p.username}</h1>
            <div style={{ display: 'flex', gap: '15px', opacity: 0.5, fontWeight: 600, fontSize: '0.9rem' }}>
               <span>Level {p.level} Operative</span>
               <span>ID_{p.userId.slice(-6)}</span>
            </div>
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
            <p style={{ color: 'var(--text-dim)', marginBottom: '30px', fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{theme.bio || 'Operative bio pending...'}</p>
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
                <Star size={20} style={{ color: 'var(--cyber-yellow)' }} />
                <span>{p.star_dust?.toLocaleString() || 0} Star Dust</span>
              </div>
              <div className="zen-social-item">
                <Globe size={20} color="var(--cyber-cyan)" />
                <span>Resources: {p.balance?.toLocaleString() || 0} CC</span>
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
                    <motion.div key={idx} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="zen-portfolio-card">
                       {item.type === 'art' ? <div className="zen-art-display"><img src={item.url} alt={item.title} /></div> : 
                         <div className="zen-card-info">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}><Code size={20} style={{ color: accent }} /><span className="zen-card-name">{item.title}</span></div>
                            <p className="zen-card-desc">{item.description || 'Source protocols established.'}</p>
                            <a href={item.url} target="_blank" rel="noreferrer" className="btn-v3 btn-v3-ghost" style={{ marginTop: '20px', width: '100%', fontSize: '0.75rem' }}>VIEW_SOURCE</a>
                         </div>
                       }
                       {item.type === 'art' && <div className="zen-card-info"><span className="zen-card-name">{item.title}</span><a href={item.url} target="_blank" rel="noreferrer" className="btn-v3 btn-v3-ghost" style={{ marginTop: '15px', width: '100%', fontSize: '0.75rem' }}>OPEN_ARCHIVE</a></div>}
                    </motion.div>
                  )) : <div className="glass-panel empty-state-zen"><p>ARCHIVE_EMPTY</p></div>}
                </motion.div>
              )}

              {activeTab === 'favorites' && (
                <motion.div key="favorites" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="units-grid-fb">
                   {favorites.length > 0 ? favorites.map((fav, i) => (
                     <motion.div whileHover={{ translateY: -5 }} key={i} className="char-card-fb" onClick={() => fav.type === 'character' && setSelectedChar(fav)} style={{ cursor: fav.type === 'character' ? 'pointer' : 'default' }}>
                        <div className="char-visual-fb" style={{ width: '80px', height: '80px' }}>
                           {fav.type === 'character' ? (
                             <CharIcon name={fav.name} game={fav.game?.toLowerCase()} rarity={fav.rarity} />
                           ) : (
                             <img src={fav.sprite} alt={fav.name} className="char-icon-img" />
                           )}
                        </div>
                        <div className="char-name-fb" style={{ fontSize: '0.8rem' }}>{fav.name}</div>
                        <div className="zen-type-tag">{fav.type.toUpperCase()}</div>
                     </motion.div>
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
