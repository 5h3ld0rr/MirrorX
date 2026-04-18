import { useState, useEffect, useRef } from 'react';
import {
  User,
  MenuIcon,
  X,
  WifiOff,
  ShieldCheck,
  ShieldAlert,
  Scan,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { auth } from './lib/firebase';
import { onAuthStateChanged } from "firebase/auth";

import { FluidBackground } from './components/FluidBackground';
import { WelcomeOverlay } from './components/WelcomeOverlay';
import { AppLauncher } from './components/AppLauncher';
import { Clock } from './components/Clock';
import { Weather } from './components/Weather';
import { FaceAuth } from './components/FaceAuth';
import { AuthModal } from './components/AuthModal';
import { AppContainer } from './components/AppContainer';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { CONFIG } from './config';
import { GlobalPlayer } from './components/GlobalPlayer';
import { MusicWidget } from './components/MusicWidget';

function App() {
  const [user, setUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<string>('Idle');
  const isOnline = useOnlineStatus();
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
    setIsLauncherOpen(false);
    setActiveApp(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        handleAuth({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || 'Authorized User',
          email: firebaseUser.email,
        }, false);
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
      if (sleepTimeout) clearTimeout(sleepTimeout);
      if (terminationTimeout) clearTimeout(terminationTimeout);

      if (isAuthModalOpen || showWelcome) return;

      if (hasInteracted) {
        sleepTimeout = setTimeout(() => {
          setHasInteracted(false);
        }, CONFIG.STANDBY_DELAY);
      }

      const logoutDelay = hasInteracted ? CONFIG.STANDBY_DELAY + CONFIG.TERMINATION_DELAY : CONFIG.TERMINATION_DELAY;
      terminationTimeout = setTimeout(() => {
        if (user) handleLogout();
      }, logoutDelay);
    };

    const handleInteraction = () => {
      setHasInteracted(true);
      resetTimers();
    };

    const activityEvents = ['click', 'mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      window.addEventListener(event, handleInteraction);
    });

    if (hasInteracted || isAuthModalOpen || user) resetTimers();

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleInteraction);
      });
      if (sleepTimeout) clearTimeout(sleepTimeout);
      if (terminationTimeout) clearTimeout(terminationTimeout);
    };
  }, [hasInteracted, isAuthModalOpen, showWelcome, user]);

  const renderAuthIcon = () => {
    if (!isOnline) return <WifiOff size={24} />;

    switch (authStatus) {
      case 'Scanning...':
        return <Scan size={24} className="status-icon-scanning" />;
      case 'Authenticated':
        return <ShieldCheck size={24} className="status-icon-success" />;
      case 'Face not recognized':
      case 'Camera Error':
      case 'Backend unavailable':
      case 'Max attempts reached. Please let screen turn off to retry.':
        return <ShieldAlert size={24} className="status-icon-error" />;
      default:
        return <User size={24} />;
    }
  };

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
        <GlobalPlayer />
        <MusicWidget isIdle={!hasInteracted && !isAuthModalOpen && !showWelcome} />
        <div className="top-bar" style={{ justifyContent: 'flex-end' }}>
        <div className="top-bar">
          <div />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
            <Clock />
            <Weather isActive={hasInteracted || isAuthModalOpen} />
          </div>
        </div>

        {!user && (
          <FaceAuth
            ref={faceAuthRef}
            onUserAuth={(u) => handleAuth(u, true)}
            hasInteracted={hasInteracted}
            isLoggedIn={false}
            isPaused={isAuthModalOpen}
            isOnline={isOnline}
            onStatusChange={setAuthStatus}
            onActivity={() => {
              if (!hasInteracted) setHasInteracted(true);
            }}
          />
        )}

        <div className="bottom-bar" style={{
          position: 'fixed',
          bottom: '2rem',
          left: '0',
          right: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3100,
          pointerEvents: 'none'
        }}>
          <div style={{ pointerEvents: 'auto' }}>
            {user ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsLauncherOpen(!isLauncherOpen)}
                className="glass-panel"
                style={{ padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAuthModalOpen(true)}
                disabled={!isOnline}
                className={`glass-panel accent-border ${!isOnline ? 'offline' : ''}`}
                style={{
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isOnline ? 1 : 0.6,
                  cursor: isOnline ? 'pointer' : 'not-allowed'
                }}
              >
                {renderAuthIcon()}
              </motion.button>
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
          isOnline={isOnline}
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
