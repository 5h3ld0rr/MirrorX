import { useState, useEffect, useRef } from 'react';
import { 
  User, 
  MenuIcon,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { auth } from './lib/firebase';
import { onAuthStateChanged } from "firebase/auth";

// Components
import { FluidBackground } from './components/FluidBackground';
import { WelcomeOverlay } from './components/WelcomeOverlay';
import { AppLauncher } from './components/AppLauncher';
import { Clock } from './components/Clock';
import { Weather } from './components/Weather';
import { FaceAuth } from './components/FaceAuth';
import { AuthModal } from './components/AuthModal';
import { AppContainer } from './components/AppContainer';

// --- Main App Component ---

const STANDBY_DELAY = 150000; // 15 seconds of total inactivity

function App() {
  const [user, setUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [activeApp, setActiveApp] = useState<string | null>(null);
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
    setIsLauncherOpen(false); // Ensure launcher is closed on logout
    setActiveApp(null); // Clear active app on logout
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
                width: '56px',
                height: '56px',
                padding: 0,
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
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
        onSelectApp={(appName) => setActiveApp(appName)}
      />

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onUserAuth={(u) => {
          handleAuth(u, true);
          setIsAuthModalOpen(false);
        }}
      />

      <AppContainer 
        activeApp={activeApp} 
        onClose={() => setActiveApp(null)} 
        user={user}
        onLogout={handleLogout}
      />
      </motion.div>
    </>
  );
}

export default App;
