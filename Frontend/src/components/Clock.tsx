import { useState, useEffect, memo } from 'react';

export const Clock = memo(({ location }: { location?: string }) => {
  const [time, setTime] = useState(new Date());
  const isRightSide = location?.includes('right');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="clock-display" style={{ textAlign: isRightSide ? 'right' : 'left' }}>
      <div className="time">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      <div className="date">{time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</div>
    </div>
  );
});
