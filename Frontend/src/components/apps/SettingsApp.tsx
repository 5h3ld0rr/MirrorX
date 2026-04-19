import { useState, useRef } from 'react';
import { Settings, User, Bell, Shield, Palette, HelpCircle, LogOut, Check, Loader2, Camera, ChevronRight, Globe, Moon, Sun, Monitor, Volume2, Lock } from 'lucide-react';
import { updateProfile, updateProfilePicture } from '../../lib/api';

export const SettingsApp = ({ user, onLogout, onUpdateUser }: { 
  user: any, 
  onLogout: () => void,
  onUpdateUser: (data: any) => void 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('Profile');
  
  const sections = [
    { title: 'Profile', icon: <User size={20} /> },
    { title: 'Notifications', icon: <Bell size={20} /> },
    { title: 'Security', icon: <Shield size={20} /> },
    { title: 'Appearance', icon: <Palette size={20} /> },
    { title: 'Help & Support', icon: <HelpCircle size={20} /> },
  ];

  // Profile State
  const [name, setName] = useState(user.name || '');
  const [bio, setBio] = useState(user.bio || "Passionate creator and early adopter of MirrorX tech.");
  const [photoURL, setPhotoURL] = useState(user.photoURL || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Appearance State
  const [theme, setTheme] = useState('Dark');
  const [accentColor, setAccentColor] = useState('#00f2ff');

  const [messagesEnabled, setMessagesEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const result = await updateProfilePicture(formData);
      setPhotoURL(result.photoURL);
      onUpdateUser({ photoURL: result.photoURL });
    } catch (error) {
      console.error("❌ Upload error:", error);
      setUpdateStatus('error');
    } finally {
      setIsUploadingPhoto(false);
      // Reset input so the same file can be uploaded again
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    setUpdateStatus('idle');
    try {
      await updateProfile({ name, bio });
      onUpdateUser({ name, bio });
      setUpdateStatus('success');
      setTimeout(() => setUpdateStatus('idle'), 3000);
    } catch (error) {
      console.error(error);
      setUpdateStatus('error');
    } finally {
      setIsUpdating(false);
    }
  };

  const renderSectionContent = () => {
    switch(activeTab) {
      case 'Profile':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Matching Social Profile Header */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', marginBottom: '4rem', width: '100%' }}>
              <div style={{ position: 'relative' }}>
                {/* Perfect Circle Avatar with Real Image Support */}
                <div 
                  className="avatar-container"
                  style={{ 
                    width: '180px', 
                    height: '180px', 
                    borderRadius: '50%', 
                    background: 'linear-gradient(135deg, #2c2c2e, #1c1c1e)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '5rem',
                    fontWeight: 300,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    position: 'relative',
                    border: '1px solid rgba(255,255,255,0.05)',
                    overflow: 'hidden' // Critical to clip the image to a circle
                  }}
                >
                  {photoURL ? (
                    <img 
                      src={photoURL} 
                      alt="Profile" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover', 
                        objectPosition: 'center',
                        display: 'block'
                      }} 
                    />
                  ) : (
                    name?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                
                {/* Black Camera Trigger */}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ 
                    position: 'absolute', 
                    bottom: '10px', 
                    right: '10px', 
                    width: '52px', 
                    height: '52px', 
                    borderRadius: '50%', 
                    background: '#000', 
                    border: '3px solid #fff', 
                    color: '#fff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
                    zIndex: 100,
                    transition: 'all 0.3s ease',
                    padding: 0
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {isUploadingPhoto ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                      <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                  )}
                </button>
              </div>

              <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: 600, marginBottom: '0.2rem', color: 'white' }}>Hi, {name || 'User'}</h1>
                <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.4)' }}>{user.email}</p>
                <button 
                  onClick={() => { setPhotoURL(''); onUpdateUser({ photoURL: '' }); }}
                  style={{ marginTop: '1rem', background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '0.9rem', opacity: 0.6 }}
                >
                  Reset Avatar
                </button>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '24px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <User size={22} color="var(--accent-primary)" />
                Public Identity
              </h3>
              
              <div className="input-group" style={{ marginBottom: '2rem' }}>
                <label>Legal Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div className="input-group">
                <label>Mirror Bio</label>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', minHeight: '120px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '1rem', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2.5rem' }}>
                <button 
                  onClick={handleUpdateProfile}
                  disabled={isUpdating}
                  className="glass-panel" 
                  style={{ padding: '1rem 2.5rem', background: updateStatus === 'success' ? '#4ade80' : 'var(--accent-primary)', color: updateStatus === 'success' ? 'white' : 'black', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.8rem' }}
                >
                  {isUpdating ? <Loader2 size={18} className="animate-spin" /> : (updateStatus === 'success' ? <Check size={18} /> : null)}
                  {isUpdating ? 'Synchronizing...' : (updateStatus === 'success' ? 'Identity Updated' : 'Save Changes')}
                </button>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', border: '1px solid rgba(255, 68, 68, 0.2)', borderRadius: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.8rem', color: '#ff4d4d' }}>Danger Zone</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Permanent deletion of your MirrorX identity and associated neural data.</p>
              <button style={{ padding: '0.8rem 1.5rem', border: '1px solid #ff4d4d', color: '#ff4d4d', background: 'transparent' }}>Erase Identity</button>
            </div>
          </div>
        );
      case 'Notifications':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
             <h2 style={{ fontSize: '2rem', fontWeight: 600 }}>Notifications</h2>
             <div className="glass-panel" style={{ padding: '2rem', borderRadius: '24px' }}>
                {/* Direct Messages Toggle */}
                <div 
                  onClick={() => setMessagesEnabled(!messagesEnabled)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                >
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>Mirror Direct Messages</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Get notified when you receive messages on the mirror surface.</p>
                  </div>
                  <div style={{ 
                    width: '50px', 
                    height: '26px', 
                    background: messagesEnabled ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)', 
                    borderRadius: '20px', 
                    position: 'relative',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ 
                      position: 'absolute', 
                      left: messagesEnabled ? '27px' : '3px', 
                      top: '3px', 
                      width: '20px', 
                      height: '20px', 
                      background: messagesEnabled ? 'black' : 'white', 
                      borderRadius: '50%',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }} />
                  </div>
                </div>

                {/* Biometric Toggle */}
                <div 
                  onClick={() => setBiometricEnabled(!biometricEnabled)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 0', cursor: 'pointer' }}
                >
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>Biometric Alerts</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Security alerts for unrecognized face detection attempts.</p>
                  </div>
                   <div style={{ 
                     width: '50px', 
                     height: '26px', 
                     background: biometricEnabled ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)', 
                     borderRadius: '20px', 
                     position: 'relative',
                     transition: 'all 0.3s ease'
                   }}>
                    <div style={{ 
                      position: 'absolute', 
                      left: biometricEnabled ? '27px' : '3px', 
                      top: '3px', 
                      width: '20px', 
                      height: '20px', 
                      background: biometricEnabled ? 'black' : 'white', 
                      borderRadius: '50%',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }} />
                  </div>
                </div>
             </div>
          </div>
        );
      case 'Appearance':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
             <h2 style={{ fontSize: '2rem', fontWeight: 600 }}>Appearance</h2>
             <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '24px' }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1.5rem', display: 'block' }}>Interface Theme</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
                  {[
                    { name: 'Light', icon: <Sun size={20} /> },
                    { name: 'Dark', icon: <Moon size={20} /> },
                    { name: 'System', icon: <Monitor size={20} /> }
                  ].map(t => (
                    <button 
                      key={t.name}
                      onClick={() => setTheme(t.name)}
                      style={{ 
                        height: '100px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '0.8rem',
                        background: theme === t.name ? 'rgba(0, 242, 255, 0.1)' : 'rgba(255,255,255,0.03)',
                        borderColor: theme === t.name ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                        color: theme === t.name ? 'var(--accent-primary)' : 'white'
                      }}
                    >
                      {t.icon}
                      {t.name}
                    </button>
                  ))}
                </div>

                <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1.5rem', display: 'block' }}>Accent Color</label>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    {['#00f2ff', '#ff00ff', '#facc15', '#4ade80', '#ffffff'].map(c => (
                      <div 
                        key={c} 
                        onClick={() => setAccentColor(c)}
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '50%', 
                          background: c, 
                          cursor: 'pointer',
                          border: accentColor === c ? '3px solid white' : 'none',
                          boxShadow: accentColor === c ? `0 0 15px ${c}` : 'none'
                        }} 
                      />
                    ))}
                </div>
             </div>
          </div>
        );
      case 'Security':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
             <h2 style={{ fontSize: '2rem', fontWeight: 600 }}>Security & Privacy</h2>
             <div className="glass-panel" style={{ padding: '2rem', borderRadius: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.8rem', background: 'rgba(0, 242, 255, 0.1)', borderRadius: '12px' }}>
                    <Lock size={24} color="var(--accent-primary)" />
                  </div>
                  <div style={{ flex: 1 }}>
                     <h4 style={{ marginBottom: '0.2rem' }}>Two-Factor Authentication</h4>
                     <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Current Status: <span style={{ color: '#4ade80' }}>Active</span></p>
                  </div>
                  <ChevronRight size={20} color="var(--text-muted)" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
                  <div style={{ padding: '0.8rem', background: 'rgba(255, 61, 61, 0.1)', borderRadius: '12px' }}>
                    <Shield size={24} color="#ff4d4d" />
                  </div>
                  <div style={{ flex: 1 }}>
                     <h4 style={{ marginBottom: '0.2rem' }}>Biometric Data History</h4>
                     <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Manage your stored facial recognition descriptors.</p>
                  </div>
                  <ChevronRight size={20} color="var(--text-muted)" />
                </div>
             </div>
          </div>
        )
      default:
        return <div style={{ opacity: 0.5, textAlign: 'center', marginTop: '10rem' }}>Section under development</div>;
    }
  };

  return (
    <div className="app-content" style={{ display: 'flex', height: '100%', background: 'linear-gradient(135deg, rgba(0,0,0,0.8), rgba(20,20,30,0.4))' }}>
      {/* Sidebar */}
      <div style={{ width: '320px', padding: '3rem 2rem', borderRight: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3.5rem', letterSpacing: '-0.03em' }}>
          <Settings size={32} color="var(--accent-primary)" />
          Settings
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {sections.map((section) => (
            <button
              key={section.title}
              onClick={() => setActiveTab(section.title)}
              className="glass-panel"
              style={{ 
                padding: '1.2rem 1.5rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1.2rem', 
                background: activeTab === section.title ? 'rgba(0, 242, 255, 0.08)' : 'transparent',
                borderColor: activeTab === section.title ? 'rgba(0, 242, 255, 0.3)' : 'transparent',
                color: activeTab === section.title ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                borderRadius: '16px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: activeTab === section.title ? '0 10px 20px rgba(0, 242, 255, 0.05)' : 'none'
              }}
            >
              <div style={{ transform: activeTab === section.title ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.3s' }}>
                {section.icon}
              </div>
              <span style={{ fontWeight: activeTab === section.title ? 600 : 400, fontSize: '1.05rem' }}>{section.title}</span>
              {activeTab === section.title && <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)' }} />}
            </button>
          ))}
        </div>

        <button 
          onClick={onLogout}
          className="glass-panel" 
          style={{ width: '100%', padding: '1.2rem', marginTop: '4rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid rgba(255, 61, 61, 0.15)', color: '#ff4d4d', cursor: 'pointer', borderRadius: '16px', fontWeight: 500 }}
        >
          <LogOut size={20} /> Sign Out of MirrorX
        </button>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, padding: '4rem 6rem', overflowY: 'auto' }}>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handlePhotoUpload} 
          accept="image/*" 
          style={{ display: 'none' }} 
        />
        
        <div style={{ maxWidth: '850px' }}>
          {renderSectionContent()}
        </div>
      </div>
    </div>
  );
};
