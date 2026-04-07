import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cloud,
  Clock1,
  LogOut,
  Settings,
  Music,
  Calendar,
  Play,
  ShoppingBag,
  Newspaper,
  FileText
} from 'lucide-react';

export const AppLauncher = ({ isOpen, onClose, user, onLogout, onSelectApp }: { 
  isOpen: boolean, 
  onClose: () => void, 
  user: any, 
  onLogout: () => void,
  onSelectApp: (name: string) => void
}) => {
  const apps = [
    { name: 'Calendar', icon: <Calendar size={22} />, color: 'hsl(0, 100%, 65%)' },
    { name: 'Spotify', icon: <Music size={22} />, color: 'hsl(142, 70%, 50%)' },
    { name: 'Weather', icon: <Cloud size={22} />, color: 'hsl(186, 100%, 50%)' },
    { name: 'News', icon: <Newspaper size={22} />, color: 'hsl(35, 100%, 60%)' },
    { name: 'Notes', icon: <FileText size={22} />, color: 'hsl(210, 100%, 60%)' },
    { name: 'Clock', icon: <Clock1 size={22} />, color: 'hsl(186, 100%, 50%)' },
    { name: 'Youtube', icon: <Play size={22} />, color: 'hsl(0, 80%, 50%)' },
    { name: 'Fashion', icon: <ShoppingBag size={22} />, color: 'hsl(320, 100%, 65%)' },
    { name: 'Settings', icon: <Settings size={22} />, color: 'hsl(240, 5%, 60%)' },
  ];

  return (
    <AnimatePresence>
      {(isOpen && user) && (
        <div 
          key="launcher-overlay"
          className="auth-overlay" 
          onClick={onClose} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            position: 'fixed',
            inset: 0,
            zIndex: 3000,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(20px)'
          }}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={e => e.stopPropagation()}
            className="glass-panel"
            style={{
              width: 'min(600px, 90vw)',
              padding: '2.5rem',
              borderRadius: '32px',
              background: 'rgba(15, 15, 15, 0.9)',
              border: '1px solid rgba(0, 242, 255, 0.2)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(40px)'
            }}
          >
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '2rem',
          textAlign: 'center'
        }}>
          {apps.map((app, i) => (
            <motion.div
              key={app.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.1, y: -5 }}
              className="app-item"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                onSelectApp(app.name);
                onClose();
              }}
            >
              <div style={{ 
                width: '60px', 
                height: '60px', 
                margin: '0 auto 0.8rem',
                borderRadius: '16px',
                background: `linear-gradient(135deg, ${app.color}15, ${app.color}35)`,
                border: `1px solid ${app.color}50`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: app.color,
                boxShadow: `0 8px 16px ${app.color}08`
              }}>
                {app.icon}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{app.name}</div>
            </motion.div>
          ))}
        </div>

        <div style={{ 
          marginTop: '3rem', 
          paddingTop: '2rem', 
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--accent-primary), #0090ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'black',
              fontWeight: 700
            }}>
              {user.name?.[0].toUpperCase() || 'U'}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '1rem', color: 'white', fontWeight: 600 }}>{user.name}</div>
            </div>
          </div>
          
          <button 
            onClick={() => {
              onLogout();
              onClose();
            }} 
            className="glass-panel"
            style={{ 
              padding: '0.6rem 1.2rem', 
              borderRadius: '12px',
              background: 'rgba(255, 61, 61, 0.1)',
              border: '1px solid rgba(255, 61, 61, 0.2)',
              color: '#ff4d4d',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
};
