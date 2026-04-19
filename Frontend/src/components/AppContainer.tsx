import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Settings, 
  Calendar, 
  Clock1, 
  Music, 
  Cloud, 
  Newspaper, 
  Play, 
  ShoppingBag, 
  FileText 
} from 'lucide-react';

// App Components
import { CalendarApp } from './apps/CalendarApp';
import { ClockApp } from './apps/ClockApp';
import { NotesApp } from './apps/NotesApp';
import { WeatherApp } from './apps/WeatherApp';
import { SettingsApp } from './apps/SettingsApp';
import { NewsApp } from './apps/NewsApp';
import { YoutubeApp } from './apps/YoutubeApp';
import { FashionApp } from './apps/FashionApp';
import { MusicApp } from './apps/MusicApp';

interface AppContainerProps {
  activeApp: string | null;
  onClose: () => void;
  user: any;
  onLogout: () => void;
  onUpdateUser: (data: any) => void;
  onInhibitSleep: (inhibit: boolean) => void;
  bleProps: {
    bleConnected: boolean;
    bleConnecting: boolean;
    bleDeviceName: string;
    bleCharacteristic: any;
    connectBLE: () => Promise<void>;
    disconnectBLE: () => Promise<void>;
  };
}

export const AppContainer = ({ activeApp, onClose, user, onLogout, onUpdateUser, onInhibitSleep, bleProps }: AppContainerProps) => {
  const renderApp = () => {
    switch (activeApp) {
      case 'Calendar': return <CalendarApp user={user} />;
      case 'Clock': return <ClockApp />;
      case 'Notes': return <NotesApp />;
      case 'Music': return <MusicApp />;
      case 'Weather': return <WeatherApp />;
      case 'Settings': return <SettingsApp
        user={user}
        onLogout={onLogout}
        onUpdateUser={onUpdateUser}
        {...bleProps}
      />;
      case 'News': return <NewsApp />;
      case 'UTube': return <YoutubeApp onInhibitSleep={onInhibitSleep} />;
      case 'Fashion': return <FashionApp />;
      default: return null;
    }
  };

  const getAppIcon = (name: string) => {
    const iconProps = { size: 28, color: '#00f2ff', strokeWidth: 2.5 };
    switch (name) {
      case 'Settings': return <Settings {...iconProps} />;
      case 'Calendar': return <Calendar {...iconProps} />;
      case 'Clock': return <Clock1 {...iconProps} />;
      case 'Music': return <Music {...iconProps} />;
      case 'Weather': return <Cloud {...iconProps} />;
      case 'News': return <Newspaper {...iconProps} />;
      case 'Notes': return <FileText {...iconProps} />;
      case 'UTube': return <Play {...iconProps} />;
      case 'Fashion': return <ShoppingBag {...iconProps} />;
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
            overflow: 'hidden',
            pointerEvents: 'auto'
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                filter: 'drop-shadow(0 0 8px rgba(0, 242, 255, 0.4))'
              }}>
                {getAppIcon(activeApp)}
              </div>
              <span style={{ 
                fontSize: '2rem', 
                fontWeight: 700, 
                color: 'white',
                letterSpacing: '-0.02em'
              }}>
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
