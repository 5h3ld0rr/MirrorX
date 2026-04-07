import { useState, useEffect } from 'react';
import axios from 'axios';
import { Cloud, Sun, CloudRain, Wind, Droplets, MapPin, Search } from 'lucide-react';

export const WeatherApp = () => {
  const [weather, setWeather] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const response = await axios.get(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
        );
        setWeather(response.data.current);
        setForecast(response.data.daily.time.slice(1, 6).map((time: string, i: number) => ({
          time,
          maxTemp: Math.round(response.data.daily.temperature_2m_max[i + 1]),
          minTemp: Math.round(response.data.daily.temperature_2m_min[i + 1]),
          code: response.data.daily.weather_code[i + 1]
        })));
      } catch (err) {
        console.error("Weather error:", err);
      }
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => fetchWeather(40.7128, -74.0060) // Default to NYC
    );
  }, []);

  const getWeatherIcon = (code: number, size = 48) => {
    if (code === 0) return <Sun size={size} color="#fcd34d" />;
    if (code <= 3) return <Cloud size={size} color="#94a3b8" />;
    if (code <= 48) return <Cloud size={size} color="#cbd5e1" />;
    if (code <= 67) return <CloudRain size={size} color="#60a5fa" />;
    return <Cloud size={size} color="#94a3b8" />;
  };

  const getWeatherDesc = (code: number) => {
    if (code === 0) return 'Clear Sky';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 48) return 'Foggy';
    if (code <= 67) return 'Rainy';
    if (code <= 77) return 'Snowy';
    return 'Stormy';
  };

  if (!weather) return <div style={{ padding: '2rem' }}>Loading weather...</div>;

  return (
    <div className="app-content" style={{ padding: '2rem 4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <MapPin size={24} color="var(--accent-primary)" />
          <h2 style={{ fontSize: '1.8rem', fontWeight: 600 }}>New York, US</h2>
        </div>
        <div style={{ display: 'flex', gap: '1rem', width: '300px' }}>
          <div style={{ position: 'relative', flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', color: 'rgba(255,255,255,0.4)' }} />
            <input 
              type="text" 
              placeholder="Search city..." 
              className="glass-panel" 
              style={{ width: '100%', padding: '0.7rem 1rem 0.7rem 2.8rem', borderRadius: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} 
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '4rem', alignItems: 'center' }}>
        {/* Current Weather */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1rem' }}>
            {getWeatherIcon(weather.weather_code, 120)}
            <div>
              <div style={{ fontSize: '8rem', fontWeight: 300, lineHeight: 1 }}>{Math.round(weather.temperature_2m)}°</div>
              <div style={{ fontSize: '2rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{getWeatherDesc(weather.weather_code)}</div>
            </div>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '400px', lineHeight: 1.6 }}>
            The current conditions are perfect for outdoor activities with a clear sky and mild temperatures.
          </p>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.03)' }}>
            <Wind size={24} color="var(--accent-primary)" />
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{weather.wind_speed_10m} km/h</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Wind Speed</div>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.03)' }}>
            <Droplets size={24} color="var(--accent-primary)" />
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{weather.relative_humidity_2m}%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Humidity</div>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.03)' }}>
            <Sun size={24} color="#fcd34d" />
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>06:42 AM</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sunrise</div>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.03)' }}>
            <Sun size={24} color="#ff9500" />
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>07:15 PM</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sunset</div>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Day Forecast */}
      <div style={{ marginTop: '4rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '2rem', color: 'var(--text-secondary)' }}>5-Day Forecast</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem' }}>
          {forecast.map((day, i) => (
            <div key={i} className="glass-panel" style={{ flex: 1, padding: '1.5rem', textAlign: 'center', background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                {new Date(day.time).toLocaleDateString([], { weekday: 'short' })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                {getWeatherIcon(day.code, 32)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem', alignItems: 'baseline' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 600 }}>{day.maxTemp}°</span>
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{day.minTemp}°</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
