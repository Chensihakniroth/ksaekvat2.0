import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, Share2, Edit3, X, ExternalLink, MessageSquare, 
  Instagram, Twitter, Github, Facebook, Linkedin, Music as SpotifyIcon,
  ExternalLink as LinkIcon, Globe, Volume2, VolumeX, Code, 
  Image as ImageIcon, ArrowLeft
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
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '120px 20px 100px'
    }}>
      
      {canGoBack && <button onClick={() => navigate(-1)} style={{ position: 'fixed', top: '100px', left: '40px', zIndex: 100, width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)' }}><ArrowLeft size={20} /></button>}

      <div className="discord-profile-card" style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '700px', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(40px)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
        {/* Banner */}
        <div style={{ height: '240px', backgroundColor: accent, backgroundImage: theme.banner ? `url(${theme.banner})` : 'none', backgroundSize: 'cover', backgroundPosition: `center ${theme.bannerPosition || '50%'}`, position: 'relative' }}>
          {isOwner && (
            <Link to="/dashboard" style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '50%', color: '#fff', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', transition: '0.3s' }}>
              <Edit3 size={18} />
            </Link>
          )}
        </div>

        {/* Profile Header */}
        <div style={{ padding: '0 40px 40px', position: 'relative' }}>
          <div style={{ position: 'relative', marginTop: '-80px', marginBottom: '25px' }}>
            <div style={{ width: '140px', height: '140px', borderRadius: '50%', border: '10px solid rgba(10,10,10,1)', background: '#111', overflow: 'hidden', boxShadow: '0 15px 30px rgba(0,0,0,0.4)' }}>
              {theme.avatar ? 
                <img src={theme.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                p.avatar ? 
                  <img src={`https://cdn.discordapp.com/avatars/${p.userId}/${p.avatar}.png`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', fontWeight: 200, opacity: 0.2 }}>{p.username[0]}</div>
              }
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em', color: '#fff', marginBottom: '8px' }}>{p.username}</h1>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', opacity: 0.5, fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                <span style={{ color: 'var(--cyber-cyan)' }}>LVL {p.level} OPERATIVE</span>
                <span>•</span>
                <span>ID_{p.userId.slice(-6)}</span>
              </div>
            </div>
            
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(()=>setCopied(false), 2000); }} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px 24px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer', transition: '0.3s' }}>
              {copied ? 'COPIED UPLINK' : 'SHARE PROFILE'}
            </button>
          </div>

          {/* Socials & Bio */}
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '25px' }}>
            {theme.socials && Object.entries(theme.socials).map(([key, val]) => (
              val && (
                <a key={key} href={val.startsWith('http') ? val : `https://${key}.com/${val}`} target="_blank" rel="noreferrer" title={key} style={{ color: 'rgba(255,255,255,0.4)', transition: '0.3s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
                  {SOCIAL_ICONS[key] || <LinkIcon size={20}/>}
                </a>
              )
            ))}
          </div>

          {/* Bio & Stats */}
          <div style={{ marginTop: '30px', padding: '30px', borderRadius: '20px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.02)' }}>
            <h3 style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', opacity: 0.2, marginBottom: '20px' }}>Established Bio</h3>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.7)', whiteSpace: 'pre-wrap', fontWeight: 400 }}>{theme.bio || 'Operative has not yet transmitted a personal bio protocol.'}</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '30px', marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '30px' }}>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 900, opacity: 0.2, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '8px' }}>Current Resources</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--cyber-yellow)' }}>{p.balance?.toLocaleString() || 0} CC</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 900, opacity: 0.2, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '8px' }}>Star Dust Index</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--cyber-cyan)' }}>{p.star_dust?.toLocaleString() || 0}</div>
              </div>
            </div>
          </div>

          {/* Tabs Container */}
          <div style={{ marginTop: '50px' }}>
            <div style={{ display: 'flex', gap: '40px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '35px' }}>
              <button onClick={() => setActiveTab('portfolio')} style={{ background: 'none', border: 'none', padding: '15px 0', fontSize: '0.85rem', fontWeight: 900, letterSpacing: '0.2em', color: activeTab === 'portfolio' ? 'var(--cyber-cyan)' : 'rgba(255,255,255,0.2)', borderBottom: activeTab === 'portfolio' ? `3px solid var(--cyber-cyan)` : '3px solid transparent', cursor: 'pointer', transition: '0.3s' }}>PORTFOLIO</button>
              <button onClick={() => setActiveTab('favorites')} style={{ background: 'none', border: 'none', padding: '15px 0', fontSize: '0.85rem', fontWeight: 900, letterSpacing: '0.2em', color: activeTab === 'favorites' ? 'var(--cyber-yellow)' : 'rgba(255,255,255,0.2)', borderBottom: activeTab === 'favorites' ? `3px solid var(--cyber-yellow)` : '3px solid transparent', cursor: 'pointer', transition: '0.3s' }}>FAVORITES</button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'portfolio' && (
                <motion.div key="portfolio" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {portfolio.length > 0 ? portfolio.map((item, idx) => (
                    <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} key={idx} className="glass-panel" style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.03)', background: 'rgba(255,255,255,0.01)' }}>
                       {item.type === 'art' && <img src={item.url} alt={item.title} style={{ width: '100%', height: '180px', objectFit: 'cover', borderBottom: '1px solid rgba(255,255,255,0.03)' }} />}
                       <div style={{ padding: '25px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                            {item.type === 'github' ? <Github size={18} color="var(--cyber-cyan)" /> : <ImageIcon size={18} color="var(--cyber-cyan)" />}
                            <span style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>{item.title}</span>
                          </div>
                          <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--cyber-cyan)', textDecoration: 'none', letterSpacing: '0.1em' }}>VIEW_ARCHIVE_DATA</a>
                       </div>
                    </motion.div>
                  )) : <div style={{ textAlign: 'center', padding: '60px', opacity: 0.2, fontSize: '0.8rem', letterSpacing: '0.4em', width: '100%', gridColumn: '1/-1' }}>ARCHIVE_EMPTY</div>}
                </motion.div>
              )}

              {activeTab === 'favorites' && (
                <motion.div key="favorites" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
                   {favorites.length > 0 ? favorites.map((fav, i) => (
                     <motion.div whileHover={{ translateY: -5 }} key={i} className="glass-panel" onClick={() => fav.type === 'character' && setSelectedChar(fav)} style={{ padding: '25px', borderRadius: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.03)', cursor: fav.type === 'character' ? 'pointer' : 'default', background: 'rgba(255,255,255,0.01)' }}>
                        <div style={{ width: '90px', height: '90px', margin: '0 auto 20px' }}>
                           {fav.type === 'character' ? (
                             <CharIcon name={fav.name} game={fav.game?.toLowerCase()} rarity={fav.rarity} />
                           ) : (
                             <img src={fav.sprite} alt={fav.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                           )}
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>{fav.name}</div>
                        <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.3, marginTop: '8px', letterSpacing: '0.1em' }}>{fav.type.toUpperCase()}</div>
                     </motion.div>
                   )) : (
                     <div style={{ textAlign: 'center', padding: '60px', gridColumn: '1/-1', opacity: 0.2, fontSize: '0.8rem', letterSpacing: '0.4em' }}>NO_FAVORITES_INDEXED</div>
                   )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {theme.music && !isSpotify && (
        <div style={{ position: 'fixed', bottom: '40px', right: '40px', zIndex: 1000 }}>
          <button onClick={() => { if(audioRef.current) { if(isPlaying) audioRef.current.pause(); else audioRef.current.play(); setIsPlaying(!isPlaying); }}} style={{ padding: '14px 28px', borderRadius: '50px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255,255,255,0.1)', color: isPlaying ? 'var(--cyber-cyan)' : 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '15px', letterSpacing: '0.15em', cursor: 'pointer', transition: '0.3s', boxShadow: isPlaying ? '0 0 20px rgba(0,243,255,0.2)' : 'none' }}>
            {isPlaying ? <Volume2 size={18} /> : <VolumeX size={18} />}
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
