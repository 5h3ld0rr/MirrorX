import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Search, Trash2, X, Loader2, Save } from 'lucide-react';
import { getNotes, createNote, updateNote, deleteNote } from '../../lib/api';

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  updatedAt: string;
}

export const NotesApp = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('#00f2ff');

  const colors = ['#00f2ff', '#ff4d4d', '#ff9500', '#4ade80', '#c084fc', '#ffffff'];

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const data = await getNotes();
      setNotes(data);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const openAddModal = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setColor('#00f2ff');
    setSaveError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setColor(note.color);
    setSaveError(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      setSaveError('Please add a title or content before saving.');
      return;
    }
    
    setIsSaving(true);
    setSaveError(null);
    try {
      if (editingNote) {
        await updateNote(editingNote.id, { title, content, color });
      } else {
        await createNote({ title, content, color });
      }
      await fetchNotes();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save note:', err);
      setSaveError(err.message || 'Failed to save note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await deleteNote(id);
      setNotes(notes.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-content" style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', width: '400px' }}>
          <div style={{ position: 'relative', flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', color: 'rgba(255,255,255,0.4)' }} />
            <input 
              type="text" 
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-panel"
              style={{ padding: '0.8rem 1rem 0.8rem 3rem', width: '100%' }}
            />
          </div>
          <button 
            className="glass-panel" 
            onClick={openAddModal}
            style={{ padding: '0.8rem 1.5rem', background: 'var(--accent-primary)', color: 'black', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
          >
            <Plus size={20} /> Add
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', paddingTop: '1rem', touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <Loader2 className="animate-spin" size={32} color="var(--accent-primary)" />
          </div>
        ) : filteredNotes.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <AnimatePresence>
              {filteredNotes.map((note) => (
                <motion.div
                  layout
                  key={note.id}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  whileHover={{ y: -5 }}
                  onClick={() => openEditModal(note)}
                  className="glass-panel"
                  style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', cursor: 'pointer', position: 'relative', borderLeft: `4px solid ${note.color}` }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'white' }}>{note.title || 'Untitled'}</h3>
                    <button 
                      onClick={(e) => handleDelete(note.id, e)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, maxHeight: '100px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
                    {note.content}
                  </p>
                  <div style={{ marginTop: '1.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'flex-end' }}>
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
            <p>No notes found. Create your first note to get started.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}
            onClick={() => { if (!isSaving) setIsModalOpen(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel"
              style={{ width: '100%', maxWidth: '600px', padding: '2.5rem', borderRadius: '24px' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 300 }}>{editingNote ? 'Edit Note' : 'New Note'}</h2>
                <button 
                  onClick={() => { if (!isSaving) setIsModalOpen(false); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.4 : 1 }}
                  disabled={isSaving}
                >
                  <X size={24} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <input 
                  type="text" 
                  placeholder="Title" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="note-title-input"
                  onFocus={(e) => e.target.style.borderBottomColor = 'var(--accent-primary)'}
                  onBlur={(e) => e.target.style.borderBottomColor = 'rgba(255,255,255,0.1)'}
                  style={{ 
                    width: '100%', 
                    fontSize: '2rem', 
                    fontWeight: 700,
                    background: 'transparent', 
                    border: 'none', 
                    borderBottom: '2px solid rgba(255,255,255,0.1)', 
                    paddingBottom: '0.8rem', 
                    color: 'white', 
                    outline: 'none',
                    transition: 'all 0.3s'
                  }}
                />
                
                <textarea 
                  placeholder="Start writing..." 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  style={{ width: '100%', height: '300px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6, resize: 'none', outline: 'none' }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1rem' }}>
                  {saveError && (
                    <div style={{ 
                      background: 'rgba(255,50,50,0.12)', 
                      border: '1px solid rgba(255,80,80,0.3)', 
                      borderRadius: '12px', 
                      padding: '0.8rem 1.2rem', 
                      color: '#ff6b6b', 
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      ⚠️ {saveError}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-evenly' }}>
                      {colors.map(c => (
                        <motion.button
                          key={c}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setColor(c)}
                          style={{
                            width: '36px', 
                            height: '36px',
                            padding: 0,
                            borderRadius: '50%', 
                            background: c, 
                            border: color === c ? '3px solid white' : '2px solid rgba(255,255,255,0.05)', 
                            boxShadow: color === c ? `0 0 15px ${c}` : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{ 
                      width: '100%',
                      padding: '1.2rem', 
                      borderRadius: '16px', 
                      background: isSaving ? 'rgba(0,242,255,0.5)' : 'var(--accent-primary)', 
                      color: 'black', 
                      fontWeight: 700, 
                      fontSize: '1.1rem',
                      border: 'none', 
                      cursor: isSaving ? 'not-allowed' : 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: '0.8rem',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                      marginTop: '1rem',
                      opacity: isSaving ? 0.8 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    {isSaving 
                      ? <><Loader2 size={22} className="animate-spin" /> Saving...</>
                      : <><Save size={22} /> Save Note</>
                    }
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
