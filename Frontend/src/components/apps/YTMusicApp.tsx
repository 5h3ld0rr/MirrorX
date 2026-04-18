import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Music, Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Search, Volume2, Plus } from 'lucide-react';
import type { YouTubeVideo } from '../../services/youtube';
import { youtubeService } from '../../services/youtube';
import { useMusic } from '../../context/MusicContext';

export const YTMusicApp = () => {
  const { currentTrack, isPlaying, playTrack, togglePlay, setVolume, volume } = useMusic();
  const [songs, setSongs] = useState<YouTubeVideo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTrending();
  }, []);

  const loadTrending = async () => {
    setLoading(true);
    const data = await youtubeService.searchMusic('trending music');
    setSongs(data);
    setLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    const data = await youtubeService.searchMusic(searchQuery);
    setSongs(data);
    setLoading(false);
  };

  return (
    <div className="app-content" style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: '300px', padding: '2rem', borderRight: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ background: '#ff0000', padding: '0.4rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Music size={20} color="white" />
          </div>
          Music
        </h2>
        
        <form onSubmit={handleSearch} style={{ position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Search artists, songs..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-panel" 
            style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} 
          />
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)' }} />
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button className="glass-panel" style={{ padding: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(255, 0, 0, 0.1)', color: '#ff3d3d', cursor: 'pointer', border: 'none' }}>
            <Music size={18} /> Home
          </button>
          <button onClick={loadTrending} className="glass-panel" style={{ padding: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', border: 'none', background: 'transparent' }}>
            <Search size={18} /> Explore
          </button>
          <button className="glass-panel" style={{ padding: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', border: 'none', background: 'transparent' }}>
            <Volume2 size={18} /> Library
          </button>
        </div>

        <div style={{ marginTop: 'auto' }}>
            <button className="glass-panel" style={{ width: '100%', padding: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', border: 'none', background: 'rgba(255,255,255,0.05)' }}>
                <Plus size={18} /> New Playlist
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', position: 'relative', paddingBottom: '120px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{searchQuery ? `Results for "${searchQuery}"` : 'Recommended'}</h3>
        </div>

        {loading ? (
             <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: '#ff3d3d', borderRadius: '50%' }} />
             </div>
        ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '2rem' }}>
            {songs.map((song) => (
                <motion.div
                key={song.id}
                whileHover={{ scale: 1.05 }}
                onClick={() => playTrack(song)}
                className="glass-panel"
                style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', border: currentTrack?.id === song.id ? '1px solid #ff3d3d' : '1px solid rgba(255,255,255,0.1)' }}
                >
                <div style={{ 
                    width: '100%', 
                    aspectRatio: '1/1', 
                    borderRadius: '8px', 
                    overflow: 'hidden', 
                    marginBottom: '1rem',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                    position: 'relative'
                }}>
                    <img src={song.thumbnail} alt={song.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {currentTrack?.id === song.id && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isPlaying ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity }}><Music color="#ff3d3d" size={32} /></motion.div> : <Play fill="white" size={32} />}
                        </div>
                    )}
                </div>
                <h4 
                    style={{ fontSize: '1rem', fontWeight: 600, color: 'white', marginBottom: '0.3rem', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    dangerouslySetInnerHTML={{ __html: song.title }}
                />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{song.channelTitle}</p>
                </motion.div>
            ))}
            </div>
        )}

        {/* Player Bar */}
        {currentTrack && (
            <div style={{ 
                position: 'absolute', 
                bottom: '1rem', 
                left: '2rem', 
                right: '2rem',
                padding: '1.2rem 2rem', 
                borderRadius: '24px', 
                background: 'rgba(15, 15, 15, 0.9)',
                backdropFilter: 'blur(30px)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 10,
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
                {/* Current Song */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '300px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden' }}>
                    <img src={currentTrack.thumbnail} alt="Current" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                    <div 
                        style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        dangerouslySetInnerHTML={{ __html: currentTrack.title }}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{currentTrack.channelTitle}</div>
                    </div>
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <Shuffle size={18} color="var(--text-muted)" />
                    <SkipBack size={20} fill="white" color="white" cursor="pointer" />
                    <motion.div 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={togglePlay}
                        style={{ 
                        width: '42px', 
                        height: '42px', 
                        borderRadius: '50%', 
                        background: 'white', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'black',
                        cursor: 'pointer'
                        }}
                    >
                        {isPlaying ? <Pause size={22} fill="black" /> : <Play size={22} fill="black" style={{ marginLeft: '2px' }} />}
                    </motion.div>
                    <SkipForward size={20} fill="white" color="white" cursor="pointer" />
                    <Repeat size={18} color="var(--text-muted)" />
                    </div>
                    {/* Progress Bar (Mock) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', width: '100%', maxWidth: '400px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: '30px' }}>1:20</div>
                    <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '30%', height: '100%', background: 'white', borderRadius: '2px' }} />
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: '30px' }}>3:45</div>
                    </div>
                </div>

                {/* Volume */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'flex-end', width: '300px' }}>
                    <Volume2 size={18} color="var(--text-secondary)" />
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={volume} 
                        onChange={(e) => setVolume(parseInt(e.target.value))}
                        style={{ width: '100px', accentColor: '#ff3d3d' }}
                    />
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
