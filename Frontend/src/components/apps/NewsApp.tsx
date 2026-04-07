import { motion } from 'framer-motion';
import { Newspaper, ArrowRight, Share2, Bookmark } from 'lucide-react';

export const NewsApp = () => {
  const newsItems = [
    { id: 1, title: 'MirrorX Platform Expands to Smart Home Hubs', category: 'Technology', image: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&q=80&w=400&h=250', time: '2 mins ago' },
    { id: 2, title: 'AI Breakthrough in Real-time Face Recognition', category: 'Science', image: 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&q=80&w=400&h=250', time: '1 hour ago' },
    { id: 3, title: 'The Future of Ambient Computing in Daily Life', category: 'Future', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=400&h=250', time: '3 hours ago' },
     { id: 4, title: 'New Sustainability Standards for Smart Devices', category: 'Environment', image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=400&h=250', time: '5 hours ago' },
  ];

  return (
    <div className="app-content" style={{ padding: '2rem 4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Newspaper size={32} color="var(--accent-primary)" />
          Mirror News
        </h2>
        <div style={{ display: 'flex', gap: '1rem', width: '300px' }}>
             <button className="glass-panel" style={{ padding: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(0, 242, 255, 0.1)', color: 'var(--accent-primary)' }}>
                Top Stories
            </button>
            <button className="glass-panel" style={{ padding: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                Latest
            </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '4rem' }}>
        {/* Main News */}
        <div>
          <motion.div
            whileHover={{ y: -5 }}
            className="glass-panel"
            style={{ padding: '2rem', background: 'rgba(255,255,255,0.03)', position: 'relative' }}
          >
            <div style={{ width: '100%', height: '400px', borderRadius: '16px', overflow: 'hidden', marginBottom: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                <img src={newsItems[0].image} alt="Main" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{newsItems[0].category}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{newsItems[0].time}</span>
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 600, lineHeight: 1.3, marginBottom: '1.5rem' }}>{newsItems[0].title}</h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                The latest expansion of the MirrorX platform brings interactive widgets and ambient intelligence to smart home ecosystems globally, revolutionizing user experience.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button style={{ background: 'none', border: 'none', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    Read Full Story <ArrowRight size={20} color="var(--accent-primary)" />
                </button>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Share2 size={20} color="var(--text-muted)" cursor="pointer" />
                    <Bookmark size={20} color="var(--text-muted)" cursor="pointer" />
                </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar News */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
             <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-secondary)' }}>More News</h3>
             {newsItems.slice(1).map((item) => (
                <motion.div
                    key={item.id}
                    whileHover={{ x: 5, background: 'rgba(255,255,255,0.05)' }}
                    className="glass-panel"
                    style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.02)', display: 'flex', gap: '1.5rem', alignItems: 'center', cursor: 'pointer' }}
                >
                    <div style={{ width: '120px', height: '80px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                         <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                         <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--accent-primary)', fontWeight: 600, marginBottom: '0.3rem' }}>{item.category}</div>
                         <h4 style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.4, color: 'white' }}>{item.title}</h4>
                    </div>
                </motion.div>
             ))}
        </div>
      </div>
    </div>
  );
};
