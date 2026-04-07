import { Settings, User, Bell, Shield, Palette, HelpCircle, LogOut } from 'lucide-react';

export const SettingsApp = ({ user, onLogout }: { user: any, onLogout: () => void }) => {
  const sections = [
    { title: 'Profile', icon: <User size={20} />, active: true },
    { title: 'Notifications', icon: <Bell size={20} /> },
    { title: 'Security', icon: <Shield size={20} /> },
    { title: 'Appearance', icon: <Palette size={20} /> },
    { title: 'Help & Support', icon: <HelpCircle size={20} /> },
  ];

  return (
    <div className="app-content" style={{ display: 'flex', height: '100%' }}>
      {/* Sidebar */}
      <div style={{ width: '280px', padding: '2rem', borderRight: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)' }}>
        <h2 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '2.5rem' }}>
          <Settings size={28} color="var(--accent-primary)" />
          Settings
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sections.map((section) => (
            <button
              key={section.title}
              className="glass-panel"
              style={{ 
                padding: '1rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem', 
                background: section.active ? 'rgba(0, 242, 255, 0.1)' : 'rgba(255,255,255,0.03)',
                borderColor: section.active ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                color: section.active ? 'var(--accent-primary)' : 'white',
                cursor: 'pointer'
              }}
            >
              {section.icon}
              {section.title}
            </button>
          ))}
        </div>

        <button 
          onClick={onLogout}
          className="glass-panel" 
          style={{ width: '100%', padding: '1rem', marginTop: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid rgba(255, 61, 61, 0.2)', color: '#ff4d4d', cursor: 'pointer' }}
        >
          <LogOut size={20} /> Sign Out
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '3rem 4rem', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '4rem' }}>
           <div style={{ 
              width: '120px', 
              height: '120px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--accent-primary), #0090ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'black',
              fontSize: '4rem',
              fontWeight: 700,
              boxShadow: '0 0 30px rgba(0, 242, 255, 0.2)'
            }}>
              {user.name?.[0].toUpperCase() || 'U'}
            </div>
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>{user.name}</h1>
              <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>{user.email}</p>
            </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.5rem' }}>Public Profile</h3>
            <div className="input-group">
                <label>Display Name</label>
                <input type="text" value={user.name} readOnly style={{ opacity: 0.7 }} />
            </div>
            <div className="input-group">
                <label>Bio</label>
                <textarea 
                  className="glass-panel" 
                  style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', minHeight: '100px', cursor: 'default' }}
                  defaultValue="Passionate creator and early adopter of MirrorX tech. Exploring the future of ambient computing and human-computer interaction."
                />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button className="glass-panel" style={{ padding: '0.8rem 2rem', background: 'var(--accent-primary)', color: 'black', fontWeight: 600 }}>Update Profile</button>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '2rem', border: '1px solid rgba(255, 68, 68, 0.2)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem', color: '#ff4d4d' }}>Danger Zone</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Deleting your account is permanent. All your data, including photos and notes, will be erased instantly.</p>
             <button className="glass-panel" style={{ padding: '0.8rem 1.5rem', border: '1px solid #ff4d4d', color: '#ff4d4d', cursor: 'pointer' }}>Delete Identity</button>
          </div>
        </div>
      </div>
    </div>
  );
};
