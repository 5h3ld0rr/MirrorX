import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, TrendingUp, Filter, Heart, Camera, X, Scan, Zap, RefreshCw, Search, ShoppingCart, Sparkles, UserCheck } from 'lucide-react';
import React, { useState, useRef, useEffect, useMemo } from 'react';

export const FashionApp = () => {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isTryingOn, setIsTryingOn] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [scale, setScale] = useState(1);
  const [opacity, setOpacity] = useState(0.9);
  const [useFaceFocus, setUseFaceFocus] = useState(true);
  const [blendMode, setBlendMode] = useState<'screen' | 'multiply' | 'normal'>('multiply');
  const [fittingMode, setFittingMode] = useState<'mirror' | 'model'>('mirror');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [limbSync, setLimbSync] = useState({ arms: true, legs: true });
  const [garmentPos, setGarmentPos] = useState({ x: 0, y: 0 });
  const [compositeIntensity, setCompositeIntensity] = useState(0.8);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeCategory, setActiveCategory] = useState('Featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);

  const collections = useMemo(() => [
    { id: 1, title: 'Refractive Jacket', brand: 'Mirror Wear', image: 'https://images.unsplash.com/photo-1544022613-e87ce71c8e4d?auto=format&fit=crop&q=80&w=400&h=600', price: '$120', category: 'New Arrivals', matchScore: 98 },
    { id: 2, title: 'Glass Urban Tee', brand: 'Liquid Flow', image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=400&h=600', price: '$85', category: 'Trending', matchScore: null },
    { id: 3, title: 'Minimalist Tunic', brand: 'Void Collective', image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=400&h=600', price: '$240', category: 'Limited Edition', matchScore: 94 },
    { id: 4, title: 'Cyber Pulse Hoodie', brand: 'Neon Shimmer', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=400&h=600', price: '$180', category: 'Featured', matchScore: null },
    { id: 5, title: 'Prism Overcoat', brand: 'Mirror Wear', image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&q=80&w=400&h=600', price: '$310', category: 'New Arrivals', matchScore: 96 },
    { id: 6, title: 'Liquid Silk Scarf', brand: 'Liquid Flow', image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=400&h=600', price: '$45', category: 'Accessories', matchScore: null },
    { id: 7, title: 'Chrome Tech Vest', brand: 'Neon Shimmer', image: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&q=80&w=400&h=600', price: '$150', category: 'Trending', matchScore: 99 },
    { id: 8, title: 'Void Knit Sweater', brand: 'Void Collective', image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&q=80&w=400&h=600', price: '$195', category: 'Featured', matchScore: null },
  ], []);

  const filteredItems = useMemo(() => {
    let items = activeCategory === 'Featured' ? collections : collections.filter(item => item.category === activeCategory);
    if (searchQuery) {
      items = items.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return items;
  }, [activeCategory, collections, searchQuery]);

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

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const customItem = {
          id: 'custom-' + Date.now(),
          title: 'Custom Design',
          brand: 'Guest Designer',
          image: event.target?.result as string,
          price: 'N/A',
          category: 'Custom',
          matchScore: 99
        };
        handleTryOn(customItem);
      };
      reader.readAsDataURL(file);
    }
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
      <div style={{ flex: 1, padding: '3rem 4rem', overflowY: 'auto', position: 'relative' }}>
        {/* Header Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem' }}>
          <div style={{ position: 'relative', width: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
            <input 
              type="text" 
              placeholder="Search collections..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-panel search-input"
              style={{ 
                width: '100%', 
                padding: '0.9rem 1.2rem 0.9rem 3.2rem', 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                boxSizing: 'border-box',
                color: 'white',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.3s ease'
              }} 
            />
          </div>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="glass-panel"
            style={{ 
              padding: '0.8rem 1.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.8rem', 
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#FF00FF',
              border: '1px solid rgba(255,0,255,0.2)',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Camera size={18} /> NEURAL UPLOAD
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
             <div style={{ position: 'relative', cursor: 'pointer' }}>
                <ShoppingCart size={24} color="white" />
                {cartCount > 0 && (
                   <motion.div 
                     initial={{ scale: 0 }}
                     animate={{ scale: 1 }}
                     style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#FF00FF', color: 'white', fontSize: '0.65rem', fontWeight: 800, width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px #FF00FF' }}
                   >
                     {cartCount}
                   </motion.div>
                )}
             </div>
             <div style={{ height: '30px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(45deg, #00f2ff, #FF00FF)', padding: '2px' }}>
                   <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <UserCheck size={20} color="#00f2ff" />
                   </div>
                </div>
                <div>
                   <p style={{ fontSize: '0.8rem', fontWeight: 700 }}>AI PROFILE</p>
                   <p style={{ fontSize: '0.65rem', color: '#00f2ff' }}>ACTIVE</p>
                </div>
             </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
          <div>
            <h3 style={{ fontSize: '2.4rem', fontWeight: 700, letterSpacing: '-1px' }}>{activeCategory}</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>Discover unique reflections of style curated for you.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button className="glass-panel" style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.9rem' }}><Filter size={16} /> Filter</button>
              <button className="glass-panel" style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.9rem' }}><TrendingUp size={16} /> Sort</button>
          </div>
        </div>

        <motion.div 
          layout
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '4rem' }}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept="image/*" 
            onChange={handleCustomUpload} 
          />

          <AnimatePresence mode="popLayout">
            {/* Custom Upload Card */}
            {activeCategory === 'Featured' && !searchQuery && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                onClick={() => fileInputRef.current?.click()}
                style={{ 
                  cursor: 'pointer', 
                  position: 'relative',
                  width: '100%', 
                  aspectRatio: '3/4', 
                  borderRadius: '32px',
                  background: 'linear-gradient(135deg, rgba(255,0,255,0.1), rgba(0,242,255,0.1))',
                  border: '2px dashed rgba(255,255,255,0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1.5rem',
                  overflow: 'hidden'
                }}
              >
                <div style={{ padding: '2rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', boxShadow: '0 0 30px rgba(255,0,255,0.2)' }}>
                   <Camera size={48} color="#FF00FF" />
                </div>
                <div style={{ textAlign: 'center' }}>
                   <h4 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '2px' }}>AI CUSTOM FIT</h4>
                   <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>Upload your own design</p>
                </div>
                <motion.div 
                   animate={{ opacity: [0.3, 0.6, 0.3] }}
                   transition={{ duration: 2, repeat: Infinity }}
                   style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(0,242,255,0.1) 0%, transparent 70%)' }}
                />
              </motion.div>
            )}
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -10 }}
                style={{ cursor: 'pointer', position: 'relative' }}
              >
                <div style={{ 
                  width: '100%', 
                  aspectRatio: '3/4', 
                  borderRadius: '32px', 
                  overflow: 'hidden', 
                  marginBottom: '1.5rem',
                  boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
                  position: 'relative',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}>
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    onError={(e: any) => {
                      e.target.src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400';
                    }}
                  />
                  
                  {item.matchScore && (
                    <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', background: 'rgba(0, 242, 255, 0.2)', backdropFilter: 'blur(10px)', padding: '0.6rem 1rem', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(0, 242, 255, 0.3)', zIndex: 10 }}>
                       <Sparkles size={14} color="#00f2ff" />
                       <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#00f2ff' }}>{item.matchScore}% NEURAL MATCH</span>
                    </div>
                  )}

                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent 60%)', opacity: 0, transition: '0.4s all ease' }} className="hover-overlay">
                      <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', right: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleTryOn(item); }}
                            className="glass-panel" 
                            style={{ 
                              width: '100%',
                              padding: '1.2rem', 
                              background: 'linear-gradient(135deg, #FF00FF, #00f2ff)', 
                              color: 'white', 
                              fontWeight: 800, 
                              border: 'none', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              gap: '0.8rem',
                              boxShadow: '0 10px 20px rgba(255,0,255,0.4)',
                              cursor: 'pointer'
                            }}
                          >
                              <Camera size={20} /> LIVE TRY-ON
                          </button>
                      </div>
                  </div>
                  <button style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', width: '45px', height: '45px', borderRadius: '18px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 15 }}>
                      <Heart size={20} />
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', minWidth: 0, padding: '0 0.5rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.4rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</h4>
                      <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 500 }}>{item.brand}</p>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FF00FF', flexShrink: 0 }}>{item.price}</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      <VirtualTryOnModal 
        isOpen={isTryingOn}
        onClose={() => { setIsTryingOn(false); stopCamera(); }}
        item={selectedItem}
        videoRef={videoRef}
        processing={processing}
        setProcessing={setProcessing}
        scale={scale}
        setScale={setScale}
        opacity={opacity}
        setOpacity={setOpacity}
        useFaceFocus={useFaceFocus}
        setUseFaceFocus={setUseFaceFocus}
        blendMode={blendMode}
        setBlendMode={setBlendMode}
        fittingMode={fittingMode}
        setFittingMode={setFittingMode}
        capturedImage={capturedImage}
        setCapturedImage={setCapturedImage}
        isCapturing={isCapturing}
        setIsCapturing={setIsCapturing}
        garmentPos={garmentPos}
        setGarmentPos={setGarmentPos}
        limbSync={limbSync}
        setLimbSync={setLimbSync}
        onAddToCart={() => setCartCount(c => c + 1)}
      />
    </div>
  );
};

