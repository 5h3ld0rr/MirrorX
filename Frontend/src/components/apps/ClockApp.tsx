import { useState, useEffect, useRef } from 'react';
import { 
  Clock as ClockIcon, 
  Globe, 
  AlarmClock, 
  Timer, 
  Plus, 
  Trash2, 
  Search, 
  Play, 
  Pause, 
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAlarms, createAlarm, updateAlarm, deleteAlarm as apiDeleteAlarm } from '../../lib/api';

interface WorldClock {
  id: string;
  city: string;
  country: string;
  timezone: string;
}

interface Alarm {
  id: string;
  time: string;
  label: string;
  active: boolean;
  days: string[];
}

export const ClockApp = () => {
  const [time, setTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'clock' | 'world' | 'alarm' | 'timer'>('clock');
  const [isLoadingAlarms, setIsLoadingAlarms] = useState(false);
  
  // World Clock State
  const [worldClocks, setWorldClocks] = useState<WorldClock[]>([
    { id: '1', city: 'London', country: 'UK', timezone: 'Europe/London' },
    { id: '2', city: 'New York', country: 'USA', timezone: 'America/New_York' },
    { id: '3', city: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo' },
    { id: '4', city: 'Dubai', country: 'UAE', timezone: 'Asia/Dubai' },
  ]);
  const [isAddCityOpen, setIsAddCityOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Alarm State
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [isAddAlarmOpen, setIsAddAlarmOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const [newAlarmTime, setNewAlarmTime] = useState('07:00');
  const [newAlarmLabel, setNewAlarmLabel] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const dayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Timer State
  const [timerInput, setTimerInput] = useState({ h: 0, m: 10, s: 0 });
  const [timerRemaining, setTimerRemaining] = useState(600); // 10 mins in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [totalTimerTime, setTotalTimerTime] = useState(600);
  const timerIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAlarms = async () => {
    try {
      setIsLoadingAlarms(true);
      const data = await getAlarms();
      setAlarms(data);
    } catch (err) {
      console.error("Failed to load alarms:", err);
    } finally {
      setIsLoadingAlarms(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    fetchAlarms();
    return () => clearInterval(timer);
  }, []);

  const startTimer = () => {
    const total = timerInput.h * 3600 + timerInput.m * 60 + timerInput.s;
    if (total > 0) {
      setTimerRemaining(total);
      setTotalTimerTime(total);
      setIsTimerRunning(true);
    }
  };

  useEffect(() => {
    if (isTimerRunning && timerRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerRemaining(prev => prev - 1);
      }, 1000);
    } else if (timerRemaining === 0) {
      setIsTimerRunning(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, timerRemaining]);

  const formatTime = (date: Date, timezone?: string) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: activeTab === 'clock' ? '2-digit' : undefined,
      hour12: true,
      timeZone: timezone
    });
  };

  const getOffset = (timezone: string) => {
    const now = new Date();
    const local = now.getTime();
    const target = new Date(now.toLocaleString('en-US', { timeZone: timezone })).getTime();
    const diff = (target - local) / (1000 * 60 * 60);
    const sign = diff >= 0 ? '+' : '';
    return `${sign}${diff.toFixed(1).replace('.0', '')}h`;
  };

  // World Clock Helpers
  const cityOptions = [
    { city: 'Colombo', country: 'Sri Lanka', timezone: 'Asia/Colombo' },
    { city: 'Singapore', country: 'Singapore', timezone: 'Asia/Singapore' },
    { city: 'Paris', country: 'France', timezone: 'Europe/Paris' },
    { city: 'Sydney', country: 'Australia', timezone: 'Australia/Sydney' },
    { city: 'Moscow', country: 'Russia', timezone: 'Europe/Moscow' },
    { city: 'California', country: 'USA', timezone: 'America/Los_Angeles' },
    { city: 'Berlin', country: 'Germany', timezone: 'Europe/Berlin' },
    { city: 'Hong Kong', country: 'China', timezone: 'Asia/Hong_Kong' },
  ];

  const filteredCities = cityOptions.filter(city => 
    city.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    city.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addCity = (city: any) => {
    const newCity: WorldClock = {
      id: Date.now().toString(),
      city: city.city,
      country: city.country,
      timezone: city.timezone
    };
    setWorldClocks([...worldClocks, newCity]);
    setIsAddCityOpen(false);
    setSearchQuery('');
  };

  const removeCity = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWorldClocks(worldClocks.filter(c => c.id !== id));
  };

  // Alarm Helpers
  const closeAlarmModal = () => {
    setIsAddAlarmOpen(false);
    setEditingAlarm(null);
    setNewAlarmTime('07:00');
    setNewAlarmLabel('');
    setSelectedDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  };

  const openEditAlarm = (alarm: Alarm) => {
    setEditingAlarm(alarm);
    const [t, ampm] = alarm.time.split(' ');
    let [h, m] = t.split(':');
    let hour = parseInt(h);
    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    setNewAlarmTime(`${hour.toString().padStart(2, '0')}:${m}`);
    setNewAlarmLabel(alarm.label);
    setSelectedDays(alarm.days);
    setIsAddAlarmOpen(true);
  };

  const saveAlarm = async () => {
    const [h, m] = newAlarmTime.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const timeStr = `${displayHour.toString().padStart(2, '0')}:${m} ${ampm}`;

    try {
      if (editingAlarm) {
        await updateAlarm(editingAlarm.id, { 
          time: timeStr, 
          label: newAlarmLabel || 'Alarm', 
          days: selectedDays 
        });
      } else {
        await createAlarm({
          time: timeStr,
          label: newAlarmLabel || 'Alarm',
          active: true,
          days: selectedDays
        });
      }
      fetchAlarms();
      closeAlarmModal();
    } catch (err) {
      console.error('Failed to save alarm:', err);
    }
  };

  const deleteAlarm = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiDeleteAlarm(id);
      setAlarms(alarms.filter(a => a.id !== id));
    } catch (err) {
      console.error('Failed to delete alarm:', err);
    }
  };

  const toggleAlarm = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const alarm = alarms.find(a => a.id === id);
    if (!alarm) return;
    
    try {
      await updateAlarm(id, { active: !alarm.active });
      setAlarms(alarms.map(a => a.id === id ? { ...a, active: !a.active } : a));
    } catch (err) {
      console.error('Failed to toggle alarm:', err);
    }
  };

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  // Timer Helpers
  const handleTimerInputChange = (unit: 'h' | 'm' | 's', increment: boolean) => {
    const max = unit === 'h' ? 99 : 59;
    let newValue = timerInput[unit] + (increment ? 1 : -1);
    newValue = Math.max(0, Math.min(newValue, max));
    
    const newInputs = { ...timerInput, [unit]: newValue };
    setTimerInput(newInputs);
    
    if (!isTimerRunning && timerRemaining === totalTimerTime) {
      const newTotal = newInputs.h * 3600 + newInputs.m * 60 + newInputs.s;
      setTimerRemaining(newTotal);
      setTotalTimerTime(newTotal);
    }
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    const total = timerInput.h * 3600 + timerInput.m * 60 + timerInput.s;
    setTimerRemaining(total);
    setTotalTimerTime(total);
  };

  const formatTimerDisplay = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h.toString().padStart(2, '0') + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const timerProgress = totalTimerTime > 0 ? (timerRemaining / totalTimerTime) * 100 : 0;

  const tabs = [
    { id: 'clock', icon: ClockIcon, label: 'Clock' },
    { id: 'world', icon: Globe, label: 'World' },
    { id: 'alarm', icon: AlarmClock, label: 'Alarm' },
    { id: 'timer', icon: Timer, label: 'Timer' },
  ] as const;

  return (
    <div className="app-content" style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '3rem', justifyContent: 'center' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`glass-panel ${activeTab === tab.id ? 'accent-border' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '1rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: activeTab === tab.id ? 'rgba(0, 242, 255, 0.1)' : 'var(--bg-glass)',
              borderColor: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--border-light)',
              minWidth: '120px',
              justifyContent: 'center'
            }}
          >
            <tab.icon size={20} color={activeTab === tab.id ? 'var(--accent-primary)' : 'currentColor'} />
            <span style={{ color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* App Content */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'clock' && (
            <motion.div
              key="clock-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ textAlign: 'center', marginTop: '2rem' }}
            >
              <div style={{ fontSize: '10rem', fontWeight: 200, lineHeight: 1, fontFamily: 'var(--font-mono)', letterSpacing: '-0.05em' }}>
                {formatTime(time)}
              </div>
              <div style={{ fontSize: '2rem', color: 'var(--text-secondary)', marginTop: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.4em', fontWeight: 300 }}>
                {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem', marginTop: '5rem', maxWidth: '900px', margin: '5rem auto 0' }}>
                <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left', borderLeft: '4px solid var(--accent-primary)' }}>
                  <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Next Alarm</h3>
                  <div style={{ fontSize: '2.5rem', fontWeight: 500 }}>07:00 AM</div>
                  <div style={{ color: 'var(--accent-primary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Every Weekday</div>
                </div>
                <div className="glass-panel" style={{ padding: '2rem', textAlign: 'left', borderLeft: '4px solid var(--text-muted)' }}>
                  <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Sunrise</h3>
                  <div style={{ fontSize: '2.5rem', fontWeight: 500 }}>05:54 AM</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Clear Skies</div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'world' && (
            <motion.div
              key="world-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              style={{ padding: '0 2rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 300 }}>World Clock</h2>
                <button 
                  className="glass-panel" 
                  onClick={() => setIsAddCityOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem' }}
                >
                  <Plus size={18} /> Add City
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {worldClocks.map((clock) => (
                  <motion.div
                    key={clock.id}
                    layout
                    whileHover={{ scale: 1.02 }}
                    className="glass-panel"
                    style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          {clock.country}
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 500, margin: '0.25rem 0' }}>{clock.city}</div>
                        <div style={{ color: 'var(--accent-primary)', fontSize: '0.8rem' }}>
                          {getOffset(clock.timezone)} Relative to Local
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 400, fontFamily: 'var(--font-mono)' }}>
                          {formatTime(time, clock.timezone)}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          {new Date(time.toLocaleString('en-US', { timeZone: clock.timezone })).toLocaleDateString([], { weekday: 'short' })}
                          <button 
                            onClick={(e) => removeCity(clock.id, e)}
                            style={{ padding: '0.2rem', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'alarm' && (
            <motion.div
              key="alarm-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              style={{ padding: '0 2rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 300 }}>Alarms</h2>
                <button 
                  className="glass-panel" 
                  onClick={() => setIsAddAlarmOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem' }}
                >
                  <Plus size={18} /> New Alarm
                </button>
              </div>

              {isLoadingAlarms ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                    <Loader2 size={32} color="var(--accent-primary)" />
                  </motion.div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                  {alarms.map(alarm => (
                    <motion.div 
                      key={alarm.id} 
                      className="glass-panel" 
                      onClick={() => openEditAlarm(alarm)}
                      style={{ 
                        padding: '2rem', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        opacity: alarm.active ? 1 : 0.6, 
                        transition: 'all 0.3s',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '3rem', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>{alarm.time}</div>
                        <div style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{alarm.label} • {alarm.days.join(', ')}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <button 
                          onClick={(e) => deleteAlarm(alarm.id, e)}

                        style={{ background: 'transparent', border: 'none', color: 'rgba(255, 61, 61, 0.6)', cursor: 'pointer', padding: '0.5rem' }}
                      >
                        <Trash2 size={20} />
                      </button>
                      <button 
                        onClick={(e) => toggleAlarm(alarm.id, e)}
                        style={{ 
                          width: '60px', 
                          height: '32px', 
                          borderRadius: '16px', 
                          background: alarm.active ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                          position: 'relative',
                          padding: '0',
                          border: 'none',
                          transition: 'background 0.3s'
                        }}
                      >
                        <motion.div 
                          animate={{ x: alarm.active ? 28 : 4 }}
                          style={{ width: '24px', height: '24px', background: 'white', borderRadius: '50%', position: 'absolute', top: '4px' }}
                        />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

          {activeTab === 'timer' && (
            <motion.div
              key="timer-view"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', paddingBottom: '2rem' }}
            >
              <div style={{ position: 'relative', width: '400px', height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <svg width="400" height="400" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="200" cy="200" r="190" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <motion.circle 
                    cx="200" cy="200" r="190" fill="none" stroke="var(--accent-primary)" strokeWidth="8" 
                    strokeLinecap="round" strokeDasharray="1194"
                    animate={{ strokeDashoffset: 1194 - (1194 * timerProgress) / 100 }}
                    transition={{ duration: 1, ease: "linear" }}
                  />
                </svg>
                <div style={{ position: 'absolute', textAlign: 'center' }}>
                  <div style={{ fontSize: '6rem', fontWeight: 200, fontFamily: 'var(--font-mono)' }}>
                    {formatTimerDisplay(timerRemaining)}
                  </div>
                </div>
              </div>

              {!isTimerRunning && timerRemaining === totalTimerTime && (
                <div style={{ display: 'flex', gap: '2rem', marginTop: '3rem' }}>
                  {(['h', 'm', 's'] as const).map(unit => (
                    <div key={unit} style={{ textAlign: 'center' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1rem' }}>{unit === 'h' ? 'Hours' : unit === 'm' ? 'Minutes' : 'Seconds'}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <button onClick={() => handleTimerInputChange(unit, true)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}><ChevronUp size={24}/></button>
                        <div style={{ fontSize: '3rem', fontWeight: 300, width: '60px' }}>{timerInput[unit].toString().padStart(2, '0')}</div>
                        <button onClick={() => handleTimerInputChange(unit, false)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}><ChevronDown size={24}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '2rem', marginTop: '4rem' }}>
                <button 
                  onClick={() => {
                    if (isTimerRunning) setIsTimerRunning(false);
                    else if (timerRemaining === totalTimerTime) startTimer();
                    else setIsTimerRunning(true);
                  }} 
                  className="glass-panel"
                  style={{ 
                    padding: '1.5rem 3rem', 
                    borderRadius: '50px', 
                    background: isTimerRunning ? 'rgba(255,255,255,0.1)' : 'rgba(0,242,255,0.2)',
                    borderColor: isTimerRunning ? 'transparent' : 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    fontSize: '1.2rem'
                  }}
                >
                  {isTimerRunning ? <><Pause size={24} /> Pause</> : <><Play size={24} /> {timerRemaining < totalTimerTime ? 'Resume' : 'Start'}</>}
                </button>
                <button 
                  onClick={resetTimer} 
                  className="glass-panel"
                  style={{ padding: '1.5rem', borderRadius: '50%' }}
                >
                  <RotateCcw size={24} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add City Modal */}
      <AnimatePresence>
        {isAddCityOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(10px)',
              zIndex: 1000,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '2rem'
            }}
            onClick={() => setIsAddCityOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-panel accent-border"
              style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}
              onClick={e => e.stopPropagation()}
            >
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 400 }}>Add City</h2>
              
              <div className="input-group" style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search city or country..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '3rem' }}
                  autoFocus
                />
              </div>

              <div style={{ maxHeight: '300px', overflow: 'auto', marginTop: '1rem' }}>
                {filteredCities.length > 0 ? (
                  filteredCities.map(city => (
                    <div 
                      key={city.city}
                      onClick={() => addCity(city)}
                      style={{ 
                        padding: '1rem', 
                        borderRadius: '10px', 
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div>
                        <div style={{ fontWeight: 500 }}>{city.city}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{city.country}</div>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)' }}>{getOffset(city.timezone)}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No cities found
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Alarm Modal */}
      <AnimatePresence>
        {isAddAlarmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(15px)',
              zIndex: 2000,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '2rem'
            }}
            onClick={closeAlarmModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel"
              style={{ 
                width: '100%', 
                maxWidth: '450px', 
                padding: '2.5rem',
                border: '1px solid rgba(0, 242, 255, 0.2)',
                borderRadius: '24px'
              }}
              onClick={e => e.stopPropagation()}
            >
              <h2 style={{ fontSize: '1.8rem', marginBottom: '2rem', fontWeight: 300 }}>
                {editingAlarm ? 'Edit Alarm' : 'New Alarm'}
              </h2>
              
              <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <input 
                  type="time" 
                  value={newAlarmTime}
                  onChange={(e) => setNewAlarmTime(e.target.value)}
                  style={{ 
                    fontSize: '4rem', 
                    background: 'transparent', 
                    border: 'none', 
                    color: 'white', 
                    width: '100%',
                    textAlign: 'center',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none'
                  }}
                />
              </div>

              <div className="input-group" style={{ marginBottom: '2rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Label</label>
                <input 
                  type="text" 
                  placeholder="Wake up" 
                  value={newAlarmLabel}
                  onChange={(e) => setNewAlarmLabel(e.target.value)}
                  style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                />
              </div>

              <div style={{ marginBottom: '2.5rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem', display: 'block' }}>Repeat</label>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                  {dayOptions.map(day => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      style={{
                        flex: 1,
                        padding: '0.75rem 0',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        background: selectedDays.includes(day) ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                        color: selectedDays.includes(day) ? 'black' : 'white',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={closeAlarmModal}
                  style={{ flex: 1, padding: '1rem', borderRadius: '12px', background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={saveAlarm}
                  style={{ flex: 1, padding: '1rem', borderRadius: '12px', background: 'var(--accent-primary)', color: 'black', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                >
                  Save Alarm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
