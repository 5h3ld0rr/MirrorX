import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Volume2, VolumeX, Maximize, Minimize, Play, Pause, SkipForward, Settings, Subtitles } from 'lucide-react';
import type { YouTubeVideo } from '../../services/youtube';
import { youtubeService } from '../../services/youtube';
import { useMusic } from '../../context/MusicContext';

export const YoutubeApp = ({ onInhibitSleep }: { onInhibitSleep?: (inhibit: boolean) => void }) => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [relatedVideos, setRelatedVideos] = useState<YouTubeVideo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [userActive, setUserActive] = useState(true);
  const userActiveTimeout = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState('auto');
  const [showSettings, setShowSettings] = useState(false);
  const [channelDetails, setChannelDetails] = useState<{ avatar: string; subscriberCount: string } | null>(null);
  const [channelAvatars, setChannelAvatars] = useState<{ [key: string]: string }>({});
  const [activeTag, setActiveTag] = useState('All');
  const { playVideo, currentTrack, activeType, stopAll, isPlaying, volume, togglePlay, setVolume, toggleMute, progress, duration, setProgress, setDuration } = useMusic();

  const selectedVideo = activeType === 'video' ? currentTrack : null;

  useEffect(() => {
    if (selectedVideo) {
      youtubeService.getRelatedVideos(selectedVideo.id).then(setRelatedVideos);
      if (selectedVideo.channelId) {
        youtubeService.getChannelDetails(selectedVideo.channelId).then(setChannelDetails);
      } else {
        setChannelDetails(null);
      }
    }
  }, [selectedVideo]);

  // Sync Video Playback
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe && loaded && activeType === 'video') {
      const command = isPlaying ? 'playVideo' : 'pauseVideo';
      iframe.contentWindow?.postMessage(JSON.stringify({ 
        event: 'command', 
        func: command, 
        args: [] 
      }), '*');
    }
  }, [isPlaying, loaded, activeType]);
  
  // Sync Sleep Inhibition
  useEffect(() => {
    if (activeType === 'video' && isPlaying && onInhibitSleep) {
      onInhibitSleep(true);
    } else if (onInhibitSleep) {
      onInhibitSleep(false);
    }
    
    return () => onInhibitSleep?.(false);
  }, [activeType, isPlaying, onInhibitSleep]);

  // Sync Volume
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe && loaded && activeType === 'video') {
      iframe.contentWindow?.postMessage(JSON.stringify({ 
        event: 'command', 
        func: 'setVolume', 
        args: [volume] 
      }), '*');
    }
  }, [volume, loaded, activeType]);

  // Sync Playback Rate
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe && loaded && activeType === 'video') {
      iframe.contentWindow?.postMessage(JSON.stringify({ 
        event: 'command', 
        func: 'setPlaybackRate', 
        args: [playbackRate] 
      }), '*');
    }
  }, [playbackRate, loaded, activeType]);

  // Sync IFrame Data (Time/Duration)
  useEffect(() => {
    if (!loaded || activeType !== 'video') return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'infoDelivery' && data.info) {
          if (data.info.currentTime !== undefined) setProgress(Math.floor(data.info.currentTime));
          if (data.info.duration !== undefined) setDuration(Math.floor(data.info.duration));
        }
      } catch (e) {
        // Not a JSON message or not from YouTube
      }
    };

    window.addEventListener('message', handleMessage);
    
    const pollInterval = setInterval(() => {
      const iframe = iframeRef.current;
      if (iframe && isPlaying) {
        iframe.contentWindow?.postMessage(JSON.stringify({ event: 'listening' }), '*');
      }
    }, 1000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(pollInterval);
    };
  }, [loaded, activeType, isPlaying, setProgress, setDuration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const formatSubCount = (count: string) => {
    if (!count) return '0 subscribers';
    const num = parseInt(count);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M subscribers`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K subscribers`;
    return `${num} subscribers`;
  };

  const formatDuration = (duration: string) => {
    if (!duration) return '';
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '';
    const [ , hours, minutes, seconds ] = match;
    const parts = [
      hours && hours.padStart(2, '0'),
      (minutes || '0').padStart(2, '0'),
      (seconds || '0').padStart(2, '0')
    ].filter(Boolean);
    if (parts.length === 2 && parts[0] === '00' && parts[1] === '00') return '0:00';
    return parts.join(':').replace(/^0/, '');
  };

  const formatRelativeTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const formatViews = (views: string) => {
    if (!views) return '0 views';
    const num = parseInt(views);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M views`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K views`;
    return `${num} views`;
  };

  const handleSelectVideo = (video: YouTubeVideo) => {
    playVideo(video);
  };

  useEffect(() => {
    loadTrending();
    return () => {
      // Use a functional check to avoid stale closure if activeType changes
      if (activeType === 'video') stopAll();
      if (userActiveTimeout.current) clearTimeout(userActiveTimeout.current);
    };
  }, []);

  const resetUserTimer = () => {
    setUserActive(true);
    if (userActiveTimeout.current) clearTimeout(userActiveTimeout.current);
    userActiveTimeout.current = setTimeout(() => {
      setUserActive(false);
    }, 2000); // Hide after 2 seconds of inactivity
  };

  const loadTrending = async () => {
    setLoading(true);
    const data = await youtubeService.getTrendingVideos();
    setVideos(data);
    
    // Fetch avatars batch
    const channelIds = [...new Set(data.filter(v => v.channelId).map(v => v.channelId as string))];
    if (channelIds.length > 0) {
      const avatars = await youtubeService.getChannelsAvatars(channelIds);
      setChannelAvatars(prev => ({ ...prev, ...avatars }));
    }
    
    setLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    const data = await youtubeService.searchVideos(searchQuery);
    setVideos(data);

    // Fetch avatars batch
    const channelIds = [...new Set(data.filter(v => v.channelId).map(v => v.channelId as string))];
    if (channelIds.length > 0) {
      const avatars = await youtubeService.getChannelsAvatars(channelIds);
      setChannelAvatars(prev => ({ ...prev, ...avatars }));
    }

    setLoading(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <div 
      className={`app-content ${(isPlaying && !userActive) ? 'cursor-none' : ''}`}
      onMouseMove={resetUserTimer}
      onMouseDown={resetUserTimer}
      onTouchStart={resetUserTimer}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        overflow: 'hidden'
      }}
    >
      {/* Navbar */}
      <div style={{ padding: '1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flexShrink: 0 }}>
             {/* Logo or App Name could go here if needed, currently empty to keep it immersive */}
        </div>

        <form onSubmit={handleSearch} style={{ width: '500px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: '24px',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}>
             <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                flexGrow: 1, 
                padding: '0.7rem 1.2rem', 
                background: 'transparent', 
                border: 'none', 
                color: 'white',
                outline: 'none',
                fontSize: '0.95rem'
              }} 
            />
            <button 
              type="submit" 
              style={{ 
                padding: '0.7rem 1.5rem', 
                border: 'none',
                borderLeft: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)', 
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
                <Search size={18} />
            </button>
          </div>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', opacity: 0 }}>
            {/* Action items could go here */}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Main Content */}
        <div style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto' }}>
          {selectedVideo ? (
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div 
                  ref={containerRef}
                  className="group relative"
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                  style={{ 
                    position: 'relative', 
                    width: '100%', 
                    paddingTop: isFullscreen ? '0' : '56.25%', 
                    height: isFullscreen ? '100vh' : 'auto',
                    borderRadius: isFullscreen ? '0' : '24px', 
                    overflow: 'hidden', 
                    background: 'black', 
                    boxShadow: isFullscreen ? 'none' : '0 30px 60px rgba(0,0,0,0.6)',
                    border: isFullscreen ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    zIndex: isFullscreen ? 5000 : 1
                  }}
                >
                    <iframe
                        ref={iframeRef}
                        onLoad={() => setLoaded(true)}
                        src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1&playlist=${selectedVideo.id}&loop=1&origin=${window.location.origin}&enablejsapi=1&rel=0&modestbranding=1&iv_load_policy=3&controls=0&disablekb=1&widget_referrer=${window.location.origin}`}
                        style={{ 
                          position: 'absolute', 
                          top: 0, 
                          left: 0, 
                          width: '100%', 
                          height: '100%', 
                          border: 'none',
                          pointerEvents: 'none'
                        }}
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                    />

                    {/* Center Interaction Layer */}
                    <div 
                      style={{ 
                        position: 'absolute', 
                        inset: 0, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        zIndex: 10,
                        cursor: 'pointer'
                      }}
                      onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                    >
                      <motion.div 
                        initial={false}
                        animate={{ 
                          opacity: !isPlaying || (isHovering && userActive) ? 1 : 0,
                          scale: !isPlaying || (isHovering && userActive) ? 1 : 0.8
                        }}
                        style={{ 
                          background: 'rgba(255,255,255,0.05)', 
                          backdropFilter: 'blur(30px)', 
                          width: '100px', 
                          height: '100px', 
                          borderRadius: '50%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          border: '1px solid rgba(255,255,255,0.1)', 
                          boxShadow: '0 0 50px rgba(0,0,0,0.5)' 
                        }}
                      >
                        {!isPlaying ? (
                          <div style={{ width: '0', height: '0', borderTop: '20px solid transparent', borderBottom: '20px solid transparent', borderLeft: '35px solid white', marginLeft: '10px' }} />
                        ) : (
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <div style={{ width: '10px', height: '35px', background: 'white', borderRadius: '4px' }} />
                            <div style={{ width: '10px', height: '35px', background: 'white', borderRadius: '4px' }} />
                          </div>
                        )}
                      </motion.div>
                    </div>

                      {/* Bottom Control Layer */}
                      <div 
                        style={{ 
                          position: 'absolute', 
                          bottom: 0,
                          left: 0,
                          right: 0,
                          paddingTop: '4rem', // Fade from top
                          display: 'flex', 
                          flexDirection: 'column', 
                          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
                          opacity: (!isPlaying || (isHovering && userActive)) ? 1 : 0,
                          transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          pointerEvents: ((isHovering && userActive) || !isPlaying) ? 'auto' : 'none',
                          zIndex: 20
                        }}
                      >
                        {/* Progress Bar Container */}
                        <div 
                          className="px-4 pb-2"
                          style={{ padding: '0 1rem 0.5rem 1rem' }}
                        >
                            <div 
                              style={{ width: '100%', height: isHovering ? '5px' : '3px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', position: 'relative', cursor: 'pointer', transition: 'height 0.1s ease' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                const percent = x / rect.width;
                                const seekTo = percent * duration;
                                if (iframeRef.current) {
                                    iframeRef.current.contentWindow?.postMessage(JSON.stringify({
                                        event: 'command',
                                        func: 'seekTo',
                                        args: [seekTo, true]
                                    }), '*');
                                }
                              }}
                            >
                              <div 
                                style={{ 
                                  position: 'absolute', 
                                  left: 0, 
                                  top: 0, 
                                  height: '100%', 
                                  background: '#FF0000', // Youtube Red
                                  width: `${(progress / duration) * 100}%`,
                                  borderRadius: '2px'
                                }} 
                              />
                              {isHovering && (
                                <div style={{ 
                                    position: 'absolute', 
                                    left: `${(progress / duration) * 100}%`, 
                                    top: '50%', 
                                    transform: 'translate(-50%, -50%)',
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    background: '#FF0000'
                                }} />
                              )}
                            </div>
                        </div>

                        {/* Control Bar Content */}
                        <div style={{ 
                          padding: isFullscreen ? '0.5rem 2rem 1.5rem' : '0.5rem 1.5rem 1.2rem', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center'
                        }}>
                          {/* Left Group */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center' }}>
                                {isPlaying ? <Pause size={22} fill="white" /> : <Play size={22} fill="white" />}
                            </button>
                            <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem', opacity: 0.8 }}><SkipForward size={22} fill="white" /></button>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
                                <button 
                                  onClick={toggleMute} 
                                  style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center' }}
                                >
                                    {volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
                                </button>
                                <div style={{ width: isHovering ? '60px' : '0px', height: '3px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', position: 'relative', transition: 'width 0.2s ease', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${volume}%`, background: 'white', borderRadius: '2px' }} />
                                    <input 
                                        type="range" min="0" max="100" value={volume}
                                        onChange={(e) => setVolume(parseInt(e.target.value))}
                                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                    />
                                </div>
                            </div>

                            <div style={{ color: 'white', fontSize: '0.85rem', fontWeight: 500, marginLeft: '1rem', opacity: 0.9 }}>
                                {formatTime(progress)} <span style={{ opacity: 0.5, margin: '0 0.1rem' }}>/</span> {formatTime(duration)}
                            </div>
                          </div>

                          {/* Right Group */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                             <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem', opacity: 0.8 }}><Subtitles size={20} /></button>
                             
                             {/* Settings Menu */}
                             <div style={{ position: 'relative' }}>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                                  style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem', opacity: 0.8 }}
                                >
                                    <Settings size={20} style={{ transform: showSettings ? 'rotate(45deg)' : 'none', transition: 'transform 0.3s ease' }} />
                                </button>

                                {showSettings && (
                                   <motion.div 
                                     initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                     animate={{ opacity: 1, y: 0, scale: 1 }}
                                     style={{ 
                                       position: 'absolute', 
                                       bottom: '100%', 
                                       right: 0, 
                                       marginBottom: '1rem',
                                       background: 'rgba(20,20,20,0.95)',
                                       backdropFilter: 'blur(10px)',
                                       borderRadius: '12px',
                                       padding: '0.8rem',
                                       width: '200px',
                                       border: '1px solid rgba(255,255,255,0.1)',
                                       boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                       zIndex: 100
                                     }}
                                     onClick={(e) => e.stopPropagation()}
                                   >
                                      <div style={{ marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>PLAYBACK SPEED</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                          {[0.5, 1, 1.5, 2].map(rate => (
                                            <button 
                                              key={rate} 
                                              onClick={() => { setPlaybackRate(rate); setShowSettings(false); }}
                                              style={{ flex: 1, background: playbackRate === rate ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)', border: 'none', color: playbackRate === rate ? 'black' : 'white', padding: '0.4rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}
                                            >
                                              {rate}x
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                      <div>
                                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>QUALITY</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                           {['auto', '144p', '360p', '480p', '720p', '1080p'].map(q => (
                                            <button 
                                              key={q} 
                                              onClick={() => { 
                                                setQuality(q); 
                                                const map: Record<string, string> = { 
                                                  'auto': 'default', 
                                                  '144p': 'tiny', 
                                                  '360p': 'medium', 
                                                  '480p': 'large', 
                                                  '720p': 'hd720', 
                                                  '1080p': 'hd1080' 
                                                };
                                                iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ 
                                                    event: 'command', 
                                                    func: 'setPlaybackQuality', 
                                                    args: [map[q] || 'default'] 
                                                }), '*');
                                                setShowSettings(false); 
                                              }}
                                              style={{ textAlign: 'left', background: quality === q ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'white', padding: '0.5rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: quality === q ? 600 : 400, cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                                            >
                                              {q.toUpperCase()}
                                              {quality === q && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-primary)', marginTop: '6px' }} />}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                   </motion.div>
                                )}
                             </div>

                             <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem', opacity: 0.8 }}>
                                {isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
                             </button>
                          </div>
                        </div>
                      </div>
                    </div>
                {/* Video Info */}
                <div style={{ marginTop: '1.5rem' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem' }}>{selectedVideo.title}</h1>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: channelDetails?.avatar ? `url(${channelDetails.avatar})` : '#222', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'white' }}>{selectedVideo.channelTitle}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{channelDetails ? formatSubCount(channelDetails.subscriberCount) : '... subscribers'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          ) : (
            <>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
                    {['All', 'Music', 'Live', 'Tech', 'Drones', 'Physics', 'Design', 'Gaming', 'Computers'].map((tag) => (
                        <button 
                          key={tag} 
                          className="glass-panel" 
                          onClick={() => {
                            setActiveTag(tag);
                            if (tag === 'All') loadTrending();
                            else {
                              setLoading(true);
                              youtubeService.searchVideos(tag).then(async res => {
                                setVideos(res);
                                const channelIds = [...new Set(res.filter(v => v.channelId).map(v => v.channelId as string))];
                                if (channelIds.length > 0) {
                                  const avatars = await youtubeService.getChannelsAvatars(channelIds);
                                  setChannelAvatars(prev => ({ ...prev, ...avatars }));
                                }
                                setLoading(false);
                              });
                            }
                          }}
                          style={{ 
                            padding: '0.6rem 1.4rem', 
                            borderRadius: '12px', 
                            background: activeTag === tag ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)', 
                            color: activeTag === tag ? 'black' : 'white', 
                            cursor: 'pointer', 
                            border: 'none', 
                            fontWeight: 600,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {tag}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%' }} />
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2.5rem' }}>
                    {videos.map((v) => (
                        <motion.div
                            key={v.id}
                            whileHover={{ y: -5 }}
                            className="glass-panel"
                            style={{ padding: '1rem', background: 'transparent', cursor: 'pointer' }}
                            onClick={() => handleSelectVideo(v)}
                        >
                        <div style={{ width: '100%', height: '180px', borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem', position: 'relative' }}>
                            <img src={v.thumbnail} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            {v.duration && (
                              <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.8)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, color: 'white' }}>
                                {formatDuration(v.duration)}
                              </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ 
                                width: '36px', 
                                height: '36px', 
                                borderRadius: '50%', 
                                background: v.channelId && channelAvatars[v.channelId] ? `url(${channelAvatars[v.channelId]})` : 'rgba(255,255,255,0.1)', 
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                flexShrink: 0 
                            }} />
                            <div>
                                <h3 
                                    style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.4, color: 'white', marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                                    dangerouslySetInnerHTML={{ __html: v.title }}
                                />
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{v.channelTitle}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                  {v.viewCount ? formatViews(v.viewCount) : 'Trending'} • {v.publishedAt ? formatRelativeTime(v.publishedAt) : 'Recently'}
                                </div>
                            </div>
                        </div>
                        </motion.div>
                    ))}
                    </div>
                )}
            </>
          )}
        </div>
        {/* Sidebar / Recommended (when video is selected) */}
        {selectedVideo && (
            <div style={{ width: '400px', borderLeft: '1px solid rgba(255,255,255,0.05)', padding: '2rem', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Up Next</h3>
                    <button onClick={() => stopAll()} className="glass-panel" style={{ padding: '0.4rem' }}><X size={18} /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {(relatedVideos.length > 0 ? relatedVideos : videos.filter(v => v.id !== selectedVideo.id)).map(v => (
                        <div key={v.id} style={{ display: 'flex', gap: '1rem', cursor: 'pointer' }} onClick={() => handleSelectVideo(v)}>
                            <div style={{ width: '160px', height: '90px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                                <img src={v.thumbnail} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                {v.duration && (
                                  <div style={{ position: 'absolute', bottom: '0.3rem', right: '0.3rem', background: 'rgba(0,0,0,0.8)', padding: '0.1rem 0.3rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600, color: 'white' }}>
                                    {formatDuration(v.duration)}
                                  </div>
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div 
                                    style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '0.3rem' }}
                                    dangerouslySetInnerHTML={{ __html: v.title }}
                                />
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.channelTitle}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {v.viewCount ? formatViews(v.viewCount) : 'Trending'} • {v.publishedAt ? formatRelativeTime(v.publishedAt) : ''}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
        </div>
    </div>
  );
};
