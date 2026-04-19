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
    { name: 'Music', icon: <Music size={22} />, color: 'hsl(0, 100%, 50%)' },
    { name: 'Weather', icon: <Cloud size={22} />, color: 'hsl(186, 100%, 50%)' },
    { name: 'News', icon: <Newspaper size={22} />, color: 'hsl(35, 100%, 60%)' },
    { name: 'Notes', icon: <FileText size={22} />, color: 'hsl(210, 100%, 60%)' },
    { name: 'Clock', icon: <Clock1 size={22} />, color: 'hsl(186, 100%, 50%)' },
    { name: 'UTube', icon: <Play size={22} />, color: 'hsl(0, 80%, 50%)' },
    { name: 'Fashion', icon: <ShoppingBag size={22} />, color: 'hsl(320, 100%, 65%)' },
    { name: 'Settings', icon: <Settings size={22} />, color: 'hsl(240, 5%, 60%)' },
  ];

  return (
    <AnimatePresence>
      {(isOpen && user) && (
        <motion.div
          key="launcher-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
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
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ scale: 1.05, y: -8 }}
                  className="app-item"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    onSelectApp(app.name);
                    onClose();
                  }}
                >
                  <div style={{
                    width: '72px',
                    height: '72px',
                    margin: '0 auto 1rem',
                    borderRadius: '22px',
                    background: `linear-gradient(135deg, ${app.color}20, ${app.color}35)`,
                    border: `1px solid ${app.color}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: app.color,
                    boxShadow: `0 12px 24px rgba(0,0,0,0.3), 0 0 20px ${app.color}15`,
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at center, ${app.color}40, transparent 70%)`, opacity: 0.3 }} />
                    {app.icon}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'white', fontWeight: 600, letterSpacing: '0.01em', opacity: 0.8 }}>{app.name}</div>
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
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: user.photoURL ? `url(${user.photoURL})` : 'linear-gradient(135deg, var(--accent-primary), #0090ff)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'black',
                  fontWeight: 700,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    user.name?.[0].toUpperCase() || 'U'
                  )}
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
        </motion.div>
      )}
    </AnimatePresence>
  );
};
