import { motion } from 'framer-motion';
import { Play, Search, Bell, Menu, Plus } from 'lucide-react';

export const YoutubeApp = () => {
  const videos = [
    { id: 1, title: 'Inside MirrorX Factory: How the Magic is Made', channel: 'Tech Insider', thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400&h=225', views: '2M views', time: '1 day ago' },
    { id: 2, title: '10 Amazing MirrorX Features You Didn’t Know About', channel: 'MirrorX Tips', thumbnail: 'https://images.unsplash.com/photo-1496307653780-42ee777d4833?auto=format&fit=crop&q=80&w=400&h=225', views: '1M views', time: '3 days ago' },
    { id: 3, title: 'Future of Home Automation 2026: AI Integration', channel: 'Futurist TV', thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=400&h=225', views: '500K views', time: '5 days ago' },
    { id: 4, title: 'Smart Mirror Setup Guide: From Unboxing to Login', channel: 'Smart Home Hub', thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=400&h=225', views: '300K views', time: '1 week ago' },
  ];

  return (
    <div className="app-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Navbar */}
      <div style={{ padding: '1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Menu size={24} color="var(--text-muted)" cursor="pointer" />
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
             <div style={{ background: '#ff0000', padding: '0.3rem', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Play size={16} fill="white" color="white" />
             </div>
             YouTube
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '500px' }}>
          <div style={{ position: 'relative', flexGrow: 1, display: 'flex', alignItems: 'center' }}>
             <input 
              type="text" 
              placeholder="Search..." 
              className="glass-panel" 
              style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '24px 0 0 24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} 
            />
            <button className="glass-panel" style={{ padding: '0.7rem 1.5rem', borderRadius: '0 24px 24px 0', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                <Search size={18} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Plus size={24} color="var(--text-muted)" cursor="pointer" />
            <Bell size={24} color="var(--text-muted)" cursor="pointer" />
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), #0090ff)' }} />
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto' }}>
        <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
            {['All', 'Music', 'Live', 'Tech', 'Drones', 'Physics', 'Design', 'Gaming', 'Computers'].map((tag) => (
                <button key={tag} className="glass-panel" style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', background: tag === 'All' ? 'white' : 'rgba(255,255,255,0.05)', color: tag === 'All' ? 'black' : 'white', cursor: 'pointer', border: 'none', fontWeight: 600 }}>{tag}</button>
            ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2.5rem' }}>
          {videos.map((v) => (
            <motion.div
              key={v.id}
              whileHover={{ y: -5 }}
              className="glass-panel"
              style={{ padding: '1rem', background: 'transparent', cursor: 'pointer' }}
            >
              <div style={{ width: '100%', height: '180px', borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem', position: 'relative' }}>
                <img src={v.thumbnail} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.8)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>12:45</div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
                <div>
                   <h3 style={{ fontSize: '1.1rem', fontWeight: 600, lineHeight: 1.4, color: 'white', marginBottom: '0.5rem' }}>{v.title}</h3>
                   <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{v.channel}</div>
                   <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{v.views} • {v.time}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
