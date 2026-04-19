import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Search, Trash2, Edit2 } from 'lucide-react';

export const NotesApp = () => {
  const [notes] = useState([
    { id: 1, title: 'Project MirrorX', content: 'Focus on face authentication and premium UI design for the mirror.', color: '#00f2ff' },
    { id: 2, title: 'Grocery List', content: 'Milk, Bread, Coffee, Fruits, Vegetables.', color: '#ff4d4d' },
    { id: 3, title: 'Meeting Notes', content: 'Discuss the backend integration with the frontend team at 2 PM.', color: '#ff9500' },
  ]);

  return (
    <div className="app-content" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div />
        <div style={{ display: 'flex', gap: '1rem', width: '300px' }}>
          <div style={{ 
            position: 'relative', 
            flexGrow: 1, 
            display: 'flex', 
            alignItems: 'center' 
          }}>
            <Search size={20} style={{ position: 'absolute', left: '1rem', color: 'rgba(255,255,255,0.4)' }} />
            <input 
              type="text" 
              placeholder="Search notes..." 
              className="glass-panel" 
              style={{ 
                width: '100%', 
                padding: '0.8rem 1rem 0.8rem 3rem', 
                borderRadius: '12px',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white'
              }} 
            />
          </div>
          <button className="glass-panel" style={{ padding: '0.8rem', background: 'var(--accent-primary)', color: 'black' }}>
            <Plus size={24} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <AnimatePresence>
          {notes.map((note) => (
            <motion.div
              layout
              key={note.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              whileHover={{ y: -5 }}
              className="glass-panel"
              style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', position: 'relative' }}
            >
              <div 
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '4px', 
                  height: '100%', 
                  background: note.color, 
                  borderRadius: '12px 0 0 12px' 
                }} 
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{note.title}</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Edit2 size={16} /></button>
                  <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{note.content}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
