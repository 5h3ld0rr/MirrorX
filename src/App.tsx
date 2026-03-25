import { useState, useEffect, useRef, forwardRef, useImperativeHandle, memo } from 'react';
import axios from 'axios';
// @ts-ignore
import WebGLFluid from 'webgl-fluid';
import { 
  User, 
  Cloud,
  Clock1,
  LogOut,
  ShieldCheck,
  UserPlus,
  MenuIcon,
  Settings,
  X,
  Music,
  Calendar,
  Play,
  ShoppingBag,
  Newspaper,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";

// Initialize Firebase from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const FluidBackground = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      WebGLFluid(canvasRef.current, {
        TRIGGER: 'click',
        IMMEDIATE: true,
        TRANSPARENT: false,
        AUTO: false,
        INTERVAL: 3000,
        SIM_RESOLUTION: 128,
        DYE_RESOLUTION: 1024,
        CAPTURE_RESOLUTION: 512,
        DENSITY_DISSIPATION: 3.5,
        VELOCITY_DISSIPATION: 2.0,
        PRESSURE: 0.8,
        PRESSURE_ITERATIONS: 20,
        CURL: 20,
        SPLAT_RADIUS: 0.5,
        SPLAT_FORCE: 6000,
        SPLAT_COUNT: Math.floor(Math.random() * 20) + 5,
        SHADING: true,
        COLORFUL: true,
        COLOR_UPDATE_SPEED: 10,
        PAUSED: false,
        BACK_COLOR: { r: 0, g: 0, b: 0 },
        BLOOM: false,
        SUNRAYS: false
      });
    }
  }, []);

  return <canvas id="fluid-canvas" ref={canvasRef} />;
});

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const TypewriterSequence = ({ 
  phrases, 
  onComplete,
  typingSpeed = 60,
  deletingSpeed = 30,
  pauseDelay = 1500 
}: { 
  phrases: string[], 
  onComplete: () => void,
  typingSpeed?: number,
  deletingSpeed?: number,
  pauseDelay?: number
}) => {
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<'typing' | 'pausing' | 'deleting'>('typing');
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    let timer: any;
    const currentPhrase = phrases[phraseIndex];

    if (phase === 'typing') {
      if (text.length < currentPhrase.length) {
        timer = setTimeout(() => {
          setText(currentPhrase.slice(0, text.length + 1));
        }, typingSpeed);
      } else {
        setPhase('pausing');
      }
    } else if (phase === 'pausing') {
      timer = setTimeout(() => {
        setPhase('deleting');
      }, pauseDelay);
    } else if (phase === 'deleting') {
      if (text.length > 0) {
        timer = setTimeout(() => {
          setText(text.slice(0, -1));
        }, deletingSpeed);
      } else {
        if (phraseIndex < phrases.length - 1) {
          setPhraseIndex(prev => prev + 1);
          setPhase('typing');
        } else {
          onComplete();
        }
      }
    }

    return () => clearTimeout(timer);
  }, [text, phase, phraseIndex, phrases, typingSpeed, deletingSpeed, pauseDelay]);

  return (
    <div style={{ 
      fontSize: 'clamp(3rem, 10vw, 6rem)', 
      fontWeight: 700, 
      color: 'white',
      textAlign: 'center',
      minHeight: '1.2em',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      letterSpacing: '-0.1rem'
    }}>
      {text}
      <motion.span 
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.6, repeat: Infinity }}
        style={{ borderLeft: '3px solid white', marginLeft: '4px', height: '0.9em' }}
      />
    </div>
  );
};

