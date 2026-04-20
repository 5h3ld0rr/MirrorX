import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Music, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { useState } from 'react';


export const MusicWidget = ({ location }: { location?: string }) => {
  const { currentTrack, isPlaying, togglePlay, skipForward, skipBackward, progress, duration, activeType, volume, setVolume } = useMusic();
  const [showVolume, setShowVolume] = useState(false);

  if (!currentTrack || activeType === 'video') return null;

  const isRightSide = location?.includes('right');

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-panel"
      style={{
        width: '380px',
        padding: '1.2rem',
        borderRadius: '28px',
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: duration > 0 ? `${(progress / duration) * 100}%` : 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 45 }}
            style={{ height: '100%', background: 'var(--accent-primary)', borderRadius: '2px', boxShadow: '0 0 8px var(--accent-glow)' }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
          <span>{formatTime(progress)}</span>
          <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
        </div>
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

        {/* Volume Control */}
        <div 
          onMouseEnter={() => setShowVolume(true)}
          onMouseLeave={() => setShowVolume(false)}
          style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
        >
          <AnimatePresence>
            {showVolume && (
              <motion.div
                initial={{ opacity: 0, x: isRightSide ? 10 : -10, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: isRightSide ? 10 : -10, scale: 0.9 }}
                style={{ 
                  position: 'absolute',
                  bottom: '0',
                  right: isRightSide ? '100%' : 'auto',
                  left: !isRightSide ? '100%' : 'auto',
                  padding: '1rem 0.5rem',
                  background: 'rgba(20, 20, 20, 0.9)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  marginRight: isRightSide ? '0.8rem' : '0',
                  marginLeft: !isRightSide ? '0.8rem' : '0',
                  height: '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  zIndex: 10
                }}
              >
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(parseInt(e.target.value))}
                      style={{
                        WebkitAppearance: 'slider-vertical',
                        width: '4px',
                        height: '100%',
                        cursor: 'pointer',
                        outline: 'none',
                        accentColor: 'var(--accent-primary)'
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ color: 'var(--accent-primary)' }}
                onClick={(e) => { e.stopPropagation(); setVolume(volume === 0 ? 70 : 0); }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '0.4rem' }}
              >
                {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </motion.button>
            </div>
          </div>
    </motion.div>
  );
};
