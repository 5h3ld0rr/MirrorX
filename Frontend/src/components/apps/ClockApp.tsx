import { useState, useEffect } from 'react';
import { Clock as ClockIcon, Globe, AlarmClock, Timer } from 'lucide-react';

export const ClockApp = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="app-content" style={{ padding: '2rem', textAlign: 'center' }}>
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '3rem', justifyContent: 'center' }}>
        <button className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0, 242, 255, 0.1)', borderColor: 'var(--accent-primary)' }}>
          <ClockIcon size={20} /> Clock
        </button>
        <button className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Globe size={20} /> World
        </button>
        <button className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlarmClock size={20} /> Alarm
        </button>
        <button className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Timer size={20} /> Timer
        </button>
      </div>

      <div style={{ marginBottom: '4rem' }}>
        <div style={{ fontSize: '8rem', fontWeight: 300, lineHeight: 1 }}>
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
        <div style={{ fontSize: '1.5rem', color: 'var(--text-secondary)', marginTop: '1rem', textTransform: 'uppercase', letterSpacing: '0.5em' }}>
          {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Next Alarm</h3>
          <div style={{ fontSize: '2rem', fontWeight: 600 }}>07:00 AM</div>
          <div style={{ color: 'var(--accent-primary)', fontSize: '0.8rem' }}>Every Weekday</div>
        </div>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>London, UK</h3>
          <div style={{ fontSize: '2rem', fontWeight: 600 }}>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' })}
          </div>
          <div style={{ color: 'var(--accent-primary)', fontSize: '0.8rem' }}>-5:30 Hours</div>
        </div>
      </div>
    </div>
  );
};