const AppLauncher = ({ isOpen, onClose, user, onLogout }: { isOpen: boolean, onClose: () => void, user: any, onLogout: () => void }) => {
  const apps = [
    { name: 'Calendar', icon: <Calendar size={24} />, color: '#ff4d4d' },
    { name: 'Clock', icon: <Clock1 size={24} />, color: '#00f2ff' },
    { name: 'Notes', icon: <FileText size={24} />, color: '#00f2ff' },
    { name: 'Spotify', icon: <Music size={24} />, color: '#1DB954' },
    { name: 'Weather', icon: <Cloud size={24} />, color: '#0090ff' },
    { name: 'Settings', icon: <Settings size={24} />, color: '#8e8e93' },
    { name: 'News', icon: <Newspaper size={24} />, color: '#ff9500' },
    { name: 'Youtube', icon: <Play size={24} />, color: '#ff0000' },
    { name: 'Fashion', icon: <ShoppingBag size={24} />, color: '#ff0000' },
  ];

  return (
    <AnimatePresence>
      {(isOpen && user) && (
        <div 
          key="launcher-overlay"
          className="auth-overlay" 
          onClick={onClose} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            position: 'fixed',
            inset: 0,
            zIndex: 3000,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(20px)'
          }}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={e => e.stopPropagation()}
            className="glass-panel"
            style={{
              width: 'min(600px, 90vw)',
              padding: '2.5rem',
              borderRadius: '32px',
              background: 'rgba(15, 15, 15, 0.9)',
              border: '1px solid rgba(0, 242, 255, 0.2)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(40px)'
            }}
          >
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '2rem',
          textAlign: 'center'
        }}>
          {apps.map((app, i) => (
            <motion.div
              key={app.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.1, y: -5 }}
              className="app-item"
              style={{ cursor: 'pointer' }}
            >
              <div style={{ 
                width: '60px', 
                height: '60px', 
                margin: '0 auto 0.8rem',
                borderRadius: '16px',
                background: `linear-gradient(135deg, ${app.color}15, ${app.color}35)`,
                border: `1px solid ${app.color}50`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: app.color,
                boxShadow: `0 8px 16px ${app.color}08`
              }}>
                {app.icon}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{app.name}</div>
            </motion.div>
          ))}
        </div>

        <div style={{ 
          marginTop: '3rem', 
          paddingTop: '2rem', 
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--accent-primary), #0090ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'black',
              fontWeight: 700
            }}>
              {user.name[0].toUpperCase()}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '1rem', color: 'white', fontWeight: 600 }}>{user.name}</div>
            </div>
          </div>
          
          <button 
            onClick={() => {
              onLogout();
              onClose();
            }} 
            className="glass-panel"
            style={{ 
              padding: '0.6rem 1.2rem', 
              borderRadius: '12px',
              background: 'rgba(255, 61, 61, 0.1)',
              border: '1px solid rgba(255, 61, 61, 0.2)',
              color: '#ff4d4d',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
};
const WelcomeOverlay = memo(({ user, onComplete }: { user: any, onComplete: () => void }) => {
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return `Good Morning, ${user.name}.`;
    if (hour < 17) return `Good Afternoon, ${user.name}.`;
    return `Good Evening, ${user.name}.`;
  })();

  const phrases = [
    greeting,
    "Welcome back to MirrorX."
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(80px) brightness(0.4)',
        backgroundColor: 'rgba(0,0,0,0.6)',
        pointerEvents: 'none'
      }}
    >
      <TypewriterSequence phrases={phrases} onComplete={onComplete} />
    </motion.div>
  );
});

/**
 * Helper to get ID Token from Custom Token returned by backend
 */
const exchangeToken = async (customToken: string) => {
  const userCred = await signInWithCustomToken(auth, customToken);
  return await userCred.user.getIdToken();
};

const Clock = memo(() => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="clock-display">
      <div className="time">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      <div className="date">{time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</div>
    </div>
  );
});

const Weather = memo(({ isActive }: { isActive: boolean }) => {
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
      () => console.warn("Geolocation failed. Weather widget hidden.")
    );

    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude)
      );
    }, 600000); // 10 mins

    return () => clearInterval(interval);
  }, [isActive]);

  // Map WMO Weather Code to string/icon
  const getWeatherDesc = (code: number) => {
    if (code === 0) return 'Clear Sky';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 48) return 'Foggy';
    if (code <= 67) return 'Rainy';
    if (code <= 77) return 'Snowy';
    return 'Stormy';
  };

  if (!weather) return null;

  return (
    <div className="glass-panel" style={{ width: '250px', textAlign: 'right' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: '2rem', fontWeight: 600 }}>{Math.round(weather.temperature_2m)}°C</div>
          <div style={{ color: 'var(--text-secondary)' }}>{getWeatherDesc(weather.weather_code)}</div>
        </div>
        <Cloud size={40} color="#00f2ff" />
      </div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: '1rem', 
        fontSize: '0.8rem' 
      }}>
        <div style={{ color: 'var(--text-muted)' }}>Humidity: {weather.relative_humidity_2m}%</div>
        <div style={{ color: 'var(--text-muted)' }}>Wind: {weather.wind_speed_10m} km/h</div>
      </div>
    </div>
  );
});

