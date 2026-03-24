import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';
import { 
  User, 
  Cloud, 
  ShieldCheck,
  UserPlus,
  LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';

import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken, signInWithEmailAndPassword } from "firebase/auth";

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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Helper to get ID Token from Custom Token returned by backend
 */
const exchangeToken = async (customToken: string) => {
  const userCred = await signInWithCustomToken(auth, customToken);
  return await userCred.user.getIdToken();
};

const Clock = () => {
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
};

const Weather = () => {
  return (
    <div className="glass-panel" style={{ width: '250px', textAlign: 'right' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: '2rem', fontWeight: 600 }}>24°C</div>
          <div style={{ color: 'var(--text-secondary)' }}>Clear Sky</div>
        </div>
        <Cloud size={40} color="#00f2ff" />
      </div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: '1rem', 
        fontSize: '0.8rem' 
      }}>
        <div style={{ color: 'var(--text-muted)' }}>Humidity: 45%</div>
        <div style={{ color: 'var(--text-muted)' }}>Wind: 12km/h</div>
      </div>
    </div>
  );
};

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
          } catch (err) {
            setStatus('Searching...');
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
        <div className="glitch-text" style={{ fontSize: '0.8rem', color: isScanning ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
          {status}
        </div>
      </div>
    </div>
  );
});


const AuthModal = ({ isOpen, onClose, onUserAuth, getPhotoBlob }: { 
  isOpen: boolean, 
  onClose: () => void, 
  onUserAuth: (user: any) => void,
  getPhotoBlob: () => Promise<Blob | null>
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

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

        const photoBlob = await getPhotoBlob();
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
    <div className="auth-overlay">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel modal accent-border"
      >
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isLogin ? <ShieldCheck size={28} color="#00f2ff" /> : <UserPlus size={28} color="#00f2ff" />}
          {isLogin ? 'Identity Verification' : 'Register Profile'}
        </h2>

        {error && <div style={{ color: '#ff4444', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}

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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <button 
            onClick={handleSubmit}
            disabled={isLoading}
            style={{ width: '100%', background: 'var(--accent-primary)', color: 'black', fontWeight: 600 }}
          >
            {isLoading ? 'Processing...' : (isLogin ? 'Authorize Access' : 'Create Identity')}
          </button>
          
          <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {isLogin ? "New user?" : "Already have a profile?"}
            </span>
            <button 
              onClick={() => setIsLogin(!isLogin)}
              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', padding: '0 0.5rem' }}
            >
              {isLogin ? "Register Now" : "Login Here"}
            </button>
          </div>
          
          <button onClick={onClose} style={{ width: '100%', border: '1px solid transparent', color: 'var(--text-muted)' }}>
            Abort Initialization
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App Component ---

function App() {
  const [user, setUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const faceAuthRef = useRef<any>(null);

  useEffect(() => {
    let sleepTimeout: any;
    let terminationTimeout: any;

    const resetTimers = () => {
      // Clear existing
      if (sleepTimeout) clearTimeout(sleepTimeout);
      if (terminationTimeout) clearTimeout(terminationTimeout);
      
      // If modal is open or user is authenticating, don't set the sleep timer
      if (isAuthModalOpen) return;

      // Stage 1: Sleep (15 seconds)
      sleepTimeout = setTimeout(() => {
        setHasInteracted(false); 
      }, 15000);

      // Stage 2: Termination (30 seconds)
      terminationTimeout = setTimeout(() => {
        handleLogout();
      }, 30000);
    };

    const handleInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
      }
      resetTimers();
    };

    // Global Activity Listeners
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      window.addEventListener(event, resetTimers);
    });

    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    // Initial timer start
    if (hasInteracted || isAuthModalOpen) resetTimers();

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetTimers);
      });
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      if (sleepTimeout) clearTimeout(sleepTimeout);
      if (terminationTimeout) clearTimeout(terminationTimeout);
    };
  }, [hasInteracted, isAuthModalOpen]);

  const handleLogout = () => {
    auth.signOut();
    setUser(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: hasInteracted || isAuthModalOpen ? 1 : 0 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      className="mirror-container"
    >
      {/* Top Section */}
      <div className="top-bar">
        {user ? (
          <div className="glass-panel">
            <div className="greeting">
              Hello, {user.name}
            </div>
          </div>
        ) : (
          <div /> // Empty spacer to maintain layout if needed, or just null
        )}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
          <Clock />
          <Weather />
        </div>
      </div>

      {/* Center Section: Face Recognition */}
      <FaceAuth 
        ref={faceAuthRef} 
        onUserAuth={(u) => setUser(u)} 
        hasInteracted={hasInteracted}
        isLoggedIn={!!user}
        isPaused={isAuthModalOpen}
        onActivity={() => {
          if (!hasInteracted) setHasInteracted(true);
          // resetTimers is handled by the dependency on hasInteracted or can be called if we move it out
        }}
      />

      {/* Bottom Section */}
      <div className="bottom-bar" style={{ justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {!user && (
            <button onClick={() => setIsAuthModalOpen(true)} className="glass-panel accent-border" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} /> Manual Login
            </button>
          )}
          <button 
            onClick={handleLogout} 
            className="glass-panel"
            style={{ display: user ? 'flex' : 'none', alignItems: 'center', gap: '0.5rem' }}
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onUserAuth={(u) => {
          setUser(u);
          setIsAuthModalOpen(false);
        }}
        getPhotoBlob={() => faceAuthRef.current?.getBlob() || Promise.resolve(null)}
      />
    </motion.div>
  );
}

export default App;
