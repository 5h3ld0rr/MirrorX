import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

// App Components
import { CalendarApp } from './apps/CalendarApp';
import { ClockApp } from './apps/ClockApp';
import { NotesApp } from './apps/NotesApp';
import { SpotifyApp } from './apps/SpotifyApp';
import { WeatherApp } from './apps/WeatherApp';
import { SettingsApp } from './apps/SettingsApp';
import { NewsApp } from './apps/NewsApp';
import { YoutubeApp } from './apps/YoutubeApp';
import { FashionApp } from './apps/FashionApp';

interface AppContainerProps {
  activeApp: string | null;
  onClose: () => void;
  user: any;
  onLogout: () => void;
}

export const AppContainer = ({ activeApp, onClose, user, onLogout }: AppContainerProps) => {
  const renderApp = () => {
    switch (activeApp) {
      case 'Calendar': return <CalendarApp />;
      case 'Clock': return <ClockApp />;
      case 'Notes': return <NotesApp />;
      case 'Spotify': return <SpotifyApp />;
      case 'Weather': return <WeatherApp />;
      case 'Settings': return <SettingsApp user={user} onLogout={onLogout} />;
      case 'News': return <NewsApp />;
      case 'Youtube': return <YoutubeApp />;
      case 'Fashion': return <FashionApp />;
      default: return null;
    }
  };

  return (
    <AnimatePresence>
      {activeApp && (
        <motion.div
          initial={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          style={{
          position: 'fixed',
          inset: 0,
          zIndex: 4000,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(60px) brightness(0.6)',
          display: 'flex',
          flexDirection: 'column',
          color: 'white',
          overflow: 'hidden'
        }}
      >
        {/* Global Toolbar */}
        <div style={{ 
          padding: '1.5rem 3rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          background: 'rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              borderRadius: '50%', 
              background: 'var(--accent-primary)',
              boxShadow: '0 0 10px var(--accent-primary)' 
            }} />
            <span style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              {activeApp}
            </span>
          </div>
          
          <button 
            onClick={onClose}
            className="glass-panel"
            style={{ 
              width: '44px', 
              height: '44px', 
              padding: 0, 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* App Framework */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {renderApp()}
        </div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};
