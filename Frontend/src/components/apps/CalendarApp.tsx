import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, X, Trash2 } from 'lucide-react';
import axios from 'axios';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, collection, addDoc, deleteDoc } from 'firebase/firestore';

const GOOGLE_CAL_ID = 'en.lk#holiday@group.v.calendar.google.com';
const GOOGLE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;

const WheelItem = ({ value, index, y, itemHeight, isInfinite, totalOptions }: { value: string, index: number, y: any, itemHeight: number, isInfinite: boolean, totalOptions: number }) => {
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
          <WheelItem key={`${opt}-${i}`} value={opt} index={i} y={y} itemHeight={itemHeight} isInfinite={isInfinite} totalOptions={options.length} />
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
  const [showModal, setShowModal] = useState(false);
  const [eventInput, setEventInput] = useState('');
  const [timeInput, setTimeInput] = useState('12:00');
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
        const url = `/api/google/calendar/v3/calendars/${encodeURIComponent(GOOGLE_CAL_ID)}/events?key=${GOOGLE_API_KEY}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`;
        
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
  }, [year]);

  useEffect(() => {
    if (!user?.uid) return;

    const eventsRef = collection(db, 'users', user.uid, 'events');
    const unsubscribe = onSnapshot(eventsRef, (snapshot) => {
      const mapped: Record<string, { text: string, time: string, id: string }[]> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const date = data.date;
        if (!mapped[date]) mapped[date] = [];
        mapped[date].push({ 
          text: data.text, 
          time: data.time, 
          id: doc.id 
        });
      });
      setUserEvents(mapped);
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
      if (showModal) return;
      if (e.key === 'ArrowLeft') handlePrevMonth();
      else if (e.key === 'ArrowRight') handleNextMonth();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  const addEvent = async () => {
    if (!eventInput.trim() || !selectedDate || !user?.uid) return;
    
    try {
      const eventsRef = collection(db, 'users', user.uid, 'events');
      await addDoc(eventsRef, {
        date: selectedDate,
        text: eventInput.trim(),
        time: timeInput,
        createdAt: new Date().toISOString()
      });
      setEventInput('');
    } catch (error) {
      console.error("Firestore Save Error:", error);
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!user?.uid || !eventId) return;
    
    try {
      const eventDocRef = doc(db, 'users', user.uid, 'events', eventId);
      await deleteDoc(eventDocRef);
    } catch (error) {
      console.error("Firestore Delete Error:", error);
    }
  };

  const [pickerH, setPickerH] = useState('12');
  const [pickerM, setPickerM] = useState('00');
  const [pickerP, setPickerP] = useState('AM');

  useEffect(() => {
    const [h, m] = timeInput.split(':').map(Number);
    const p = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    setPickerH(h12.toString());
    setPickerM(m.toString().padStart(2, '0'));
    setPickerP(p);
  }, [timeInput]);

  const updateFromPicker = (newH: string, newM: string, newP: string) => {
    let h = parseInt(newH);
    if (newP === 'PM' && h < 12) h += 12;
    if (newP === 'AM' && h === 12) h = 0;
    const formatted = `${h.toString().padStart(2, '0')}:${newM}`;
    setTimeInput(formatted);
  };

  return (
    <div className="app-content" style={{ padding: '2.5rem', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* Mesh Background for Depth */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 0% 0%, rgba(0, 242, 255, 0.03) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(128, 0, 255, 0.03) 0%, transparent 50%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem', position: 'relative', zIndex: 1 }}>
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
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
              <span style={{ fontSize: '1.2rem', fontWeight: 300, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em' }}>{year}</span>
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
              <ChevronLeft size={20} />
            </motion.button>
            <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }} />
            <motion.button 
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--accent-primary)' }} 
              whileTap={{ scale: 0.9 }} 
              onClick={handleNextMonth} 
              style={{ width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'transparent', border: 'none', color: '#ffffff' }}
            >
              <ChevronRight size={20} />
            </motion.button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)', 
          gap: '1rem', 
          height: '100%', 
          gridTemplateRows: 'auto repeat(6, 1fr)',
          perspective: '1000px',
          padding: '2px'
        }}>
          {days.map(day => (
            <div key={day} style={{ 
              color: 'var(--text-muted)', 
              fontWeight: 800, 
              fontSize: '0.85rem', 
              textAlign: 'center', 
              paddingBottom: '1rem', 
              textTransform: 'uppercase', 
              letterSpacing: '0.2em',
              opacity: 0.6
            }}>
              {day}
            </div>
          ))}
          
          {Array.from({ length: getFirstDayOfMonth(year, viewDate.getMonth()) }).map((_, i) => (
            <div key={`blank-${i}`} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', margin: '2px', opacity: 0.3 }} />
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
                transition={{ delay: (dayNum % 7) * 0.02 }}
                whileHover={{ 
                  y: -8, 
                  scale: 1.03,
                  background: isToday ? 'linear-gradient(135deg, var(--accent-primary) 20%, #0088ff 100%)' : 'rgba(255,255,255,0.08)',
                  boxShadow: isToday ? '0 30px 60px rgba(0, 242, 255, 0.3)' : '0 20px 40px rgba(0,0,0,0.5)',
                  zIndex: 10,
                  border: isToday ? '3px solid white' : '1px solid rgba(255,255,255,0.3)'
                }}
                onClick={() => { setSelectedDate(dStr); setShowModal(true); }}
                style={{ 
                  textAlign: 'left', 
                  padding: '1.2rem', 
                  borderRadius: '24px', 
                  border: isToday ? '2px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.05)',
                  background: isToday 
                    ? 'linear-gradient(135deg, var(--accent-primary) 0%, #00d2ff 100%)' 
                    : holiday 
                      ? 'rgba(255, 255, 255, 0.04)' 
                      : 'rgba(255, 255, 255, 0.02)',
                  backdropFilter: 'blur(8px)',
                  boxShadow: isToday ? '0 0 40px rgba(0, 242, 255, 0.25)' : 'none',
                  color: isToday ? '#ffffff' : 'rgba(255,255,255,0.9)', 
                  cursor: 'pointer', 
                  position: 'relative', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  minHeight: '130px',
                  overflow: 'hidden'
                }}
              >
                {/* Background Glow for Today */}
                {isToday && (
                  <motion.div
                    animate={{ opacity: [0.4, 0.7, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                      position: 'absolute', inset: 0, 
                      background: 'radial-gradient(circle at center, white, transparent 70%)',
                      mixBlendMode: 'overlay', pointerEvents: 'none'
                    }}
                  />
                )}

                <div style={{ 
                  fontSize: '2.2rem', 
                  fontWeight: 900, 
                  fontFamily: 'Inter, system-ui, sans-serif',
                  letterSpacing: '-0.06em',
                  opacity: isToday ? 1 : 0.8,
                  lineHeight: 0.9,
                  textShadow: isToday ? '0 2px 10px rgba(0,0,0,0.2)' : 'none'
                }}>
                  {dayNum}
                </div>

                {holiday && (
                  <div style={{ 
                    fontSize: '0.65rem', 
                    color: isToday ? '#ffffff' : getDayTypeColor(holiday.type), 
                    fontWeight: 700, 
                    lineHeight: 1.2,
                    background: isToday ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                    padding: '4px 8px',
                    borderRadius: '20px',
                    width: 'fit-content',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isToday ? '#ffffff' : getDayTypeColor(holiday.type) }} />
                    {holiday.name}
                  </div>
                )}

                {customE.length > 0 && (
                  <div style={{ marginTop: 'auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {customE.slice(0, 1).map((evt, idx) => (
                      <div key={idx} style={{ 
                        fontSize: '0.7rem', 
                        background: isToday ? 'rgba(0,0,0,0.1)' : 'rgba(0, 242, 255, 0.1)', 
                        padding: '4px 8px', 
                        borderRadius: '10px', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap', 
                        color: isToday ? 'black' : 'var(--accent-primary)', 
                        fontWeight: 700,
                        border: isToday ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(0, 242, 255, 0.2)'
                      }}>
                        {evt.text}
                      </div>
                    ))}
                    {customE.length > 1 && (
                      <div style={{ fontSize: '0.65rem', opacity: 0.5, fontWeight: 700, paddingLeft: '4px' }}>
                        + {customE.length - 1} more
                      </div>
                    )}
                  </div>
                )}

                {holiday && (
                  <Star 
                    size={14} 
                    fill={isToday ? 'black' : getDayTypeColor(holiday.type)}
                    style={{ 
                      position: 'absolute', top: '1rem', right: '1rem', 
                      opacity: isToday ? 0.3 : 0.6,
                      color: isToday ? 'black' : getDayTypeColor(holiday.type)
                    }} 
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
              className="glass-panel"
              style={{ 
                width: '100%', 
                maxWidth: '680px', 
                padding: '2.5rem', 
                border: '1px solid rgba(255,255,255,0.12)', 
                boxShadow: '0 40px 100px rgba(0,0,0,0.8)', 
                position: 'relative', 
                borderRadius: '40px',
                background: 'rgba(10, 10, 10, 0.85)',
                backdropFilter: 'blur(30px) saturate(180%)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '2.4rem', fontWeight: 700, letterSpacing: '-0.03em', background: 'linear-gradient(to bottom, #fff, #aaa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Schedule</h3>
                  <p style={{ margin: '0.4rem 0 0 0', fontSize: '1.1rem', opacity: 0.5, fontWeight: 500, fontFamily: 'var(--font-mono)' }}>{new Date(selectedDate!).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <motion.button 
                  whileHover={{ rotate: 90, scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }} 
                  onClick={() => setShowModal(false)} 
                  style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={24} />
                </motion.button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }} className="hide-scrollbar">
                  {(userEvents[selectedDate!] || []).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.3, border: '2px dashed rgba(255,255,255,0.08)', borderRadius: '32px', fontSize: '1.1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                      <Star size={32} opacity={0.5} />
                      <span>No events for this day</span>
                    </div>
                  ) : (
                    (userEvents[selectedDate!] || []).map((ev, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} style={{ padding: '1.2rem 1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                          <span style={{ fontSize: '1.3rem', color: 'var(--accent-primary)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{ev.time}</span>
                          <span style={{ fontSize: '1.2rem', fontWeight: 500, opacity: 0.9 }}>{ev.text}</span>
                        </div>
                        <motion.button whileHover={{ scale: 1.1, color: '#ff4d4d', backgroundColor: 'rgba(255,77,77,0.1)' }} onClick={() => deleteEvent(ev.id)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,75,75,0.3)', cursor: 'pointer', padding: '8px', borderRadius: '12px' }}><Trash2 size={20} /></motion.button>
                      </motion.div>
                    ))
                  )}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'stretch' }}>
                    <div className="glass-panel" style={{ 
                      display: 'flex', alignItems: 'center', padding: '0 1rem', borderRadius: '32px', 
                      background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                      height: '240px', overflow: 'hidden'
                    }}>
                      <ScrollWheel 
                        options={Array.from({ length: 12 }, (_, i) => (i + 1).toString())}
                        value={pickerH} isInfinite={true}
                        onChange={(val) => updateFromPicker(val, pickerM, pickerP)}
                        width="70px"
                      />
                      <span style={{ color: 'var(--accent-primary)', fontWeight: 900, fontSize: '2rem', opacity: 0.2 }}>:</span>
                      <ScrollWheel 
                        options={Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))}
                        value={pickerM} isInfinite={true}
                        onChange={(val) => updateFromPicker(pickerH, val, pickerP)}
                        width="70px"
                      />
                      <ScrollWheel 
                        options={['AM', 'PM']}
                        value={pickerP}
                        onChange={(val) => updateFromPicker(pickerH, pickerM, val)}
                        width="80px"
                      />
                    </div>

                    <textarea 
                      autoFocus value={eventInput} placeholder="Add a note or reminder..."
                      onChange={(e) => setEventInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), addEvent())}
                      style={{ 
                        flex: 1, 
                        background: 'rgba(255,255,255,0.03)', 
                        border: '1px solid rgba(255,255,255,0.08)', 
                        borderRadius: '32px', 
                        padding: '1.8rem', 
                        color: 'white', 
                        resize: 'none', 
                        height: '240px', 
                        fontSize: '1.3rem', 
                        outline: 'none', 
                        fontWeight: 500,
                        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)'
                      }}
                    />
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(0, 242, 255, 0.4)' }} 
                    whileTap={{ scale: 0.98 }} 
                    onClick={addEvent} 
                    style={{ 
                      width: '100%', 
                      padding: '1.4rem', 
                      background: 'linear-gradient(135deg, var(--accent-primary) 0%, #00d2ff 100%)', 
                      color: 'black', 
                      border: 'none', 
                      borderRadius: '28px', 
                      fontWeight: 800, 
                      fontSize: '1.3rem', 
                      cursor: 'pointer',
                      boxShadow: '0 10px 25px rgba(0, 242, 255, 0.2)',
                      letterSpacing: '0.02em'
                    }}
                  >
                    Confirm Event
                  </motion.button>
                </div>
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
