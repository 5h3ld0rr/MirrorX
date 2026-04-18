import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Search, Bell, Menu, Plus, X, Share2, ThumbsUp } from 'lucide-react';
import type { YouTubeVideo } from '../../services/youtube';
import { youtubeService } from '../../services/youtube';

export const YoutubeApp = () => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);

  useEffect(() => {
    loadTrending();
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

  return (
    <div className="app-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Navbar */}
      <div style={{ padding: '1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Menu size={24} color="var(--text-muted)" cursor="pointer" />
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, cursor: 'pointer' }} onClick={loadTrending}>
             <div style={{ background: '#ff0000', padding: '0.3rem', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Play size={16} fill="white" color="white" />
             </div>
             UTube
          </h2>
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
                <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: '16px', overflow: 'hidden', background: 'black', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                    <iframe
                        src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                    />
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
                <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
                    {['All', 'Music', 'Live', 'Tech', 'Drones', 'Physics', 'Design', 'Gaming', 'Computers'].map((tag) => (
                        <button key={tag} className="glass-panel" style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', background: tag === 'All' ? 'white' : 'rgba(255,255,255,0.05)', color: tag === 'All' ? 'black' : 'white', cursor: 'pointer', border: 'none', fontWeight: 600 }}>{tag}</button>
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
                            onClick={() => setSelectedVideo(v)}
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
                    <button onClick={() => setSelectedVideo(null)} className="glass-panel" style={{ padding: '0.4rem' }}><X size={18} /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {videos.filter(v => v.id !== selectedVideo.id).map(v => (
                        <div key={v.id} style={{ display: 'flex', gap: '1rem', cursor: 'pointer' }} onClick={() => setSelectedVideo(v)}>
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
