import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Clock } from 'lucide-react';

interface NewsSnippet {
  title: string;
  time: string;
  image: string;
}

export const NewsWidget = ({ location }: { location?: string }) => {
  const [news, setNews] = useState<NewsSnippet[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const isRightSide = location?.includes('right');

  const getRelativeTime = (publishedAt: string) => {
    if (!publishedAt) return 'Just now';
    const now = new Date();
    const pub = new Date(publishedAt);
    const diffMs = now.getTime() - pub.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}hr ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const fetchLatest = async () => {
    try {
      const response = await axios.get('/api/helakuru/');
      const rawData = response.data?.news_data?.data || [];
      const latest: NewsSnippet[] = rawData.slice(0, 3).map((item: any) => ({
        title: item.titleEn || item.titleSi,
        time: getRelativeTime(item.published),
        image: item.cover || item.thumb
      }));
      setNews(latest);
      setLoading(false);
    } catch (err) {
      console.error('News widget fetch error:', err);
    }
  };

  useEffect(() => {
      fetchLatest();
      const fetchInterval = setInterval(fetchLatest, 300000); // Refresh every 5 mins
      return () => clearInterval(fetchInterval);
  }, []);

  useEffect(() => {
    if (news.length > 0) {
      const swapInterval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % news.length);
      }, 7000); // Swap news every 7 seconds
      return () => clearInterval(swapInterval);
    }
  }, [news]);

  if (loading || news.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: isRightSide ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isRightSide ? 20 : -20 }}
      className="glass-panel"
      style={{
        padding: '0.8rem',
        maxWidth: '420px',
        display: 'flex',
        flexDirection: isRightSide ? 'row-reverse' : 'row',
        alignItems: 'center',
        gap: '1.2rem',
        overflow: 'hidden',
        textAlign: isRightSide ? 'right' : 'left'
      }}
    >
      <div style={{ 
        width: '56px', 
        height: '56px', 
        borderRadius: '10px', 
        background: 'rgba(255,255,255,0.05)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'var(--accent-primary)',
        flexShrink: 0,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        {news[currentIndex].image ? (
            <img src={news[currentIndex].image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
            <Globe size={18} />
        )}
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
          >
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: isRightSide ? 'flex-end' : 'space-between', 
                gap: '0.6rem',
                marginBottom: '0.2rem',
                flexDirection: isRightSide ? 'row-reverse' : 'row'
            }}>
                <span style={{ 
                    fontSize: '0.65rem', 
                    fontWeight: 700, 
                    color: 'var(--accent-primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}>
                    LATEST
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem' }}>
                    <Clock size={10} />
                    {news[currentIndex].time}
                </div>
            </div>
            <h3 style={{ 
                fontSize: '0.9rem', 
                fontWeight: 500, 
                color: 'white', 
                margin: 0,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: '1.3',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
            }}>
              {news[currentIndex].title}
            </h3>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
