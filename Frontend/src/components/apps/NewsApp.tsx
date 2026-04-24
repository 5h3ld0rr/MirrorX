import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Globe, Zap } from 'lucide-react';

interface NewsArticle {
  title: string;
  description: string;
  image: string;
  source: string;
  link: string;
  time: string;
}

interface EsanaBlock {
  text?: string;
  data?: string;
}

interface EsanaArticle {
  category: number | string;
  contentEn?: EsanaBlock[] | string;
  contentSi?: EsanaBlock[] | string;
  titleEn?: string;
  titleSi?: string;
  descriptionEn?: string;
  descriptionSi?: string;
  description?: string;
  cover?: string;
  thumb?: string;
  share_url: string;
  published?: string;
}


export const NewsApp = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [newsCache, setNewsCache] = useState<Record<string, NewsArticle[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = {
    'All': '1',
    'Incidents': '2',
    'Audio': '3',
    'Alerts': '4',
    'Statements': '5'
  };

  const [availableCategories, setAvailableCategories] = useState<string[]>(Object.keys(categories));

  const fetchNews = async (catName: string) => {
    setLoading(true);
    setError(null);
    try {
      const catId = categories[catName as keyof typeof categories];
      const response = await axios.get('/api/helakuru/');
      
      const rawData: EsanaArticle[] = response.data?.news_data?.data || [];

      if (catName === 'All' && rawData.length > 0) {
        const foundIds = new Set(rawData.map((item: EsanaArticle) => String(item.category)));
        const validNames = Object.keys(categories).filter(name => 
          name === 'All' || foundIds.has(categories[name as keyof typeof categories])
        );
        setAvailableCategories(validNames);
      }
      
      const filteredData = (catName === 'All')
        ? rawData
        : rawData.filter((item: EsanaArticle) => String(item.category) === catId);

      const mapped: NewsArticle[] = filteredData.map((item: EsanaArticle) => {
        let fullContent = '';
        
        const extractText = (content: EsanaBlock[] | string | undefined) => {
          if (!content) return '';
          if (Array.isArray(content)) {
            return content.map(block => block.text || block.data).filter(Boolean).join('\n\n');
          }
          return content.trim();
        };

        const enContent = extractText(item.contentEn).replace(/<[^>]*>?/gm, '');
        const siContent = extractText(item.contentSi).replace(/<[^>]*>?/gm, '');
        
        fullContent = enContent || siContent;

        if (!fullContent) {
           fullContent = item.descriptionEn || item.descriptionSi || item.description || '';
        }

        return {
          title: item.titleEn || item.titleSi || 'Untitled Story',
          description: fullContent,
          image: item.cover || item.thumb || '',
          source: 'ESANA',
          link: item.share_url,
          time: item.published ? new Date(item.published).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'
        };
      });

      setNewsCache(prev => ({ ...prev, [catName]: mapped }));
    } catch (err: any) {
      console.error("Esana fetch error:", err);
      setError("Unable to update news feed. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(activeCategory);
  }, [activeCategory]);

  const [heroOverwrites, setHeroOverwrites] = useState<Record<string, NewsArticle | null>>({});

  const handleSwap = (category: string, newHero: NewsArticle) => {
    setHeroOverwrites(prev => ({ ...prev, [category]: newHero }));
  };

  const renderNewsContent = () => {
    let articles = [...(newsCache[activeCategory] || [])];

    
    if (articles.length === 0 && !loading) {

        return (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem' }}>
                <Globe size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                <div>No news stories found in this section. Please try another category.</div>
            </div>
        );
    }

    // Handle swapping logic: New hero becomes index 0, previous hero moves to right top (index 1)
    const selectedHero = heroOverwrites[activeCategory];
    if (selectedHero && articles.length > 0) {
        const foundIndex = articles.findIndex(a => a.link === selectedHero.link);
        if (foundIndex > -1) {
            const articleToPromote = articles.splice(foundIndex, 1)[0];
            articles.unshift(articleToPromote);
        }
    }


    // Using standardized internal format from getMap
    const main = { ...articles[0] };
    
    // Apply high-res only for the featured hero slot (supports 1, 2, or 3 -> 6)
    if (main.image) {
        main.image = main.image.replace(/([123])\.(jpg|jpeg|png|webp|JPG|JPEG|PNG|WEBP)/i, '6.$2');
    }

    
    const sides = articles.slice(1, 8);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr)', gap: '3rem' }}>
            {/* Main Featured News - Enhanced with Full Description */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} key={main.link}>
                <div className="glass-panel" style={{ 
                    borderRadius: '32px', 
                    overflow: 'hidden', 
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
                    cursor: 'default'
                }} 
                >
                    <div style={{ height: '380px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                        <img src={main.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={main.title} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%)' }} />
                        <div style={{ position: 'absolute', bottom: '1.5rem', left: '2rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: '0.05em' }}>{main.time}</div>
                        </div>
                    </div>
                    
                    <div style={{ 
                        padding: '2.5rem', 
                        background: 'rgba(255,255,255,0.03)',
                        flex: 1
                    }}>
                         <h2 style={{ 
                             fontSize: '2.2rem', 
                             fontWeight: 600, 
                             color: 'white', 
                             marginBottom: '1.5rem', 
                             lineHeight: 1.2, 
                             letterSpacing: '-0.01em',
                             textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                         }}>
                             {main.title}
                         </h2>
                         <p style={{ 
                             color: 'rgba(255,255,255,0.85)', 
                             fontSize: '1.25rem', 
                             lineHeight: 1.8, 
                             whiteSpace: 'pre-wrap',
                             textShadow: '0 1px 4px rgba(0,0,0,0.2)'
                         }}>
                             {main.description || 'No description available for this story.'}
                         </p>
                    </div>
                </div>
            </motion.div>

            {/* Sidebar Feed - With Interactive Swap */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                    <Zap size={18} color="var(--accent-primary)" />
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'white', letterSpacing: '0.05em' }}>LATEST STREAM</span>
                </div>
                {sides.map((item, idx) => {
                    return (
                        <motion.div 
                            key={item.link}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={{ x: 8, background: 'rgba(255,255,255,0.03)' }}
                            onClick={() => handleSwap(activeCategory, item)}
                            style={{ 
                                display: 'flex', 
                                gap: '1.2rem', 
                                marginBottom: '1rem', 
                                cursor: 'pointer', 
                                borderRadius: '16px',
                                padding: '0.8rem',
                                transition: 'background 0.3s'
                            }}
                        >

                            <div style={{ width: '85px', height: '85px', borderRadius: '16px', overflow: 'hidden', flexShrink: 0 }}>
                                <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={item.title} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 500, color: 'white', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</h4>
                            </div>

                        </motion.div>
                    );
                })}
            </motion.div>

        </div>
    );
  };

  if (error && (!newsCache[activeCategory] || newsCache[activeCategory].length === 0)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1.5rem', padding: '2rem' }}>
        <Globe size={44} color="#ff4d4d" style={{ opacity: 0.5 }} />
        <div style={{ fontSize: '1.1rem', color: '#ff4d4d', textAlign: 'center', maxWidth: '300px' }}>{error}</div>
        <button 
          onClick={() => fetchNews(activeCategory)}
          style={{ padding: '0.6rem 1.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', cursor: 'pointer' }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (loading && (!newsCache[activeCategory] || newsCache[activeCategory].length === 0)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1.5rem' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
            <RefreshCw size={44} color="var(--accent-primary)" />
        </motion.div>
        <div style={{ fontSize: '1.4rem', fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>UPDATING FEED...</div>
      </div>
    );
  }

  return (
    <div className="app-content" style={{ padding: '2rem 4rem', height: '100%', overflowY: 'auto', touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
        {availableCategories.map((cat) => (
            <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                    padding: '0.8rem 1.8rem',
                    textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                    borderRadius: '16px',
                    border: 'none',
                    background: activeCategory === cat ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                    color: activeCategory === cat ? 'white' : 'rgba(255,255,255,0.6)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    letterSpacing: '0.02em'
                }}
                onMouseEnter={(e) => {
                    if (activeCategory !== cat) e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                }}
                onMouseLeave={(e) => {
                    if (activeCategory !== cat) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }}
            >
                {cat}
            </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.35 }}
        >
          {renderNewsContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
