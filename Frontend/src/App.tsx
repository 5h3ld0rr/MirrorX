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
import { getUserProfile } from './lib/api';

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
import { MusicSyncManager } from './components/MusicSyncManager';
import { MusicWidget } from './components/MusicWidget';
import { ReminderWidget } from './components/ReminderWidget';
import { NewsWidget } from './components/NewsWidget';
import { VoiceAssistant } from './components/VoiceAssistant';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  accentColor?: string;
  standByDelay?: number;
  terminationDelay?: number;
  rgbColor?: { r: number, g: number, b: number };
  brightness?: number;
  appBrightness?: number;
  musicSyncEnabled?: boolean;
  widgetSettings?: {
    [key: string]: { enabled: boolean; location: string };
  };
}

function App() {
  const [user, setUser] = useState<UserProfile | null>();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<string>('Idle');
  const isOnline = useOnlineStatus();
  const faceAuthRef = useRef<any>(null);
  const [bleDevice, setBleDevice] = useState<any>(null);
  const [bleCharacteristic, setBleCharacteristic] = useState<any>(null);
  const [bleConnected, setBleConnected] = useState(false);
  const [bleConnecting, setBleConnecting] = useState(false);
  const [bleDeviceName, setBleDeviceName] = useState('');
  const [isInhibitingSleep, setIsInhibitingSleep] = useState(false);

  // Auto-connect BLE and apply saved RGB color
  const autoConnectBLE = async (profile: any) => {
    if (!profile?.rgbColor) return;
    try {
      const nav = navigator as any;
      if (!nav.bluetooth?.getDevices) {
        return;
      }
      const devices = await nav.bluetooth.getDevices();
      const elkDevice = devices.find((d: any) => d.name?.startsWith('ELK'));
      if (!elkDevice) {
        return;
      }

      // Listen for advertisement to wake the device
      const abortController = new AbortController();
      elkDevice.addEventListener('advertisementreceived', async () => {
        abortController.abort();
        try {
          setBleConnecting(true);
          const server = await elkDevice.gatt.connect();
          const service = await server.getPrimaryService('0000fff0-0000-1000-8000-00805f9b34fb');
          const char = await service.getCharacteristic('0000fff3-0000-1000-8000-00805f9b34fb');
          
          setBleDevice(elkDevice);
          setBleCharacteristic(char);
          setBleConnected(true);
          setBleDeviceName(elkDevice.name || 'ELK Device');

          const { r, g, b } = profile.rgbColor;
          const brightness = profile.brightness ?? 100;
          const sR = Math.round(r * (brightness / 100));
          const sG = Math.round(g * (brightness / 100));
          const sB = Math.round(b * (brightness / 100));
          await char.writeValue(
            new Uint8Array([0x7E, 0x07, 0x05, 0x03, sR, sG, sB, 0x10, 0xEF])
          );
        } catch (err) {
          console.error('BLE auto-apply error:', err);
        } finally {
          setBleConnecting(false);
        }
      }, { once: true });

      // Also try direct connect (works if device is already in range)
      try {
        setBleConnecting(true);
        const server = await elkDevice.gatt.connect();
        const service = await server.getPrimaryService('0000fff0-0000-1000-8000-00805f9b34fb');
        const char = await service.getCharacteristic('0000fff3-0000-1000-8000-00805f9b34fb');
        
        setBleDevice(elkDevice);
        setBleCharacteristic(char);
        setBleConnected(true);
        setBleDeviceName(elkDevice.name || 'ELK Device');
        abortController.abort(); // Cancel advertisement listener

        const { r, g, b } = profile.rgbColor;
        const brightness = profile.brightness ?? 100;
        const sR = Math.round(r * (brightness / 100));
        const sG = Math.round(g * (brightness / 100));
        const sB = Math.round(b * (brightness / 100));
        await char.writeValue(
          new Uint8Array([0x7E, 0x07, 0x05, 0x03, sR, sG, sB, 0x10, 0xEF])
        );
      } catch {
        // Direct connect failed, waiting for advertisement listener above
        elkDevice.watchAdvertisements?.({ signal: abortController.signal }).catch(() => {});
      } finally {
        setBleConnecting(false);
      }
    } catch (err) {
      console.error('BLE auto-connect error:', err);
    }
  };

  const connectBLE = async () => {
    setBleConnecting(true);
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ namePrefix: 'ELK' }],
        optionalServices: ['0000fff0-0000-1000-8000-00805f9b34fb'],
      });
      
      device.addEventListener('gattserverdisconnected', () => {
        setBleConnected(false);
        setBleCharacteristic(null);
        setBleDeviceName('');
        setBleDevice(null);
      });
      
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('0000fff0-0000-1000-8000-00805f9b34fb');
      const char = await service.getCharacteristic('0000fff3-0000-1000-8000-00805f9b34fb');
      
      setBleDevice(device);
      setBleCharacteristic(char);
      setBleConnected(true);
      setBleDeviceName(device.name || 'ELK Device');
      
      // Apply user's saved color if available after manual connect
      if (user?.rgbColor) {
        const { r, g, b } = user.rgbColor;
        const brightness = user.brightness ?? 100;
        const sR = Math.round(r * (brightness / 100));
        const sG = Math.round(g * (brightness / 100));
        const sB = Math.round(b * (brightness / 100));
        await char.writeValue(
          new Uint8Array([0x7E, 0x07, 0x05, 0x03, sR, sG, sB, 0x10, 0xEF])
        );
      }
    } catch (err) {
      console.error('BLE connect error:', err);
    } finally {
      setBleConnecting(false);
    }
  };

  const disconnectBLE = async () => {
    if (bleDevice?.gatt?.connected) {
      bleDevice.gatt.disconnect();
    }
    setBleDevice(null);
    setBleCharacteristic(null);
    setBleConnected(false);
    setBleDeviceName('');
  };

  const handleAuth = (userData: any, isNewLogin: boolean = false) => {
    setUser(userData);
    setHasInteracted(true);
    if (isNewLogin) {
      setShowWelcome(true);
      autoConnectBLE(userData);
    }
  };

  const handleLogout = () => {
    // Disconnect BLE on logout
    if (bleDevice?.gatt?.connected) {
      bleDevice.gatt.disconnect();
    }
    setBleDevice(null);
    setBleCharacteristic(null);
    setBleConnected(false);
    setBleDeviceName('');
    auth.signOut();
    setUser(null);
    setHasInteracted(false);
    setIsLauncherOpen(false);
    setActiveApp(null);
  };



  // Synchronize Global Accent Color
  useEffect(() => {
    if (user?.accentColor) {
      const root = document.documentElement;
      root.style.setProperty('--accent-primary', user.accentColor);
      // Generate partial opacity versions for glassmorphism
      root.style.setProperty('--accent-glow', `${user.accentColor}4D`); // 30% alpha
      root.style.setProperty('--border-accent', `${user.accentColor}33`); // 20% alpha
    } else {
      // Reset to default electric blue if no preference
      const root = document.documentElement;
      root.style.setProperty('--accent-primary', '#00f2ff');
      root.style.setProperty('--accent-glow', 'rgba(0, 242, 255, 0.3)');
      root.style.setProperty('--border-accent', 'rgba(0, 242, 255, 0.2)');
    }
  }, [user?.accentColor]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch enriched profile from Firestore via Backend
          const profile = await getUserProfile();
          handleAuth(profile, false);
          // Auto-connect BLE on session restore too
          autoConnectBLE(profile);
        } catch (error) {
          // Fallback to basic Firebase info if profile fetch fails
          handleAuth({
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'Authorized User',
            email: firebaseUser.email,
          }, false);
        }
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

      if (isAuthModalOpen || showWelcome || isInhibitingSleep) return;

      const standbyVal = user?.standByDelay || CONFIG.STANDBY_DELAY;
      const logoutVal = user?.terminationDelay || CONFIG.TERMINATION_DELAY;

      if (hasInteracted) {
        sleepTimeout = setTimeout(() => {
          setHasInteracted(false);
          setActiveApp(null);
        }, standbyVal);
      }

      terminationTimeout = setTimeout(() => {
        if (user) handleLogout();
      }, logoutVal);

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

  const getWidgetsForLocation = (location: string) => {
    const settings = user?.widgetSettings || {
      news: { enabled: true, location: 'top-left' },
      clockWeather: { enabled: true, location: 'top-right' },
      reminder: { enabled: true, location: 'top-right' },
      music: { enabled: true, location: 'bottom-right' }
    };

    const widgets = [];
    if (settings.news?.enabled && settings.news?.location === location) {
      widgets.push(<div key="news" style={{ pointerEvents: 'auto' }}><NewsWidget location={location} /></div>);
    }
    if (settings.reminder?.enabled && settings.reminder?.location === location) {
      widgets.push(<div key="reminder" style={{ pointerEvents: 'auto' }}><ReminderWidget user={user} location={location} /></div>);
    }
    if (settings.clockWeather?.enabled && settings.clockWeather?.location === location) {
      widgets.push(
        <div key="clockWeather" style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: location.includes('right') ? 'flex-end' : 'flex-start', gap: '1rem' }}>
          <Clock location={location} />
          <Weather location={location} />
        </div>
      );
    }
    if (settings.music?.enabled && settings.music?.location === location) {
      widgets.push(<div key="music" style={{ pointerEvents: 'auto' }}><MusicWidget location={location} /></div>);
    }
    
    return widgets;
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
        <VoiceAssistant user={user}/>
        {/* Dynamic Widget Corners */}
        <div style={{ position: 'fixed', top: '2rem', left: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'flex-start', zIndex: 2000, pointerEvents: 'none' }}>
           {getWidgetsForLocation('top-left')}
        </div>

        <div style={{ position: 'fixed', top: '2rem', right: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'flex-end', zIndex: 2000, pointerEvents: 'none' }}>
           {getWidgetsForLocation('top-right')}
        </div>

        <div style={{ position: 'fixed', bottom: '2rem', left: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'flex-start', zIndex: 2000, pointerEvents: 'none' }}>
           {getWidgetsForLocation('bottom-left')}
        </div>

        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'flex-end', zIndex: 2000, pointerEvents: 'none' }}>
           {getWidgetsForLocation('bottom-right')}
        </div>

        {user===null && (
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
          onUpdateUser={(updatedData) => handleAuth({ ...user, ...updatedData })}
          onInhibitSleep={setIsInhibitingSleep}
          bleProps={{
            bleConnected,
            bleConnecting,
            bleDeviceName,
            bleCharacteristic,
            connectBLE,
            disconnectBLE
          }}
        />

        {/* Global Multimedia Layer */}
        <GlobalPlayer />
        <MusicSyncManager 
          bleConnected={bleConnected}
          bleCharacteristic={bleCharacteristic}
          user={user}
        />
      </motion.div>
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'black',
        opacity: 1 - (user?.appBrightness ?? CONFIG.DEFAULT_APP_BRIGHTNESS) / 100,
        pointerEvents: 'none',
        zIndex: 10000,
        transition: 'opacity 0.3s ease'
      }} />
    </>
  );
}

export default App;
