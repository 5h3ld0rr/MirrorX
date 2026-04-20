import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, RotateCcw, ChevronLeft, ChevronRight, Bookmark, Globe, ExternalLink, Shield } from 'lucide-react';

export const BrowserApp = () => {
  const [url, setUrl] = useState('https://www.google.com/search?igu=1');
  const [inputValue, setInputValue] = useState('https://google.com');
  const [history, setHistory] = useState<string[]>(['https://www.google.com/search?igu=1']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const quickLinks = [
    { name: 'Google', url: 'https://www.google.com/search?igu=1', icon: 'https://www.google.com/favicon.ico' },
    { name: 'Bing', url: 'https://www.bing.com', icon: 'https://www.bing.com/favicon.ico' },
    { name: 'Wikipedia', url: 'https://en.wikipedia.org', icon: 'https://en.wikipedia.org/favicon.ico' },
    { name: 'GitHub', url: 'https://github.com', icon: 'https://github.com/favicon.ico' },
  ];

  const handleNavigate = (targetUrl: string) => {
    let finalUrl = targetUrl;
    if (!targetUrl.startsWith('http')) {
      if (targetUrl.includes('.') && !targetUrl.includes(' ')) {
        finalUrl = `https://${targetUrl}`;
      } else {
        finalUrl = `https://www.google.com/search?q=${encodeURIComponent(targetUrl)}&igu=1`;
      }
    }
    
    // Add igu=1 for Google to work in iframe if possible (Google usually blocks iframes but some mirrors work)
    if (finalUrl.includes('google.com') && !finalUrl.includes('igu=1')) {
        finalUrl += (finalUrl.includes('?') ? '&' : '?') + 'igu=1';
    }

    setUrl(finalUrl);
    setInputValue(finalUrl.replace('?igu=1', '').replace('&igu=1', ''));
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(finalUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    setIsLoading(true);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setUrl(prev);
      setInputValue(prev.replace('?igu=1', '').replace('&igu=1', ''));
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setUrl(next);
      setInputValue(next.replace('?igu=1', '').replace('&igu=1', ''));
    }
  };

  const reload = () => {
    const currentUrl = url;
    setUrl('');
    setTimeout(() => setUrl(currentUrl), 50);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0c' }}>
      {/* Search Bar / Controls */}
      <div style={{ 
        padding: '1.5rem 3rem', 
        background: 'rgba(255,255,255,0.02)', 
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={goBack}
            disabled={historyIndex === 0}
            style={{ 
              background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '10px', 
              width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: historyIndex === 0 ? 'not-allowed' : 'pointer', color: historyIndex === 0 ? '#444' : 'white' 
            }}>
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={goForward}
            disabled={historyIndex === history.length - 1}
            style={{ 
              background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '10px', 
              width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: historyIndex === history.length - 1 ? 'not-allowed' : 'pointer', color: historyIndex === history.length - 1 ? '#444' : 'white' 
            }}>
            <ChevronRight size={20} />
          </button>
          <button 
            onClick={reload}
            style={{ 
              background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '10px', 
              width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'white' 
            }}>
            <RotateCcw size={18} />
          </button>
        </div>

        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ 
            position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', 
            display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--accent-primary)' 
          }}>
            <Shield size={16} />
            <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.1)' }} />
          </div>
          <input 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNavigate(inputValue)}
            style={{ 
              width: '100%', 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px',
              padding: '0.8rem 1rem 0.8rem 3.5rem',
              color: 'white',
              fontSize: '0.95rem',
              outline: 'none',
              transition: 'all 0.3s'
            }}
            placeholder="Search or enter URL"
          />
          <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
            <Bookmark size={16} style={{ cursor: 'pointer' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
            {quickLinks.map(link => (
                <button 
                    key={link.name}
                    onClick={() => handleNavigate(link.url)}
                    className="glass-panel"
                    style={{ padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                >
                    <img src={link.icon} alt="" style={{ width: 14, height: 14, borderRadius: '2px' }} />
                    {link.name}
                </button>
            ))}
        </div>
      </div>

      {/* Browser View */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
            {!url && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem' }}
                >
                    <div style={{ padding: '2rem', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', color: 'var(--accent-primary)' }}>
                        <Globe size={64} className="animate-pulse" />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Secure Web Gateway</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Enter a destination to begin browsing.</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {url && (
            <iframe 
                ref={iframeRef}
                src={url}
                onLoad={() => setIsLoading(false)}
                style={{ 
                    width: '100%', 
                    height: '100%', 
                    border: 'none', 
                    background: 'white',
                    display: isLoading ? 'none' : 'block'
                }}
                title="Browser Frame"
                sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-scripts allow-same-origin"
            />
        )}

        {isLoading && url && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c' }}>
                <div className="glass-panel" style={{ padding: '2rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 40, height: 40, border: '3px solid var(--accent-glow)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%' }} className="animate-spin" />
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Encrypting Link...</span>
                </div>
            </div>
        )}

        {/* Iframe limitation warning (subtle) */}
        <div style={{ 
            position: 'absolute', bottom: '1rem', right: '1rem', 
            background: 'rgba(0,0,0,0.6)', padding: '0.5rem 1rem', borderRadius: '8px',
            fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none',
            backdropFilter: 'blur(10px)'
        }}>
            Some sites may prevent embedded viewing for security.
        </div>
      </div>
    </div>
  );
};
