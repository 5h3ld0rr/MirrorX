import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Music, SkipBack, SkipForward } from 'lucide-react';
import { useMusic } from '../context/MusicContext';

interface MusicWidgetProps {
  isIdle: boolean;
}

export const MusicWidget = ({ isIdle }: MusicWidgetProps) => {
  const { currentTrack, isPlaying, togglePlay, skipForward, skipBackward, progress, duration, activeType } = useMusic();

  if (!currentTrack || activeType === 'video') return null;

  return (
    <AnimatePresence>
      {isIdle && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: 100 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, x: 100 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 4000,
            width: '380px',
            padding: '1.2rem',
            background: 'rgba(10, 10, 15, 0.4)',
            backdropFilter: 'blur(24px) saturate(180%)',
            borderRadius: '28px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
            {/* Artwork with Animated Glow */}
            <motion.div 
              animate={{ 
                rotate: isPlaying ? 360 : 0,
                scale: isPlaying ? 1.05 : 1
              }}
              transition={{ 
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                scale: { duration: 0.5 }
              }}
              style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '16px', 
                overflow: 'hidden',
                flexShrink: 0,
                boxShadow: isPlaying ? '0 0 20px var(--accent-primary)' : '0 4px 12px rgba(0,0,0,0.3)',
                position: 'relative'
              }}
            >
              <img 
                src={currentTrack.thumbnail} 
                alt={currentTrack.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              {!isPlaying && (
                <div style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  background: 'rgba(0,0,0,0.4)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <Music size={20} color="white" opacity={0.6} />
                </div>
              )}
            </motion.div>

            {/* Title & Channel */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: 700, 
                color: 'white', 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                marginBottom: '0.2rem'
              }}>
                {currentTrack.title}
              </div>
              <div style={{ 
                fontSize: '0.8rem', 
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <span style={{ color: 'var(--accent-primary)' }}>{currentTrack.channelTitle}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar (Dynamic Sync) */}
          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(progress / duration) * 100}%` }}
              transition={{ type: 'spring', damping: 15, stiffness: 45 }}
              style={{ height: '100%', background: 'var(--accent-primary)', borderRadius: '2px', boxShadow: '0 0 8px var(--accent-glow)' }}
            />
          </div>

          {/* Advanced Controls */}
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}
          >
            <motion.button
              whileHover={{ color: 'white' }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); skipBackward(); }}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
            >
              <SkipBack size={20} fill="currentColor" />
            </motion.button>

            <motion.button
              whileHover={{ boxShadow: '0 0 15px var(--accent-glow)' }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                transition: 'all 0.3s ease'
              }}
            >
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px' }}>
                {isPlaying ? <Pause size={22} fill="white" color="white" /> : <Play size={22} fill="white" color="white" style={{ marginLeft: '1px' }} />}
             </div>
            </motion.button>

            <motion.button
              whileHover={{ color: 'white' }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); skipForward(); }}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
            >
              <SkipForward size={20} fill="currentColor" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
