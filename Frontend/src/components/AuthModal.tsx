import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { API_BASE_URL, exchangeToken } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, UserPlus, X } from 'lucide-react';

export const AuthModal = ({ isOpen, onClose, onUserAuth, isOnline }: { 
  isOpen: boolean, 
  onClose: () => void, 
  onUserAuth: (user: any) => void,
  isOnline: boolean
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
        console.error(err);
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

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError('');
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
        resetForm();
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
          resetForm();
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
            padding: 0,
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            transition: 'all 0.2s ease'
          }}
          className="close-button"
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
                disabled={isLoading || !isOnline}
                style={{ 
                  width: '100%', 
                  background: isOnline ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)', 
                  color: isOnline ? 'black' : 'var(--text-muted)', 
                  fontWeight: 600, 
                  padding: '1rem', 
                  borderRadius: '12px',
                  border: isOnline ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  cursor: isOnline ? 'pointer' : 'not-allowed'
                }}
              >
                {isLoading ? 'Processing...' : (!isOnline ? 'Network Unavailable' : (isLogin ? 'Authorize Access' : 'Create Identity'))}
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
