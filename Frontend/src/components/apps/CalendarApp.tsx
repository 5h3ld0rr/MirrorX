import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export const CalendarApp = () => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const date = new Date();
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();

  return (
    <div className="app-content" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <CalendarIcon size={32} color="var(--accent-primary)" />
          {month} {year}
        </h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="glass-panel" style={{ padding: '0.5rem' }}><ChevronLeft size={20} /></button>
          <button className="glass-panel" style={{ padding: '0.5rem' }}><ChevronRight size={20} /></button>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gap: '1rem',
        textAlign: 'center'
      }}>
        {days.map(day => (
          <div key={day} style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem' }}>{day}</div>
        ))}
        {Array.from({ length: 31 }).map((_, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.1, background: 'rgba(0, 242, 255, 0.1)' }}
            style={{ 
              padding: '1rem', 
              borderRadius: '12px', 
              background: i + 1 === date.getDate() ? 'var(--accent-primary)' : 'rgba(255,255,255,0.03)',
              color: i + 1 === date.getDate() ? 'black' : 'white',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            {i + 1}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
