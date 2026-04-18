import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Music } from 'lucide-react';
import { useMusic } from '../context/MusicContext';

interface MusicWidgetProps {
  isIdle: boolean;
}

export const MusicWidget = ({ isIdle }: MusicWidgetProps) => {
  const { currentTrack, isPlaying, togglePlay } = useMusic();

  if (!currentTrack) return null;

  return (
    <AnimatePresence>
      {isIdle && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 4000,
            width: '320px',
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(16px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          {/* Artwork */}
          <div style={{ 
            width: '56px', 
            height: '56px', 
            borderRadius: '12px', 
            overflow: 'hidden',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            position: 'relative'
          }}>
            <img 
              src={currentTrack.thumbnail} 
              alt={currentTrack.title} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            {!isPlaying && (
              <div style={{ 
                position: 'absolute', 
                inset: 0, 
                background: 'rgba(0,0,0,0.3)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Pause size={16} color="white" fill="white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ 
              fontSize: '0.9rem', 
              fontWeight: 600, 
              color: 'white', 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis' 
            }}>
              {currentTrack.title}
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
              <Music size={12} />
              {currentTrack.channelTitle}
            </div>
          </div>

          {/* Controls */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: isPlaying ? 'white' : 'rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: 'none',
              color: isPlaying ? 'black' : 'white',
            }}
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" style={{ marginLeft: '2px' }} />}
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
