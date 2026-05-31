import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import DiscordAvatar from '../components/DiscordAvatar';
import {
  Settings,
  Palette,
  User,
  Globe,
  Music,
  Save,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Bell,
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

  // Guild Configuration & Bot Telemetry States
  const [guilds, setGuilds] = useState([]);
  const [guildsLoading, setGuildsLoading] = useState(true);
  const [guildsError, setGuildsError] = useState(null);
  const [guildChannels, setGuildChannels] = useState({});
  const [selectedGuild, setSelectedGuild] = useState('');
  const [serverConfigs, setServerConfigs] = useState({});

  // Creator Control Console System Actions Logs
  const [consoleLogs, setConsoleLogs] = useState([
    '[SYSTEM] Kernel core initialized successfully.',
    '[MONITOR] CPU load optimal. Connected database pool active.',
    '[WEBSOCKET] Shards established and active.'
  ]);
  const [consoleInput, setConsoleInput] = useState('');
  const [adminStats, setAdminStats] = useState(null);
  const [guildInvites, setGuildInvites] = useState({});
  const [loadingInviteId, setLoadingInviteId] = useState(null);

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

  // Fetch specific guild configuration and text channels
  const fetchGuildConfig = async (guildId) => {
    try {
      const res = await fetch(`/api/guild/${guildId}`);
      const data = await res.json();
      if (data.success) {
        setServerConfigs((prev) => ({
          ...prev,
          [guildId]: data.config,
        }));
        setGuildChannels((prev) => ({
          ...prev,
          [guildId]: data.channels,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch config for guild:', guildId, err);
    }
  };

  const handleGuildChange = (guildId) => {
    setSelectedGuild(guildId);
    const targetGuild = guilds.find((g) => g.id === guildId);
    if (targetGuild && targetGuild.botIn && !serverConfigs[guildId]) {
      fetchGuildConfig(guildId);
    }
  };

  // Bot configuration helper functions (Connected to Backend API)
  const handleServerSave = async () => {
    const config = serverConfigs[selectedGuild];
    if (!config) return;

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/guild/${selectedGuild}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Configuration for [${data.config.guildName}] updated successfully! ＼(≧▽≦)／` });
        setServerConfigs((prev) => ({
          ...prev,
          [selectedGuild]: data.config,
        }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save configuration.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error saving configuration.' });
    }
    setSaving(false);
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

  // Creator Control Remote Terminal Command Execution
  const handleConsoleSubmit = async (e) => {
    e.preventDefault();
    if (!consoleInput.trim()) return;

    const input = consoleInput.trim();
    const cmd = input.toLowerCase();

    if (cmd === 'clear') {
      setConsoleLogs([]);
      setConsoleInput('');
      return;
    }

    setConsoleLogs((prev) => [...prev, `> ${input}`]);
    setConsoleInput('');

    try {
      const res = await fetch('/api/admin/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: input }),
      });
      const data = await res.json();
      if (data.success) {
        setConsoleLogs((prev) => [...prev, data.output]);
      } else {
        setConsoleLogs((prev) => [...prev, `[ERROR] ${data.error || 'Execution failed.'}`]);
      }
    } catch (err) {
      setConsoleLogs((prev) => [...prev, '[ERROR] Network connection failure to host system.']);
    }
  };

  const handleFetchInvite = async (guildId) => {
    try {
      setLoadingInviteId(guildId);
      const res = await fetch(`/api/admin/guild/${guildId}/invite`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setGuildInvites((prev) => ({ ...prev, [guildId]: data.inviteUrl }));
      } else {
        alert(`Failed to retrieve invite: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect to administrative kernel.');
    } finally {
      setLoadingInviteId(null);
    }
  };

  // Load User Admin Guilds List
  useEffect(() => {
    if (activeTab === 'server' && user) {
      setGuildsLoading(true);
      setGuildsError(null);
      fetch('/api/guild/list')
        .then((r) => r.json())
        .then((res) => {
          if (res.success) {
            setGuilds(res.guilds);
            // Pre-select first guild
            if (res.guilds.length > 0) {
              const firstGuild = res.guilds[0];
              setSelectedGuild(firstGuild.id);
              if (firstGuild.botIn) {
                fetchGuildConfig(firstGuild.id);
              }
            }
          } else {
            setGuildsError(res.error || 'Failed to load servers.');
          }
          setGuildsLoading(false);
        })
        .catch((err) => {
          setGuildsError('Network error loading servers.');
          setGuildsLoading(false);
        });
    }
  }, [activeTab, user]);

  // Poll Creator Telemetry Stats
  useEffect(() => {
    if (activeTab === 'creator' && user?.id === '703266672022388789') {
      const fetchStats = async () => {
        try {
          const res = await fetch('/api/admin/stats');
          const data = await res.json();
          if (data.success) {
            setAdminStats(data.stats);
          }
        } catch (err) {
          console.error('Failed to fetch admin stats:', err);
        }
      };

      fetchStats();
      const interval = setInterval(fetchStats, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab, user]);

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
                  zIndex: 2,
                }}
              >
                <DiscordAvatar
                  userId={user?.id}
                  avatarHash={formData.avatar || profile?.profileTheme?.avatar || user?.avatar}
                  decorationAsset={profile?.profileTheme?.avatarDecoration}
                  size={60}
                />
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
                    <Shield size={16} />
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
                      <div className={`switch-toggle-matte ${formData.showStats ? 'active' : 'inactive'}`}><div className="switch-handle-matte" /></div>
                    </div>
                    <div
                      onClick={() => setFormData({ ...formData, showInventory: !formData.showInventory })}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      <span>Show Arsenal/Inventory</span>
                      <div className={`switch-toggle-matte ${formData.showInventory ? 'active' : 'inactive'}`}><div className="switch-handle-matte" /></div>
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
                    <Bell size={16} />
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
                      <div className={`switch-toggle-matte ${formData.publicLeaderboard ? 'active' : 'inactive'}`}><div className="switch-handle-matte" /></div>
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
                      <div className={`switch-toggle-matte ${formData.dmOnLevelUp ? 'active' : 'inactive'}`}><div className="switch-handle-matte" /></div>
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
                      <div className={`switch-toggle-matte ${formData.compactLogs ? 'active' : 'inactive'}`}><div className="switch-handle-matte" /></div>
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
                {guildsLoading ? (
                  <div
                    className="matte-card"
                    style={{
                      padding: '40px 20px',
                      borderRadius: '16px',
                      border: '1px solid var(--border-matte)',
                      textAlign: 'center',
                      opacity: 0.5,
                      letterSpacing: '0.1em',
                      fontSize: '0.8rem'
                    }}
                  >
                    SCANNING DISCORD SECTOR FOR COMPATIBLE GUILDS...
                  </div>
                ) : guildsError ? (
                  <div
                    className="matte-card"
                    style={{
                      padding: '30px 20px',
                      borderRadius: '16px',
                      border: '1px solid var(--border-matte)',
                      textAlign: 'center',
                      color: '#ff3b5c'
                    }}
                  >
                    <AlertTriangle size={24} style={{ marginBottom: '10px' }} />
                    <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{guildsError}</p>
                    <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '5px' }}>
                      Make sure you have authorized the bot to read your guilds. You may need to log out and log back in.
                    </p>
                  </div>
                ) : guilds.length === 0 ? (
                  <div
                    className="matte-card"
                    style={{
                      padding: '40px 20px',
                      borderRadius: '16px',
                      border: '1px solid var(--border-matte)',
                      textAlign: 'center',
                      opacity: 0.6
                    }}
                  >
                    <AlertTriangle size={24} style={{ marginBottom: '10px' }} />
                    <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>No Managed Servers Found</p>
                    <p style={{ fontSize: '0.75rem', marginTop: '5px' }}>
                      You must possess the "Manage Server" or "Administrator" permission in at least one server to configure settings.
                    </p>
                  </div>
                ) : (
                  <>
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
                          onChange={(e) => handleGuildChange(e.target.value)}
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
                          {guilds.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.botIn ? '🛡️' : '🔗'} {g.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {guilds.find((g) => g.id === selectedGuild)?.iconUrl ? (
                        <img
                          src={guilds.find((g) => g.id === selectedGuild)?.iconUrl}
                          alt="Guild Icon"
                          style={{ width: '50px', height: '50px', borderRadius: '12px', border: '1px solid var(--border-matte)' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '12px',
                            border: '1px solid var(--border-matte)',
                            background: 'rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            fontWeight: 700
                          }}
                        >
                          {guilds.find((g) => g.id === selectedGuild)?.name?.slice(0, 2).toUpperCase() || '??'}
                        </div>
                      )}
                    </div>

                    {!guilds.find((g) => g.id === selectedGuild)?.botIn ? (
                      <div
                        className="matte-card"
                        style={{
                          padding: '40px 20px',
                          borderRadius: '16px',
                          border: '1px solid var(--border-matte)',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '15px'
                        }}
                      >
                        <Bot size={48} color="rgba(255,255,255,0.3)" />
                        <div>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 900, marginBottom: '5px' }}>KSAEKVAT Bot Offline in Sector</h4>
                          <p style={{ fontSize: '0.75rem', opacity: 0.6, maxWidth: '420px', margin: '0 auto', lineHeight: 1.4 }}>
                            To configure custom prefix, enable modular systems, and activate welcome greetings, authorize KSAEKVAT for this guild.
                          </p>
                        </div>
                        <a
                          href={`https://discord.com/api/oauth2/authorize?client_id=1399459454889754805&permissions=8&scope=bot%20applications.commands&guild_id=${selectedGuild}&disable_guild_select=true`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="matte-btn"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '10px 24px',
                            fontSize: '0.75rem',
                            background: '#fff',
                            color: '#0b0b0c',
                            border: 'none',
                            borderRadius: '50px',
                            fontWeight: 900,
                            letterSpacing: '0.05em',
                            textDecoration: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          INVITE BOT INTO SECTOR
                        </a>
                      </div>
                    ) : !serverConfigs[selectedGuild] ? (
                      <div
                        className="matte-card"
                        style={{
                          padding: '30px',
                          borderRadius: '16px',
                          border: '1px solid var(--border-matte)',
                          textAlign: 'center',
                          opacity: 0.5,
                          fontSize: '0.8rem'
                        }}
                      >
                        SYNCHRONIZING GUILD MATRIX CONFIGURATION...
                      </div>
                    ) : (
                      <>
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
                              placeholder="k"
                              maxLength="5"
                              value={serverConfigs[selectedGuild].prefix || ''}
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
                              <span style={{ display: 'inline', fontWeight: 600 }}>Enable Welcome Greetings</span>
                              <span style={{ display: 'block', fontSize: '0.65rem', opacity: 0.4, marginTop: '2px' }}>
                                Greet new sector members when they initialize synchronization protocols.
                              </span>
                            </div>
                            <div className={`switch-toggle-matte ${serverConfigs[selectedGuild].welcomeEnabled ? 'active' : 'inactive'}`}><div className="switch-handle-matte" /></div>
                          </div>

                          {serverConfigs[selectedGuild].welcomeEnabled && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                              <div className="input-group" style={{ marginBottom: 0, gap: '4px' }}>
                                <label style={{ fontSize: '0.65rem' }}>Welcome Target Channel</label>
                                <div className="icon-input">
                                  <Hash size={12} />
                                  <select
                                    value={serverConfigs[selectedGuild].welcomeChannel || ''}
                                    onChange={(e) => handleServerConfigChange('welcomeChannel', e.target.value || null)}
                                    className="matte-input"
                                    style={{ padding: '6px 12px 6px 35px', fontSize: '0.75rem', width: '100%', appearance: 'none', WebkitAppearance: 'none' }}
                                  >
                                    <option value="">None (Send to default/system channel)</option>
                                    {guildChannels[selectedGuild]?.map((ch) => (
                                      <option key={ch.id} value={ch.id}>
                                        {ch.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div className="input-group" style={{ marginBottom: 0, gap: '4px' }}>
                                <label style={{ fontSize: '0.65rem' }}>Welcome Message Template</label>
                                <textarea
                                  placeholder="Welcome {user}!"
                                  value={serverConfigs[selectedGuild].welcomeMessage || ''}
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
                                  Available wildcards: `{{user}}` (mentions user), `{{guild}}` (server name).
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
                                <div className={`switch-toggle-matte ${serverConfigs[selectedGuild].modules?.[mod.key] ? 'active' : 'inactive'}`}><div className="switch-handle-matte" /></div>
                              </div>
                            ))}
                          </div>
                        </section>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                          <button
                            className="matte-btn"
                            onClick={handleServerSave}
                            disabled={saving}
                            style={{ padding: '12px 30px', fontSize: '0.75rem', background: '#fff', color: '#0b0b0c', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '50px', fontWeight: 900, letterSpacing: '0.1em', cursor: 'pointer' }}
                          >
                            <Save size={14} />
                            <span>{saving ? 'SAVING...' : 'SAVE GUILD CONFIG'}</span>
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
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
                    <Activity size={24} color="#4ade80" />
                    <div>
                      <span style={{ display: 'block', fontSize: '0.6rem', opacity: 0.4, textTransform: 'uppercase' }}>System Status</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#4ade80' }}>
                        {adminStats ? `ONLINE | WS: ${adminStats.ping}ms` : 'CONNECTING...'}
                      </span>
                    </div>
                  </div>
                  <div className="matte-card" style={{ padding: '15px', borderRadius: '12px', border: '1px solid var(--border-matte)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Bot size={24} color="rgba(255,255,255,0.6)" />
                    <div>
                      <span style={{ display: 'block', fontSize: '0.6rem', opacity: 0.4, textTransform: 'uppercase' }}>Active Guilds</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 900 }}>
                        {adminStats ? `${adminStats.guildCount} ACTIVE SECTORS` : 'LOADING...'}
                      </span>
                    </div>
                  </div>
                  <div className="matte-card" style={{ padding: '15px', borderRadius: '12px', border: '1px solid var(--border-matte)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Cpu size={24} color="rgba(255,255,255,0.6)" />
                    <div>
                      <span style={{ display: 'block', fontSize: '0.6rem', opacity: 0.4, textTransform: 'uppercase' }}>Telemetry Memory</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 900 }}>
                        {adminStats ? `${adminStats.memory.heapUsed}MB HEAP / ${adminStats.cachedUsers} USERS` : 'LOADING...'}
                      </span>
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
                    <Bot size={16} color="rgba(255,255,255,0.6)" />
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Active Connected Sectors (Servers)
                    </h3>
                  </div>

                  <p style={{ fontSize: '0.75rem', opacity: 0.6, lineHeight: 1.4, marginBottom: '20px' }}>
                    Currently monitoring {adminStats?.guilds?.length || adminStats?.guildCount || 0} active server sectors. Only accessible via authorization protocols.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                    {adminStats?.guilds?.map((guild) => (
                      <div
                        key={guild.id}
                        className="matte-card"
                        style={{
                          padding: '12px 15px',
                          borderRadius: '12px',
                          border: '1px solid var(--border-matte)',
                          background: 'rgba(255,255,255,0.01)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                        }}
                      >
                        {guild.iconUrl ? (
                          <img
                            src={guild.iconUrl}
                            alt="Sector Icon"
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '8px',
                              border: '1px solid var(--border-matte)',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '8px',
                              border: '1px solid var(--border-matte)',
                              background: 'rgba(255,255,255,0.04)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: 'rgba(255,255,255,0.6)',
                            }}
                          >
                            {guild.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              margin: 0,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {guild.name}
                          </h4>
                          <span style={{ fontSize: '0.65rem', opacity: 0.4, display: 'block', marginTop: '2px' }}>
                            ID: {guild.id}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 900,
                              color: 'rgba(255, 255, 255, 0.8)',
                              background: 'rgba(255, 255, 255, 0.04)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-matte)',
                            }}
                          >
                            {guild.memberCount.toLocaleString()} MEM
                          </span>
                          {guildInvites[guild.id] ? (
                            <a
                              href={guildInvites[guild.id]}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: '0.65rem',
                                color: '#4ade80',
                                textDecoration: 'underline',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              INVITE LINK
                            </a>
                          ) : (
                            <button
                              onClick={() => handleFetchInvite(guild.id)}
                              disabled={loadingInviteId !== null}
                              style={{
                                fontSize: '0.6rem',
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255, 255, 255, 0.4)',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                padding: 0,
                                margin: 0,
                                fontWeight: 700
                              }}
                            >
                              {loadingInviteId === guild.id ? 'GETTING...' : 'GET INVITE'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {(!adminStats?.guilds || adminStats.guilds.length === 0) && (
                      <div
                        style={{
                          gridColumn: '1 / -1',
                          padding: '30px',
                          textAlign: 'center',
                          opacity: 0.4,
                          fontSize: '0.75rem',
                          fontStyle: 'italic',
                        }}
                      >
                        No active sectors scanned.
                      </div>
                    )}
                  </div>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
