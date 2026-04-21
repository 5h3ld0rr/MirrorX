import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Music, Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Search, Volume2, VolumeX, Plus } from 'lucide-react';
import type { YouTubeVideo } from '../../services/youtube';
import { youtubeService } from '../../services/youtube';
import { useMusic } from '../../context/MusicContext';

export const MusicApp = () => {
  const { currentTrack, isPlaying, playTrack, togglePlay, setVolume, toggleMute, volume, skipForward, skipBackward, activeType, progress, duration, setProgress: updateGlobalProgress } = useMusic();
  const [activeTab, setActiveTab] = useState('Explore');
  const [songs, setSongs] = useState<YouTubeVideo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTrending();
  }, []);

  const loadTrending = async () => {
    setLoading(true);
    const data = await youtubeService.getTrendingMusic();
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="app-content" style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: '300px', padding: '2rem', borderRight: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Header removed as requested */}

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
          {[
            { id: 'Explore', icon: Search, label: 'Explore' },
            { id: 'Moods', icon: Music, label: 'Moods & Genres' },
            { id: 'Library', icon: Volume2, label: 'Library' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (item.id === 'Explore') {
                  setSearchQuery('');
                  loadTrending();
                }
              }}
              className="glass-panel"
              style={{
                padding: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem',
                background: activeTab === item.id ? 'var(--accent-glow)' : 'transparent',
                color: activeTab === item.id ? 'var(--accent-primary)' : 'white',
                cursor: 'pointer',
                border: 'none',
                width: '100%',
                textAlign: 'left'
              }}>
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </div>

        {activeTab === 'Moods' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '-1rem' }}>
            {['Focus', 'Relax', 'Workout', 'Party', 'Energy', 'Jazz'].map(mood => (
              <button
                key={mood}
                onClick={async () => {
                  setLoading(true);
                  const data = await youtubeService.searchMusic(`${mood} music`);
                  setSongs(data);
                  setLoading(false);
                }}
                className="glass-panel"
                style={{ fontSize: '0.8rem', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', border: 'none', cursor: 'pointer' }}
              >
                {mood}
              </button>
            ))}
          </div>
        )}

        <div style={{ marginTop: 'auto' }}>
          <button className="glass-panel" style={{ width: '100%', padding: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', border: 'none', background: 'rgba(255,255,255,0.05)' }}>
            <Plus size={18} /> New Playlist
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Scrollable Songs List */}
        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{searchQuery ? `Results for "${searchQuery}"` : 'Recommended'}</h3>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%' }} />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '2rem', paddingBottom: '2rem' }}>
              {songs.map((song) => (
                <motion.div
                  key={song.id}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => playTrack(song, songs)}
                  className="glass-panel"
                  style={{
                    padding: '1rem',
                    background: currentTrack?.id === song.id ? 'var(--accent-glow)' : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    border: currentTrack?.id === song.id ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.1)'
                  }}
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
                        {isPlaying ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity }}><Music color="var(--accent-primary)" size={32} /></motion.div> : <Play fill="white" size={32} />}
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
        </div>

        {/* Player Bar - Moved outside of scrollable area for dedicated touch zone */}
        {currentTrack && activeType === 'music' && (
          <div
            onClick={(e) => e.stopPropagation()} // Prevent accidental clicks to layers below
            style={{
              padding: '1.2rem 2.5rem',
              background: 'rgba(15, 15, 15, 0.95)',
              backdropFilter: 'blur(40px)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 100, // Elevated z-index
              boxShadow: '0 -10px 30px rgba(0,0,0,0.5)'
            }}>
            {/* Current Song */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', width: '30% ' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                <img src={currentTrack.thumbnail} alt="Current" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div
                  style={{ fontSize: '1rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  dangerouslySetInnerHTML={{ __html: currentTrack.title }}
                />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{currentTrack.channelTitle}</div>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', flex: 1, maxWidth: '500px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <Shuffle size={18} color="rgba(255,255,255,0.3)" />
                <button
                  onClick={(e) => { e.stopPropagation(); skipBackward(); }}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  <SkipBack size={24} fill="white" color="white" />
                </button>
                <motion.button
                  whileHover={{ scale: 1.1, boxShadow: '0 0 20px var(--accent-glow)' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-primary)',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px' }}>
                    {isPlaying ? <Pause size={24} fill="white" color="white" /> : <Play size={24} fill="white" color="white" style={{ marginLeft: '1px' }} />}
                  </div>
                </motion.button>
                <button
                  onClick={(e) => { e.stopPropagation(); skipForward(); }}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  <SkipForward size={24} fill="white" color="white" />
                </button>
                <Repeat size={18} color="rgba(255,255,255,0.3)" />
              </div>
              {/* Progress Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', width: '40px', textAlign: 'right' }}>{formatTime(progress)}</div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const percentage = x / rect.width;
                    updateGlobalProgress(Math.floor(percentage * duration));
                  }}
                  style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', position: 'relative', cursor: 'pointer' }}
                >
                  <motion.div
                    layoutId="progress-bar-fill"
                    style={{ position: 'absolute', top: 0, left: 0, width: `${(progress / duration) * 100}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: '3px', boxShadow: '0 0 10px var(--accent-primary)' }}
                  />
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', width: '40px' }}>{formatTime(duration)}</div>
              </div>
            </div>

            {/* Volume */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', justifyContent: 'flex-end', width: '30%' }}>
              <button 
                onClick={toggleMute}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '0.4rem', display: 'flex', alignItems: 'center' }}
              >
                {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => { e.stopPropagation(); setVolume(parseInt(e.target.value)); }}
                onClick={(e) => e.stopPropagation()}
                style={{ width: '120px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
