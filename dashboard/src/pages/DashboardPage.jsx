import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  Settings, Palette, User, Globe, Music, Save, 
  ChevronRight, AlertCircle, CheckCircle2, Link as LinkIcon,
  Eye, EyeOff, Image as ImageIcon, Plus, Trash2, Github, Image
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    bio: '',
    accentColor: '#22d3ee',
    background: '',
    banner: '',
    music: '',
    showStats: true,
    showInventory: true,
    portfolio: [],
    socials: {
      discord: '',
      instagram: '',
      twitter: '',
      github: '',
      website: ''
    }
  });

  useEffect(() => {
    if (user) {
      fetch(`/api/profile/${user.id}`)
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            const pt = res.data.profileTheme || {};
            setProfile(res.data);
            setFormData({
              bio: pt.bio || '',
              accentColor: pt.accentColor || '#22d3ee',
              background: pt.background || '',
              banner: pt.banner || '',
              music: pt.music || '',
              showStats: pt.showStats !== undefined ? pt.showStats : true,
              showInventory: pt.showInventory !== undefined ? pt.showInventory : true,
              portfolio: pt.portfolio || [],
              socials: pt.socials || {}
            });
          }
          setLoading(false);
        });
    }
  }, [user]);

  const addPortfolioItem = () => {
    setFormData(prev => ({
      ...prev,
      portfolio: [...prev.portfolio, { type: 'github', title: '', url: '', description: '' }]
    }));
  };

  const updatePortfolioItem = (index, field, value) => {
    setFormData(prev => {
      const newP = [...prev.portfolio];
      newP[index] = { ...newP[index], [field]: value };
      return { ...prev, portfolio: newP };
    });
  };

  const removePortfolioItem = (index) => {
    setFormData(prev => ({
      ...prev,
      portfolio: prev.portfolio.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully! (｡♥‿♥｡)' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error occurred.' });
    }
    setSaving(false);
  };

  const updateSocial = (key, val) => {
    setFormData(prev => ({
      ...prev,
      socials: { ...prev.socials, [key]: val }
    }));
  };

  if (loading) return <div className="p-8 text-center opacity-50">Synchronizing Data...</div>;

  return (
    <div className="dashboard-v3 wrap">
      <header className="dash-header">
        <div className="dash-title-wrap">
          <Settings className="text-cyan animate-spin-slow" size={24} />
          <h1 className="dash-title glitch-text">Terminal Configuration</h1>
        </div>
        <p className="dash-subtitle">Personalize your digital footprint and network presence.</p>
      </header>

      <div className="dash-grid">
        {/* --- LEFT: PREVIEW & QUICK STATS --- */}
        <div className="dash-sidebar">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="glass-panel preview-card neon-border">
            <div className="preview-banner" style={{ backgroundColor: formData.accentColor, backgroundImage: formData.banner ? `url(${formData.banner})` : 'none' }}>
              <div className="preview-avatar">
                {user?.avatar ? 
                  <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} alt="Avatar" /> :
                  <div className="avatar-placeholder">{user?.username[0]}</div>
                }
              </div>
            </div>
            <div className="preview-info">
              <h3 className="preview-name">{user?.username}</h3>
              <p className="preview-bio">{formData.bio || 'No bio set...'}</p>
              <div className="preview-accent" style={{ color: formData.accentColor }}>{formData.accentColor}</div>
            </div>
          </motion.div>

          <div className="glass-panel status-card mt-4">
            <div className="status-item">
              <Globe size={14} className="text-cyan" />
              <span>Network Status: <span className="text-green">ONLINE</span></span>
            </div>
            <div className="status-item">
              <CheckCircle2 size={14} className="text-purple" />
              <span>Identity Verified</span>
            </div>
          </div>
        </div>

        {/* --- RIGHT: SETTINGS FORM --- */}
        <div className="dash-main">
          {message && (
            <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`alert-v3 ${message.type}`}>
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{message.text}</span>
            </motion.div>
          )}

          <section className="settings-section glass-panel">
            <div className="section-header">
              <User size={18} className="text-cyan" />
              <h3>Identity Bio</h3>
            </div>
            <textarea 
              placeholder="Tell the world about yourself..." 
              value={formData.bio}
              onChange={e => setFormData({...formData, bio: e.target.value})}
              className="dash-input textarea-v3"
            />
          </section>

          <section className="settings-section glass-panel">
            <div className="section-header">
              <Palette size={18} className="text-purple" />
              <h3>Visual Aesthetic</h3>
            </div>
            <div className="input-row">
              <div className="input-group">
                <label>Accent Color</label>
                <div className="color-picker-wrap">
                   <input type="color" value={formData.accentColor} onChange={e => setFormData({...formData, accentColor: e.target.value})} />
                   <input type="text" value={formData.accentColor} onChange={e => setFormData({...formData, accentColor: e.target.value})} className="dash-input" />
                </div>
              </div>
              <div className="input-group">
                <label>Background Image URL</label>
                <div className="icon-input">
                  <ImageIcon size={14} />
                  <input type="text" placeholder="https://..." value={formData.background} onChange={e => setFormData({...formData, background: e.target.value})} className="dash-input" />
                </div>
              </div>
            </div>
            <div className="input-group mt-4">
              <label>Banner Image URL</label>
              <div className="icon-input">
                <ImageIcon size={14} />
                <input type="text" placeholder="https://..." value={formData.banner} onChange={e => setFormData({...formData, banner: e.target.value})} className="dash-input" />
              </div>
            </div>
          </section>

          <section className="settings-section glass-panel">
            <div className="section-header">
              <Music size={18} className="text-pink" />
              <h3>Atmospheric Audio</h3>
            </div>
            <div className="icon-input">
              <Music size={14} />
              <input type="text" placeholder="SoundCloud or Direct Link..." value={formData.music} onChange={e => setFormData({...formData, music: e.target.value})} className="dash-input" />
            </div>
            <p className="hint-text">Music will autoplay (if possible) when others view your profile.</p>
          </section>

          <section className="settings-section glass-panel">
            <div className="section-header">
              <LinkIcon size={18} className="text-gold" />
              <h3>Social Uplinks</h3>
            </div>
            <div className="social-grid">
              {['discord', 'instagram', 'twitter', 'github', 'website'].map(s => (
                <div key={s} className="input-group">
                  <label className="capitalize">{s}</label>
                  <input 
                    type="text" 
                    placeholder={`${s} handle/link`} 
                    value={formData.socials[s] || ''} 
                    onChange={e => updateSocial(s, e.target.value)}
                    className="dash-input"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="settings-section glass-panel">
            <div className="section-header">
              <LinkIcon size={18} className="text-cyan" />
              <h3>Portfolio Assets</h3>
              <button onClick={addPortfolioItem} className="ml-auto text-xs bg-cyan/20 text-cyan px-2 py-1 rounded-md flex items-center gap-1 hover:bg-cyan/30 transition-colors">
                <Plus size={12} /> Add Item
              </button>
            </div>
            <div className="portfolio-list">
              {formData.portfolio.map((item, idx) => (
                <div key={idx} className="portfolio-item-edit glass-panel mb-3 p-3 border border-white/5 relative group">
                  <button onClick={() => removePortfolioItem(idx)} className="absolute top-2 right-2 text-red/50 hover:text-red transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={14} />
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="input-group">
                      <label>Type</label>
                      <select 
                        value={item.type} 
                        onChange={e => updatePortfolioItem(idx, 'type', e.target.value)}
                        className="dash-input select-v3"
                      >
                        <option value="github">GitHub Repo</option>
                        <option value="art">Artwork / Image</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label>Title</label>
                      <input 
                        type="text" 
                        placeholder="Project or Art Name" 
                        value={item.title} 
                        onChange={e => updatePortfolioItem(idx, 'title', e.target.value)}
                        className="dash-input"
                      />
                    </div>
                  </div>
                  <div className="input-group mt-2">
                    <label>URL</label>
                    <input 
                      type="text" 
                      placeholder={item.type === 'github' ? "https://github.com/..." : "https://..."} 
                      value={item.url} 
                      onChange={e => updatePortfolioItem(idx, 'url', e.target.value)}
                      className="dash-input"
                    />
                  </div>
                </div>
              ))}
              {formData.portfolio.length === 0 && (
                <p className="text-center opacity-30 py-4 text-xs italic">No portfolio items added yet.</p>
              )}
            </div>
          </section>

          <section className="settings-section glass-panel">
            <div className="section-header">
              <Eye size={18} className="text-cyan" />
              <h3>Privacy & Visibility</h3>
            </div>
            <div className="toggle-row">
              <div className="toggle-item" onClick={() => setFormData({...formData, showStats: !formData.showStats})}>
                <span>Display Statistics</span>
                {formData.showStats ? <Eye className="text-green" size={20} /> : <EyeOff className="text-red" size={20} />}
              </div>
              <div className="toggle-item" onClick={() => setFormData({...formData, showInventory: !formData.showInventory})}>
                <span>Show Arsenal/Inventory</span>
                {formData.showInventory ? <Eye className="text-green" size={20} /> : <EyeOff className="text-red" size={20} />}
              </div>
            </div>
          </section>

          <div className="dash-actions">
            <button className={`btn-v3 btn-v3-primary ${saving ? 'loading' : ''}`} onClick={handleSave} disabled={saving}>
              <Save size={18} />
              <span>{saving ? 'UPDATING...' : 'COMMIT CHANGES'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
