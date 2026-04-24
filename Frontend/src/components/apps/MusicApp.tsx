import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Music, Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Search, Volume2, VolumeX, Plus, ListMusic, Trash2 } from 'lucide-react';
import type { YouTubeVideo } from '../../services/youtube';
import { youtubeService } from '../../services/youtube';
import { useMusic } from '../../context/MusicContext';
import { getPlaylists, createPlaylist as apiCreatePlaylist, updatePlaylist as apiUpdatePlaylist, deletePlaylist as apiDeletePlaylist } from '../../lib/api';

interface Playlist {
  id: string;
  name: string;
  tracks: YouTubeVideo[];
}

export const MusicApp = () => {
  const { 
    currentTrack, isPlaying, playTrack, togglePlay, 
    setVolume, volume, skipForward, skipBackward, 
    activeType, progress, duration, seekTo,
    isShuffle, isLoop, toggleShuffle, toggleLoop,
    toggleMute
  } = useMusic();
  const [activeTab, setActiveTab] = useState('Explore');
  const [songs, setSongs] = useState<YouTubeVideo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState<string | null>(null);

  useEffect(() => {
    loadTrending();
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const data = await getPlaylists();
      setPlaylists(data);
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
      // Fallback to local storage if API fails or user not logged in
      const saved = localStorage.getItem('music_playlists');
      if (saved) setPlaylists(JSON.parse(saved));
    }
  };

  const createPlaylist = async () => {
    const name = prompt('Enter playlist name:');
    if (!name) return;
    try {
      const newPlaylist = await apiCreatePlaylist({ name, tracks: [] });
      setPlaylists([...playlists, newPlaylist]);
    } catch (error) {
      console.error('Failed to create playlist:', error);
    }
  };

  const deletePlaylist = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this playlist?')) return;
    try {
      await apiDeletePlaylist(id);
      const newPlaylists = playlists.filter(p => p.id !== id);
      setPlaylists(newPlaylists);
      if (activePlaylistId === id) {
        setActivePlaylistId(null);
        setActiveTab('Explore');
      }
    } catch (error) {
      console.error('Failed to delete playlist:', error);
    }
  };

  const addToPlaylist = async (playlistId: string, track: YouTubeVideo) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;
    
    if (playlist.tracks.find(t => t.id === track.id)) {
      setShowAddMenu(null);
      return;
    }

    const updatedTracks = [...playlist.tracks, track];
    try {
      await apiUpdatePlaylist(playlistId, { tracks: updatedTracks });
      setPlaylists(playlists.map(p => p.id === playlistId ? { ...p, tracks: updatedTracks } : p));
      setShowAddMenu(null);
    } catch (error) {
      console.error('Failed to add to playlist:', error);
    }
  };

  const removeFromPlaylist = async (playlistId: string, trackId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    const updatedTracks = playlist.tracks.filter(t => t.id !== trackId);
    try {
      await apiUpdatePlaylist(playlistId, { tracks: updatedTracks });
      setPlaylists(playlists.map(p => p.id === playlistId ? { ...p, tracks: updatedTracks } : p));
      if (activePlaylistId === playlistId) setSongs(updatedTracks);
    } catch (error) {
      console.error('Failed to remove from playlist:', error);
    }
  };

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
            { id: 'Library', icon: Volume2, label: 'Library' },
            { id: 'Playlists', icon: ListMusic, label: 'My Playlists' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setActivePlaylistId(null);
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

        {activeTab === 'Playlists' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
            {playlists.map(playlist => (
              <div 
                key={playlist.id} 
                style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
                onMouseEnter={(e) => (e.currentTarget.lastChild as HTMLElement).style.opacity = '1'}
                onMouseLeave={(e) => (e.currentTarget.lastChild as HTMLElement).style.opacity = '0'}
              >
                <button
                  onClick={() => {
                    setActivePlaylistId(playlist.id);
                    setSongs(playlist.tracks);
                  }}
                  className="glass-panel"
                  style={{
                    padding: '0.6rem 0.8rem',
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.8rem',
                    background: activePlaylistId === playlist.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: 'white',
                    cursor: 'pointer',
                    border: 'none',
                    textAlign: 'left',
                    fontSize: '0.9rem'
                  }}
                >
                  <ListMusic size={14} /> {playlist.name}
                </button>
                <button
                  onClick={(e) => deletePlaylist(e, playlist.id)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    background: 'none',
                    border: 'none',
                    color: '#ff4444',
                    cursor: 'pointer',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    padding: '4px'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

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
          <button 
            onClick={createPlaylist}
            className="glass-panel" 
            style={{ width: '100%', padding: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', border: 'none', background: 'rgba(255,255,255,0.05)' }}
          >
            <Plus size={18} /> New Playlist
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Scrollable Songs List */}
        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', position: 'relative', touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
              {activePlaylistId ? playlists.find(p => p.id === activePlaylistId)?.name : (searchQuery ? `Results for "${searchQuery}"` : 'Recommended')}
            </h3>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%' }} />
            </div>
          ) : songs.length > 0 ? (
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
                    border: currentTrack?.id === song.id ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.1)',
                    position: 'relative'
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
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h4
                        style={{ fontSize: '1rem', fontWeight: 600, color: 'white', marginBottom: '0.3rem', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                        dangerouslySetInnerHTML={{ __html: song.title }}
                      />
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{song.channelTitle}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {activePlaylistId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromPlaylist(activePlaylistId, song.id);
                          }}
                          style={{ background: 'none', border: 'none', color: 'rgba(255,68,68,0.5)', cursor: 'pointer', padding: '4px' }}
                          title="Remove from playlist"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAddMenu(showAddMenu === song.id ? null : song.id);
                        }}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '4px' }}
                        title="Add to playlist"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>

                  {showAddMenu === song.id && (
                    <div 
                      className="glass-panel"
                      style={{ 
                        position: 'absolute', 
                        bottom: '100%', 
                        right: '0', 
                        zIndex: 10, 
                        width: '200px', 
                        background: 'rgba(15, 15, 15, 0.95)',
                        backdropFilter: 'blur(20px)',
                        padding: '0.5rem',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.2rem'
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', padding: '0.4rem', color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '0.2rem' }}>ADD TO PLAYLIST</div>
                      {playlists.length === 0 && (
                        <div style={{ fontSize: '0.8rem', padding: '0.5rem', color: 'rgba(255,255,255,0.3)' }}>No playlists found</div>
                      )}
                      {playlists.map(p => (
                        <button
                          key={p.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            addToPlaylist(p.id, song);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            textAlign: 'left',
                            padding: '0.6rem',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            borderRadius: '4px'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                        >
                          {p.name}
                        </button>
                      ))}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          createPlaylist();
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent-primary)',
                          textAlign: 'left',
                          padding: '0.6rem',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          borderTop: '1px solid rgba(255,255,255,0.1)',
                          marginTop: '0.2rem'
                        }}
                      >
                        <Plus size={14} /> New Playlist
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : activePlaylistId ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 2rem', gap: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Music size={40} style={{ opacity: 0.3 }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>This playlist is empty</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Start adding your favorite tracks!</p>
              </div>
              <button 
                onClick={() => { setActiveTab('Explore'); setActivePlaylistId(null); loadTrending(); }}
                className="glass-panel"
                style={{ 
                  padding: '1rem 2rem', 
                  background: 'var(--accent-primary)', 
                  color: 'black', 
                  border: 'none', 
                  cursor: 'pointer', 
                  borderRadius: '12px', 
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.8rem'
                }}
              >
                <Search size={18} /> Browse Songs
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', opacity: 0.5 }}>
              <p>No songs found</p>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{currentTrack.channelTitle}</div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAddMenu(showAddMenu === 'current' ? null : 'current');
                    }}
                    style={{ 
                      background: 'rgba(255,255,255,0.05)', 
                      border: 'none', 
                      color: 'rgba(255,255,255,0.7)', 
                      cursor: 'pointer', 
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <Plus size={12} /> Add to Playlist
                  </button>
                </div>
              </div>

              {showAddMenu === 'current' && (
                <div 
                  className="glass-panel"
                  style={{ 
                    position: 'absolute', 
                    bottom: '100%', 
                    left: '80px', 
                    zIndex: 200, 
                    width: '200px', 
                    background: 'rgba(15, 15, 15, 0.98)',
                    backdropFilter: 'blur(20px)',
                    padding: '0.5rem',
                    boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                    marginBottom: '1rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', padding: '0.4rem', color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '0.2rem' }}>ADD TO PLAYLIST</div>
                  {playlists.map(p => (
                    <button
                      key={p.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        addToPlaylist(p.id, currentTrack);
                        setShowAddMenu(null);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        textAlign: 'left',
                        padding: '0.6rem',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        borderRadius: '4px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      {p.name}
                    </button>
                  ))}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      createPlaylist();
                      setShowAddMenu(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-primary)',
                      textAlign: 'left',
                      padding: '0.6rem',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      borderTop: '1px solid rgba(255,255,255,0.1)',
                      marginTop: '0.2rem'
                    }}
                  >
                    <Plus size={14} /> New Playlist
                  </button>
                </div>
              )}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', flex: 1, maxWidth: '500px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleShuffle(); }}
                  style={{ background: 'none', border: 'none', padding: '0.5rem', cursor: 'pointer', color: isShuffle ? 'var(--accent-primary)' : 'rgba(255,255,255,0.3)', transition: 'all 0.3s' }}
                >
                  <Shuffle size={18} color="currentColor" />
                </button>
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
                    background: 'none', 
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px' }}>
                    {isPlaying ? <Pause size={24} fill="white" color="white" /> : <Play size={24} fill="white" color="white" style={{ marginLeft: '2px' }} />}
                  </div>
                </motion.button>

                <button
                  onClick={(e) => { e.stopPropagation(); skipForward(); }}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  <SkipForward size={24} fill="white" color="white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLoop(); }}
                  style={{ background: 'none', border: 'none', padding: '0.5rem', cursor: 'pointer', color: isLoop ? 'var(--accent-primary)' : 'rgba(255,255,255,0.3)', transition: 'all 0.3s' }}
                >
                  <Repeat size={18} color="currentColor" />
                </button>
              </div>
              {/* Progress Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', width: '40px', textAlign: 'right' }}>{formatTime(progress)}</div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const percentage = Math.max(0, Math.min(1, x / rect.width));
                    seekTo(Math.floor(percentage * duration));
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
                onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {volume === 0 ? <VolumeX size={20} color="#ff4444" /> : <Volume2 size={20} color="rgba(255,255,255,0.5)" />}
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
