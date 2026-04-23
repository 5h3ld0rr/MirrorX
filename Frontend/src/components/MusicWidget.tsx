import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { useState } from 'react';

export const MusicWidget = () => {
  const { 
    currentTrack, isPlaying, togglePlay, skipForward, skipBackward, 
    progress, duration, activeType, volume, setVolume, toggleMute, seekTo 
  } = useMusic();
  const [showVolume, setShowVolume] = useState(false);

  if (!currentTrack || activeType === 'video') return null;

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
        padding: '1rem',
        borderRadius: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.8rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <motion.div
          animate={{ rotate: isPlaying ? 360 : 0, scale: isPlaying ? 1.1 : 1 }}
          transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" }, scale: { duration: 0.5 } }}
          style={{
            width: '60px', height: '60px', borderRadius: '14px', overflow: 'hidden', flexShrink: 0,
            boxShadow: isPlaying ? '0 0 20px var(--accent-primary)' : '0 4px 12px rgba(0,0,0,0.3)',
            position: 'relative'
          }}
        >
          <img src={currentTrack.thumbnail} alt={currentTrack.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </motion.div>

        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.1rem' }}>
            {currentTrack.title}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ color: 'var(--accent-primary)' }}>{currentTrack.channelTitle}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: duration > 0 ? `${(progress / duration) * 100}%` : 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 45 }}
            style={{ height: '100%', background: 'var(--accent-primary)', borderRadius: '2px', boxShadow: '0 0 8px var(--accent-glow)' }}
          />
        </div>
        <div 
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = x / rect.width;
            seekTo(Math.floor(percentage * duration));
          }}
          style={{ width: '100%', height: '14px', marginTop: '-14px', cursor: 'pointer', zIndex: 5, position: 'relative' }} 
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
          <span>{formatTime(progress)}</span>
          <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
        </div>
      </div>

      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
        <motion.button
          whileHover={{ color: 'white' }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); skipBackward(); }}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
        >
          <SkipBack size={20} fill="currentColor" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1, border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.15)' }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          style={{
            width: '48px', 
            height: '48px', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            cursor: 'pointer',
            background: 'rgba(255, 255, 255, 0.08)', 
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            backdropFilter: 'blur(20px)',
            transition: 'all 0.3s ease',
            zIndex: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isPlaying ? <Pause size={22} fill="white" color="white" /> : <Play size={22} fill="white" color="white" style={{ marginLeft: '4px' }} />}
          </div>
        </motion.button>

        <motion.button
          whileHover={{ color: 'white' }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); skipForward(); }}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
        >
          <SkipForward size={20} fill="currentColor" />
        </motion.button>

        <div onMouseEnter={() => setShowVolume(true)} onMouseLeave={() => setShowVolume(false)} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <AnimatePresence>
            {showVolume && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', padding: '1rem 0.5rem', background: 'rgba(20, 20, 20, 0.9)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '0.8rem', height: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}
              >
                <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(parseInt(e.target.value))} style={{ WebkitAppearance: 'slider-vertical', width: '4px', height: '100%', cursor: 'pointer', outline: 'none', accentColor: 'var(--accent-primary)' }} />
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button
            whileHover={{ color: 'var(--accent-primary)' }}
            onClick={(e) => { e.stopPropagation(); toggleMute(); }}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '0.4rem', display: 'flex', alignItems: 'center' }}
          >
            {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
