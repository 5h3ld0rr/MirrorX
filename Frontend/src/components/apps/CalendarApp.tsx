import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Star, Plus, X, Trash2, CheckCircle } from 'lucide-react';
import axios from 'axios';

const GOOGLE_CAL_ID = 'en.lk#holiday@group.v.calendar.google.com';
const GOOGLE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;

export const CalendarApp = () => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [holidays, setHolidays] = useState<Record<string, { name: string, type: 'buddhist'|'christian'|'hindu'|'muslim'|'national' }>>({});
  const [userEvents, setUserEvents] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('mirrorx_user_events');
    return saved ? JSON.parse(saved) : {};
  });
  const [showModal, setShowModal] = useState(false);
  const [eventInput, setEventInput] = useState('');
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const today = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthName = viewDate.toLocaleString('default', { month: 'long' });
  const year = viewDate.getFullYear();

  useEffect(() => {
    const fetchHolidaysFromGoogle = async () => {
      setIsLoading(true);
      try {
        const timeMin = `${year}-01-01T00:00:00Z`;
        const timeMax = `${year}-12-31T23:59:59Z`;
        const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(GOOGLE_CAL_ID)}/events?key=${GOOGLE_API_KEY}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`;
        
        const response = await axios.get(url);
        const items = response.data.items || [];
        const mapped: Record<string, any> = {};

        items.forEach((item: any) => {
          const date = item.start.date || item.start.dateTime.split('T')[0];
          let type = 'national';
          const lowerName = item.summary.toLowerCase();
          
          if (lowerName.includes('poya')) type = 'buddhist';
          else if (lowerName.includes('ramazan') || lowerName.includes('hadji') || lowerName.includes('id-ul')) type = 'muslim';
          else if (lowerName.includes('thai pongal') || lowerName.includes('deepavali')) type = 'hindu';
          else if (lowerName.includes('christmas') || lowerName.includes('good friday') || lowerName.includes('easter')) type = 'christian';

          mapped[date] = { name: item.summary, type: type };
        });
        setHolidays(mapped);
      } catch (error) {
        console.error("Direct Google Fetch Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHolidaysFromGoogle();
  }, [year]); // Refetch if year changes

  useEffect(() => {
    localStorage.setItem('mirrorx_user_events', JSON.stringify(userEvents));
  }, [userEvents]);

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const handlePrevMonth = () => {
    setViewDate(prev => {
      let prevM = prev.getMonth() - 1;
      let prevY = prev.getFullYear();
      if (prevM < 0) { prevM = 11; prevY -= 1; }
      return new Date(prevY, prevM, 1);
    });
  };

  const handleNextMonth = () => {
    setViewDate(prev => {
      let nextM = prev.getMonth() + 1;
      let nextY = prev.getFullYear();
      if (nextM > 11) { nextM = 0; nextY += 1; }
      return new Date(nextY, nextM, 1);
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showModal) return;
      if (e.key === 'ArrowLeft') handlePrevMonth();
      else if (e.key === 'ArrowRight') handleNextMonth();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  const addEvent = () => {
    if (!eventInput.trim() || !selectedDate) return;
    setUserEvents(prev => ({
      ...prev,
      [selectedDate]: [...(prev[selectedDate] || []), eventInput.trim()]
    }));
    setEventInput('');
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  const deleteEvent = (dateStr: string, index: number) => {
    setUserEvents(prev => {
      const updated = [...(prev[dateStr] || [])];
      updated.splice(index, 1);
      if (updated.length === 0) {
        const newState = { ...prev };
        delete newState[dateStr];
        return newState;
      }
      return { ...prev, [dateStr]: updated };
    });
  };

  const totalDays = getDaysInMonth(year, viewDate.getMonth());
  const firstDayIndex = getFirstDayOfMonth(year, viewDate.getMonth());
  const blanks = Array.from({ length: firstDayIndex });
  const dayNumbers = Array.from({ length: totalDays }, (_, i) => i + 1);

  const getDayTypeColor = (type?: string) => {
    switch(type) {
      case 'buddhist': return '#fcc419';
      case 'christian': return '#ae3ec9';
      case 'hindu': return '#fd7e14';
      case 'muslim': return '#40c057';
      default: return 'var(--accent-primary)';
    }
  };

  return (
    <div className="app-content" style={{ padding: '2.5rem', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* Navigation & Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h2 style={{ fontSize: '3rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>{monthName} {year}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.4rem' }}>
            <CalendarIcon size={20} />
            <span>Sri Lanka {year} Calendar (Google Live)</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
          <motion.button 
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.08)' }}
            whileTap={{ scale: 0.95 }}
            className="glass-panel" 
            onClick={handlePrevMonth} 
            style={{ width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <ChevronLeft size={32} />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.08)' }}
            whileTap={{ scale: 0.95 }}
            className="glass-panel" 
            onClick={handleNextMonth} 
            style={{ width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <ChevronRight size={32} />
          </motion.button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem', height: '100%', gridTemplateRows: 'auto repeat(6, 1fr)' }}>
          {days.map(day => (
            <div key={day} style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.9rem', textAlign: 'center', paddingBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{day}</div>
          ))}
          {blanks.map((_, i) => <div key={`blank-${i}`} />)}
          {dayNumbers.map(dayNum => {
            const m = viewDate.getMonth() + 1;
            const dStr = `${year}-${String(m).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const holiday = holidays[dStr];
            const customE = userEvents[dStr] || [];
            const isToday = dayNum === today.getDate() && viewDate.getMonth() === today.getMonth() && viewDate.getFullYear() === today.getFullYear();

            return (
              <motion.button
                key={dayNum}
                whileHover={{ y: -4, background: 'rgba(255,255,255,0.06)' }}
                onClick={() => { setSelectedDate(dStr); setShowModal(true); }}
                style={{ 
                  textAlign: 'left', padding: '0.8rem', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)',
                  background: isToday ? 'var(--accent-primary)' : holiday ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                  color: isToday ? 'black' : 'white', cursor: 'pointer', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '4px'
                }}
              >
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{dayNum}</div>
                
                {/* Holiday Name */}
                {holiday && (
                  <div style={{ fontSize: '0.65rem', color: isToday ? 'black' : getDayTypeColor(holiday.type), fontWeight: 700, lineHeight: 1.2 }}>
                    {holiday.name}
                  </div>
                )}

                {/* Custom Event Names */}
                {customE.length > 0 && (
                  <div style={{ marginTop: '4px', width: '100%', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {customE.slice(0, 2).map((evt, idx) => (
                      <div key={idx} style={{ 
                        fontSize: '0.6rem', 
                        background: isToday ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                        padding: '2px 6px', 
                        borderRadius: '6px', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        color: isToday ? 'black' : 'white',
                        fontWeight: 500
                      }}>
                        {evt}
                      </div>
                    ))}
                    {customE.length > 2 && (
                      <div style={{ fontSize: '0.55rem', opacity: 0.6, fontWeight: 700, paddingLeft: '4px' }}>
                        + {customE.length - 2} more
                      </div>
                    )}
                  </div>
                )}

                {holiday && <Star size={10} style={{ position: 'absolute', top: '10px', right: '10px', opacity: 0.5 }} />}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Persistence Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(15px)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="glass-panel"
              style={{ width: '100%', maxWidth: '450px', padding: '2rem', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', position: 'relative' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h3 style={{ margin: 0 }}>Add Event</h3>
                  <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.9rem', opacity: 0.6 }}>{selectedDate}</p>
                </div>
                <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
              </div>

              {/* Saved Toast Inside Modal */}
              <AnimatePresence>
                {showSavedToast && (
                  <motion.div 
                    initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                    style={{ position: 'absolute', top: '1rem', left: '50%', translateX: '-50%', background: 'var(--accent-primary)', color: 'black', padding: '0.5rem 1.5rem', borderRadius: '50px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 10px 20px rgba(0,0,0,0.3)', zIndex: 10001 }}
                  >
                    <CheckCircle size={16} /> Saved Successfully!
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(userEvents[selectedDate!] || []).map((ev, i) => (
                    <div key={i} style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem' }}>{ev}</span>
                      <button onClick={() => deleteEvent(selectedDate!, i)} style={{ background: 'transparent', border: 'none', color: '#ff4b4b', cursor: 'pointer' }}><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <input 
                    autoFocus type="text" value={eventInput} placeholder="What's happening?"
                    onChange={(e) => setEventInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addEvent()}
                    style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.8rem 1rem', color: 'white' }}
                  />
                  <button onClick={addEvent} style={{ padding: '0 1.5rem', background: 'var(--accent-primary)', color: 'black', border: 'none', borderRadius: '12px', fontWeight: 600 }}>Save</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
