import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Clock } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export const ReminderWidget = ({ user }: { user: any }) => {
  const [allEvents, setAllEvents] = useState<Record<string, { text: string, time: string }[]>>({});
  const [reminders, setReminders] = useState<{ text: string, time: string }[]>([]);

  useEffect(() => {
    if (!user?.uid) {
      setAllEvents({});
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAllEvents(data.calendarEvents || {});
      } else {
        setAllEvents({});
      }
    }, (err) => {
      console.error("ReminderWidget Firestore Error:", err);
      setAllEvents({});
    });

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    const getTodayStr = () => {
      const d = new Date();
      return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    };

    const cleanupAndFilter = async () => {
      if (!user?.uid) return;
      
      const today = getTodayStr();
      const todaysEvents = allEvents[today] || [];
      
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      // Filter events that have already passed (strictly less than current time)
      const currentAndFutureEvents = todaysEvents.filter((event: any) => event.time >= currentTime);
      const hasPassedEvents = todaysEvents.length !== currentAndFutureEvents.length;
      
      if (hasPassedEvents) {
        const updatedAllEvents = { ...allEvents };
        
        if (currentAndFutureEvents.length === 0) {
          delete updatedAllEvents[today];
        } else {
          updatedAllEvents[today] = currentAndFutureEvents;
        }

        try {
          // Update Firestore to remove expired events
          await setDoc(doc(db, 'users', user.uid), { calendarEvents: updatedAllEvents }, { merge: true });
        } catch (e) {
          console.error("Auto-cleanup Error:", e);
        }
      }

      // Update local UI state
      setReminders(currentAndFutureEvents.sort((a: any, b: any) => a.time.localeCompare(b.time)));
    };

    cleanupAndFilter();
    // Run every 10 seconds to feel "instant" relative to the minute change
    const interval = setInterval(cleanupAndFilter, 10000); 
    return () => clearInterval(interval);
  }, [allEvents, user?.uid]);

  if (reminders.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ 
        opacity: 1, 
        x: 0 
      }}
      className="glass-panel"
      style={{
        padding: '1.2rem',
        width: '300px',
        borderRadius: '24px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.8rem',
        position: 'fixed',
        bottom: '2.5rem',
        left: '2.5rem',
        zIndex: 2000
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.4rem' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          background: 'rgba(0, 242, 255, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-primary)'
        }}>
          <Bell size={18} />
        </div>
        <span style={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Today's Tasks</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {reminders.map((reminder, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.8rem',
              padding: '0.6rem 0.8rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-primary)', opacity: 0.8 }}>
              <Clock size={14} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{reminder.time}</span>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: 500, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {reminder.text}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
