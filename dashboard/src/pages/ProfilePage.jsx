import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Trophy, Coins, Star, Dog, Sparkles, ArrowLeft,
  Share2, Zap, Heart, History, Box, Filter, Terminal,
  Layers, BarChart3, Globe, Award, Crosshair, Activity, PawPrint,
  Instagram, Twitter, Github, ExternalLink, Music, Volume2, VolumeX,
  Code, Image as ImageIcon, Mail, MessageSquare, ShoppingBag, ChevronLeft, ChevronRight, Edit3
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

export default function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('portfolio');
  
  // Shop State
  const [shopData, setShopData] = useState([]);
  const [shopPage, setShopPage] = useState(1);
  const [shopPages, setShopPages] = useState(1);
  const [shopLoading, setShopLoading] = useState(false);
  const [shopFilter, setShopFilter] = useState({ game: 'all', rarity: 'all', search: '' });

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

  // Load Shop Data
  useEffect(() => {
    if (activeTab === 'shop') {
      setShopLoading(true);
      const params = new URLSearchParams({
        page: shopPage.toString(),
        game: shopFilter.game,
        rarity: shopFilter.rarity,
        search: shopFilter.search
      });
      fetch(`/api/shop/characters?${params}`)
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            setShopData(res.data);
            setShopPages(res.pages);
          }
          setShopLoading(false);
        });
    }
  }, [activeTab, shopPage, shopFilter]);

  const theme = p?.profileTheme || {};
  const accent = theme.accentColor || '#22d3ee';
  const portfolio = theme.portfolio || [];

  const isSpotify = theme.music?.includes('spotify.com');
  const spotifyTrackId = isSpotify ? theme.music.split('/').pop()?.split('?')[0] : null;
  const spotifyEmbedUrl = spotifyTrackId ? `https://open.spotify.com/embed/track/${spotifyTrackId}?utm_source=generator&theme=0` : null;

  useEffect(() => {
    if (!loading && theme.music && !isSpotify && audioRef.current) {
        audioRef.current.volume = 0.15;
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [loading, theme.music, isSpotify]);

  const handleBuy = async (charName) => {
    if (!window.confirm(`Exchange Star Dust for ${charName}?`)) return;
    try {
      const res = await fetch('/api/shop/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterName: charName })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setP(prev => ({ ...prev, star_dust: data.newBalance }));
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("Network error protocols failed.");
    }
  };

  const getSocialHandle = (url) => {
    if (!url) return '';
    if (!url.includes('/')) return url;
    return url.split('/').filter(Boolean).pop();
  };

  if (loading) return <div className="profile-loading-screen"><div className="glitch-text">SYNCING_UPLINK...</div></div>;
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
              <Link to="/dashboard" className="share-btn-sidebar" style={{ backgroundColor: accent, color: '#000', borderColor: accent }}>
                <Edit3 size={18} />
                <span>EDIT PROFILE</span>
              </Link>
            )}
            <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(()=>setCopied(false), 2000); }} className="share-btn-sidebar">
              <Share2 size={20} />
              <span>{copied ? 'COPIED' : 'SHARE'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="portfolio-content-wrap">
        <aside className="portfolio-zen-sidebar">
          <div className="zen-info-card">
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
             <button onClick={() => setActiveTab('shop')} className={`p-tab-fb ${activeTab === 'shop' ? 'active' : ''}`}>Resonator Shop</button>
          </div>

          <div className="portfolio-tab-content">
            <AnimatePresence mode="wait">
              {activeTab === 'portfolio' && (
                <motion.div key="portfolio" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="portfolio-items-grid-zen">
                  {portfolio.length > 0 ? portfolio.map((item, idx) => (
                    <motion.div key={idx} variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }} className="zen-portfolio-card">
                       {item.type === 'art' ? <div className="zen-art-display"><img src={item.url} alt={item.title} /></div> : 
                         <div className="zen-card-info">
                            <div className="repo-header-new"><Code size={20} style={{ color: accent }} /><span className="zen-card-name">{item.title}</span></div>
                            <p className="zen-card-desc">{item.description || 'Source protocols established.'}</p>
                            <a href={item.url} target="_blank" rel="noreferrer" className="repo-link-new">VIEW_SOURCE</a>
                         </div>
                       }
                       {item.type === 'art' && <div className="zen-card-info"><span className="zen-card-name">{item.title}</span><a href={item.url} target="_blank" rel="noreferrer" className="repo-link-new">OPEN_ARCHIVE</a></div>}
                    </motion.div>
                  )) : <div className="empty-portfolio-new" style={{ gridColumn: '1/-1', opacity: 0.1 }}><p>ARCHIVE_EMPTY</p></div>}
                </motion.div>
              )}

              {activeTab === 'shop' && (
                <motion.div key="shop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                   <div className="shop-filters" style={{ display: 'flex', gap: '15px', marginBottom: '30px', opacity: 0.5 }}>
                      <input type="text" placeholder="Search operatives..." value={shopFilter.search} onChange={e => { setShopFilter({...shopFilter, search: e.target.value}); setShopPage(1); }} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '10px 20px', borderRadius: '10px', color: '#fff', fontSize: '0.8rem' }} />
                      <select value={shopFilter.game} onChange={e => { setShopFilter({...shopFilter, game: e.target.value}); setShopPage(1); }} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '10px', borderRadius: '10px', color: '#fff' }}>
                        <option value="all">All Games</option>
                        <option value="genshin">Genshin</option>
                        <option value="hsr">HSR</option>
                        <option value="wuwa">WuWa</option>
                        <option value="zzz">ZZZ</option>
                      </select>
                   </div>

                   <div className="units-grid-fb">
                      {shopData.map((c, i) => (
                        <div key={i} className={`char-card-fb ${c.rarity === '5' ? 'r5' : ''}`}>
                           <div className="char-visual-fb"><CharIcon name={c.name} game={c.game?.toLowerCase()} rarity={c.rarity} /></div>
                           <div className="char-name-fb">{c.name}</div>
                           <button onClick={() => handleBuy(c.name)} className="repo-link-new" style={{ marginTop: '15px', width: '100%', borderColor: c.rarity === '5' ? '#fbbf24' : accent }}>
                              {c.price} DUST
                           </button>
                        </div>
                      ))}
                   </div>

                   <div className="shop-pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '50px' }}>
                      <button disabled={shopPage === 1} onClick={() => setShopPage(p => p - 1)} className="p-tab-fb"><ChevronLeft size={20} /></button>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, opacity: 0.3 }}>PAGE {shopPage} / {shopPages}</span>
                      <button disabled={shopPage === shopPages} onClick={() => setShopPage(p => p + 1)} className="p-tab-fb"><ChevronRight size={20} /></button>
                   </div>
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
    </div>
  );
}

function StatBox({ label, value }) {
  return <div className="stat-box-fb"><span className="stat-lbl-fb">{label}</span><span className="stat-val-fb">{value}</span></div>;
}

function UnitCard({ char }) {
  return (
    <div className={`char-card-fb ${char.rarity === '5' ? 'r5' : ''}`}>
       <div className="char-visual-fb"><CharIcon name={char.name} game={char.game?.toLowerCase()} rarity={char.rarity} emoji={char.emoji} /></div>
       <div className="char-name-fb">{char.name}</div>
    </div>
  );
}
