import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { Star, X, Trash2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { updateProfile, API_BASE_URL } from '../../lib/api';

const GOOGLE_CAL_ID = 'en.lk#holiday@group.v.calendar.google.com';
const GOOGLE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;

const WheelItem = ({ value, index, y, itemHeight, isInfinite, totalOptions, onSelect }: { value: string, index: number, y: any, itemHeight: number, isInfinite: boolean, totalOptions: number, onSelect: (val: string) => void }) => {
  const itemY = index * itemHeight;
  const wrapRange = totalOptions * itemHeight;

  const translateY = useTransform(y, (latest: number) => {
    if (!isInfinite) return 0;
    const rawPos = latest + itemY;
    const wraps = Math.floor((rawPos + wrapRange / 2) / wrapRange);
    return -wraps * wrapRange;
  });

  const distanceFromCenter = useTransform(y, (latest: number) => {
    const rawPos = latest + itemY;
    if (!isInfinite) return rawPos;
    const wraps = Math.floor((rawPos + wrapRange / 2) / wrapRange);
    return rawPos - wraps * wrapRange;
  });

  const rotateX = useTransform(distanceFromCenter, [-itemHeight * 3, 0, itemHeight * 3], [70, 0, -70]);
  const opacity = useTransform(distanceFromCenter, [-itemHeight * 2.5, -itemHeight, 0, itemHeight, itemHeight * 2.5], [0.1, 0.4, 1, 0.4, 0.1]);
  const scale = useTransform(distanceFromCenter, [-itemHeight * 2, 0, itemHeight * 2], [0.7, 1.35, 0.7]);
  const color = useTransform(distanceFromCenter, [-itemHeight * 0.5, 0, itemHeight * 0.5], ['rgba(255,255,255,0.4)', '#00f2ff', 'rgba(255,255,255,0.4)']);

  return (
    <motion.div
      style={{
        position: 'absolute',
        top: `${itemY + 82.5}px`,
        y: translateY,
        height: `${itemHeight}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2rem',
        fontWeight: 800,
        width: '100%',
        rotateX,
        opacity,
        scale,
        color,
        userSelect: 'none',
        perspective: '1200px',
        transformStyle: 'preserve-3d'
      }}
      onTap={() => onSelect(value)}
      whileTap={{ scale: 0.9, opacity: 0.6 }}
    >
      {value}
    </motion.div>
  );
};

const ScrollWheel = ({ options, value, onChange, width = '80px', isInfinite = false }: { options: string[], value: string, onChange: (val: string) => void, width?: string, isInfinite?: boolean }) => {
  const itemHeight = 65; 
  
  const initialIndex = options.indexOf(value);
  const y = useMotionValue(-initialIndex * itemHeight);

  // Sync prop changes
  useEffect(() => {
    const idxInOriginal = options.indexOf(value);
    const currentY = y.get();
    const currentAbsoluteIdx = Math.round(-currentY / itemHeight);
    const currentRelativeIdx = ((currentAbsoluteIdx % options.length) + options.length) % options.length;
    
    if (idxInOriginal !== currentRelativeIdx && idxInOriginal !== -1) {
      y.set(-idxInOriginal * itemHeight);
    }
  }, [value, options, y]);

  const handleDragEnd = (_: any, info: any) => {
    const currentY = y.get();
    const velocity = info.velocity.y;
    const projectedY = currentY + velocity * 0.15;
    
    let newIndex = Math.round(-projectedY / itemHeight);
    if (!isInfinite) {
      newIndex = Math.max(0, Math.min(newIndex, options.length - 1));
    }
    
    animate(y, -newIndex * itemHeight, { type: 'spring', stiffness: 450, damping: 45, mass: 0.8 });
    
    const wrappedIndex = ((newIndex % options.length) + options.length) % options.length;
    onChange(options[wrappedIndex]);
  };

  return (
    <div style={{ position: 'relative', height: '230px', width, overflow: 'hidden', display: 'flex', justifyContent: 'center', cursor: 'grab', touchAction: 'none' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '60px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)', zIndex: 3, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', zIndex: 3, pointerEvents: 'none' }} />

      <div style={{ 
        position: 'absolute', top: '82.5px', left: '4px', right: '4px', height: '65px', 
        background: 'rgba(255, 255, 255, 0.08)', borderRadius: '18px', 
        border: '1px solid rgba(255, 255, 255, 0.2)', pointerEvents: 'none', zIndex: 2,
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)'
      }} />

      <motion.div
        drag="y"
        dragConstraints={isInfinite ? undefined : { top: -(options.length - 1) * itemHeight, bottom: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        style={{ y, width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1, transformStyle: 'preserve-3d' }}
      >
        {isInfinite && <div style={{ position: 'absolute', height: '2000000px', width: '100%', top: '-1000000px' }} />}
        {!isInfinite && <div style={{ position: 'absolute', height: `${options.length * itemHeight + 165}px`, width: '100%', top: 0 }} />}
        
        {options.map((opt, i) => (
          <WheelItem 
            key={`${opt}-${i}`} 
            value={opt} 
            index={i} 
            y={y} 
            itemHeight={itemHeight} 
            isInfinite={isInfinite} 
            totalOptions={options.length} 
            onSelect={(val) => {
              const idx = options.indexOf(val);
              animate(y, -idx * itemHeight, { type: 'spring', stiffness: 450, damping: 45 });
              onChange(val);
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};

export const CalendarApp = ({ user }: { user: any }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [holidays, setHolidays] = useState<Record<string, { name: string, type: 'buddhist'|'christian'|'hindu'|'muslim'|'national' }>>({});
  const [userEvents, setUserEvents] = useState<Record<string, { text: string, time: string, id: string }[]>>({});
  const [showEventModal, setShowEventModal] = useState(false);
  const [showNavModal, setShowNavModal] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'year' | 'list'>('month');
  const [eventInput, setEventInput] = useState('');
  const [timeInput, setTimeInput] = useState('12:00');
  const [isLoading, setIsLoading] = useState(false);
  
  const today = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = viewDate.toLocaleString('default', { month: 'long' });
  const year = viewDate.getFullYear();

  const [navMonth, setNavMonth] = useState(monthName);
  const [navYear, setNavYear] = useState(year.toString());

  useEffect(() => {
    setNavMonth(monthName);
    setNavYear(year.toString());
  }, [monthName, year]);

  useEffect(() => {
    const fetchHolidaysFromGoogle = async () => {
      setIsLoading(true);
      try {
        const timeMin = `${year}-01-01T00:00:00Z`;
        const timeMax = `${year}-12-31T23:59:59Z`;
        const url = `${API_BASE_URL}/google/calendar/v3/calendars/${encodeURIComponent(GOOGLE_CAL_ID)}/events?key=${GOOGLE_API_KEY}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`;
        
        const response = await axios.get(url);
        const items = response.data.items || [];
        const mapped: Record<string, any> = {};

        items.forEach((item: any) => {
          if (!item.start) return;
          const date = item.start.date || (item.start.dateTime && item.start.dateTime.split('T')[0]);
          if (!date) return;
          
          let type: 'buddhist'|'christian'|'hindu'|'muslim'|'national' = 'national';
          const lowerName = (item.summary || '').toLowerCase();
          
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
  }, [year]);

  useEffect(() => {
    if (!user?.uid) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserEvents(data.calendarEvents || {});
      }
    }, (err) => {
      console.error("Calendar Firestore Error:", err);
    });

    return () => unsubscribe();
  }, [user?.uid]);

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
      if (showEventModal || showNavModal) return;
      if (e.key === 'ArrowLeft') handlePrevMonth();
      else if (e.key === 'ArrowRight') handleNextMonth();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showEventModal, showNavModal]);

  const handleNavConfirm = () => {
    const monthIdx = months.indexOf(navMonth);
    const y = parseInt(navYear);
    setViewDate(new Date(y, monthIdx, 1));
    setShowNavModal(false);
  };

  const [isSaving, setIsSaving] = useState(false);

  const addEvent = async () => {
    if (!eventInput.trim() || !selectedDate || !user?.uid) return;
    setIsSaving(true);
    
    try {
      const newEvent = {
        text: eventInput.trim(),
        time: timeInput,
        id: Math.random().toString(36).substr(2, 9)
      };

      const updatedEvents = { ...userEvents };
      if (!updatedEvents[selectedDate]) updatedEvents[selectedDate] = [];
      updatedEvents[selectedDate] = [...updatedEvents[selectedDate], newEvent];

      await updateProfile({ calendarEvents: updatedEvents });
      
      setEventInput('');
      setTimeout(() => setIsSaving(false), 1000);
    } catch (error) {
      console.error("Firestore Save Error:", error);
      setIsSaving(false);
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!user?.uid || !selectedDate) return;
    
    try {
      const updatedEvents = { ...userEvents };
      if (updatedEvents[selectedDate]) {
        updatedEvents[selectedDate] = updatedEvents[selectedDate].filter(e => e.id !== eventId);
        if (updatedEvents[selectedDate].length === 0) delete updatedEvents[selectedDate];
      }

      await updateProfile({ calendarEvents: updatedEvents });
    } catch (error) {
      console.error("Firestore Delete Error:", error);
    }
  };

  const [pickerH, setPickerH] = useState('12');
  const [pickerM, setPickerM] = useState('00');
  const [pickerP, setPickerP] = useState('AM');

  // Unified time logic
  useEffect(() => {
    let h = parseInt(pickerH);
    if (pickerP === 'PM' && h < 12) h += 12;
    if (pickerP === 'AM' && h === 12) h = 0;
    const formatted = `${h.toString().padStart(2, '0')}:${pickerM}`;
    setTimeInput(formatted);
  }, [pickerH, pickerM, pickerP]);

  return (
    <div className="app-content" style={{ padding: '2.5rem', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* Mesh Background for Depth */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 0% 0%, rgba(0, 242, 255, 0.05) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(128, 0, 255, 0.05) 0%, transparent 50%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
        <div style={{ cursor: 'pointer' }} onClick={() => setShowNavModal(true)}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.02 }}
          >
            <h2 style={{ 
              fontSize: '4.5rem', 
              fontWeight: 900, 
              margin: 0, 
              letterSpacing: '-0.05em',
              lineHeight: 1,
              background: 'linear-gradient(to bottom, #ffffff 30%, rgba(255,255,255,0.3) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.1))'
            }}>
              {monthName}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 300, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em' }}>{year} <span style={{ opacity: 0.3, fontSize: '0.8rem' }}>(Select)</span></span>
              {isLoading && (
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%' }}
                />
              )}
            </div>
          </motion.div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            {['Month', 'Year', 'List'].map(mode => (
              <motion.button
                key={mode}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode(mode.toLowerCase() as any)}
                style={{
                  padding: '0.5rem 1rem',
                  background: viewMode === mode.toLowerCase() ? 'var(--accent-primary)' : 'transparent',
                  color: viewMode === mode.toLowerCase() ? 'black' : 'rgba(255,255,255,0.5)',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                {mode}
              </motion.button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <motion.button
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#ffffff' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewDate(new Date())}
              style={{
                padding: '0.6rem 1.4rem',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease'
              }}
            >
              Today
            </motion.button>
            
            <div style={{ 
              display: 'flex', 
              gap: '1px', 
              alignItems: 'center', 
              background: 'rgba(255, 255, 255, 0.05)', 
              padding: '4px', 
              borderRadius: '24px', 
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}>
              <motion.button 
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--accent-primary)' }} 
                whileTap={{ scale: 0.9 }} 
                onClick={handlePrevMonth} 
                style={{ width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'transparent', border: 'none', color: '#ffffff' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </motion.button>
              <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }} />
              <motion.button 
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--accent-primary)' }} 
                whileTap={{ scale: 0.9 }} 
                onClick={handleNextMonth} 
                style={{ width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'transparent', border: 'none', color: '#ffffff' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }} className="hide-scrollbar">
        {viewMode === 'month' && (
          <>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              gap: '0.8rem', 
              height: 'fit-content', 
              perspective: '1000px',
              padding: '2px'
            }}>
              {days.map(day => (
                <div key={day} style={{ 
                  color: 'var(--text-muted)', 
                  fontWeight: 800, 
                  fontSize: '0.85rem', 
                  textAlign: 'center', 
                  paddingBottom: '0.8rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.2em',
                  opacity: 0.6
                }}>
                  {day}
                </div>
              ))}
              
              {Array.from({ length: getFirstDayOfMonth(year, viewDate.getMonth()) }).map((_, i) => (
                <div key={`blank-${i}`} style={{ background: 'rgba(255,255,255,0.01)', borderRadius: '16px', margin: '1px', opacity: 0.2 }} />
              ))}

              {Array.from({ length: getDaysInMonth(year, viewDate.getMonth()) }, (_, i) => i + 1).map(dayNum => {
                const m = viewDate.getMonth() + 1;
                const dStr = `${year}-${String(m).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const holiday = holidays[dStr];
                const customE = userEvents[dStr] || [];
                const isToday = dayNum === today.getDate() && viewDate.getMonth() === today.getMonth() && viewDate.getFullYear() === today.getFullYear();

                return (
                  <motion.button
                    key={dayNum}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (dayNum % 7) * 0.01 }}
                    whileHover={{ 
                      y: -8, 
                      scale: 1.02,
                      background: isToday ? 'linear-gradient(135deg, var(--accent-primary) 20%, #0088ff 100%)' : 'rgba(255,255,255,0.08)',
                      boxShadow: isToday ? '0 30px 60px rgba(0, 242, 255, 0.3)' : '0 20px 40px rgba(0,0,0,0.5)',
                      zIndex: 10,
                      border: isToday ? '3px solid white' : '1px solid rgba(255,255,255,0.3)'
                    }}
                    onClick={() => { setSelectedDate(dStr); setShowEventModal(true); }}
                    style={{ 
                      textAlign: 'left', 
                      padding: '1rem', 
                      borderRadius: '24px', 
                      border: isToday ? '2px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.05)',
                      background: isToday 
                        ? 'linear-gradient(135deg, var(--accent-primary) 0%, #00d2ff 100%)' 
                        : holiday 
                          ? 'rgba(255, 255, 255, 0.04)' 
                          : 'rgba(255, 255, 255, 0.02)',
                      backdropFilter: 'blur(8px)',
                      color: isToday ? '#ffffff' : 'rgba(255,255,255,0.9)', 
                      cursor: 'pointer', 
                      position: 'relative', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '4px',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      minHeight: '100px'
                    }}
                  >
                    <div style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 0.9 }}>{dayNum}</div>
                    {holiday && <div style={{ fontSize: '0.6rem', color: isToday ? '#ffffff' : getDayTypeColor(holiday.type), fontWeight: 700, borderRadius: '4px', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{holiday.name}</div>}
                    {customE.length > 0 && <div style={{ marginTop: 'auto', display: 'flex', gap: '2px' }}>{customE.map((_, idx) => <div key={idx} style={{ width: '4px', height: '4px', borderRadius: '50%', background: isToday ? 'black' : 'var(--accent-primary)' }} />)}</div>}
                  </motion.button>
                );
              })}
            </div>

            {/* Monthly Summary Section */}
            <div style={{ marginTop: '4rem', padding: '0 1rem 5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
                  {months[viewDate.getMonth()]}'s Schedule
                </h3>
                <div style={{ padding: '0.6rem 1.2rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                  {Object.keys(userEvents).filter(d => d.startsWith(`${year}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`)).length} EVENTS
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.2rem' }}>
                {Object.keys(userEvents)
                  .filter(d => d.startsWith(`${year}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`))
                  .sort()
                  .map(dKey => (
                    userEvents[dKey].map(ev => (
                      <motion.div
                        key={ev.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass-panel"
                        style={{ 
                          padding: '1.5rem', 
                          borderRadius: '24px', 
                          background: 'rgba(255,255,255,0.03)',
                          borderLeft: '4px solid var(--accent-primary)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.8rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            {new Date(dKey).toLocaleDateString('default', { day: 'numeric', month: 'long' })}
                          </span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{ev.time}</span>
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{ev.text}</div>
                      </motion.div>
                    ))
                  ))}
                
                {Object.keys(userEvents).filter(d => d.startsWith(`${year}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`)).length === 0 && (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <div style={{ opacity: 0.3, fontWeight: 600 }}>No events scheduled for this month.</div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {viewMode === 'year' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
            {months.map((mName, mIdx) => {
              const isActiveMonth = viewDate.getMonth() === mIdx;
              return (
                <motion.button
                  key={mName}
                  whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.08)' }}
                  onClick={() => { setViewDate(new Date(year, mIdx, 1)); setViewMode('month'); }}
                  style={{
                    padding: '1.5rem',
                    background: isActiveMonth ? 'rgba(0, 242, 255, 0.1)' : 'rgba(255,255,255,0.02)',
                    border: isActiveMonth ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '24px',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{mName}</span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', opacity: 0.3 }}>
                    {Array.from({ length: 31 }).map((_, i) => <div key={i} style={{ width: '4px', height: '4px', background: 'white', borderRadius: '1px' }} />)}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        {viewMode === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             {Object.keys(userEvents).sort().map(dKey => {
                const evs = userEvents[dKey];
                return evs.map(ev => (
                  <div key={ev.id} className="glass-panel" style={{ padding: '1.2rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                        <div style={{ textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '1.5rem' }}>
                           <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{new Date(dKey).getDate()}</div>
                           <div style={{ fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase' }}>{new Date(dKey).toLocaleString('default', { month: 'short' })}</div>
                        </div>
                        <div>
                           <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{ev.text}</div>
                           <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 700 }}>{ev.time}</div>
                        </div>
                     </div>
                     <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteEvent(ev.id)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,75,75,0.3)', cursor: 'pointer' }}><Trash2 size={20} /></motion.button>
                  </div>
                ));
             })}
             {Object.keys(userEvents).length === 0 && <div style={{ textAlign: 'center', padding: '5rem', opacity: 0.5 }}>No events scheduled</div>}
          </div>
        )}
      </div>

      {/* Navigation Picker Modal */}
      <AnimatePresence>
        {showNavModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(30px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
              className="glass-panel"
              style={{ padding: '3rem', width: '450px', display: 'flex', flexDirection: 'column', gap: '2rem', borderRadius: '40px' }}
            >
              <h3 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, textAlign: 'center' }}>Select Date</h3>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>
                <ScrollWheel 
                  options={months}
                  value={navMonth}
                  onChange={setNavMonth}
                  width="180px"
                  isInfinite={true}
                />
                <ScrollWheel 
                  options={Array.from({ length: 20 }, (_, i) => (today.getFullYear() - 10 + i).toString())}
                  value={navYear}
                  onChange={setNavYear}
                  width="100px"
                  isInfinite={false}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                 <motion.button onClick={() => setShowNavModal(false)} style={{ flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '20px', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Cancel</motion.button>
                 <motion.button onClick={handleNavConfirm} style={{ flex: 1, padding: '1rem', background: 'var(--accent-primary)', border: 'none', borderRadius: '20px', color: 'black', fontWeight: 800, cursor: 'pointer' }}>Go To Date</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEventModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
              className="glass-panel"
              style={{ width: '100%', maxWidth: '680px', padding: '2.5rem', borderRadius: '40px', position: 'relative' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '2.4rem', fontWeight: 900 }}>Schedule</h3>
                  <p style={{ margin: '0.4rem 0 0 0', opacity: 0.5, fontWeight: 700 }}>{selectedDate}</p>
                </div>
                <motion.button 
                  onClick={() => setShowEventModal(false)} 
                  style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', padding: '12px', borderRadius: '50%' }}
                >
                  <X size={24} />
                </motion.button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }} className="hide-scrollbar">
                  {(userEvents[selectedDate!] || []).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.3, border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '24px' }}>No events</div>
                  ) : (
                    (userEvents[selectedDate!] || []).map((ev, i) => (
                      <div key={i} style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <span style={{ color: 'var(--accent-primary)', fontWeight: 800 }}>{ev.time}</span>
                          <span>{ev.text}</span>
                        </div>
                        <motion.button onClick={() => deleteEvent(ev.id)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,100,100,0.5)', cursor: 'pointer' }}><Trash2 size={18} /></motion.button>
                      </div>
                    ))
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="glass-panel" style={{ display: 'flex', padding: '0.5rem', borderRadius: '24px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', height: '180px' }}>
                      <ScrollWheel options={Array.from({ length: 12 }, (_, i) => (i + 1).toString())} value={pickerH} onChange={setPickerH} width="60px" isInfinite />
                      <ScrollWheel options={Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))} value={pickerM} onChange={setPickerM} width="60px" isInfinite />
                      <ScrollWheel options={['AM', 'PM']} value={pickerP} onChange={setPickerP} width="70px" />
                    </div>
                    <textarea value={eventInput} placeholder="Add a reminder..." onChange={(e) => setEventInput(e.target.value)} style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '1.5rem', color: 'white', resize: 'none', height: '180px', fontSize: '1.2rem', outline: 'none' }} />
                </div>
                <motion.button onClick={addEvent} style={{ width: '100%', padding: '1.2rem', background: 'var(--accent-primary)', color: 'black', border: 'none', borderRadius: '24px', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer' }}>{isSaving ? 'Saving...' : 'Confirm Event'}</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


const getDayTypeColor = (type?: string) => {
  switch(type) {
    case 'buddhist': return '#fcc419';
    case 'christian': return '#ae3ec9';
    case 'hindu': return '#fd7e14';
    case 'muslim': return '#40c057';
    default: return 'var(--accent-primary)';
  }
};
