import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Palette,
  User,
  Globe,
  Music,
  Save,
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Plus,
  Trash2,
  Github,
  Upload,
  Heart,
  Bot,
  Terminal,
  Shield,
  Activity,
  Cpu,
  Layers,
  HelpCircle,
  Hash,
  MessageSquare
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  // Form State
  const [formData, setFormData] = useState({
    bio: '',
    accentColor: '#22d3ee',
    avatar: '',
    slug: '',
    background: '',
    banner: '',
    bannerPosition: '50%',
    music: '',
    showStats: true,
    showInventory: true,
    portfolio: [],
    favorites: [],
    customPrefix: '',
    customSubPrefix: '',
    publicLeaderboard: true,
    dmOnLevelUp: true,
    compactLogs: false,
    socials: {
      discord: '',
      instagram: '',
      twitter: '',
      github: '',
      facebook: '',
      spotify: '',
      linkedin: '',
      website: '',
    },
  });

  // Simulated Bot Shard Server Configuration States
  const [selectedGuild, setSelectedGuild] = useState('1');
  const [serverConfigs, setServerConfigs] = useState({
    '1': {
      name: 'KSAEKVAT Official Support',
      icon: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=150',
      prefix: 'k!',
      welcomeEnabled: true,
      welcomeChannel: 'welcome-gate',
      welcomeMessage: 'Welcome to the digital sector, {user}! Sync complete. (｡♥‿♥｡)',
      loggingEnabled: true,
      logChannel: 'audit-log',
      modules: {
        rpg: true,
        economy: true,
        gacha: true,
        hunting: true,
        aiChat: true,
      }
    },
    '2': {
      name: "Momo's Retro Lounge",
      icon: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=150',
      prefix: 'K',
      welcomeEnabled: false,
      welcomeChannel: 'general',
      welcomeMessage: 'Hello {user}! Hope you enjoy your stay in Retro Lounge.',
      loggingEnabled: false,
      logChannel: 'logs',
      modules: {
        rpg: true,
        economy: true,
        gacha: false,
        hunting: true,
        aiChat: false,
      }
    }
  });

  // Creator Control Console System Actions Logs
  const [consoleLogs, setConsoleLogs] = useState([
    '[SYSTEM] Kernel core initialized successfully.',
    '[MONITOR] CPU load optimal at 0.8%. Connected database pool: 12 units.',
    '[WEBSOCKET] Shards established and active. Ping: 24ms.'
  ]);
  const [consoleInput, setConsoleInput] = useState('');

  useEffect(() => {
    if (user) {
      fetch(`/api/profile/${user.id}`)
        .then((r) => r.json())
        .then((res) => {
          if (res.success) {
            const pt = res.data.profileTheme || {};
            setProfile(res.data);
            setFormData({
              bio: pt.bio || '',
              accentColor: pt.accentColor || '#22d3ee',
              avatar: pt.avatar || '',
              slug: pt.slug || '',
              background: pt.background || '',
              banner: pt.banner || '',
              bannerPosition: pt.bannerPosition || '50%',
              music: pt.music || '',
              showStats: pt.showStats !== undefined ? pt.showStats : true,
              showInventory: pt.showInventory !== undefined ? pt.showInventory : true,
              portfolio: pt.portfolio || [],
              favorites: pt.favorites || [],
              customPrefix: res.data.customPrefix || '',
              customSubPrefix: res.data.customSubPrefix || '',
              publicLeaderboard: pt.publicLeaderboard !== undefined ? pt.publicLeaderboard : true,
              dmOnLevelUp: pt.dmOnLevelUp !== undefined ? pt.dmOnLevelUp : true,
              compactLogs: pt.compactLogs !== undefined ? pt.compactLogs : false,
              socials: pt.socials || {
                discord: '',
                instagram: '',
                twitter: '',
                github: '',
                facebook: '',
                spotify: '',
                linkedin: '',
                website: '',
              },
            });
          }
          setLoading(false);
        });
    }
  }, [user]);

  const addFavorite = () => {
    setFormData((prev) => ({
      ...prev,
      favorites: [...prev.favorites, { type: 'character', name: '' }],
    }));
  };

  const updateFavorite = (index, field, value) => {
    setFormData((prev) => {
      const newF = [...prev.favorites];
      newF[index] = { ...newF[index], [field]: value };
      return { ...prev, favorites: newF };
    });
  };

  const removeFavorite = (index) => {
    setFormData((prev) => ({
      ...prev,
      favorites: prev.favorites.filter((_, i) => i !== index),
    }));
  };

  const addPortfolioItem = () => {
    setFormData((prev) => ({
      ...prev,
      portfolio: [...prev.portfolio, { type: 'github', title: '', url: '', description: '' }],
    }));
  };

  const updatePortfolioItem = (index, field, value) => {
    setFormData((prev) => {
      const newP = [...prev.portfolio];
      newP[index] = { ...newP[index], [field]: value };
      return { ...prev, portfolio: newP };
    });
  };

  const removePortfolioItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      portfolio: prev.portfolio.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Settings updated successfully! (｡♥‿♥｡)' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update settings.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error occurred.' });
    }
    setSaving(false);
  };

  const updateSocial = (key, val) => {
    setFormData((prev) => ({
      ...prev,
      socials: { ...prev.socials, [key]: val },
    }));
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      return setMessage({ type: 'error', text: 'File too large! Max 15MB.' });
    }

    setUploading(true);
    setMessage({ type: 'success', text: 'Uploading neural audio data... (｡♥‿♥｡)' });

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const res = await fetch('/api/profile/upload-mp3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Audio: reader.result }),
        });
        const data = await res.json();
        if (data.success) {
          setFormData((prev) => ({ ...prev, music: data.url }));
          setMessage({ type: 'success', text: 'Audio uploaded successfully!' });
        } else {
          setMessage({ type: 'error', text: data.error || 'Upload failed.' });
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Network error during upload.' });
      }
      setUploading(false);
    };
  };

  // Bot configuration helper functions (Simulated)
  const handleServerSave = () => {
    setMessage({ type: 'success', text: `Server [${serverConfigs[selectedGuild].name}] configuration updated successfully! ＼(≧▽≦)／` });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleServerConfigChange = (field, val) => {
    setServerConfigs(prev => ({
      ...prev,
      [selectedGuild]: {
        ...prev[selectedGuild],
        [field]: val
      }
    }));
  };

  const handleServerModuleChange = (moduleKey, val) => {
    setServerConfigs(prev => ({
      ...prev,
      [selectedGuild]: {
        ...prev[selectedGuild],
        modules: {
          ...prev[selectedGuild].modules,
          [moduleKey]: val
        }
      }
    }));
  };

  // Creator trigger simulated commands
  const handleConsoleSubmit = (e) => {
    e.preventDefault();
    if (!consoleInput.trim()) return;
    const cmd = consoleInput.toLowerCase().trim();
    let resp = '';

    if (cmd === 'clear') {
      setConsoleLogs([]);
      setConsoleInput('');
      return;
    } else if (cmd === 'reload') {
      resp = '[SYSTEM] Commencing commands registry flush... Loaded 38 standard and custom modules successfully.';
    } else if (cmd === 'shard status') {
      resp = '[MONITOR] All shards operational. Shard #0: active (Ping: 24ms). Shard #1: active (Ping: 22ms).';
    } else if (cmd === 'flush cache') {
      resp = '[CDN] Cleared sprite buffer registers. Flushed 1,280 entries cleanly.';
    } else {
      resp = `[ERROR] Unknown matrix control command "${cmd}". Try: "reload", "shard status", "flush cache", or "clear".`;
    }

    setConsoleLogs(prev => [...prev, `> ${consoleInput}`, resp]);
    setConsoleInput('');
  };

  if (loading)
    return (
      <div
        className="p-8 text-center opacity-50"
        style={{ letterSpacing: '0.2em', fontSize: '0.8rem', marginTop: '100px', color: 'var(--text-muted)' }}
      >
        SYNCHRONIZING SYSTEM CORES...
      </div>
    );

  return (
    <div
      className="wrap"
      style={{ paddingTop: '100px', paddingBottom: '80px', maxWidth: '1000px' }}
    >
      <header style={{ marginBottom: '30px', textAlign: 'center' }}>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            fontSize: '2rem',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            marginBottom: '5px',
          }}
        >
          KSAEKVAT CONTROL PANEL
        </motion.h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 300 }}>
          Manage your synchronized profile page, fine-tune bot preferences, and review server configurations.
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        {/* --- LEFT: PREVIEW & NAVIGATION --- */}
        <div
          style={{
            position: 'sticky',
            top: '100px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
          }}
        >
          {/* Real-time mini profile preview */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="matte-card"
            style={{
              padding: 0,
              overflow: 'hidden',
              borderRadius: '16px',
              border: '1px solid var(--border-matte)',
            }}
          >
            <div
              style={{
                height: '100px',
                backgroundColor: formData.accentColor,
                backgroundImage: formData.banner ? `url(${formData.banner})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: `center ${formData.bannerPosition}`,
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  bottom: '-30px',
                  left: '20px',
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  border: '3px solid #0b0b0c',
                  overflow: 'hidden',
                  background: '#0b0b0c',
                }}
              >
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt="Avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : user?.avatar ? (
                  <img
                    src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
                    alt="Avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 300,
                      opacity: 0.5,
                    }}
                  >
                    {user?.username[0]}
                  </div>
                )}
              </div>
            </div>
            <div style={{ padding: '40px 20px 20px' }}>
              <h3
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  marginBottom: '5px',
                }}
              >
                {user?.username}
              </h3>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                  marginBottom: '15px',
                }}
              >
                {formData.bio || 'Exploring the digital sector...'}
              </p>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '50px',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  color: formData.accentColor,
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: formData.accentColor,
                  }}
                />
                {formData.accentColor}
              </div>
            </div>
          </motion.div>

          {/* Premium High-End Navigation Menu */}
          <div
            className="matte-card"
            style={{
              padding: '10px',
              borderRadius: '16px',
              border: '1px solid var(--border-matte)',
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
            }}
          >
            <button
              onClick={() => { setActiveTab('profile'); setMessage(null); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 15px',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: activeTab === 'profile' ? 900 : 500,
                background: activeTab === 'profile' ? 'rgba(255,255,255,0.06)' : 'transparent',
                border: 'none',
                color: activeTab === 'profile' ? '#fff' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: '0.3s',
              }}
            >
              <User size={16} />
              <span>Profile & Theme</span>
            </button>
            <button
              onClick={() => { setActiveTab('bot'); setMessage(null); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 15px',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: activeTab === 'bot' ? 900 : 500,
                background: activeTab === 'bot' ? 'rgba(255,255,255,0.06)' : 'transparent',
                border: 'none',
                color: activeTab === 'bot' ? '#fff' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: '0.3s',
              }}
            >
              <Settings size={16} />
              <span>Bot Preferences</span>
            </button>
            <button
              onClick={() => { setActiveTab('server'); setMessage(null); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 15px',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: activeTab === 'server' ? 900 : 500,
                background: activeTab === 'server' ? 'rgba(255,255,255,0.06)' : 'transparent',
                border: 'none',
                color: activeTab === 'server' ? '#fff' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: '0.3s',
              }}
            >
              <Bot size={16} />
              <span>Server Configuration</span>
            </button>
            {user?.id === '703266672022388789' && (
              <button
                onClick={() => { setActiveTab('creator'); setMessage(null); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 15px',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  fontWeight: activeTab === 'creator' ? 900 : 500,
                  background: activeTab === 'creator' ? 'rgba(255, 223, 0, 0.05)' : 'transparent',
                  border: 'none',
                  color: activeTab === 'creator' ? '#ffd700' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: '0.3s',
                }}
              >
                <Terminal size={16} />
                <span>Creator Control</span>
              </button>
            )}
          </div>

          <div
            className="matte-card"
            style={{
              padding: '15px 20px',
              borderRadius: '16px',
              border: '1px solid var(--border-matte)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              <Globe size={14} color="rgba(255,255,255,0.5)" />
              <span>
                Network Status: <span style={{ color: '#4ade80' }}>ONLINE</span>
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={14} color="rgba(255,255,255,0.5)" />
              <span>Identity Verified</span>
            </div>
          </div>
        </div>

        {/* --- RIGHT: DYNAMIC CONTENT PANEL --- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {message && (
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              style={{
                padding: '12px 20px',
                borderRadius: '12px',
                background:
                  message.type === 'success' ? 'rgba(74, 222, 128, 0.08)' : 'rgba(255, 59, 92, 0.08)',
                border: `1px solid ${message.type === 'success' ? 'rgba(74, 222, 128, 0.3)' : 'rgba(255, 59, 92, 0.3)'}`,
                color: message.type === 'success' ? '#4ade80' : '#ff3b5c',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.8rem',
                fontWeight: 800,
              }}
            >
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{message.text}</span>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {/* ==================== TAB 1: PROFILE & CUSTOMIZATION ==================== */}
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
              >
                {/* Clean, high-tech sync notice for profile assets */}
                <div
                  className="matte-card"
                  style={{
                    padding: '15px 20px',
                    borderRadius: '16px',
                    border: '1px solid rgba(74, 222, 128, 0.15)',
                    background: 'rgba(74, 222, 128, 0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                  }}
                >
                  <Shield size={24} color="#4ade80" style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#4ade80' }}>
                      Discord Identity Synced
                    </h4>
                    <p style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: '3px', lineHeight: 1.4 }}>
                      Your avatar, banner, and custom avatar decoration are fetched live via your Discord account. 
                      Any changes made in your Discord client are synchronized here immediately.
                    </p>
                  </div>
                </div>

                <section
                  className="matte-card"
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-matte)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '15px',
                      opacity: 0.8,
                    }}
                  >
                    <User size={16} />
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Identity & Access
                    </h3>
                  </div>

                  <div className="input-group" style={{ marginBottom: '20px', gap: '4px' }}>
                    <label style={{ fontSize: '0.65rem' }}>Custom Profile URL Slug</label>
                    <div className="icon-input">
                      <span style={{ position: 'absolute', left: '15px', fontSize: '0.75rem', opacity: 0.3 }}>
                        /profile/
                      </span>
                      <input
                        type="text"
                        placeholder="your-unique-slug"
                        value={formData.slug}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''),
                          })
                        }
                        className="matte-input"
                        style={{ paddingLeft: '75px', fontSize: '0.75rem' }}
                      />
                    </div>
                    <p style={{ fontSize: '0.6rem', opacity: 0.4, marginTop: '5px' }}>
                      Example: ksaekvat.up.railway.app/profile/{formData.slug || 'username'}
                    </p>
                  </div>

                  <div className="input-group" style={{ marginBottom: 0, gap: '4px' }}>
                    <label style={{ fontSize: '0.65rem' }}>About Me (Bio)</label>
                    <textarea
                      placeholder="Tell the world about yourself..."
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="matte-input"
                      style={{
                        minHeight: '80px',
                        resize: 'vertical',
                        background: 'rgba(255,255,255,0.02)',
                        padding: '15px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                      }}
                    />
                  </div>
                </section>

                <section
                  className="matte-card"
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-matte)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '15px',
                      opacity: 0.8,
                    }}
                  >
                    <Palette size={16} />
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Visual Aesthetic
                    </h3>
                  </div>
                  <div className="input-row" style={{ gap: '15px', marginBottom: '15px' }}>
                    <div className="input-group" style={{ marginBottom: 0, gap: '4px' }}>
                      <label style={{ fontSize: '0.65rem' }}>Accent Color</label>
                      <div className="color-picker-wrap">
                        <input
                          type="color"
                          value={formData.accentColor}
                          onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                          style={{ width: '30px', height: '30px' }}
                        />
                        <input
                          type="text"
                          value={formData.accentColor}
                          onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                          className="matte-input"
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        />
                      </div>
                    </div>
                    <div className="input-group" style={{ marginBottom: 0, gap: '4px' }}>
                      <label style={{ fontSize: '0.65rem' }}>Portfolio Background URL</label>
                      <div className="icon-input">
                        <ImageIcon size={12} />
                        <input
                          type="text"
                          placeholder="https://..."
                          value={formData.background}
                          onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                          className="matte-input"
                          style={{ padding: '6px 12px 6px 35px', fontSize: '0.75rem' }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="input-group" style={{ marginBottom: 0, gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: '0.65rem' }}>Discord Banner Vertical Position</label>
                      <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>{formData.bannerPosition}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={formData.bannerPosition.replace('%', '')}
                      onChange={(e) => setFormData({ ...formData, bannerPosition: e.target.value + '%' })}
                      style={{ width: '100%', cursor: 'pointer', accentColor: '#fff' }}
                    />
                  </div>
                </section>

                <section
                  className="matte-card"
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-matte)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '15px',
                      opacity: 0.8,
                    }}
                  >
                    <Music size={16} />
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Atmospheric Audio
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="icon-input">
                      <Music size={12} />
                      <input
                        type="text"
                        placeholder="Spotify Track URL or Direct MP3 Link"
                        value={formData.music}
                        onChange={(e) => setFormData({ ...formData, music: e.target.value })}
                        className="matte-input"
                        style={{ padding: '6px 12px 6px 35px', fontSize: '0.75rem' }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <label
                        className={`matte-btn ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                        style={{ flex: '1 1 auto', cursor: 'pointer', padding: '8px 15px', fontSize: '0.7rem' }}
                      >
                        <Upload size={14} />
                        <span>{uploading ? 'UPLOADING...' : 'UPLOAD OWN MP3'}</span>
                        <input type="file" accept="audio/mpeg" onChange={handleAudioUpload} hidden />
                      </label>
                      {formData.music && (
                        <span style={{ fontSize: '0.65rem', opacity: 0.4, maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {formData.music}
                        </span>
                      )}
                    </div>
                  </div>
                </section>

                <section
                  className="matte-card"
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-matte)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '15px',
                      opacity: 0.8,
                    }}
                  >
                    <LinkIcon size={16} />
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Social Uplinks
                    </h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                    {['discord', 'instagram', 'twitter', 'github', 'facebook', 'spotify', 'linkedin', 'website'].map((s) => (
                      <div key={s} className="input-group" style={{ marginBottom: 0, gap: '4px' }}>
                        <label style={{ textTransform: 'capitalize', fontSize: '0.65rem' }}>{s}</label>
                        <input
                          type="text"
                          placeholder={`${s} handle/link`}
                          value={formData.socials[s] || ''}
                          onChange={(e) => updateSocial(s, e.target.value)}
                          className="matte-input"
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        />
                      </div>
                    ))}
                  </div>
                </section>

                <section
                  className="matte-card"
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-matte)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '15px',
                      opacity: 0.8,
                    }}
                  >
                    <Heart size={16} />
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Favorite Assets
                    </h3>
                    <button
                      onClick={addFavorite}
                      style={{
                        marginLeft: 'auto',
                        fontSize: '0.65rem',
                        background: 'rgba(255, 255, 255, 0.04)',
                        color: 'rgba(255,255,255,0.5)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        border: '1px solid var(--border-matte)',
                        cursor: 'pointer',
                        transition: '0.3s',
                      }}
                    >
                      <Plus size={10} /> Add
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {formData.favorites.map((item, idx) => (
                      <div
                        key={idx}
                        className="matte-card"
                        style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--border-matte)', position: 'relative' }}
                      >
                        <button
                          onClick={() => removeFavorite(idx)}
                          style={{ position: 'absolute', top: '12px', right: '12px', color: '#ff3b5c', opacity: 0.5, background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <Trash2 size={12} />
                        </button>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', paddingRight: '20px' }}>
                          <div className="input-group" style={{ marginBottom: 0, gap: '4px' }}>
                            <label style={{ fontSize: '0.6rem' }}>Type</label>
                            <select
                              value={item.type}
                              onChange={(e) => updateFavorite(idx, 'type', e.target.value)}
                              className="matte-input"
                              style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                            >
                              <option value="character">Resonator</option>
                              <option value="animal">Specimen</option>
                            </select>
                          </div>
                          <div className="input-group" style={{ marginBottom: 0, gap: '4px' }}>
                            <label style={{ fontSize: '0.6rem' }}>Exact Name</label>
                            <input
                              type="text"
                              placeholder="Name"
                              value={item.name}
                              onChange={(e) => updateFavorite(idx, 'name', e.target.value)}
                              className="matte-input"
                              style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {formData.favorites.length === 0 && (
                      <p style={{ textAlign: 'center', opacity: 0.3, padding: '10px 0', fontSize: '0.65rem', fontStyle: 'italic' }}>
                        No favorite assets indexed.
                      </p>
                    )}
                  </div>
                </section>

                <section
                  className="matte-card"
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-matte)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '15px',
                      opacity: 0.8,
                    }}
                  >
                    <LinkIcon size={16} />
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Portfolio Assets
                    </h3>
                    <button
                      onClick={addPortfolioItem}
                      style={{
                        marginLeft: 'auto',
                        fontSize: '0.65rem',
                        background: 'rgba(255, 255, 255, 0.04)',
                        color: 'rgba(255,255,255,0.5)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        border: '1px solid var(--border-matte)',
                        cursor: 'pointer',
                        transition: '0.3s',
                      }}
                    >
                      <Plus size={10} /> Add
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {formData.portfolio.map((item, idx) => (
                      <div
                        key={idx}
                        className="matte-card"
                        style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--border-matte)', position: 'relative' }}
                      >
                        <button
                          onClick={() => removePortfolioItem(idx)}
                          style={{ position: 'absolute', top: '12px', right: '12px', color: '#ff3b5c', opacity: 0.5, background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <Trash2 size={12} />
                        </button>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', paddingRight: '20px' }}>
                          <div className="input-group" style={{ marginBottom: 0, gap: '4px' }}>
                            <label style={{ fontSize: '0.6rem' }}>Type</label>
                            <select
                              value={item.type}
                              onChange={(e) => updatePortfolioItem(idx, 'type', e.target.value)}
                              className="matte-input"
                              style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                            >
                              <option value="github">GitHub</option>
                              <option value="art">Artwork</option>
                            </select>
                          </div>
                          <div className="input-group" style={{ marginBottom: 0, gap: '4px' }}>
                            <label style={{ fontSize: '0.6rem' }}>Title</label>
                            <input
                              type="text"
                              placeholder="Title"
                              value={item.title}
                              onChange={(e) => updatePortfolioItem(idx, 'title', e.target.value)}
                              className="matte-input"
                              style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                            />
                          </div>
                        </div>
                        <div className="input-group" style={{ marginTop: '10px', marginBottom: 0, gap: '4px' }}>
                          <label style={{ fontSize: '0.6rem' }}>URL</label>
                          <input
                            type="text"
                            placeholder="https://..."
                            value={item.url}
                            onChange={(e) => updatePortfolioItem(idx, 'url', e.target.value)}
                            className="matte-input"
                            style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                          />
                        </div>
                      </div>
                    ))}
                    {formData.portfolio.length === 0 && (
                      <p style={{ textAlign: 'center', opacity: 0.3, padding: '10px 0', fontSize: '0.65rem', fontStyle: 'italic' }}>
                        No portfolio items added.
                      </p>
                    )}
                  </div>
                </section>

                <section
                  className="matte-card"
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-matte)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '15px',
                      opacity: 0.8,
                    }}
                  >
                    <Eye size={16} />
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Privacy & Visibility
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div
                      onClick={() => setFormData({ ...formData, showStats: !formData.showStats })}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      <span>Display Statistics</span>
                      {formData.showStats ? <Eye color="#4ade80" size={16} /> : <EyeOff color="#ff3b5c" size={16} />}
                    </div>
                    <div
                      onClick={() => setFormData({ ...formData, showInventory: !formData.showInventory })}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      <span>Show Arsenal/Inventory</span>
                      {formData.showInventory ? <Eye color="#4ade80" size={16} /> : <EyeOff color="#ff3b5c" size={16} />}
                    </div>
                  </div>
                </section>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button
                    className={`matte-btn ${saving ? 'loading' : ''}`}
                    onClick={handleSave}
                    disabled={saving}
                    style={{ padding: '12px 30px', fontSize: '0.75rem', background: '#fff', color: '#0b0b0c', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '50px', fontWeight: 900, letterSpacing: '0.1em', cursor: 'pointer' }}
                  >
                    <Save size={14} />
                    <span>{saving ? 'UPDATING...' : 'SAVE PROFILE'}</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ==================== TAB 2: BOT PREFERENCES ==================== */}
            {activeTab === 'bot' && (
              <motion.div
                key="bot"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
              >
                <section
                  className="matte-card"
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-matte)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '15px',
                      opacity: 0.8,
                    }}
                  >
                    <Settings size={16} />
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Command Console Prefixes
                    </h3>
                  </div>

                  <p style={{ fontSize: '0.75rem', opacity: 0.6, lineHeight: 1.4, marginBottom: '20px' }}>
                    Customize how you invoke KSAEKVAT commands in servers. Your main prefix is completely personal and overrides the global defaults (`k`, `K`) exclusively for you. Shorthand subprefixes are mapped to standard routines.
                  </p>

                  <div className="input-row" style={{ gap: '15px', marginBottom: '15px' }}>
                    <div className="input-group" style={{ marginBottom: 0, gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <label style={{ fontSize: '0.65rem' }}>Personal Main Prefix</label>
                        <HelpCircle size={10} style={{ opacity: 0.4 }} title="Overrides default 'k' for you in all channels." />
                      </div>
                      <input
                        type="text"
                        placeholder="k"
                        maxLength="5"
                        value={formData.customPrefix}
                        onChange={(e) => setFormData({ ...formData, customPrefix: e.target.value })}
                        className="matte-input"
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      />
                    </div>
                    <div className="input-group" style={{ marginBottom: 0, gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <label style={{ fontSize: '0.65rem' }}>Personal Sub-Prefix</label>
                        <HelpCircle size={10} style={{ opacity: 0.4 }} title="Custom shortcut sub-prefix trigger." />
                      </div>
                      <input
                        type="text"
                        placeholder="w"
                        maxLength="5"
                        value={formData.customSubPrefix}
                        onChange={(e) => setFormData({ ...formData, customSubPrefix: e.target.value })}
                        className="matte-input"
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      />
                    </div>
                  </div>
                  <p style={{ fontSize: '0.6rem', opacity: 0.4 }}>
                    ⚠️ Avoid forbidden characters: `@`, `#`, `/`, `\`, or backticks. Max length is 5 characters.
                  </p>
                </section>

                <section
                  className="matte-card"
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-matte)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '15px',
                      opacity: 0.8,
                    }}
                  >
                    <Eye size={16} />
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Alerts & System Preferences
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div
                      onClick={() => setFormData({ ...formData, publicLeaderboard: !formData.publicLeaderboard })}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      <div>
                        <span style={{ display: 'block', fontWeight: 600 }}>Public Leaderboard Opt-In</span>
                        <span style={{ display: 'block', fontSize: '0.65rem', opacity: 0.4, marginTop: '2px' }}>
                          Let your account appear on the global wealth and RPG rankings.
                        </span>
                      </div>
                      {formData.publicLeaderboard ? <Eye color="#4ade80" size={16} /> : <EyeOff color="#ff3b5c" size={16} />}
                    </div>

                    <div
                      onClick={() => setFormData({ ...formData, dmOnLevelUp: !formData.dmOnLevelUp })}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      <div>
                        <span style={{ display: 'block', fontWeight: 600 }}>Level Up Direct Messages</span>
                        <span style={{ display: 'block', fontSize: '0.65rem', opacity: 0.4, marginTop: '2px' }}>
                          Receive direct system alerts from the bot whenever you scale up Resonance levels.
                        </span>
                      </div>
                      {formData.dmOnLevelUp ? <Eye color="#4ade80" size={16} /> : <EyeOff color="#ff3b5c" size={16} />}
                    </div>

                    <div
                      onClick={() => setFormData({ ...formData, compactLogs: !formData.compactLogs })}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      <div>
                        <span style={{ display: 'block', fontWeight: 600 }}>High-Density Compact Embeds</span>
                        <span style={{ display: 'block', fontSize: '0.65rem', opacity: 0.4, marginTop: '2px' }}>
                          Condense battle and gacha results into minimal text formats to reduce chat clutter.
                        </span>
                      </div>
                      {formData.compactLogs ? <Eye color="#4ade80" size={16} /> : <EyeOff color="#ff3b5c" size={16} />}
                    </div>
                  </div>
                </section>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button
                    className={`matte-btn ${saving ? 'loading' : ''}`}
                    onClick={handleSave}
                    disabled={saving}
                    style={{ padding: '12px 30px', fontSize: '0.75rem', background: '#fff', color: '#0b0b0c', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '50px', fontWeight: 900, letterSpacing: '0.1em', cursor: 'pointer' }}
                  >
                    <Save size={14} />
                    <span>{saving ? 'UPDATING...' : 'SAVE PREFERENCES'}</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ==================== TAB 3: SERVER CONFIGURATION ==================== */}
            {activeTab === 'server' && (
              <motion.div
                key="server"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
              >
                <div
                  className="matte-card"
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-matte)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                  }}
                >
                  <Bot size={24} color="rgba(255,255,255,0.6)" />
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.6rem', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Select Active Sector Guild
                    </label>
                    <select
                      value={selectedGuild}
                      onChange={(e) => setSelectedGuild(e.target.value)}
                      className="matte-input"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        width: '100%',
                        maxWidth: '300px',
                        marginTop: '5px',
                        border: '1px solid var(--border-matte)',
                        background: 'rgba(255,255,255,0.02)'
                      }}
                    >
                      <option value="1">🛡️ KSAEKVAT Official Support</option>
                      <option value="2">👾 Momo's Retro Lounge</option>
                    </select>
                  </div>
                  <img
                    src={serverConfigs[selectedGuild].icon}
                    alt="Guild Icon"
                    style={{ width: '50px', height: '50px', borderRadius: '12px', border: '1px solid var(--border-matte)' }}
                  />
                </div>

                <section
                  className="matte-card"
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-matte)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '15px',
                      opacity: 0.8,
                    }}
                  >
                    <Settings size={16} />
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      General Server Settings
                    </h3>
                  </div>

                  <div className="input-group" style={{ marginBottom: 0, gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <label style={{ fontSize: '0.65rem' }}>Server Command Prefix</label>
                      <HelpCircle size={10} style={{ opacity: 0.4 }} title="Sets the base command trigger for all regular members." />
                    </div>
                    <input
                      type="text"
                      placeholder="k!"
                      maxLength="5"
                      value={serverConfigs[selectedGuild].prefix}
                      onChange={(e) => handleServerConfigChange('prefix', e.target.value)}
                      className="matte-input"
                      style={{ padding: '6px 12px', fontSize: '0.75rem', maxWidth: '150px' }}
                    />
                  </div>
                </section>

                <section
                  className="matte-card"
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-matte)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '15px',
                      opacity: 0.8,
                    }}
                  >
                    <MessageSquare size={16} />
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Welcome gate greetings
                    </h3>
                  </div>

                  <div
                    onClick={() => handleServerConfigChange('welcomeEnabled', !serverConfigs[selectedGuild].welcomeEnabled)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', marginBottom: '15px' }}
                  >
                    <div>
                      <span style={{ display: 'block', fontWeight: 600 }}>Enable Welcome Greetings</span>
                      <span style={{ display: 'block', fontSize: '0.65rem', opacity: 0.4, marginTop: '2px' }}>
                        Greet new sector members when they initialize synchronization protocols.
                      </span>
                    </div>
                    {serverConfigs[selectedGuild].welcomeEnabled ? <Eye color="#4ade80" size={16} /> : <EyeOff color="#ff3b5c" size={16} />}
                  </div>

                  {serverConfigs[selectedGuild].welcomeEnabled && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div className="input-group" style={{ marginBottom: 0, gap: '4px' }}>
                        <label style={{ fontSize: '0.65rem' }}>Welcome Target Channel</label>
                        <div className="icon-input">
                          <Hash size={12} />
                          <input
                            type="text"
                            placeholder="welcome"
                            value={serverConfigs[selectedGuild].welcomeChannel}
                            onChange={(e) => handleServerConfigChange('welcomeChannel', e.target.value)}
                            className="matte-input"
                            style={{ padding: '6px 12px 6px 35px', fontSize: '0.75rem' }}
                          />
                        </div>
                      </div>
                      <div className="input-group" style={{ marginBottom: 0, gap: '4px' }}>
                        <label style={{ fontSize: '0.65rem' }}>Welcome Message Template</label>
                        <textarea
                          placeholder="Welcome {user}!"
                          value={serverConfigs[selectedGuild].welcomeMessage}
                          onChange={(e) => handleServerConfigChange('welcomeMessage', e.target.value)}
                          className="matte-input"
                          style={{
                            minHeight: '60px',
                            resize: 'vertical',
                            background: 'rgba(255,255,255,0.02)',
                            padding: '10px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                          }}
                        />
                        <span style={{ fontSize: '0.6rem', opacity: 0.3 }}>
                          Available wildcards: `{`{user}`}` (mentions user), `{`{guild}`}` (server name).
                        </span>
                      </div>
                    </div>
                  )}
                </section>

                <section
                  className="matte-card"
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-matte)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '15px',
                      opacity: 0.8,
                    }}
                  >
                    <Layers size={16} />
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Operational Bot Modules
                    </h3>
                  </div>
                  <p style={{ fontSize: '0.75rem', opacity: 0.6, lineHeight: 1.4, marginBottom: '15px' }}>
                    De-authorize or load specific KSAEKVAT core mechanics on this server. Members will not be able to execute commands associated with disabled modules.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { key: 'rpg', label: '⚔️ Advanced RPG Combat & Battle System', desc: 'Allows dungeoneering, boss duels, battles, and operative ranks.' },
                      { key: 'economy', label: '🪙 Economic ledger & Trade Systems', desc: 'Activates credits claims, bank accounts, daily bonuses, and transfers.' },
                      { key: 'gacha', label: '🎲 Gacha Resonance Pools', desc: 'Unlocks resonator character rolls, pity counters, and pulls inventory.' },
                      { key: 'hunting', label: '🐾 Pokemon Wilderness Hunting', desc: 'Spawns wild beasts, specimen logging, capturing, and zoo displays.' },
                      { key: 'aiChat', label: '💬 SEA-LION AI Chat System', desc: 'Enables direct context conversations with the bot waifu companion.' },
                    ].map((mod) => (
                      <div
                        key={mod.key}
                        onClick={() => handleServerModuleChange(mod.key, !serverConfigs[selectedGuild].modules[mod.key])}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        <div>
                          <span style={{ display: 'block', fontWeight: 600 }}>{mod.label}</span>
                          <span style={{ display: 'block', fontSize: '0.65rem', opacity: 0.4, marginTop: '2px' }}>
                            {mod.desc}
                          </span>
                        </div>
                        {serverConfigs[selectedGuild].modules[mod.key] ? <Eye color="#4ade80" size={16} /> : <EyeOff color="#ff3b5c" size={16} />}
                      </div>
                    ))}
                  </div>
                </section>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button
                    className="matte-btn"
                    onClick={handleServerSave}
                    style={{ padding: '12px 30px', fontSize: '0.75rem', background: '#fff', color: '#0b0b0c', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '50px', fontWeight: 900, letterSpacing: '0.1em', cursor: 'pointer' }}
                  >
                    <Save size={14} />
                    <span>SAVE GUILD CONFIG</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ==================== TAB 4: CREATOR MISSION CONTROL ==================== */}
            {activeTab === 'creator' && user?.id === '703266672022388789' && (
              <motion.div
                key="creator"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  <div className="matte-card" style={{ padding: '15px', borderRadius: '12px', border: '1px solid var(--border-matte)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Activity size={24} color="#ffd700" />
                    <div>
                      <span style={{ display: 'block', fontSize: '0.6rem', opacity: 0.4, textTransform: 'uppercase' }}>System Status</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#ffd700' }}>HEALTHY [SHARD_0]</span>
                    </div>
                  </div>
                  <div className="matte-card" style={{ padding: '15px', borderRadius: '12px', border: '1px solid var(--border-matte)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Bot size={24} color="rgba(255,255,255,0.6)" />
                    <div>
                      <span style={{ display: 'block', fontSize: '0.6rem', opacity: 0.4, textTransform: 'uppercase' }}>Cached Guilds</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 900 }}>4 ACTIVE SECTORS</span>
                    </div>
                  </div>
                  <div className="matte-card" style={{ padding: '15px', borderRadius: '12px', border: '1px solid var(--border-matte)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Cpu size={24} color="rgba(255,255,255,0.6)" />
                    <div>
                      <span style={{ display: 'block', fontSize: '0.6rem', opacity: 0.4, textTransform: 'uppercase' }}>Specs Core Load</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 900 }}>0.8% CPU / 12 POOLS</span>
                    </div>
                  </div>
                </div>

                <section
                  className="matte-card"
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-matte)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '15px',
                      opacity: 0.8,
                    }}
                  >
                    <Terminal size={16} color="#ffd700" />
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ffd700' }}>
                      Mainframe Matrix Terminal
                    </h3>
                  </div>

                  <p style={{ fontSize: '0.75rem', opacity: 0.6, lineHeight: 1.4, marginBottom: '15px' }}>
                    Execute high-priority systems operations directly on the bot instance. Type command parameters below to bypass visual configurations.
                  </p>

                  <div
                    style={{
                      background: '#040405',
                      border: '1px solid var(--border-matte)',
                      borderRadius: '12px',
                      padding: '15px',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                      minHeight: '150px',
                      maxHeight: '250px',
                      overflowY: 'auto',
                      marginBottom: '15px'
                    }}
                  >
                    {consoleLogs.map((log, i) => (
                      <div key={i} style={{ color: log.startsWith('>') ? '#ffd700' : log.startsWith('[ERROR]') ? '#ff3b5c' : '#a3e635' }}>
                        {log}
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleConsoleSubmit} style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      placeholder="Type command e.g. 'reload', 'shard status', 'flush cache'..."
                      value={consoleInput}
                      onChange={(e) => setConsoleInput(e.target.value)}
                      className="matte-input"
                      style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.75rem' }}
                    />
                    <button
                      type="submit"
                      className="matte-btn"
                      style={{ padding: '0 20px', fontSize: '0.75rem', border: '1px solid var(--border-matte)', cursor: 'pointer' }}
                    >
                      EXECUTE
                    </button>
                  </form>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
