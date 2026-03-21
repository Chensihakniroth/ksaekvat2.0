import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  Settings, Palette, User, Globe, Music, Save, 
  ChevronRight, AlertCircle, CheckCircle2, Link as LinkIcon,
  Eye, EyeOff, Image as ImageIcon, Plus, Trash2, Github, Image, Upload, Heart
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
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
    favorites: [],
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
              favorites: pt.favorites || [],
              socials: pt.socials || {}
            });
          }
          setLoading(false);
        });
    }
  }, [user]);

  const addFavorite = () => {
    setFormData(prev => ({
      ...prev,
      favorites: [...prev.favorites, { type: 'character', name: '' }]
    }));
  };

  const updateFavorite = (index, field, value) => {
    setFormData(prev => {
      const newF = [...prev.favorites];
      newF[index] = { ...newF[index], [field]: value };
      return { ...prev, favorites: newF };
    });
  };

  const removeFavorite = (index) => {
    setFormData(prev => ({
      ...prev,
      favorites: prev.favorites.filter((_, i) => i !== index)
    }));
  };

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
          body: JSON.stringify({ base64Audio: reader.result })
        });
        const data = await res.json();
        if (data.success) {
          setFormData(prev => ({ ...prev, music: data.url }));
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

  if (loading) return <div className="p-8 text-center opacity-50" style={{ letterSpacing: '0.2em', fontSize: '0.8rem', marginTop: '100px' }}>SYNCHRONIZING...</div>;

  return (
    <div className="wrap" style={{ paddingTop: '160px', paddingBottom: '120px', maxWidth: '1000px' }}>
      <header style={{ marginBottom: '60px', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', opacity: 0.5, marginBottom: '20px' }}>
          <Settings size={16} />
          <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em' }}>Profile Settings</span>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, letterSpacing: '-0.05em', marginBottom: '20px' }}>
          YOUR ARCHIVE
        </motion.h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', fontWeight: 300 }}>Shape your digital presence and manage your synced assets.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', alignItems: 'start' }}>
        {/* --- LEFT: PREVIEW --- */}
        <div style={{ position: 'sticky', top: '120px' }}>
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="glass-panel" style={{ padding: 0, overflow: 'hidden', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ height: '150px', backgroundColor: formData.accentColor, backgroundImage: formData.banner ? `url(${formData.banner})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', bottom: '-40px', left: '30px', width: '90px', height: '90px', borderRadius: '50%', border: '4px solid var(--bg-deep)', overflow: 'hidden', background: 'var(--bg-deep)', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}>
                {user?.avatar ? 
                  <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 300, opacity: 0.5 }}>{user?.username[0]}</div>
                }
              </div>
            </div>
            <div style={{ padding: '60px 30px 30px' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '10px' }}>{user?.username}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: '20px' }}>{formData.bio || 'No bio set...'}</p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 800, color: formData.accentColor }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: formData.accentColor, boxShadow: `0 0 10px ${formData.accentColor}` }} />
                {formData.accentColor}
              </div>
            </div>
          </motion.div>

          <div className="glass-panel" style={{ padding: '20px 30px', borderRadius: '24px', marginTop: '20px', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '0.85rem', fontWeight: 600 }}>
              <Globe size={16} color="var(--cyber-cyan)" />
              <span>Network Status: <span style={{ color: 'var(--cyber-green)' }}>ONLINE</span></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '0.85rem', fontWeight: 600 }}>
              <CheckCircle2 size={16} color="var(--cyber-purple)" />
              <span>Identity Verified</span>
            </div>
          </div>
        </div>

        {/* --- RIGHT: SETTINGS FORM --- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {message && (
            <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ padding: '20px', borderRadius: '16px', background: message.type === 'success' ? 'rgba(5, 255, 161, 0.1)' : 'rgba(255, 0, 60, 0.1)', border: `1px solid ${message.type === 'success' ? 'var(--cyber-green)' : 'var(--cyber-pink)'}`, color: message.type === 'success' ? 'var(--cyber-green)' : 'var(--cyber-pink)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', fontWeight: 800 }}>
              {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{message.text}</span>
            </motion.div>
          )}

          <section className="glass-panel" style={{ padding: '40px', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px', opacity: 0.8 }}>
              <User size={18} />
              <h3 style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Identity Bio</h3>
            </div>
            <textarea 
              placeholder="Tell the world about yourself..." 
              value={formData.bio}
              onChange={e => setFormData({...formData, bio: e.target.value})}
              className="dash-input"
              style={{ minHeight: '120px', resize: 'vertical', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px' }}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="icon-input">
                <Music size={14} />
                <input 
                  type="text" 
                  placeholder="Spotify Track URL or Direct MP3 Link" 
                  value={formData.music} 
                  onChange={e => setFormData({...formData, music: e.target.value})} 
                  className="dash-input" 
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <label className={`btn-v3 btn-v3-ghost ${uploading ? 'opacity-50 pointer-events-none' : ''}`} style={{ flex: '1 1 auto', cursor: 'pointer' }}>
                  <Upload size={16} />
                  <span>{uploading ? 'UPLOADING...' : 'UPLOAD OWN MP3'}</span>
                  <input type="file" accept="audio/mpeg" onChange={handleAudioUpload} hidden />
                </label>
                {formData.music && <span style={{ fontSize: '0.75rem', opacity: 0.3, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formData.music}</span>}
              </div>
            </div>
            <p className="hint-text mt-4">
              <strong>Spotify Tip:</strong> Paste a track link to show a mini-player. <br/>
              <strong>Custom Audio:</strong> Upload an MP3 for automatic background sound (15% volume).
            </p>
          </section>

          <section className="settings-section glass-panel">
            <div className="section-header">
              <LinkIcon size={18} className="text-gold" />
              <h3>Social Uplinks</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              {['discord', 'instagram', 'twitter', 'github', 'website'].map(s => (
                <div key={s} className="input-group" style={{ marginBottom: 0 }}>
                  <label style={{ textTransform: 'capitalize' }}>{s}</label>
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
              <Heart size={18} className="text-red" />
              <h3>Favorite Assets</h3>
              <button onClick={addFavorite} style={{ marginLeft: 'auto', fontSize: '0.7rem', background: 'rgba(255, 0, 60, 0.2)', color: 'var(--cyber-pink)', padding: '6px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(255, 0, 60, 0.3)', cursor: 'pointer', transition: '0.3s' }}>
                <Plus size={12} /> Add Favorite
              </button>
            </div>
            <div className="portfolio-list">
              {formData.favorites.map((item, idx) => (
                <div key={idx} className="portfolio-item-edit glass-panel" style={{ marginBottom: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                  <button onClick={() => removeFavorite(idx)} style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--cyber-pink)', opacity: 0.5, background: 'none', border: 'none', cursor: 'pointer', transition: '0.3s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.5}>
                    <Trash2 size={14} />
                  </button>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginTop: '10px' }}>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label>Asset Type</label>
                      <select 
                        value={item.type} 
                        onChange={e => updateFavorite(idx, 'type', e.target.value)}
                        className="dash-input select-v3"
                      >
                        <option value="character">Resonator (Character)</option>
                        <option value="animal">Specimen (Animal)</option>
                      </select>
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label>Asset Name</label>
                      <input 
                        type="text" 
                        placeholder="Exact Name" 
                        value={item.name} 
                        onChange={e => updateFavorite(idx, 'name', e.target.value)}
                        className="dash-input"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {formData.favorites.length === 0 && (
                <p style={{ textAlign: 'center', opacity: 0.3, padding: '20px 0', fontSize: '0.75rem', fontStyle: 'italic' }}>No favorite assets indexed yet.</p>
              )}
            </div>
          </section>

          <section className="settings-section glass-panel">
            <div className="section-header">
              <LinkIcon size={18} className="text-cyan" />
              <h3>Portfolio Assets</h3>
              <button onClick={addPortfolioItem} style={{ marginLeft: 'auto', fontSize: '0.7rem', background: 'rgba(0, 243, 255, 0.1)', color: 'var(--cyber-cyan)', padding: '6px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(0, 243, 255, 0.3)', cursor: 'pointer', transition: '0.3s' }}>
                <Plus size={12} /> Add Item
              </button>
            </div>
            <div className="portfolio-list">
              {formData.portfolio.map((item, idx) => (
                <div key={idx} className="portfolio-item-edit glass-panel" style={{ marginBottom: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                  <button onClick={() => removePortfolioItem(idx)} style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--cyber-pink)', opacity: 0.5, background: 'none', border: 'none', cursor: 'pointer', transition: '0.3s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.5}>
                    <Trash2 size={14} />
                  </button>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginTop: '10px' }}>
                    <div className="input-group" style={{ marginBottom: 0 }}>
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
                    <div className="input-group" style={{ marginBottom: 0 }}>
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
                  <div className="input-group" style={{ marginTop: '16px', marginBottom: 0 }}>
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
                <p style={{ textAlign: 'center', opacity: 0.3, padding: '20px 0', fontSize: '0.75rem', fontStyle: 'italic' }}>No portfolio items added yet.</p>
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
