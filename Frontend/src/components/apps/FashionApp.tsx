import { motion } from 'framer-motion';
import { ShoppingBag, TrendingUp, Filter, Heart } from 'lucide-react';

export const FashionApp = () => {
  const collections = [
    { id: 1, title: 'Summer Refraction', brand: 'Mirror Wear', image: 'https://images.unsplash.com/photo-15391091323cf-ad17f39acc03?auto=format&fit=crop&q=80&w=400&h=600', price: '$120' },
    { id: 2, title: 'Glass Urban', brand: 'Liquid Flow', image: 'https://images.unsplash.com/photo-1549416878-b9ca95e26903?auto=format&fit=crop&q=80&w=400&h=600', price: '$85' },
    { id: 3, title: 'Minimal Reflection', brand: 'Void Collective', image: 'https://images.unsplash.com/photo-1509319117193-57bab727e09d?auto=format&fit=crop&q=80&w=400&h=600', price: '$240' },
    { id: 4, title: 'Cyber Pulse', brand: 'Neon Shimmer', image: 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&q=80&w=400&h=600', price: '$180' },
  ];

  return (
    <div className="app-content" style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: '300px', padding: '2rem', borderRight: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        <h2 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.8rem', fontWeight: 600 }}>
          <ShoppingBag size={28} color="#FF00FF" />
          Mirror Fashion
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {['Featured', 'New Arrivals', 'Trending', 'Accessories', 'Limited Edition'].map((cat, i) => (
             <div key={cat} style={{ fontSize: '1.1rem', color: i === 0 ? 'white' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                {i === 0 && <div style={{ width: '4px', height: '18px', background: '#FF00FF', borderRadius: '4px' }} />}
                {cat}
             </div>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '3rem' }}>
          {collections.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -10 }}
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              <div style={{ 
                width: '100%', 
                aspectRatio: '2/3', 
                borderRadius: '16px', 
                overflow: 'hidden', 
                marginBottom: '1.5rem',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                position: 'relative'
              }}>
                <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button style={{ position: 'absolute', top: '1rem', right: '1rem', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <Heart size={20} />
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.3rem' }}>{item.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.brand}</p>
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FF00FF' }}>{item.price}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
