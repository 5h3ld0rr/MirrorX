import { useState, useEffect, memo } from 'react';
import axios from 'axios';
import { 
  Cloud, 
  CloudSun, 
  CloudRain, 
  CloudLightning, 
  Sun,
  Droplets,
  Wind
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Enterprise Weather Widget
 * Fetches real-time localized weather and displays 'Mirror Mirror' style HUD info.
 * Polished animation and condition-specific icon mapping.
 */
export const Weather = memo(({ isActive }: { isActive: boolean }) => {
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    if (!isActive) return;

    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const response = await axios.get(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`
        );
        setWeather(response.data.current);
      } catch (err) {
        console.error("Weather error:", err);
      }
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => console.warn("Geolocation failed. Weather widget defaults to system fallback.")
    );

    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude)
      );
    }, 600000); 

    return () => clearInterval(interval);
  }, [isActive]);

  const getCondition = (code: number) => {
    if (code === 0) return { desc: 'Clear Night', icon: <Sun size={32} /> };
    if (code <= 3) return { desc: 'Partly Cloudy', icon: <CloudSun size={32} /> };
    if (code <= 48) return { desc: 'Fog Horizon', icon: <Cloud size={32} /> };
    if (code <= 67) return { desc: 'External Rain', icon: <CloudRain size={32} /> };
    if (code <= 77) return { desc: 'Snow Precipitation', icon: <Droplets size={32} /> };
    if (code <= 99) return { desc: 'Internal Storm', icon: <CloudLightning size={32} /> };
    return { desc: 'Data Syncing...', icon: <Cloud size={32} /> };
  };

  if (!weather) return null;
  const condition = getCondition(weather.weather_code);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="glass-panel" 
        style={{ 
          width: '280px', 
          textAlign: 'right', 
          background: 'hsla(0, 0%, 100%, 0.03)',
          border: '1px solid var(--border-light)',
          padding: '1.2rem 1.5rem',
          borderRadius: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1.2rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 300, color: 'white', lineHeight: 1 }}>{Math.round(weather.temperature_2m)}°</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.4rem' }}>{condition.desc}</div>
          </div>
          <div style={{ color: 'var(--accent-primary)', opacity: 0.8 }}>
            {condition.icon}
          </div>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '1.2rem', 
          borderTop: '1px solid hsla(0,0%,100%,0.05)',
          paddingTop: '0.8rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
            <Droplets size={12} /> {weather.relative_humidity_2m}%
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
            <Wind size={12} /> {weather.wind_speed_10m} km/h
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});