const VirtualTryOnModal = ({ 
  isOpen, onClose, item, videoRef, processing, setProcessing, 
  scale, setScale, opacity, setOpacity, 
  useFaceFocus, setUseFaceFocus, blendMode, setBlendMode,
  fittingMode, setFittingMode,
  capturedImage, setCapturedImage,
  isCapturing, setIsCapturing,
  garmentPos, setGarmentPos,
  limbSync, setLimbSync,
  onAddToCart
}: any) => {
  const [scanStage, setScanStage] = useState<'none' | 'scanning' | 'measuring' | 'complete'>('none');
  const [measurements, setMeasurements] = useState({ height: '--', shoulders: '--', waist: '--' });
  const [captureProgress, setCaptureProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      // Auto-start scan sequence
      setScanStage('scanning');
      setProcessing(true);
      
      const timer1 = setTimeout(() => setScanStage('measuring'), 1500);
      const timer2 = setTimeout(() => {
        setScanStage('complete');
        setProcessing(false);
        setMeasurements({ height: '172cm', shoulders: '44cm', waist: '32"' });
        
        // Auto-capture snapshot after 1.5 seconds of seeing the result
        setTimeout(() => {
           if (videoRef.current) {
             setIsCapturing(true);
             setCaptureProgress(0);
             
             // Simulate "Neural Processing" progress
             const interval = setInterval(() => {
                setCaptureProgress(prev => {
                   if (prev >= 100) {
                      clearInterval(interval);
                      return 100;
                   }
                   return prev + 2;
                });
             }, 30);

             const captureAction = () => {
               const canvas = document.createElement('canvas');
               canvas.width = 1080; // High res
               canvas.height = 1440;
               const ctx = canvas.getContext('2d');
               if (ctx) {
                 // Background (Mirror or Model)
                 if (fittingMode === 'mirror') {
                    // Mirror background
                    ctx.save();
                    ctx.translate(canvas.width, 0);
                    ctx.scale(-1, 1);
                    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                    ctx.restore();
                    
                    // Garment Overlay
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.src = item.image;
                    img.onload = () => {
                       ctx.globalAlpha = opacity;
                       const gW = canvas.width * 0.6 * scale;
                       const gH = canvas.height * 0.7 * scale;
                       const centerX = canvas.width / 2 + (garmentPos.x * 2); 
                       const centerY = (useFaceFocus ? canvas.height * 0.6 : canvas.height * 0.45) + (garmentPos.y * 2);
                       
                       ctx.drawImage(img, centerX - gW/2, centerY - gH/2, gW, gH);
                       
                       // Add bloom/glow to make it "proper"
                       ctx.globalAlpha = 0.15;
                       ctx.filter = 'blur(20px)';
                       ctx.drawImage(img, centerX - gW/2, centerY - gH/2, gW, gH);
                       ctx.filter = 'none';

                       setCapturedImage(canvas.toDataURL('image/png'));
                       setIsCapturing(false);
                    };
                 } else {
                    // Model Sync background - ADVANCED BLENDING
                    const modelImg = new Image();
                    modelImg.crossOrigin = "anonymous";
                    modelImg.src = item.image;
                    modelImg.onload = () => {
                       ctx.drawImage(modelImg, 0, 0, canvas.width, canvas.height);
                       
                       // Define Neural Zone (Model's head area)
                       const faceX = canvas.width * 0.5;
                       const faceY = canvas.height * 0.22;
                       const faceW = canvas.width * 0.08;
                       const faceH = faceW * 1.25;

                       // 1. Create a feathered elliptical mask for the face
                       ctx.save();
                       ctx.beginPath();
                       ctx.ellipse(faceX, faceY, faceW, faceH, 0, 0, Math.PI * 2);
                       ctx.clip();
                       
                       // 2. Draw User Face with "Studio Match" filters
                       ctx.save();
                       ctx.translate(faceX + faceW, faceY - faceH);
                       ctx.scale(-1, 1);
                       
                       // Match studio lighting: increase contrast and apply subtle warmth
                       ctx.filter = 'contrast(1.15) brightness(1.05) saturate(1.1) sepia(0.05)';
                       ctx.drawImage(videoRef.current, 0, 0, faceW * 2, faceH * 2);
                       ctx.restore();
                       
                       // 3. Post-process edge blending (Soft neural blur)
                       ctx.globalCompositeOperation = 'destination-in';
                       const grad = ctx.createRadialGradient(faceX, faceY, faceW * 0.5, faceX, faceY, faceW);
                       grad.addColorStop(0, 'rgba(0,0,0,1)');
                       grad.addColorStop(1, 'rgba(0,0,0,0)');
                       ctx.fillStyle = grad;
                       ctx.fill();
                       ctx.restore();

                       // 4. Draw model's hair/collar back ON TOP to blend (Subtle)
                       ctx.globalAlpha = 0.3;
                       ctx.drawImage(modelImg, 0, 0, canvas.width, canvas.height);
                       ctx.globalAlpha = 1.0;

                       setCapturedImage(canvas.toDataURL('image/png'));
                       setIsCapturing(false);
                    };
                 }
               }
             };

             setTimeout(captureAction, 1800);
           } else {
             setCapturedImage(item.image);
           }
        }, 1500);
      }, 3500);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else {
      setScanStage('none');
    }
  }, [isOpen]);

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
               <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4)' }}>
                  <img src="https://i.ibb.co/L8zB3Xy/tryu-logo.png" alt="TryU" style={{ width: '80%' }} onError={(e: any) => { e.target.style.display = 'none'; }} />
                  <Scan size={28} color="#f2994a" style={{ position: 'absolute' }} />
               </div>
               <div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.5px', color: '#f2994a' }}>TryU <span style={{ color: 'white' }}>Mirror</span></h2>
                  <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase' }}>AI Body Measurement & Fitting</p>
               </div>
            </div>
            
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '0.4rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <button 
                  onClick={() => setFittingMode('mirror')}
                  style={{ 
                    padding: '0.6rem 1.5rem', 
                    borderRadius: '12px', 
                    background: fittingMode === 'mirror' ? 'white' : 'transparent', 
                    color: fittingMode === 'mirror' ? 'black' : 'white',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    border: 'none',
                    transition: '0.3s all'
                  }}
                >
                  AR MIRROR
                </button>
                <button 
                  onClick={() => setFittingMode('model')}
                  style={{ 
                    padding: '0.6rem 1.5rem', 
                    borderRadius: '12px', 
                    background: fittingMode === 'model' ? 'white' : 'transparent', 
                    color: fittingMode === 'model' ? 'black' : 'white',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    border: 'none',
                    transition: '0.3s all'
                  }}
                >
                  MODEL SYNC
                </button>
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
              <div style={{ 
                flex: 2, 
                position: 'relative', 
                borderRadius: fittingMode === 'model' ? '32px' : '100% 100% 100% 100% / 120% 120% 80% 80%', 
                overflow: 'hidden', 
                boxShadow: `0 0 120px ${fittingMode === 'model' ? 'rgba(255, 255, 255, 0.1)' : useFaceFocus ? 'rgba(0, 242, 255, 0.2)' : 'rgba(255, 0, 255, 0.15)'}`, 
                background: '#050505', 
                border: '2px solid rgba(255, 255, 255, 0.15)',
                transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)'
              }}>
                  {/* Background Layer (Camera or Model) */}
                  <div style={{ position: 'absolute', inset: 0 }}>
                    {(fittingMode === 'mirror' || scanStage !== 'complete') ? (
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover', 
                          transform: `scaleX(-1) ${useFaceFocus ? 'scale(1.5) translateY(10%)' : 'scale(1)'}`,
                          filter: 'contrast(1.1) brightness(1.1)',
                          transition: 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)'
                        }} 
                      />
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ position: 'relative', width: '100%', height: '100%' }}
                      >
                        <img 
                          src={item.image} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          alt="Model"
                        />
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.1)' }} />
                        
                        {/* Sub-window for face masking onto model - REFINED for seamless blend */}
                        <motion.div 
                          drag
                          dragMomentum={false}
                          style={{ 
                            position: 'absolute', 
                            top: '11%', 
                            left: '42%', 
                            width: '16%', 
                            aspectRatio: '0.85', // Elliptical for natural face shape
                            borderRadius: '50% 50% 45% 45%',
                            overflow: 'hidden',
                            zIndex: 5,
                            cursor: 'grab',
                            background: 'black',
                            maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 70%)',
                            WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 70%)',
                            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)'
                          }}
                        >
                           <video 
                              ref={videoRef} 
                              autoPlay 
                              playsInline 
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover', 
                                transform: 'scaleX(-1) scale(2)',
                                filter: 'contrast(1.2) brightness(1.1) saturate(1.1)'
                              }} 
                           />
                        </motion.div>
                      </motion.div>
                    )}
                  </div>

                  {/* Limb Sync Controls - NEW */}
                  {fittingMode === 'mirror' && scanStage === 'complete' && (
                    <div style={{ 
                      position: 'absolute', 
                      bottom: '50px', 
                      left: '50%', 
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      gap: '1.5rem',
                      zIndex: 10
                    }}>
                      <button 
                        onClick={() => setLimbSync(p => ({ ...p, arms: !p.arms }))}
                        className="glass-panel"
                        style={{ 
                          padding: '1rem 2rem', 
                          borderRadius: '16px', 
                          color: limbSync.arms ? '#f2994a' : 'white',
                          border: `2px solid ${limbSync.arms ? '#f2994a' : 'rgba(255,255,255,0.1)'}`,
                          background: 'rgba(0,0,0,0.7)',
                          fontSize: '0.85rem',
                          fontWeight: 800,
                          boxShadow: limbSync.arms ? '0 0 20px rgba(242, 153, 74, 0.3)' : 'none',
                          transition: '0.3s all'
                        }}
                      >
                        {limbSync.arms ? 'ARMS FORWARD' : 'SYNC ARMS'}
                      </button>
                      <button 
                        onClick={() => setLimbSync(p => ({ ...p, legs: !p.legs }))}
                        className="glass-panel"
                        style={{ 
                          padding: '1rem 2rem', 
                          borderRadius: '16px', 
                          color: limbSync.legs ? '#f2994a' : 'white',
                          border: `2px solid ${limbSync.legs ? '#f2994a' : 'rgba(255,255,255,0.1)'}`,
                          background: 'rgba(0,0,0,0.7)',
                          fontSize: '0.85rem',
                          fontWeight: 800,
                          boxShadow: limbSync.legs ? '0 0 20px rgba(242, 153, 74, 0.3)' : 'none',
                          transition: '0.3s all'
                        }}
                      >
                        {limbSync.legs ? 'LEGS SYNC' : 'SYNC LEGS'}
                      </button>
                    </div>
                  )}
                  
                  {/* Anatomical HUD Overlays */}
                  <AnimatePresence>
                    {scanStage !== 'none' && scanStage !== 'complete' && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none' }}
                      >
                         {/* Shoulder Line */}
                         <motion.div 
                            animate={{ scaleX: [0, 1] }} 
                            style={{ position: 'absolute', top: '35%', left: '20%', right: '20%', height: '1px', background: '#f2994a', boxShadow: '0 0 10px #f2994a' }} 
                         />
                         <div style={{ position: 'absolute', top: '32%', left: '50%', transform: 'translateX(-50%)', fontSize: '0.6rem', color: '#f2994a', fontWeight: 800 }}>SHOULDER ALIGNMENT</div>
                         
                         {/* Waist Line */}
                         <motion.div 
                            animate={{ scaleX: [0, 1] }} 
                            transition={{ delay: 0.5 }}
                            style={{ position: 'absolute', top: '55%', left: '30%', right: '30%', height: '1px', background: '#f2994a', opacity: 0.6 }} 
                         />
                         
                         <div style={{ position: 'absolute', top: '10%', right: '5%', textAlign: 'right' }}>
                            <p style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.4)' }}>CALIBRATION</p>
                            <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f2994a' }}>{scanStage === 'scanning' ? 'ANALYZING...' : 'MEASURING...'}</p>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Neural Masking Layer / HUD */}
                  {fittingMode === 'mirror' && (
                    <div style={{ 
                      position: 'absolute', 
                      inset: 0, 
                      background: 'radial-gradient(circle at 50% 40%, transparent 20%, rgba(0,0,0,0.4) 70%)',
                      pointerEvents: 'none'
                    }} />
                  )}

                  {/* AR Overlay - Interactive Fitting (Only in Mirror Mode) */}
                  {fittingMode === 'mirror' && (
                    <motion.div 
                        key={item.id}
                        drag
                        dragMomentum={false}
                        onDrag={(_, info) => setGarmentPos({ x: info.point.x, y: info.point.y })}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ 
                          opacity: processing ? 0.1 : opacity, 
                          scale: scale,
                          transition: { duration: 0.4 }
                        }}
                        style={{ 
                          position: 'absolute', 
                          top: useFaceFocus ? '40%' : '20%', 
                          left: '25%', 
                          width: '50%',
                          height: '60%',
                          zIndex: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'grab',
                          transition: 'top 0.8s cubic-bezier(0.23, 1, 0.32, 1)'
                        }}
                        whileDrag={{ cursor: 'grabbing', scale: scale * 1.05 }}
                    >
                        <img 
                          src={item.image} 
                          alt="garment"
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'contain', 
                            filter: `drop-shadow(0 20px 40px rgba(0,0,0,0.3)) brightness(${blendMode === 'multiply' ? 1.05 : 1.1}) contrast(1.1)`,
                            mixBlendMode: blendMode,
                            pointerEvents: 'none',
                            transform: blendMode === 'multiply' ? 'scale(1.02)' : 'none'
                          }} 
                        />
                    </motion.div>
                  )}

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
                       <p style={{ marginTop: '2.5rem', fontSize: '1.2rem', letterSpacing: '4px', fontWeight: 800, color: 'white' }}>SYNCING FABRIC...</p>
                    </div>
                  )}

                   {/* HUD Info */}
                   <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', display: 'flex', gap: '1.5rem' }}>
                       <div style={{ background: 'rgba(0,0,0,0.8)', padding: '0.8rem 1.2rem', borderRadius: '12px', border: '1px solid #f2994a30' }}>
                           <p style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.2rem' }}>BODY HEIGHT</p>
                           <p style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f2994a' }}>{measurements.height}</p>
                       </div>
                       <div style={{ background: 'rgba(0,0,0,0.8)', padding: '0.8rem 1.2rem', borderRadius: '12px', border: '1px solid #f2994a30' }}>
                           <p style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.2rem' }}>SHOULDER</p>
                           <p style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f2994a' }}>{measurements.shoulders}</p>
                       </div>
                       <div style={{ background: 'rgba(0,0,0,0.8)', padding: '0.8rem 1.2rem', borderRadius: '12px', border: '1px solid #f2994a30' }}>
                           <p style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.2rem' }}>WAIST SYNC</p>
                           <p style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f2994a' }}>{measurements.waist}</p>
                       </div>
                   </div>
               </div>

               {/* AI Generating State */}
               <AnimatePresence>
                 {isCapturing && (
                   <motion.div 
                     key="capturing"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     style={{ 
                       position: 'absolute', 
                       inset: 0, 
                       zIndex: 200, 
                       background: 'rgba(0,0,0,0.92)', 
                       backdropFilter: 'blur(50px)',
                       display: 'flex',
                       flexDirection: 'column',
                       alignItems: 'center',
                       justifyContent: 'center',
                       textAlign: 'center'
                     }}
                   >
                      <div style={{ position: 'relative', width: '200px', height: '200px', marginBottom: '3rem' }}>
                         <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                            <motion.circle 
                               cx="100" cy="100" r="90" 
                               fill="none" 
                               stroke="#f2994a" 
                               strokeWidth="6" 
                               strokeDasharray="565"
                               animate={{ strokeDashoffset: 565 - (565 * captureProgress) / 100 }}
                               transition={{ type: 'spring', stiffness: 50 }}
                               strokeLinecap="round"
                            />
                         </svg>
                         <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Sparkles size={60} color="#f2994a" style={{ filter: 'drop-shadow(0 0 20px #f2994a)' }} />
                         </div>
                      </div>
                      
                      <motion.div
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: 0.2 }}
                      >
                         <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', letterSpacing: '8px', textTransform: 'uppercase', marginBottom: '1rem' }}>Generating</h2>
                         <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500, letterSpacing: '2px' }}>NEURAL TEXTURES & LIGHT MAPPING</p>
                         <div style={{ marginTop: '2.5rem', fontSize: '1.5rem', color: '#f2994a', fontWeight: 900, fontFamily: 'monospace' }}>{Math.round(captureProgress)}%</div>
                      </motion.div>
                   </motion.div>
                 )}
               </AnimatePresence>

               {/* Snapshot Capture Overlay */}
               <AnimatePresence>
                 {capturedImage && (
                   <motion.div 
                     key="snapshot-overlay"
                     initial={{ opacity: 0, scale: 0.8, y: 50 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.8 }}
                     style={{ 
                       position: 'absolute', 
                       inset: '2rem', 
                       zIndex: 100, 
                       background: 'rgba(10, 10, 15, 0.9)', 
                       backdropFilter: 'blur(60px)', 
                       borderRadius: '48px',
                       display: 'flex',
                       flexDirection: 'column',
                       alignItems: 'center',
                       justifyContent: 'center',
                       padding: '3rem',
                       border: '1px solid rgba(242, 153, 74, 0.4)',
                       boxShadow: '0 50px 150px rgba(0,0,0,1)'
                     }}
                   >
                      <div style={{ position: 'relative', width: '400px', aspectRatio: '3/4', borderRadius: '32px', overflow: 'hidden', marginBottom: '3rem', boxShadow: '0 40px 100px rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)' }}>
                         <img src={capturedImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Snapshot" />
                         <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%)' }} />
                         <div style={{ position: 'absolute', bottom: '2rem', left: '2.5rem', right: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ background: 'white', padding: '0.5rem 0.8rem', borderRadius: '10px' }}>
                               <img src="https://i.ibb.co/L8zB3Xy/tryu-logo.png" style={{ height: '16px' }} />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'white', letterSpacing: '1.5px', background: 'rgba(0,0,0,0.5)', padding: '0.6rem 1.2rem', borderRadius: '12px', backdropFilter: 'blur(15px)', border: '1px solid rgba(255,255,255,0.1)' }}>RESULT: GEN-AI PORTRAIT</span>
                         </div>
                      </div>
                      
                      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                         <h3 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#f2994a', letterSpacing: '-1px', marginBottom: '0.5rem' }}>SNAP CAPTURED!</h3>
                         <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.5)', maxWidth: '400px', lineHeight: '1.6' }}>Your high-fidelity digital fitting portrait is ready for showcase.</p>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '1.5rem', width: '100%', maxWidth: '500px' }}>
                         <button 
                            onClick={() => setCapturedImage(null)}
                            style={{ flex: 1, padding: '1.4rem', background: 'rgba(255,255,255,0.03)', borderRadius: '22px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer' }}
                         >
                            RE-SCAN
                         </button>
                         <button 
                            style={{ flex: 1.5, padding: '1.4rem', background: 'linear-gradient(135deg, #f2994a, #f2c94c)', borderRadius: '22px', border: 'none', color: 'black', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 20px 40px rgba(242, 153, 74, 0.3)' }}
                         >
                            SAVE TO GALLERY
                         </button>
                      </div>
                   </motion.div>
                 )}
               </AnimatePresence>

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
                              setTimeout(() => {
                                setProcessing(false);
                                onAddToCart();
                              }, 2500);
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
                              <Zap size={20} fill="white" /> {processing ? 'SYNCING...' : 'RENDER & ADD TO CART'}
                          </button>
                          <button 
                            onClick={onClose}
                            className="glass-panel" 
                            style={{ width: '100%', padding: '1.2rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 700, fontSize: '1rem' }}
                          >
                              EXIT MIRROR
                          </button>
                      </div>
                  </div>

                  <div className="glass-panel" style={{ padding: '2rem', background: 'rgba(255,255,255,0.01)', borderRadius: '32px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', textTransform: 'uppercase' }}>Neural Controls</h4>
                        <div 
                          onClick={() => setUseFaceFocus(!useFaceFocus)}
                          style={{ 
                            padding: '0.4rem 0.8rem', 
                            borderRadius: '20px', 
                            background: useFaceFocus ? 'rgba(0, 242, 255, 0.2)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${useFaceFocus ? '#00f2ff' : 'rgba(255,255,255,0.1)'}`,
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            color: useFaceFocus ? '#00f2ff' : 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                          }}
                        >
                          <UserCheck size={12} /> {useFaceFocus ? 'FACE FOCUS ON' : 'FACE FOCUS OFF'}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                          <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '1rem' }}>
                                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>Fit Scale</span>
                                  <span style={{ color: '#FF00FF', fontWeight: 700 }}>{Math.round(scale * 100)}%</span>
                              </div>
                              <input 
                                  type="range" 
                                  min="0.5" 
                                  max="2" 
                                  step="0.01" 
                                  value={scale} 
                                  onChange={(e) => setScale(parseFloat(e.target.value))}
                                  style={{ width: '100%', accentColor: '#FF00FF', cursor: 'pointer' }}
                              />
                          </div>

                          <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '1rem' }}>
                                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>Fabric Blending</span>
                                  <span style={{ color: '#00f2ff', fontWeight: 700 }}>{Math.round(opacity * 100)}%</span>
                              </div>
                              <input 
                                  type="range" 
                                  min="0.2" 
                                  max="1" 
                                  step="0.01" 
                                  value={opacity} 
                                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                                  style={{ width: '100%', accentColor: '#00f2ff', cursor: 'pointer' }}
                              />
                          </div>

                          <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '1rem' }}>
                                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>Processing Mode</span>
                                  <span style={{ color: '#FF00FF', fontWeight: 700 }}>{blendMode.toUpperCase()}</span>
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  {['multiply', 'screen', 'normal'].map((mode: any) => (
                                    <button 
                                      key={mode}
                                      onClick={() => setBlendMode(mode)}
                                      style={{ 
                                        flex: 1, 
                                        padding: '0.5rem', 
                                        fontSize: '0.6rem', 
                                        fontWeight: 800,
                                        background: blendMode === mode ? 'rgba(255,0,255,0.2)' : 'transparent',
                                        border: `1px solid ${blendMode === mode ? '#FF00FF' : 'rgba(255,255,255,0.1)'}`,
                                        color: blendMode === mode ? 'white' : 'rgba(255,255,255,0.4)',
                                        borderRadius: '8px'
                                      }}
                                    >
                                      {mode.toUpperCase()}
                                    </button>
                                  ))}
                              </div>
                          </div>
                      </div>

                      {fittingMode === 'model' && (
                        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(0, 242, 255, 0.05)', borderRadius: '20px', border: '1px solid rgba(0, 242, 255, 0.2)' }}>
                            <p style={{ fontSize: '0.75rem', color: '#00f2ff', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Sparkles size={14} /> AI MAPPING ACTIVE
                            </p>
                            <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', lineHeight: '1.4' }}>
                              Drag your portrait to align with the model's face. Our AI will automatically match the lighting and skin-tone.
                            </p>
                        </div>
                      )}

                      <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                          Tip: Drag the garment to position it over your reflection.
                      </div>
                  </div>
              </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
