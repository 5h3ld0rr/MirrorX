import { motion } from 'framer-motion';
import { Music, Play, SkipBack, SkipForward, Repeat, Shuffle, Search, Volume2, Plus, ArrowLeft } from 'lucide-react';

export const SpotifyApp = () => {
  const songs = [
    { id: 1, title: 'Mirror Effect', artist: 'Reflection Collective', album: 'Refractions', duration: '3:45', artwork: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=200&h=200' },
    { id: 2, title: 'Glass Half Full', artist: 'Liquid Vibes', album: 'Transparencies', duration: '4:12', artwork: 'https://images.unsplash.com/photo-1619983081563-430f63602796?auto=format&fit=crop&q=80&w=200&h=200' },
    { id: 3, title: 'Ambient Pulse', artist: 'Soundscape Theory', album: 'Neon Dreams', duration: '5:20', artwork: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=200&h=200' },
    { id: 4, title: 'Velvet Echo', artist: 'The Shimmering', album: 'Luminescence', duration: '3:58', artwork: 'https://images.unsplash.com/photo-1459749411177-042180ce673f?auto=format&fit=crop&q=80&w=200&h=200' },
  ];

  return (
    <div className="app-content" style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', padding: '2rem', borderRight: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Music size={28} color="#1DB954" />
          Spotify
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button className="glass-panel" style={{ padding: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(29, 185, 84, 0.1)', color: '#1DB954', cursor: 'pointer' }}>
            <Music size={18} /> My Library
          </button>
          <button className="glass-panel" style={{ padding: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
            <Search size={18} /> Browse
          </button>
          <button className="glass-panel" style={{ padding: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
            <Volume2 size={18} /> Radio
          </button>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
           <button className="glass-panel" style={{ padding: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
            <Plus size={18} /> New Playlist
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Recommended for You</h3>
          <div style={{ display: 'flex', gap: '1rem' }}>
             <button className="glass-panel" style={{ padding: '0.5rem' }}><ArrowLeft size={20} /></button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
          {songs.map((song) => (
            <motion.div
              key={song.id}
              whileHover={{ scale: 1.05 }}
              className="glass-panel"
              style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', cursor: 'pointer' }}
            >
              <div style={{ 
                width: '100%', 
                aspectRatio: '1/1', 
                borderRadius: '8px', 
                overflow: 'hidden', 
                marginBottom: '1rem',
                boxShadow: '0 8px 16px rgba(0,0,0,0.3)'
              }}>
                <img src={song.artwork} alt={song.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'white', marginBottom: '0.3rem' }}>{song.title}</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{song.artist}</p>
            </motion.div>
          ))}
        </div>

        {/* Player Bar */}
        <div style={{ 
          position: 'absolute', 
          bottom: '1rem', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          width: 'calc(100% - 4rem)',
          padding: '1.2rem 2rem', 
          borderRadius: '24px', 
          background: 'rgba(15, 15, 15, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10
        }}>
          {/* Current Song */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '250px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden' }}>
              <img src={songs[0].artwork} alt="Current" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{songs[0].title}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{songs[0].artist}</div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <Shuffle size={18} color="var(--text-muted)" />
              <SkipBack size={20} fill="white" color="white" cursor="pointer" />
              <div style={{ 
                width: '42px', 
                height: '42px', 
                borderRadius: '50%', 
                background: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'black',
                cursor: 'pointer'
              }}>
                <Play size={22} fill="black" style={{ marginLeft: '2px' }} />
              </div>
              <SkipForward size={20} fill="white" color="white" cursor="pointer" />
              <Repeat size={18} color="var(--text-muted)" />
            </div>
            {/* Progress Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', width: '100%', maxWidth: '400px' }}>
               <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: '30px' }}>1:20</div>
               <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '30%', height: '100%', background: 'white', borderRadius: '2px' }} />
                  <div style={{ position: 'absolute', top: '50%', left: '30%', width: '10px', height: '10px', background: 'white', borderRadius: '50%', transform: 'translate(-50%, -50%)', boxShadow: '0 0 10px white' }} />
               </div>
               <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: '30px' }}>{songs[0].duration}</div>
            </div>
          </div>

          {/* Volume / Extras */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'flex-end', width: '250px' }}>
            <Volume2 size={18} color="var(--text-secondary)" />
             <div style={{ width: '100px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '70%', height: '100%', background: 'var(--accent-primary)', borderRadius: '2px' }} />
               </div>
          </div>
        </div>
      </div>
    </div>
  );
};