const FaceAuth = forwardRef(({ onUserAuth, hasInteracted, isLoggedIn, onActivity, isPaused }: { 
  onUserAuth: (user: any) => void, 
  hasInteracted: boolean,
  isLoggedIn: boolean,
  onActivity?: () => void,
  isPaused?: boolean
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState('Idle');

  useImperativeHandle(ref, () => ({
    getBlob: async (): Promise<Blob | null> => {
      if (!videoRef.current || !canvasRef.current) return null;
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0);
      return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
    }
  }));

  useEffect(() => {
    let interval: any;
    
    if (hasInteracted && !isLoggedIn) {
      startCamera();
      if (!isPaused) {
        interval = setInterval(captureAndAuth, 5000); // Try auth every 5 seconds
      } else {
        setStatus('Registration Preview Active');
      }
    } else {
      stopCamera();
      setStatus('Idle');
    }
    
    return () => {
      if (interval) clearInterval(interval);
      stopCamera();
    };
  }, [hasInteracted, isLoggedIn, isPaused]);

  const startCamera = async () => {
    try {
      if (streamRef.current) return;
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setStatus('Camera Error');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const captureAndAuth = async () => {
    if (!videoRef.current || !canvasRef.current || isScanning) return;

    // Call onActivity to prevent sleep during scanning
    if (onActivity) onActivity();

    setIsScanning(true);
    setStatus('Scanning...');

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      canvas.toBlob(async (blob) => {
        if (blob) {
          const formData = new FormData();
          formData.append('photo', blob, 'face.jpg');

          try {
            const response = await axios.post(`${API_BASE_URL}/auth/login`, formData);
            if (response.data.success) {
              setStatus('Authenticated');
              const idToken = await exchangeToken(response.data.token);
              onUserAuth({ ...response.data.user, token: idToken });
            } else {
              setStatus('Face not recognized');
            }
          } catch (err: any) {
            const errorMsg = err.response?.data?.error || 'Searching...';
            setStatus(errorMsg);
          }
        }
        setIsScanning(false);
      }, 'image/jpeg');
    }
  };

  if (isLoggedIn) return null;

  return (
    <div className="main-content">
      <div className={`scanning-ring ${isScanning ? 'active' : ''}`}>
        <video ref={videoRef} autoPlay muted playsInline />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div className="scan-line"></div>
      </div>
      <div style={{ 
        position: 'absolute', 
        bottom: '-3rem', 
        textAlign: 'center',
        width: '100%'
      }}>
        <div 
          className="glitch-text" 
          style={{ 
            fontSize: '0.8rem', 
            color: (status.includes('closer') || status.includes('far')) ? '#ff4d4d' : (isScanning ? 'var(--accent-primary)' : 'var(--text-muted)'),
            fontWeight: '400',
            textTransform: 'uppercase',
            letterSpacing: '0.1rem'
          }}
        >
          {status}
        </div>
      </div>
    </div>
  );
});


const AuthModal = ({ isOpen, onClose, onUserAuth }: { 
  isOpen: boolean, 
  onClose: () => void, 
  onUserAuth: (user: any) => void
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        currentStream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480, facingMode: 'user' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
        }
      } catch (err) {
        console.error("Registration camera error:", err);
        setError("Could not access camera for face registration.");
      }
    };

    if (isOpen && !isLogin) {
      startCamera();
    }

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, isLogin]);

  const captureBlob = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!videoRef.current) return resolve(null);
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95);
    });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      if (isLogin) {
        if (!email || !password) {
          setError("Email and Password are required for manual authorization.");
          setIsLoading(false);
          return;
        }
        
        if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          setIsLoading(false);
          return;
        }

        const userCred = await signInWithEmailAndPassword(auth, email, password);
        onUserAuth({ 
          uid: userCred.user.uid, 
          name: userCred.user.displayName || 'User', 
          email: userCred.user.email,
          token: await userCred.user.getIdToken()
        });
        onClose();
      } else {
        if (!name || !email || !password) {
          setError("All fields (Name, Email, Password) are required for registration.");
          setIsLoading(false);
          return;
        }

        if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          setIsLoading(false);
          return;
        }

        const photoBlob = await captureBlob();
        if (!photoBlob) {
          setError("Failed to capture face. Ensure camera is active.");
          setIsLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('photo', photoBlob, 'registration.jpg');
        formData.append('name', name);
        formData.append('email', email);
        formData.append('password', password);

        const response = await axios.post(`${API_BASE_URL}/auth/register`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (response.data.userId) {
          const idToken = await exchangeToken(response.data.token);
          onUserAuth({ ...response.data.user, token: idToken });
          onClose();
        }
      }
    } catch (err: any) {
      setError(err.code === 'auth/invalid-credential' ? "Invalid Email or Password" : (err.response?.data?.error || err.message || "Operation failed."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="auth-overlay" key="auth-modal-overlay">
       <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass-panel modal accent-border"
        style={{ 
          position: 'relative',
          width: isLogin ? '400px' : '850px',
          maxWidth: '95vw',
          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          padding: isLogin ? '2.5rem' : '3rem'
        }}
      >
        <button 
          onClick={onClose}
          style={{ 
            position: 'absolute', 
            top: '1.5rem', 
            right: '1.5rem', 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-muted)', 
            cursor: 'pointer',
            padding: '0.5rem'
          }}
        >
          <X size={20} />
        </button>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isLogin ? <ShieldCheck size={28} color="#00f2ff" /> : <UserPlus size={28} color="#00f2ff" />}
          {isLogin ? 'Identity Verification' : 'Register Profile'}
        </h2>

        <div style={{ 
          display: isLogin ? 'block' : 'flex', 
          gap: isLogin ? '0' : '3rem',
          alignItems: 'stretch'
        }}>
          {!isLogin && (
            <div style={{ 
              flex: '1.2',
              overflow: 'hidden', 
              border: '1px solid rgba(0, 242, 255, 0.4)', 
              background: '#000',
              aspectRatio: '1/1',
              position: 'relative',
              borderRadius: '24px',
              boxShadow: '0 0 40px rgba(0, 242, 255, 0.15)'
            }}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover', 
                  transform: 'scaleX(-1)',
                  borderRadius: '0',
                  opacity: 1,
                  filter: 'none'
                }} 
              />
              <div style={{ 
                position: 'absolute', 
                bottom: '1.5rem', 
                left: '50%', 
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.7)',
                padding: '0.6rem 1.2rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                color: '#fff',
                fontWeight: 500,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                width: 'max-content',
                textAlign: 'center'
              }}>
                Position yourself in the center
              </div>
            </div>
          )}

          <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {error && <div style={{ color: '#ff4444', marginBottom: '1.5rem', fontSize: '0.85rem', padding: '0.8rem', background: 'rgba(255, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid rgba(255, 68, 68, 0.2)' }}>{error}</div>}

            {!isLogin && (
              <div className="input-group">
                <label>Full Name</label>
                <input type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} />
              </div>
            )}

            <div className="input-group">
              <label>Email Address</label>
              <input type="email" placeholder="name@domain.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1.5rem' }}>
              <button 
                onClick={handleSubmit}
                disabled={isLoading}
                style={{ width: '100%', background: 'var(--accent-primary)', color: 'black', fontWeight: 600, padding: '1rem', borderRadius: '12px' }}
              >
                {isLoading ? 'Processing...' : (isLogin ? 'Authorize Access' : 'Create Identity')}
              </button>
              
              <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  {isLogin ? "New user?" : "Already have a profile?"}
                </span>
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', padding: '0 0.5rem', fontWeight: 600 }}
                >
                  {isLogin ? "Register Now" : "Login Here"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
};

