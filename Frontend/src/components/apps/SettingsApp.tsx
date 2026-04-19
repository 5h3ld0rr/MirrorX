import { useState, useRef, useCallback, useEffect } from 'react';
import { Settings, User, Bell, Shield, Palette, HelpCircle, LogOut, Check, Loader2, ChevronRight, Sun, Lock, Lightbulb, Bluetooth, BluetoothOff, Power, Zap } from 'lucide-react';
import { updateProfile, updateProfilePicture } from '../../lib/api';

export const SettingsApp = ({ user, onLogout, onUpdateUser, bleConnected, bleConnecting, bleDeviceName, bleCharacteristic, connectBLE, disconnectBLE }: { 
  user: any, 
  onLogout: () => void,
  onUpdateUser: (data: any) => void,
  bleConnected: boolean,
  bleConnecting: boolean,
  bleDeviceName: string,
  bleCharacteristic: any,
  connectBLE: () => Promise<void>,
  disconnectBLE: () => Promise<void>
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('Profile');
  
  const sections = [
    { title: 'Profile', icon: <User size={20} /> },
    { title: 'Notifications', icon: <Bell size={20} /> },
    { title: 'Security', icon: <Shield size={20} /> },
    { title: 'Appearance', icon: <Palette size={20} /> },
    { title: 'RGB Controller', icon: <Lightbulb size={20} /> },
    { title: 'Help & Support', icon: <HelpCircle size={20} /> },
  ];

  // Profile State
  const [name, setName] = useState(user.name || '');
  const [bio, setBio] = useState(user.bio || "Passionate creator and early adopter of MirrorX tech.");
  const [photoURL, setPhotoURL] = useState(user.photoURL || '');
  
  // Appearance & Notification State
  const [accentColor, setAccentColor] = useState(user.accentColor || '#00f2ff');
  const [messagesEnabled, setMessagesEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [appBrightness, setAppBrightness] = useState(user.appBrightness ?? 100);
  
  // RGB State
  const [rgbColor, setRgbColor] = useState(user.rgbColor || { r: 255, g: 0, b: 0 });
  const [brightness, setBrightness] = useState(user.brightness ?? 100);
  const [ledPower, setLedPower] = useState(true);
  const [rgbHue, setRgbHue] = useState(0);
  const [rgbSat] = useState(100);
  const colorWheelRef = useRef<HTMLCanvasElement>(null);
  const saveTimerRef = useRef<any>(null);

  // Save RGB settings to Firestore (debounced)
  const saveRgbToCloud = useCallback((color: { r: number, g: number, b: number }, bright: number) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await updateProfile({ rgbColor: color, brightness: bright });
        onUpdateUser({ rgbColor: color, brightness: bright });
      } catch (err) {
        console.error('Failed to save RGB settings:', err);
      }
    }, 800);
  }, [onUpdateUser]);

  const saveAppBrightnessToCloud = useCallback((bright: number) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await updateProfile({ appBrightness: bright });
        onUpdateUser({ appBrightness: bright });
      } catch (err) {
        console.error('Failed to save app brightness:', err);
      }
    }, 800);
  }, [onUpdateUser]);

  const saveAccentColorToCloud = useCallback((color: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await updateProfile({ accentColor: color });
        onUpdateUser({ accentColor: color });
      } catch (err) {
        console.error('Failed to save accent color:', err);
      }
    }, 800);
  }, [onUpdateUser]);


  // Cleanup save timer on unmount
  useEffect(() => {
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, []);

  // HSL to RGB conversion
  const hslToRgb = useCallback((h: number, s: number, l: number) => {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    };
    return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
  }, []);
  
  const rgbToHue = useCallback((r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0;
    if (max !== min) {
      const d = max - min;
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return Math.round(h * 360);
  }, []);

  // Send RGB command over BLE
  const sendRgbCommand = useCallback(async (r: number, g: number, b: number) => {
    if (!bleCharacteristic) return;
    try {
      const scaledR = Math.round(r * (brightness / 100));
      const scaledG = Math.round(g * (brightness / 100));
      const scaledB = Math.round(b * (brightness / 100));
      await bleCharacteristic.writeValue(
        new Uint8Array([0x7E, 0x07, 0x05, 0x03, scaledR, scaledG, scaledB, 0x10, 0xEF])
      );
    } catch (err) {
      console.error('BLE write error:', err);
    }
  }, [bleCharacteristic, brightness]);

  // Send power command
  const sendPowerCommand = useCallback(async (on: boolean) => {
    if (!bleCharacteristic) return;
    try {
      if (on) {
        await sendRgbCommand(rgbColor.r, rgbColor.g, rgbColor.b);
      } else {
        await bleCharacteristic.writeValue(
          new Uint8Array([0x7E, 0x07, 0x05, 0x03, 0x00, 0x00, 0x00, 0x10, 0xEF])
        );
      }
    } catch (err) {
      console.error('BLE power error:', err);
    }
  }, [bleCharacteristic, rgbColor, sendRgbCommand]);

  // Draw color wheel
  useEffect(() => {
    const canvas = colorWheelRef.current;
    if (!canvas || activeTab !== 'RGB Controller') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 8;

    // Draw hue ring
    for (let angle = 0; angle < 360; angle++) {
      const startAngle = (angle - 1) * Math.PI / 180;
      const endAngle = (angle + 1) * Math.PI / 180;
      ctx.beginPath();
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.arc(center, center, radius - 32, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = `hsl(${angle}, 100%, 50%)`;
      ctx.fill();
    }

    // Draw selector dot
    const selectorAngle = rgbHue * Math.PI / 180;
    const selectorR = radius - 16;
    const sx = center + selectorR * Math.cos(selectorAngle);
    const sy = center + selectorR * Math.sin(selectorAngle);
    ctx.beginPath();
    ctx.arc(sx, sy, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [rgbHue, activeTab]);

  // Handle color wheel interaction
  const handleWheelInteraction = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = colorWheelRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left - rect.width / 2;
    const y = clientY - rect.top - rect.height / 2;
    let angle = Math.atan2(y, x) * 180 / Math.PI;
    if (angle < 0) angle += 360;
    const hue = Math.round(angle) % 360;
    setRgbHue(hue);
    const newColor = hslToRgb(hue, rgbSat, 50);
    setRgbColor(newColor);
    if (bleConnected && ledPower) {
      sendRgbCommand(newColor.r, newColor.g, newColor.b);
    }
    saveRgbToCloud(newColor, brightness);
  }, [hslToRgb, rgbSat, bleConnected, ledPower, sendRgbCommand, saveRgbToCloud, brightness]);

  const [isDraggingWheel, setIsDraggingWheel] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const result = await updateProfilePicture(formData);
      setPhotoURL(result.photoURL);
      onUpdateUser({ photoURL: result.photoURL });
    } catch (error) {
      console.error("❌ Upload error:", error);
      setUpdateStatus('error');
    } finally {
      setIsUploadingPhoto(false);
      // Reset input so the same file can be uploaded again
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    setUpdateStatus('idle');
    try {
      await updateProfile({ name, bio });
      onUpdateUser({ name, bio });
      setUpdateStatus('success');
      setTimeout(() => setUpdateStatus('idle'), 3000);
    } catch (error) {
      console.error(error);
      setUpdateStatus('error');
    } finally {
      setIsUpdating(false);
    }
  };

  const renderSectionContent = () => {
    switch(activeTab) {
      case 'Profile':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Matching Social Profile Header */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', marginBottom: '4rem', width: '100%' }}>
              <div style={{ position: 'relative' }}>
                {/* Perfect Circle Avatar with Real Image Support */}
                <div 
                  className="avatar-container"
                  style={{ 
                    width: '180px', 
                    height: '180px', 
                    borderRadius: '50%', 
                    background: 'linear-gradient(135deg, #2c2c2e, #1c1c1e)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '5rem',
                    fontWeight: 300,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    position: 'relative',
                    border: '1px solid rgba(255,255,255,0.05)',
                    overflow: 'hidden' // Critical to clip the image to a circle
                  }}
                >
                  {photoURL ? (
                    <img 
                      src={photoURL} 
                      alt="Profile" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover', 
                        objectPosition: 'center',
                        display: 'block'
                      }} 
                    />
                  ) : (
                    name?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                
                {/* Black Camera Trigger */}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ 
                    position: 'absolute', 
                    bottom: '10px', 
                    right: '10px', 
                    width: '52px', 
                    height: '52px', 
                    borderRadius: '50%', 
                    background: '#000', 
                    border: '3px solid #fff', 
                    color: '#fff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
                    zIndex: 100,
                    transition: 'all 0.3s ease',
                    padding: 0
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {isUploadingPhoto ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                      <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                  )}
                </button>
              </div>

              <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: 600, marginBottom: '0.2rem', color: 'white' }}>Hi, {name || 'User'}</h1>
                <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.4)' }}>{user.email}</p>
                <button 
                  onClick={() => { setPhotoURL(''); onUpdateUser({ photoURL: '' }); }}
                  style={{ marginTop: '1rem', background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '0.9rem', opacity: 0.6 }}
                >
                  Remove Avatar
                </button>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '24px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <User size={22} color="var(--accent-primary)" />
                Public Identity
              </h3>
              
              <div className="input-group" style={{ marginBottom: '2rem' }}>
                <label>Legal Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div className="input-group">
                <label>Mirror Bio</label>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', minHeight: '120px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '1rem', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2.5rem' }}>
                <button 
                  onClick={handleUpdateProfile}
                  disabled={isUpdating}
                  className="glass-panel" 
                  style={{ padding: '1rem 2.5rem', background: updateStatus === 'success' ? '#4ade80' : 'var(--accent-primary)', color: updateStatus === 'success' ? 'white' : 'black', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.8rem' }}
                >
                  {isUpdating ? <Loader2 size={18} className="animate-spin" /> : (updateStatus === 'success' ? <Check size={18} /> : null)}
                  {isUpdating ? 'Synchronizing...' : (updateStatus === 'success' ? 'Identity Updated' : 'Save Changes')}
                </button>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', border: '1px solid rgba(255, 68, 68, 0.2)', borderRadius: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.8rem', color: '#ff4d4d' }}>Danger Zone</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Permanent deletion of your MirrorX identity and associated neural data.</p>
              <button style={{ padding: '0.8rem 1.5rem', border: '1px solid #ff4d4d', color: '#ff4d4d', background: 'transparent' }}>Erase Identity</button>
            </div>
          </div>
        );
      case 'Notifications':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
             <h2 style={{ fontSize: '2rem', fontWeight: 600 }}>Notifications</h2>
             <div className="glass-panel" style={{ padding: '2rem', borderRadius: '24px' }}>
                {/* Direct Messages Toggle */}
                <div 
                  onClick={() => setMessagesEnabled(!messagesEnabled)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                >
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>Mirror Direct Messages</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Get notified when you receive messages on the mirror surface.</p>
                  </div>
                  <div style={{ 
                    width: '50px', 
                    height: '26px', 
                    background: messagesEnabled ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)', 
                    borderRadius: '20px', 
                    position: 'relative',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ 
                      position: 'absolute', 
                      left: messagesEnabled ? '27px' : '3px', 
                      top: '3px', 
                      width: '20px', 
                      height: '20px', 
                      background: messagesEnabled ? 'black' : 'white', 
                      borderRadius: '50%',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }} />
                  </div>
                </div>

                {/* Biometric Toggle */}
                <div 
                  onClick={() => setBiometricEnabled(!biometricEnabled)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 0', cursor: 'pointer' }}
                >
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>Biometric Alerts</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Security alerts for unrecognized face detection attempts.</p>
                  </div>
                   <div style={{ 
                     width: '50px', 
                     height: '26px', 
                     background: biometricEnabled ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)', 
                     borderRadius: '20px', 
                     position: 'relative',
                     transition: 'all 0.3s ease'
                   }}>
                    <div style={{ 
                      position: 'absolute', 
                      left: biometricEnabled ? '27px' : '3px', 
                      top: '3px', 
                      width: '20px', 
                      height: '20px', 
                      background: biometricEnabled ? 'black' : 'white', 
                      borderRadius: '50%',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }} />
                  </div>
                </div>
             </div>
          </div>
        );
      case 'Appearance':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
             <h2 style={{ fontSize: '2rem', fontWeight: 600 }}>Appearance</h2>
             <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '24px' }}>

                <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1.5rem', display: 'block' }}>Accent Color</label>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    {['#00f2ff', '#ff00ff', '#facc15', '#4ade80', '#ffffff'].map(c => (
                      <div 
                        key={c} 
                        onClick={() => {
                          setAccentColor(c);
                          onUpdateUser({ accentColor: c }); // Immediate glow preview
                          saveAccentColorToCloud(c);
                        }}
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '50%', 
                          background: c, 
                          cursor: 'pointer',
                          border: accentColor === c ? '3px solid white' : 'none',
                          boxShadow: accentColor === c ? `0 0 15px ${c}` : 'none'
                        }} 
                      />
                    ))}
                </div>

                <div style={{ marginTop: '3.5rem' }}>
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', letterSpacing: '0.05em' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}><Sun size={14} /> Screen Brightness</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '1rem', color: 'white', fontWeight: 600 }}>{appBrightness}%</span>
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={appBrightness}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setAppBrightness(val);
                        onUpdateUser({ appBrightness: val });
                        saveAppBrightnessToCloud(val);
                      }}
                      style={{
                        width: '100%', height: '8px', borderRadius: '4px',
                        appearance: 'none', outline: 'none', cursor: 'pointer',
                        background: `linear-gradient(to right, rgba(255,255,255,0.05) 0%, var(--accent-primary) ${appBrightness}%, rgba(255,255,255,0.08) ${appBrightness}%)`,
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.6rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Dimmed</span><span>Full Luminance</span>
                    </div>
                </div>
             </div>
          </div>
        );
      case 'Security':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
             <h2 style={{ fontSize: '2rem', fontWeight: 600 }}>Security & Privacy</h2>
             <div className="glass-panel" style={{ padding: '2rem', borderRadius: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.8rem', background: 'rgba(0, 242, 255, 0.1)', borderRadius: '12px' }}>
                    <Lock size={24} color="var(--accent-primary)" />
                  </div>
                  <div style={{ flex: 1 }}>
                     <h4 style={{ marginBottom: '0.2rem' }}>Two-Factor Authentication</h4>
                     <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Current Status: <span style={{ color: '#4ade80' }}>Active</span></p>
                  </div>
                  <ChevronRight size={20} color="var(--text-muted)" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
                  <div style={{ padding: '0.8rem', background: 'rgba(255, 61, 61, 0.1)', borderRadius: '12px' }}>
                    <Shield size={24} color="#ff4d4d" />
                  </div>
                  <div style={{ flex: 1 }}>
                     <h4 style={{ marginBottom: '0.2rem' }}>Biometric Data History</h4>
                     <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Manage your stored facial recognition descriptors.</p>
                  </div>
                  <ChevronRight size={20} color="var(--text-muted)" />
                </div>
             </div>
          </div>
        )
      case 'RGB Controller':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <Lightbulb size={28} color="var(--accent-primary)" />
              RGB Controller
            </h2>

            {/* Connection Card */}
            <div className="glass-panel" style={{ padding: '2rem', borderRadius: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: bleConnected ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s ease'
                  }}>
                    {bleConnected
                      ? <Bluetooth size={24} color="#4ade80" />
                      : <BluetoothOff size={24} color="var(--text-muted)" />
                    }
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.15rem' }}>
                      {bleConnected ? bleDeviceName : 'No Device Connected'}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: bleConnected ? '#4ade80' : 'var(--text-muted)' }}>
                      {bleConnected ? '● Connected' : 'Tap to pair your ELK LED strip'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={bleConnected ? disconnectBLE : connectBLE}
                  disabled={bleConnecting}
                  style={{
                    padding: '0.7rem 1.5rem', borderRadius: '12px', fontWeight: 600, fontSize: '0.9rem',
                    background: bleConnected ? 'rgba(255, 77, 77, 0.12)' : 'var(--accent-primary)',
                    color: bleConnected ? '#ff4d4d' : 'black',
                    border: bleConnected ? '1px solid rgba(255,77,77,0.25)' : 'none',
                    cursor: bleConnecting ? 'wait' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {bleConnecting
                    ? <><Loader2 size={16} className="animate-spin" /> Scanning...</>
                    : bleConnected ? 'Disconnect' : 'Connect'
                  }
                </button>
              </div>
            </div>

            {/* Color Wheel + Controls */}
            <div style={{ opacity: bleConnected ? 1 : 0.35, pointerEvents: bleConnected ? 'auto' : 'none', transition: 'opacity 0.4s ease' }}>
              {/* Power Toggle */}
              <div className="glass-panel" style={{ padding: '1.5rem 2rem', borderRadius: '24px', marginBottom: '2rem' }}>
                <div
                  onClick={() => {
                    const next = !ledPower;
                    setLedPower(next);
                    sendPowerCommand(next);
                  }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Power size={22} color={ledPower ? '#4ade80' : 'var(--text-muted)'} />
                    <div>
                      <h4 style={{ fontSize: '1.05rem' }}>LED Power</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{ledPower ? 'Lights are on' : 'Lights are off'}</p>
                    </div>
                  </div>
                  <div style={{
                    width: '50px', height: '26px',
                    background: ledPower ? '#4ade80' : 'rgba(255,255,255,0.1)',
                    borderRadius: '20px', position: 'relative',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{
                      position: 'absolute',
                      left: ledPower ? '27px' : '3px', top: '3px',
                      width: '20px', height: '20px',
                      background: ledPower ? 'white' : 'rgba(255,255,255,0.7)',
                      borderRadius: '50%',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }} />
                  </div>
                </div>
              </div>

              {/* Color Wheel */}
              <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '24px', marginBottom: '2rem' }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1.5rem', display: 'block', letterSpacing: '0.05em' }}>Color Wheel</label>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative' }}>
                    <canvas
                      ref={colorWheelRef}
                      width={220}
                      height={220}
                      style={{ cursor: 'crosshair', borderRadius: '50%' }}
                      onMouseDown={(e) => { setIsDraggingWheel(true); handleWheelInteraction(e); }}
                      onMouseMove={(e) => { if (isDraggingWheel) handleWheelInteraction(e); }}
                      onMouseUp={() => setIsDraggingWheel(false)}
                      onMouseLeave={() => setIsDraggingWheel(false)}
                      onTouchStart={(e) => { setIsDraggingWheel(true); handleWheelInteraction(e); }}
                      onTouchMove={(e) => { if (isDraggingWheel) handleWheelInteraction(e); }}
                      onTouchEnd={() => setIsDraggingWheel(false)}
                    />
                    {/* Center preview */}
                    <div style={{
                      position: 'absolute', top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '80px', height: '80px', borderRadius: '50%',
                      background: `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})`,
                      boxShadow: `0 0 30px rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.5), inset 0 0 15px rgba(255,255,255,0.1)`,
                      border: '3px solid rgba(255,255,255,0.15)',
                      transition: 'background 0.15s ease, box-shadow 0.15s ease'
                    }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '160px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Manual Input</div>
                    {/* R / G / B inputs */}
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      {([
                        { key: 'r' as const, label: 'R', color: '#ff6b6b' },
                        { key: 'g' as const, label: 'G', color: '#51cf66' },
                        { key: 'b' as const, label: 'B', color: '#339af0' },
                      ]).map(ch => (
                        <div key={ch.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: ch.color }}>{ch.label}</label>
                          <input
                            type="number"
                            min={0}
                            max={255}
                            value={rgbColor[ch.key]}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
                              const newColor = { ...rgbColor, [ch.key]: val };
                              setRgbColor(newColor);
                              setRgbHue(rgbToHue(newColor.r, newColor.g, newColor.b));
                            }}
                            onBlur={() => {
                              if (bleConnected && ledPower) sendRgbCommand(rgbColor.r, rgbColor.g, rgbColor.b);
                              saveRgbToCloud(rgbColor, brightness);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (bleConnected && ledPower) sendRgbCommand(rgbColor.r, rgbColor.g, rgbColor.b);
                                saveRgbToCloud(rgbColor, brightness);
                              }
                            }}
                            style={{
                              width: '76px', padding: '0.7rem 0.4rem', borderRadius: '12px',
                              background: 'rgba(255,255,255,0.06)', border: `1px solid ${ch.color}33`,
                              color: ch.color, fontFamily: 'monospace', fontSize: '1.5rem',
                              fontWeight: 700, textAlign: 'center', outline: 'none',
                              transition: 'border-color 0.2s ease',
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = ch.color}
                            onBlurCapture={(e) => e.currentTarget.style.borderColor = `${ch.color}33`}
                          />
                        </div>
                      ))}
                    </div>
                    {/* Hex input */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '1.3rem', fontWeight: 600 }}>#</span>
                      <input
                        type="text"
                        maxLength={6}
                        value={`${rgbColor.r.toString(16).padStart(2, '0')}${rgbColor.g.toString(16).padStart(2, '0')}${rgbColor.b.toString(16).padStart(2, '0')}`}
                        onChange={(e) => {
                          const hex = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
                          if (hex.length === 6) {
                            const r = parseInt(hex.substring(0, 2), 16);
                            const g = parseInt(hex.substring(2, 4), 16);
                            const b = parseInt(hex.substring(4, 6), 16);
                            setRgbColor({ r, g, b });
                            setRgbHue(rgbToHue(r, g, b));
                          }
                        }}
                        onBlur={() => {
                          if (bleConnected && ledPower) sendRgbCommand(rgbColor.r, rgbColor.g, rgbColor.b);
                          saveRgbToCloud(rgbColor, brightness);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (bleConnected && ledPower) sendRgbCommand(rgbColor.r, rgbColor.g, rgbColor.b);
                            saveRgbToCloud(rgbColor, brightness);
                          }
                        }}
                        style={{
                          flex: 1, padding: '0.7rem 0.8rem', borderRadius: '12px',
                          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                          color: 'white', fontFamily: 'monospace', fontSize: '1.15rem',
                          fontWeight: 600, textTransform: 'uppercase', outline: 'none',
                          letterSpacing: '0.1em', transition: 'border-color 0.2s ease',
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                        onBlurCapture={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preset Colors */}
              <div className="glass-panel" style={{ padding: '2rem', borderRadius: '24px', marginBottom: '2rem' }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1.5rem', display: 'block', letterSpacing: '0.05em' }}>Quick Presets</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '1rem' }}>
                  {[
                    { name: 'Red', r: 255, g: 0, b: 0 },
                    { name: 'Orange', r: 255, g: 120, b: 0 },
                    { name: 'Yellow', r: 255, g: 255, b: 0 },
                    { name: 'Green', r: 0, g: 255, b: 0 },
                    { name: 'Cyan', r: 0, g: 255, b: 255 },
                    { name: 'Blue', r: 0, g: 0, b: 255 },
                    { name: 'Pink', r: 255, g: 0, b: 128 },
                    { name: 'White', r: 255, g: 255, b: 255 },
                    { name: 'Warm', r: 255, g: 180, b: 100 },
                  ].map(preset => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        const c = { r: preset.r, g: preset.g, b: preset.b };
                        setRgbColor(c);
                        setRgbHue(rgbToHue(c.r, c.g, c.b));
                        if (ledPower) sendRgbCommand(preset.r, preset.g, preset.b);
                        saveRgbToCloud(c, brightness);
                      }}
                      title={preset.name}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                        background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem'
                      }}
                    >
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '50%',
                        background: `rgb(${preset.r}, ${preset.g}, ${preset.b})`,
                        boxShadow: (rgbColor.r === preset.r && rgbColor.g === preset.g && rgbColor.b === preset.b)
                          ? `0 0 16px rgba(${preset.r}, ${preset.g}, ${preset.b}, 0.6), 0 0 0 3px rgba(255,255,255,0.4)`
                          : `0 4px 12px rgba(${preset.r}, ${preset.g}, ${preset.b}, 0.25)`,
                        border: (rgbColor.r === preset.r && rgbColor.g === preset.g && rgbColor.b === preset.b)
                          ? '2px solid white' : '2px solid transparent',
                        transition: 'all 0.25s ease',
                      }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Brightness Slider */}
              <div className="glass-panel" style={{ padding: '2rem', borderRadius: '24px' }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', letterSpacing: '0.05em' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Zap size={14} /> Brightness</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '1rem', color: 'white', fontWeight: 600 }}>{brightness}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={brightness}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setBrightness(val);
                    if (ledPower) {
                      sendRgbCommand(rgbColor.r, rgbColor.g, rgbColor.b);
                    }
                    saveRgbToCloud(rgbColor, val);
                  }}
                  style={{
                    width: '100%', height: '8px', borderRadius: '4px',
                    appearance: 'none', outline: 'none', cursor: 'pointer',
                    background: `linear-gradient(to right, rgba(255,255,255,0.05) 0%, rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}) ${brightness}%, rgba(255,255,255,0.08) ${brightness}%)`,
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Off</span><span>Max</span>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <div style={{ opacity: 0.5, textAlign: 'center', marginTop: '10rem' }}>Section under development</div>;
    }
  };

  return (
    <div className="app-content" style={{ display: 'flex', height: '100%', background: 'linear-gradient(135deg, rgba(0,0,0,0.8), rgba(20,20,30,0.4))' }}>
      {/* Sidebar */}
      <div style={{ width: '320px', padding: '3rem 2rem', borderRight: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)' }}>
        <div style={{ height: '1.5rem' }} />
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {sections.map((section) => (
            <button
              key={section.title}
              onClick={() => setActiveTab(section.title)}
              className="glass-panel"
              style={{ 
                padding: '1.2rem 1.5rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1.2rem', 
                background: activeTab === section.title ? 'rgba(0, 242, 255, 0.08)' : 'transparent',
                borderColor: activeTab === section.title ? 'rgba(0, 242, 255, 0.3)' : 'transparent',
                color: activeTab === section.title ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                borderRadius: '16px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: activeTab === section.title ? '0 10px 20px rgba(0, 242, 255, 0.05)' : 'none'
              }}
            >
              <div style={{ transform: activeTab === section.title ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.3s' }}>
                {section.icon}
              </div>
              <span style={{ fontWeight: activeTab === section.title ? 600 : 400, fontSize: '1.05rem' }}>{section.title}</span>
              {activeTab === section.title && <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)' }} />}
            </button>
          ))}
        </div>

        <button 
          onClick={onLogout}
          className="glass-panel" 
          style={{ width: '100%', padding: '1.2rem', marginTop: '4rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid rgba(255, 61, 61, 0.15)', color: '#ff4d4d', cursor: 'pointer', borderRadius: '16px', fontWeight: 500 }}
        >
          <LogOut size={20} /> Sign Out of MirrorX
        </button>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, padding: '4rem 6rem', overflowY: 'auto' }}>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handlePhotoUpload} 
          accept="image/*" 
          style={{ display: 'none' }} 
        />
        
        <div style={{ maxWidth: '850px' }}>
          {renderSectionContent()}
        </div>
      </div>
    </div>
  );
};
