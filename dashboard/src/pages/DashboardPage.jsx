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
    <div className="wrap" style={{ paddingTop: '100px', paddingBottom: '80px', maxWidth: '1000px' }}>
      <header style={{ marginBottom: '30px', textAlign: 'center' }}>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '5px' }}>
          YOUR ARCHIVE
        </motion.h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', fontWeight: 300 }}>Shape your digital presence and manage your synced assets.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'start' }}>
        {/* --- LEFT: PREVIEW --- */}
        <div style={{ position: 'sticky', top: '100px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="glass-panel" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ height: '100px', backgroundColor: formData.accentColor, backgroundImage: formData.banner ? `url(${formData.banner})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', bottom: '-30px', left: '20px', width: '60px', height: '60px', borderRadius: '50%', border: '3px solid var(--bg-deep)', overflow: 'hidden', background: 'var(--bg-deep)', boxShadow: '0 5px 15px rgba(0,0,0,0.5)' }}>
                {user?.avatar ? 
                  <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 300, opacity: 0.5 }}>{user?.username[0]}</div>
                }
              </div>
            </div>
            <div style={{ padding: '40px 20px 20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '5px' }}>{user?.username}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: '15px' }}>{formData.bio || 'No bio set...'}</p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '50px', fontSize: '0.65rem', fontWeight: 800, color: formData.accentColor }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: formData.accentColor, boxShadow: `0 0 10px ${formData.accentColor}` }} />
                {formData.accentColor}
              </div>
            </div>
          </motion.div>

          <div className="glass-panel" style={{ padding: '15px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', fontWeight: 600 }}>
              <Globe size={14} color="var(--cyber-cyan)" />
              <span>Network Status: <span style={{ color: 'var(--cyber-green)' }}>ONLINE</span></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', fontWeight: 600 }}>
              <CheckCircle2 size={14} color="var(--cyber-purple)" />
              <span>Identity Verified</span>
            </div>
          </div>
        </div>

        {/* --- RIGHT: SETTINGS FORM --- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {message && (
            <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ padding: '12px 20px', borderRadius: '12px', background: message.type === 'success' ? 'rgba(5, 255, 161, 0.1)' : 'rgba(255, 0, 60, 0.1)', border: `1px solid ${message.type === 'success' ? 'var(--cyber-green)' : 'var(--cyber-pink)'}`, color: message.type === 'success' ? 'var(--cyber-green)' : 'var(--cyber-pink)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', fontWeight: 800 }}>
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{message.text}</span>
            </motion.div>
          )}

          <section className="glass-panel" style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', opacity: 0.8 }}>
              <User size={16} />
              <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Identity Bio</h3>
            </div>
            <textarea 
              placeholder="Tell the world about yourself..." 
              value={formData.bio}
              onChange={e => setFormData({...formData, bio: e.target.value})}
              className="dash-input"
              style={{ minHeight: '80px', resize: 'vertical', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '12px', fontSize: '0.8rem' }}
            />
          </section>

          <section className="glass-panel" style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', opacity: 0.8 }}>
              <Palette size={16} className="text-purple" />
              <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Visual Aesthetic</h3>
            </div>
            <div className="input-row" style={{ gap: '15px', marginBottom: '10px' }}>
              <div className="input-group" style={{ marginBottom: 0, gap: '4px' }}>
                <label style={{ fontSize: '0.65rem' }}>Accent Color</label>
                <div className="color-picker-wrap">
                   <input type="color" value={formData.accentColor} onChange={e => setFormData({...formData, accentColor: e.target.value})} style={{ width: '30px', height: '30px' }} />
                   <input type="text" value={formData.accentColor} onChange={e => setFormData({...formData, accentColor: e.target.value})} className="dash-input" style={{ padding: '6px 12px', fontSize: '0.75rem' }} />
                </div>
              </div>
              <div className="input-group" style={{ marginBottom: 0, gap: '4px' }}>
                <label style={{ fontSize: '0.65rem' }}>Background URL</label>
                <div className="icon-input">
                  <ImageIcon size={12} />
                  <input type="text" placeholder="https://..." value={formData.background} onChange={e => setFormData({...formData, background: e.target.value})} className="dash-input" style={{ padding: '6px 12px 6px 35px', fontSize: '0.75rem' }} />
                </div>
              </div>
            </div>
            <div className="input-group" style={{ marginBottom: 0, gap: '4px' }}>
              <label style={{ fontSize: '0.65rem' }}>Banner Image URL</label>
              <div className="icon-input">
                <ImageIcon size={12} />
                <input type="text" placeholder="https://..." value={formData.banner} onChange={e => setFormData({...formData, banner: e.target.value})} className="dash-input" style={{ padding: '6px 12px 6px 35px', fontSize: '0.75rem' }} />
              </div>
            </div>
          </section>

          <section className="glass-panel" style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', opacity: 0.8 }}>
              <Music size={16} className="text-pink" />
              <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Atmospheric Audio</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="icon-input">
                <Music size={12} />
                <input 
                  type="text" 
                  placeholder="Spotify Track URL or Direct MP3 Link" 
                  value={formData.music} 
                  onChange={e => setFormData({...formData, music: e.target.value})} 
                  className="dash-input" 
                  style={{ padding: '6px 12px 6px 35px', fontSize: '0.75rem' }}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <label className={`btn-v3 btn-v3-ghost ${uploading ? 'opacity-50 pointer-events-none' : ''}`} style={{ flex: '1 1 auto', cursor: 'pointer', padding: '8px 15px', fontSize: '0.7rem' }}>
                  <Upload size={14} />
                  <span>{uploading ? 'UPLOADING...' : 'UPLOAD OWN MP3'}</span>
                  <input type="file" accept="audio/mpeg" onChange={handleAudioUpload} hidden />
                </label>
                {formData.music && <span style={{ fontSize: '0.65rem', opacity: 0.4, maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formData.music}</span>}
              </div>
            </div>
            <p style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: '10px', lineHeight: 1.4 }}>
              <strong>Spotify Tip:</strong> Paste a track link to show a mini-player. <br/>
              <strong>Custom Audio:</strong> Upload an MP3 for automatic background sound.
            </p>
          </section>

          <section className="glass-panel" style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', opacity: 0.8 }}>
              <LinkIcon size={16} className="text-gold" />
              <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Social Uplinks</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
              {['discord', 'instagram', 'twitter', 'github', 'website'].map(s => (
                <div key={s} className="input-group" style={{ marginBottom: 0, gap: '4px' }}>
                  <label style={{ textTransform: 'capitalize', fontSize: '0.65rem' }}>{s}</label>
                  <input 
                    type="text" 
                    placeholder={`${s} handle/link`} 
                    value={formData.socials[s] || ''} 
                    onChange={e => updateSocial(s, e.target.value)}
                    className="dash-input"
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel" style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', opacity: 0.8 }}>
              <Heart size={16} className="text-red" />
              <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Favorite Assets</h3>
              <button onClick={addFavorite} style={{ marginLeft: 'auto', fontSize: '0.65rem', background: 'rgba(255, 0, 60, 0.1)', color: 'var(--cyber-pink)', padding: '4px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(255, 0, 60, 0.2)', cursor: 'pointer', transition: '0.3s' }}>
                <Plus size={10} /> Add
              </button>
            </div>
            <div className="portfolio-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {formData.favorites.map((item, idx) => (
                <div key={idx} className="glass-panel" style={{ padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)', position: 'relative' }}>
                  <button onClick={() => removeFavorite(idx)} style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--cyber-pink)', opacity: 0.5, background: 'none', border: 'none', cursor: 'pointer', transition: '0.3s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.5}>
                    <Trash2 size={12} />
                  </button>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', paddingRight: '20px' }}>
                    <div className="input-group" style={{ marginBottom: 0, gap: '4px' }}>
                      <label style={{ fontSize: '0.6rem' }}>Type</label>
                      <select 
                        value={item.type} 
                        onChange={e => updateFavorite(idx, 'type', e.target.value)}
                        className="dash-input select-v3"
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
                        onChange={e => updateFavorite(idx, 'name', e.target.value)}
                        className="dash-input"
                        style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {formData.favorites.length === 0 && (
                <p style={{ textAlign: 'center', opacity: 0.3, padding: '10px 0', fontSize: '0.65rem', fontStyle: 'italic' }}>No favorite assets indexed.</p>
              )}
            </div>
          </section>

          <section className="glass-panel" style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', opacity: 0.8 }}>
              <LinkIcon size={16} className="text-cyan" />
              <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Portfolio Assets</h3>
              <button onClick={addPortfolioItem} style={{ marginLeft: 'auto', fontSize: '0.65rem', background: 'rgba(0, 243, 255, 0.1)', color: 'var(--cyber-cyan)', padding: '4px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(0, 243, 255, 0.2)', cursor: 'pointer', transition: '0.3s' }}>
                <Plus size={10} /> Add
              </button>
            </div>
            <div className="portfolio-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {formData.portfolio.map((item, idx) => (
                <div key={idx} className="glass-panel" style={{ padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)', position: 'relative' }}>
                  <button onClick={() => removePortfolioItem(idx)} style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--cyber-pink)', opacity: 0.5, background: 'none', border: 'none', cursor: 'pointer', transition: '0.3s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.5}>
                    <Trash2 size={12} />
                  </button>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', paddingRight: '20px' }}>
                    <div className="input-group" style={{ marginBottom: 0, gap: '4px' }}>
                      <label style={{ fontSize: '0.6rem' }}>Type</label>
                      <select 
                        value={item.type} 
                        onChange={e => updatePortfolioItem(idx, 'type', e.target.value)}
                        className="dash-input select-v3"
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
                        onChange={e => updatePortfolioItem(idx, 'title', e.target.value)}
                        className="dash-input"
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
                      onChange={e => updatePortfolioItem(idx, 'url', e.target.value)}
                      className="dash-input"
                      style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                    />
                  </div>
                </div>
              ))}
              {formData.portfolio.length === 0 && (
                <p style={{ textAlign: 'center', opacity: 0.3, padding: '10px 0', fontSize: '0.65rem', fontStyle: 'italic' }}>No portfolio items added.</p>
              )}
            </div>
          </section>

          <section className="glass-panel" style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', opacity: 0.8 }}>
              <Eye size={16} className="text-cyan" />
              <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Privacy & Visibility</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div onClick={() => setFormData({...formData, showStats: !formData.showStats})} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>
                <span>Display Statistics</span>
                {formData.showStats ? <Eye color="var(--cyber-green)" size={16} /> : <EyeOff color="var(--cyber-pink)" size={16} />}
              </div>
              <div onClick={() => setFormData({...formData, showInventory: !formData.showInventory})} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>
                <span>Show Arsenal/Inventory</span>
                {formData.showInventory ? <Eye color="var(--cyber-green)" size={16} /> : <EyeOff color="var(--cyber-pink)" size={16} />}
              </div>
            </div>
          </section>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button className={`btn-v3 ${saving ? 'loading' : ''}`} onClick={handleSave} disabled={saving} style={{ padding: '12px 30px', fontSize: '0.75rem', background: 'var(--cyber-cyan)', color: '#000', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '50px', fontWeight: 900, letterSpacing: '0.1em', cursor: 'pointer', boxShadow: '0 0 15px rgba(0,243,255,0.3)' }}>
              <Save size={14} />
              <span>{saving ? 'UPDATING...' : 'SAVE CHANGES'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