// --- Main App Component ---

const STANDBY_DELAY = 15000; // 15 seconds of total inactivity

function App() {
  const [user, setUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const faceAuthRef = useRef<any>(null);

  const handleAuth = (userData: any, isNewLogin: boolean = false) => {
    setUser(userData);
    if (isNewLogin) {
      setShowWelcome(true);
    }
  };

  const handleLogout = () => {
    auth.signOut();
    setUser(null);
    setHasInteracted(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        handleAuth({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || 'Authorized User',
          email: firebaseUser.email,
        }, false); // Restoration: don't show welcome
        setHasInteracted(true);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let sleepTimeout: any;
    let terminationTimeout: any;

    const resetTimers = () => {
      // Clear existing
      if (sleepTimeout) clearTimeout(sleepTimeout);
      if (terminationTimeout) clearTimeout(terminationTimeout);
      
      // If modal is open or onboarding is active, don't set the sleep/logout timers
      if (isAuthModalOpen || showWelcome) return;

      // Stage 1: Sleep (Fade dashboard)
      if (hasInteracted) {
        sleepTimeout = setTimeout(() => {
          setHasInteracted(false); 
        }, STANDBY_DELAY);
      }

      // Stage 2: Termination (Full Logout - 1s after sleep or full delay if active)
      const logoutDelay = hasInteracted ? STANDBY_DELAY + 1000 : 1000;
      terminationTimeout = setTimeout(() => {
        if (user) handleLogout();
      }, logoutDelay);
    };

    const handleInteraction = () => {
      setHasInteracted(true);
      resetTimers();
    };

    // Global Activity Listeners
    const activityEvents = ['click', 'mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      window.addEventListener(event, handleInteraction);
    });


    // Initial timer start - Always run if we have a user or interaction
    if (hasInteracted || isAuthModalOpen || user) resetTimers();

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleInteraction);
      });
      if (sleepTimeout) clearTimeout(sleepTimeout);
      if (terminationTimeout) clearTimeout(terminationTimeout);
    };
  }, [hasInteracted, isAuthModalOpen, showWelcome, user]);

  return (
    <>
      <FluidBackground />
      <AnimatePresence>
        {user && showWelcome && (
          <WelcomeOverlay key="welcome" user={user} onComplete={() => setShowWelcome(false)} />
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: hasInteracted || isAuthModalOpen ? 1 : 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="mirror-container"
      >
      {/* Top Section */}
      <div className="top-bar">
        <div /> 
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
          <Clock />
          <Weather isActive={hasInteracted || isAuthModalOpen} />
        </div>
      </div>

      {/* Center Section: Face Recognition */}
      <FaceAuth 
        ref={faceAuthRef} 
        onUserAuth={(u) => handleAuth(u, true)} 
        hasInteracted={hasInteracted}
        isLoggedIn={!!user}
        isPaused={isAuthModalOpen}
        onActivity={() => {
          if (!hasInteracted) setHasInteracted(true);
          // resetTimers is handled by the dependency on hasInteracted or can be called if we move it out
        }}
      />

      {/* Bottom Section */}
      <div className="bottom-bar">
        <div style={{ flex: 1 }} />
        
        {/* Launcher Trigger */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', zIndex: 3100, pointerEvents: 'auto' }}>
          {user && (
            <motion.button 
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
                rotate: isLauncherOpen ? 90 : 0
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsLauncherOpen(!isLauncherOpen)}
              className="glass-panel"
              style={{ 
                padding: '0.8rem',
                borderRadius: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: isLauncherOpen ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                border: `1px solid ${isLauncherOpen ? '#fff' : 'rgba(0, 242, 255, 0.4)'}`,
                color: isLauncherOpen ? '#fff' : 'var(--accent-primary)',
                boxShadow: isLauncherOpen ? '0 0 50px rgba(255,255,255,0.15)' : '0 0 40px rgba(0, 242, 255, 0.2)',
                backdropFilter: 'blur(20px)',
                transition: 'background 0.3s, border 0.3s, color 0.3s'
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isLauncherOpen ? 'open' : 'closed'}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  {isLauncherOpen ? <X size={24} /> : <MenuIcon size={24} />}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          )}
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          {!user && (
            <button onClick={() => setIsAuthModalOpen(true)} className="glass-panel accent-border" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} /> Login
            </button>
          )}
        </div>
      </div>

      <AppLauncher 
        isOpen={isLauncherOpen} 
        onClose={() => setIsLauncherOpen(false)} 
        user={user}
        onLogout={handleLogout}
      />

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onUserAuth={(u) => {
          handleAuth(u, true);
          setIsAuthModalOpen(false);
        }}
      />
      </motion.div>
    </>
  );
}

export default App;
