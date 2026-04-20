import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, TrendingUp, Filter, Heart, Camera, X, Scan, Zap, RefreshCw } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

export const FashionApp = () => {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isTryingOn, setIsTryingOn] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [activeCategory, setActiveCategory] = useState('Featured');

  const collections = [
    { id: 1, title: 'Refractive Jacket', brand: 'Mirror Wear', image: 'https://images.unsplash.com/photo-15391091323cf-ad17f39acc03?auto=format&fit=crop&q=80&w=400&h=600', price: '$120', category: 'New Arrivals' },
    { id: 2, title: 'Glass Urban Tee', brand: 'Liquid Flow', image: 'https://images.unsplash.com/photo-1549416878-b9ca95e26903?auto=format&fit=crop&q=80&w=400&h=600', price: '$85', category: 'Trending' },
    { id: 3, title: 'Minimalist Tunic', brand: 'Void Collective', image: 'https://images.unsplash.com/photo-1509319117193-57bab727e09d?auto=format&fit=crop&q=80&w=400&h=600', price: '$240', category: 'Limited Edition' },
    { id: 4, title: 'Cyber Pulse Hoodie', brand: 'Neon Shimmer', image: 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&q=80&w=400&h=600', price: '$180', category: 'Featured' },
    { id: 5, title: 'Prism Overcoat', brand: 'Mirror Wear', image: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=400&h=600', price: '$310', category: 'New Arrivals' },
    { id: 6, title: 'Liquid Silk Scarf', brand: 'Liquid Flow', image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&q=80&w=400&h=600', price: '$45', category: 'Accessories' },
  ];

  const filteredItems = activeCategory === 'Featured' 
    ? collections 
    : collections.filter(item => item.category === activeCategory);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  const handleTryOn = (item: any) => {
    setSelectedItem(item);
    setIsTryingOn(true);
    // Add class for active try on to hide cursor or add effects if needed
    startCamera();
  };

  return (
    <div className="app-content" style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: '300px', padding: '2rem', borderRight: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        <h2 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.8rem', fontWeight: 600 }}>
          <ShoppingBag size={28} color="#FF00FF" />
          Mirror Fashion
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {['Featured', 'New Arrivals', 'Trending', 'Accessories', 'Limited Edition'].map((cat) => (
             <motion.div 
               key={cat} 
               whileHover={{ x: 5 }}
               onClick={() => setActiveCategory(cat)}
               style={{ 
                 fontSize: '1.1rem', 
                 color: activeCategory === cat ? 'white' : 'rgba(255,255,255,0.4)', 
                 cursor: 'pointer', 
                 display: 'flex', 
                 alignItems: 'center', 
                 gap: '0.8rem',
                 fontWeight: activeCategory === cat ? 600 : 400,
                 transition: 'color 0.3s ease'
               }}
             >
                {activeCategory === cat && (
                  <motion.div 
                    layoutId="activeCat"
                    style={{ width: '4px', height: '18px', background: '#FF00FF', borderRadius: '4px' }} 
                  />
                )}
                {cat}
             </motion.div>
          ))}
        </div>

        <div style={{ marginTop: 'auto' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #FF00FF20, #00f2ff20)', border: '1px solid rgba(255, 0, 255, 0.2)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>30% Discount</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>Exclusive early access offer for MirrorX owners.</p>
                <button className="glass-panel" style={{ padding: '0.6rem 1rem', background: 'white', color: 'black', fontWeight: 600, fontSize: '0.8rem', border: 'none' }}>Claim Access</button>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '3rem 4rem', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
             <button className="glass-panel" style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}><Filter size={18} /> Filters</button>
              <button className="glass-panel" style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}><TrendingUp size={18} /> Sort by Popular</button>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
             <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Winter Collections '26</h3>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '4rem' }}>
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -10 }}
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              <div style={{ 
                width: '100%', 
                aspectRatio: '3/4', 
                borderRadius: '24px', 
                overflow: 'hidden', 
                marginBottom: '1.5rem',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                position: 'relative',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <img 
                  src={item.image} 
                  alt={item.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  onError={(e: any) => {
                    e.target.src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400';
                  }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', transition: '0.4s all ease', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0 }} className="hover-overlay">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleTryOn(item); }}
                      className="glass-panel" 
                      style={{ 
                        padding: '1rem 1.8rem', 
                        background: 'linear-gradient(135deg, #FF00FF, #00f2ff)', 
                        color: 'white', 
                        fontWeight: 700, 
                        border: 'none', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.8rem',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
                        cursor: 'pointer'
                      }}
                    >
                        <Camera size={20} /> Virtual Try-On
                    </button>
                </div>
                <button style={{ position: 'absolute', top: '1rem', right: '1rem', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 5 }}>
                    <Heart size={20} />
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</h4>
                    <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>{item.brand}</p>
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FF00FF', flexShrink: 0 }}>{item.price}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <VirtualTryOnModal 
        isOpen={isTryingOn}
        onClose={() => { setIsTryingOn(false); stopCamera(); }}
        item={selectedItem}
        videoRef={videoRef}
        processing={processing}
        setProcessing={setProcessing}
      />
    </div>
  );
};

const VirtualTryOnModal = ({ isOpen, onClose, item, videoRef, processing, setProcessing }: any) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ 
            position: 'absolute', 
            inset: 0, 
            background: 'rgba(0,0,0,0.95)', 
            backdropFilter: 'blur(30px)', 
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            padding: '3rem'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
               <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'linear-gradient(135deg, #FF00FF, #7000FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(255, 0, 255, 0.4)' }}>
                  <Scan size={28} color="white" />
               </div>
               <div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Virtual Mirror</h2>
                  <p style={{ fontSize: '0.9rem', color: '#FF00FF', fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase' }}>AI Volumetric Fitting</p>
               </div>
            </div>
            <button 
              onClick={onClose}
              style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={24} />
            </button>
          </div>

          {/* Mirror View */}
          <div style={{ flex: 1, display: 'flex', gap: '3rem' }}>
              <div style={{ flex: 2, position: 'relative', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 0 120px rgba(255, 0, 255, 0.15)', background: '#050505', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
                  />
                  
                  {/* AR Overlay - Smart Projection */}
                  <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9, y: 50 }}
                      animate={{ opacity: processing ? 0.2 : 0.85, scale: 1, y: 0 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      style={{ 
                        position: 'absolute', 
                        top: '50%', 
                        left: '50%', 
                        transform: 'translate(-50%, -50%)',
                        width: '75%',
                        height: '85%',
                        pointerEvents: 'none',
                        zIndex: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                  >
                      <img 
                        src={item.image} 
                        alt="garment"
                        style={{ 
                          width: '100%', 
                          height: '90%', 
                          objectFit: 'contain', 
                          filter: 'drop-shadow(0 0 30px rgba(255,0,255,0.4)) contrast(1.1) brightness(1.1)',
                          mixBlendMode: 'screen'
                        }} 
                      />
                  </motion.div>

                  {/* Dynamic Calibration Lines */}
                  <div style={{ position: 'absolute', inset: '10%', border: '1px dashed rgba(255,0,255,0.3)', borderRadius: '24px', pointerEvents: 'none' }}>
                      <div style={{ position: 'absolute', top: -5, left: '50%', width: '10px', height: '10px', background: '#FF00FF', transform: 'translateX(-50%) rotate(45deg)' }} />
                      <div style={{ position: 'absolute', bottom: -5, left: '50%', width: '10px', height: '10px', background: '#FF00FF', transform: 'translateX(-50%) rotate(45deg)' }} />
                  </div>

                  {/* Scan Animation */}
                  <motion.div 
                      animate={{ top: ['10%', '90%', '10%'] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      style={{ 
                         position: 'absolute',
                         left: '5%',
                         right: '5%',
                         height: '1px',
                         background: 'linear-gradient(90deg, transparent, #FF00FF, transparent)',
                         boxShadow: '0 0 20px #FF00FF',
                         zIndex: 3,
                         opacity: 0.6
                      }}
                  />

                  {processing && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                       <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                          <motion.div 
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                              style={{ position: 'absolute', inset: 0, border: '4px solid rgba(255,0,255,0.1)', borderTop: '4px solid #FF00FF', borderRadius: '50%' }}
                          />
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                             <Zap size={40} className="glow-cyan" />
                          </div>
                       </div>
                       <p style={{ marginTop: '2.5rem', fontSize: '1.2rem', letterSpacing: '4px', fontWeight: 800, color: 'white' }}>GENERATING HD FIT...</p>
                       <p style={{ fontSize: '0.8rem', color: '#FF00FF', marginTop: '0.5rem', letterSpacing: '1px' }}>AI Neural Mesh Engine v4.2</p>
                    </div>
                  )}

                  {/* HUD Info */}
                  <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', display: 'flex', gap: '2rem' }}>
                      <div style={{ background: 'rgba(0,0,0,0.6)', padding: '0.8rem 1.2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.2rem' }}>TRACKING</p>
                          <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#00FF88' }}>ACTIVE</p>
                      </div>
                      <div style={{ background: 'rgba(0,0,0,0.6)', padding: '0.8rem 1.2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.2rem' }}>LATENCY</p>
                          <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>12ms</p>
                      </div>
                  </div>
              </div>

              {/* Sidebar Controls */}
              <div style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                  <div className="glass-panel" style={{ padding: '2.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                          <div>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>{item.title}</h3>
                            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>{item.brand}</p>
                          </div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FF00FF' }}>{item.price}</div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                          <button 
                            disabled={processing}
                            onClick={() => {
                              setProcessing(true);
                              setTimeout(() => setProcessing(false), 2500);
                            }}
                            className="glass-panel" 
                            style={{ 
                                width: '100%', 
                                padding: '1.2rem', 
                                background: 'linear-gradient(90deg, #FF00FF, #7000FF)', 
                                border: 'none', 
                                fontWeight: 800, 
                                color: 'white',
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                gap: '1rem',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                boxShadow: '0 10px 20px rgba(255,0,255,0.2)'
                            }}
                          >
                              <Zap size={20} fill="white" /> RENDER HD FIT
                          </button>
                          <button className="glass-panel" style={{ width: '100%', padding: '1.2rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 700, fontSize: '1rem' }}>
                              ADD TO CART
                          </button>
                      </div>
                  </div>

                  <div className="glass-panel" style={{ padding: '2rem', background: 'rgba(255,255,255,0.01)', borderRadius: '32px' }}>
                      <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', marginBottom: '1.5rem', textTransform: 'uppercase' }}>Fitting Diagnostics</h4>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                          {[
                            { label: 'Shoulder Alignment', value: 92 },
                            { label: 'Body Mesh Fidelity', value: 87 },
                            { label: 'Surface Rendering', value: 95 }
                          ].map(stat => (
                            <div key={stat.label}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.6rem' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>{stat.label}</span>
                                    <span style={{ fontWeight: 600 }}>{stat.value}%</span>
                                </div>
                                <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${stat.value}%` }}
                                      transition={{ duration: 1, delay: 0.5 }}
                                      style={{ height: '100%', background: '#FF00FF', borderRadius: '2px' }} 
                                    />
                                </div>
                            </div>
                          ))}
                      </div>

                      <div style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(56, 189, 248, 0.1)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                          <div style={{ color: '#38bdf8' }}><Zap size={18} /></div>
                          <p style={{ fontSize: '0.8rem', color: '#38bdf8', lineHeight: '1.4' }}>
                              Auto-sizing enabled. We've detected you are a <strong style={{ fontWeight: 800 }}>Medium (M)</strong> based on your proportions.
                          </p>
                      </div>
                  </div>
              </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
