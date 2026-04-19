import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Bell, Menu, Plus, X, Share2, ThumbsUp, Volume2, Maximize, Minimize } from 'lucide-react';
import type { YouTubeVideo } from '../../services/youtube';
import { youtubeService } from '../../services/youtube';
import { useMusic } from '../../context/MusicContext';

export const YoutubeApp = () => {
  const { playVideo, currentTrack, activeType, stopAll, isPlaying, volume, togglePlay, setVolume } = useMusic();
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [relatedVideos, setRelatedVideos] = useState<YouTubeVideo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedVideo = activeType === 'video' ? currentTrack : null;

  useEffect(() => {
    if (selectedVideo) {
      youtubeService.getRelatedVideos(selectedVideo.id).then(setRelatedVideos);
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

  const handleSelectVideo = (video: YouTubeVideo) => {
    playVideo(video);
  };

  useEffect(() => {
    loadTrending();
    return () => {
      // Use a functional check to avoid stale closure if activeType changes
      if (activeType === 'video') stopAll();
    };
  }, []);

  const loadTrending = async () => {
    setLoading(true);
    const data = await youtubeService.getTrendingVideos();
    setVideos(data);
    setLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    const data = await youtubeService.searchVideos(searchQuery);
    setVideos(data);
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
    <div className="app-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Navbar */}
      <div style={{ padding: '1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Menu size={24} color="var(--text-muted)" cursor="pointer" />
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '500px' }}>
          <div style={{ position: 'relative', flexGrow: 1, display: 'flex', alignItems: 'center' }}>
             <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-panel" 
              style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '24px 0 0 24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} 
            />
            <button type="submit" className="glass-panel" style={{ padding: '0.7rem 1.5rem', borderRadius: '0 24px 24px 0', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                <Search size={18} />
            </button>
          </div>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Plus size={24} color="var(--text-muted)" cursor="pointer" />
            <Bell size={24} color="var(--text-muted)" cursor="pointer" />
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), #0090ff)' }} />
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
                        src={`https://www.youtube-nocookie.com/embed/${selectedVideo.id}?autoplay=1&playlist=${selectedVideo.id}&loop=1&origin=${window.location.origin}&enablejsapi=1&rel=0&modestbranding=1&iv_load_policy=3&controls=0&disablekb=1&widget_referrer=${window.location.origin}`}
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
                          opacity: isHovering || !isPlaying ? 1 : 0,
                          scale: isHovering || !isPlaying ? 1 : 0.8
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
                        display: 'flex', 
                        flexDirection: 'column', 
                        background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 40%, transparent 100%)',
                        opacity: (!isPlaying || isHovering) ? 1 : 0,
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        pointerEvents: (isHovering || !isPlaying) ? 'auto' : 'none',
                        zIndex: 20
                      }}
                    >
                      {/* ... Bottom Control Bar Content ... */}
                      <div style={{ 
                        padding: isFullscreen ? '3rem 4rem' : '1.5rem 2rem', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '1rem'
                      }}>
                        
                        {/* Interactive Progress Bar */}
                        <div 
                          style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.15)', borderRadius: '2px', position: 'relative', cursor: 'pointer' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <motion.div 
                            style={{ 
                              position: 'absolute', 
                              left: 0, 
                              top: 0, 
                              height: '100%', 
                              background: 'var(--accent-primary)', 
                              width: '35%',
                              borderRadius: '2px',
                              boxShadow: '0 0 15px var(--accent-glow)'
                            }} 
                            animate={{ width: isPlaying ? '38%' : '35%' }}
                            transition={{ duration: 1 }}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                            {/* Time Display */}
                            <div style={{ color: 'white', fontSize: '0.9rem', fontWeight: 600, fontFamily: 'monospace', minWidth: '100px' }}>
                               0:34 <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 0.3rem' }}>/</span> 4:12
                            </div>

                            {/* Volume Control */}
                            <div 
                              style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Volume2 size={18} color="white" style={{ opacity: 0.8 }} />
                              <div style={{ width: '80px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', position: 'relative' }}>
                                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${volume}%`, background: 'white', borderRadius: '2px', opacity: 0.6 }} />
                                <input 
                                  type="range" 
                                  min="0" 
                                  max="100" 
                                  value={volume}
                                  onChange={(e) => setVolume(parseInt(e.target.value))}
                                  style={{ 
                                    position: 'absolute',
                                    inset: 0,
                                    width: '100%', 
                                    height: '100%',
                                    opacity: 0,
                                    cursor: 'pointer'
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                             <motion.button
                                whileHover={{ scale: 1.1, color: 'var(--accent-primary)' }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0.4rem', display: 'flex', alignItems: 'center' }}
                             >
                                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                             </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>
                </div>
                <div style={{ marginTop: '1.5rem' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem' }}>{selectedVideo.title}</h1>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{selectedVideo.channelTitle}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>1.2M subscribers</div>
                            </div>
                            <button className="glass-panel" style={{ marginLeft: '1.5rem', padding: '0.6rem 1.5rem', borderRadius: '24px', background: 'white', color: 'black', fontWeight: 600, border: 'none' }}>Subscribe</button>
                        </div>
                        <div style={{ display: 'flex', gap: '0.8rem' }}>
                            <button className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '24px' }}>
                                <ThumbsUp size={18} /> 45K
                            </button>
                            <button className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '24px' }}>
                                <Share2 size={18} /> Share
                            </button>
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
                            if (tag === 'All') loadTrending();
                            else {
                              setLoading(true);
                              youtubeService.searchVideos(tag).then(res => {
                                setVideos(res);
                                setLoading(false);
                              });
                            }
                          }}
                          style={{ 
                            padding: '0.6rem 1.4rem', 
                            borderRadius: '12px', 
                            background: tag === 'All' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)', 
                            color: tag === 'All' ? 'black' : 'white', 
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
                            <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.8)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>12:45</div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
                            <div>
                                <h3 
                                    style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.4, color: 'white', marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                                    dangerouslySetInnerHTML={{ __html: v.title }}
                                />
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{v.channelTitle}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{v.viewCount ? `${(parseInt(v.viewCount)/1000000).toFixed(1)}M views` : 'Trending'} • 1 day ago</div>
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
                            <div style={{ width: '160px', height: '90px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                                <img src={v.thumbnail} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div>
                                <div 
                                    style={{ fontSize: '0.9rem', fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '0.3rem' }}
                                    dangerouslySetInnerHTML={{ __html: v.title }}
                                />
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.channelTitle}</div>
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
