import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Palette, HelpCircle, LogOut, Check, Loader2, ChevronRight, Sun, Lock, Lightbulb, Bluetooth, BluetoothOff, Power, Zap, Moon, Timer, MessageSquare, Cpu, FileText, X, Send, Bot, Music } from 'lucide-react';
import { updateProfile, updateProfilePicture } from '../../lib/api';
import { CONFIG } from '../../config';

// Helper: RGB to Hue
const rgbToHue = (r: number, g: number, b: number) => {
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
};

// Helper: HSL to RGB
const hslToRgb = (h: number, s: number, l: number) => {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hue2rgb = (t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    r = hue2rgb(h + 1/3);
    g = hue2rgb(h);
    b = hue2rgb(h - 1/3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};

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
    { title: 'Widgets', icon: <Cpu size={20} /> },
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
  const [standByDelay, setStandByDelay] = useState(user.standByDelay || CONFIG.STANDBY_DELAY);
  const [terminationDelay, setTerminationDelay] = useState(user.terminationDelay || CONFIG.TERMINATION_DELAY);
  
  // Widget Customization State
  const [widgetSettings, setWidgetSettings] = useState(user.widgetSettings || {
    news: { enabled: true, location: 'top-left' },
    clockWeather: { enabled: true, location: 'top-right' },
    reminder: { enabled: true, location: 'top-right' },
    music: { enabled: true, location: 'bottom-right' }
  });

  // Sync state with user prop changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || "Passionate creator and early adopter of MirrorX tech.");
      setPhotoURL(user.photoURL || '');
      setAccentColor(user.accentColor || '#00f2ff');
      setAppBrightness(user.appBrightness ?? 100);
      setRgbColor(user.rgbColor || { r: 255, g: 0, b: 0 });
      setBrightness(user.brightness ?? 100);
      setStandByDelay(user.standByDelay || CONFIG.STANDBY_DELAY);
      setTerminationDelay(user.terminationDelay || CONFIG.TERMINATION_DELAY);
      if (user.widgetSettings) setWidgetSettings(user.widgetSettings);
      
      if (user.rgbColor) {
        setRgbHue(rgbToHue(user.rgbColor.r, user.rgbColor.g, user.rgbColor.b));
      }
    }
  }, [user]);
  const colorWheelRef = useRef<HTMLCanvasElement>(null);
  const saveTimerRef = useRef<any>(null);

  // Chat State
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState(() => {
    const saved = localStorage.getItem('mirrorx_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved chat history", e);
      }
    }
    return [
      { role: 'assistant', content: "Hello! I'm the MirrorX Virtual Assistant. How can I help you today?" }
    ];
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, showChat]);

  // Persist chat history
  useEffect(() => {
    localStorage.setItem('mirrorx_chat_history', JSON.stringify(chatHistory));
  }, [chatHistory]);

  const [isBotTyping, setIsBotTyping] = useState(false);

  const getBotResponse = (msg: string) => {
    const text = msg.toLowerCase();
    
    // Sinhala keywords detection
    if (text.includes("mehem newei") || text.includes("mun penn")) return "I completely understand. You want your face to be rendered perfectly. I've activated the Neural Face Sync module in the Virtual Try-On. Try the 'Model Sync' mode and align your face in the target zone for a perfect high-definition portrait!";
    if (text.includes("aiyo") || text.includes("muna vithrk")) return "My apologies! I've updated the system now. It will now extract ONLY your face and blend it seamlessly onto the professional model using elliptical neural masking. This way, it looks like YOU are wearing the clothes properly in a studio setting. Give it a try now!";
    if (text.includes("ath kakula") || text.includes("andala wage")) return "I've just deployed the 'Body Fit' neural module! You can now use the 'ARMS FORWARD' and 'FEET IN FRONT' controls in the AR Mirror to make your actual limbs appear over the dress. This makes it look like you are truly wearing the dress properly. Try snapping a photo now!";
    if (text.includes("adumk 4to") || text.includes("upload")) return "Yes! You can upload ANY garment photo to try it on. I have added a 'NEURAL UPLOAD' button at the top of the Mirror Fashion app. Just click that, select your item's photo, and my neural systems will instantly map it to your body reflection. You can then adjust the fit manually!";
    if (text.includes("kohomada") || text.includes("help")) return "I can help you with RGB Controller, Appearance settings, and Security. What would you like to know?";
    if (text.includes("puluwanda")) return "Yes, I can assist you with any MirrorX platform features. Just ask!";
    if (text.includes("mokakda") || text.includes("what is")) return "I am the MirrorX Neural Assistant, your personal gateway to mastering this OS.";
    
    // English keywords
    if (text.includes("rgb") || text.includes("led") || text.includes("light")) return "To manage your RGB setup, head to the 'RGB Controller' tab. Make sure your ELK hardware is powered on!";
    if (text.includes("color") || text.includes("appearance")) return "You can customize the accent color and system brightness in the 'Appearance' section.";
    if (text.includes("safety") || text.includes("security") || text.includes("privacy")) return "MirrorX uses hardware-level encryption for your biometric data. It never leaves this device.";
    if (text.includes("bluetooth") || text.includes("connect")) return "Ensure your device Bluetooth is active and seek the ELK strip in the RGB settings to pair.";
    if (text.includes("hi") || text.includes("hello") || text.includes("hey")) return "Hello! MirrorX Assistant is online. How can I help you today?";
    if (text.includes("thanks") || text.includes("thank")) return "You're welcome! I'm here if you need anything else.";
    
    return "I've logged your query. Our specialist neural agents are analyzing your request. Is there anything specific about the MirrorX tabs I can clarify for you now?";
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim() || isBotTyping) return;
    
    const userMsg = chatMessage.trim();
    const newHist = [...chatHistory, { role: 'user', content: userMsg }];
    setChatHistory(newHist);
    setChatMessage('');
    setIsBotTyping(true);

    // Simulate "Neural Processing"
    setTimeout(() => {
      const response = getBotResponse(userMsg);
      setChatHistory((prev: any) => [...prev, { role: 'assistant', content: response }]);
      setIsBotTyping(false);
    }, 1500);
  };

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

  const saveSecuritySettingsToCloud = useCallback((standby: number, logout: number) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await updateProfile({ standbyDelay: standby, logoutDelay: logout });
        onUpdateUser({ standByDelay: standby, terminationDelay: logout });
      } catch (err) {
        console.error('Failed to save security settings:', err);
      }
    }, 800);
  }, [onUpdateUser]);

  const saveWidgetsToCloud = async (settings: any) => {
    try {
      await updateProfile({ widgetSettings: settings });
      onUpdateUser({ widgetSettings: settings });
      return true;
    } catch (err) {
      console.error('Failed to save widget settings:', err);
      return false;
    }
  };



  // Cleanup save timer on unmount
  useEffect(() => {
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
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
      case 'Security': {
        const standbyOptions = [
          { label: '5 seconds', value: 5000 },
          { label: '15 seconds', value: 15000 },
          { label: '30 seconds', value: 30000 },
          { label: '1 minute', value: 60000 },
          { label: '2 minutes', value: 120000 },
          { label: '5 minutes', value: 300000 },
          { label: '10 minutes', value: 600000 },
          { label: 'Never', value: 2147483647 },
        ];

        const logoutOptions = [
          { label: '30 seconds', value: 30000 },
          { label: '1 minute', value: 60000 },
          { label: '2 minutes', value: 120000 },
          { label: '5 minutes', value: 300000 },
          { label: '10 minutes', value: 600000 },
          { label: '30 minutes', value: 1800000 },
          { label: 'Never', value: 2147483647 },
        ];

        const SettingRow = ({ title, subtitle, icon: Icon, value, options, onChange }: any) => (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '1.25rem 1.5rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            marginBottom: '0.5rem',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '10px', 
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon size={20} color="var(--accent-primary)" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>{title}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{subtitle}</span>
              </div>
            </div>
            <select
              value={value}
              onChange={(e) => onChange(parseInt(e.target.value))}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white',
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                outline: 'none',
                cursor: 'pointer',
                minWidth: '140px',
                appearance: 'none',
                backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                paddingRight: '2.5rem'
              }}
            >
              {options.map((opt: any) => (
                <option key={opt.value} value={opt.value} style={{ background: '#1a1a1a', color: 'white' }}>{opt.label}</option>
              ))}
            </select>
          </div>
        );

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
             <header style={{ marginBottom: '1rem' }}>
               <h2 style={{ fontSize: '2.2rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Security & Privacy</h2>
               <p style={{ color: 'var(--text-muted)' }}>Manage how MirrorX handles your presence and data.</p>
             </header>

             <div className="glass-panel" style={{ padding: '2rem', borderRadius: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', paddingLeft: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Screen & Sleep</h3>
                
                <SettingRow 
                  title="Turn my screen off after"
                  subtitle="Dims the display to save energy when no motion is detected"
                  icon={Moon}
                  value={standByDelay}
                  options={standbyOptions}
                  onChange={(val: number) => {
                    setStandByDelay(val);
                    saveSecuritySettingsToCloud(val, terminationDelay);
                  }}
                />

                <SettingRow 
                  title="Make my device log out after"
                  subtitle="Terminates your session automatically for security"
                  icon={Timer}
                  value={terminationDelay}
                  options={logoutOptions}
                  onChange={(val: number) => {
                    setTerminationDelay(val);
                    saveSecuritySettingsToCloud(standByDelay, val);
                  }}
                />

                <div style={{ marginTop: '2.5rem', padding: '1.5rem', background: 'rgba(255, 61, 61, 0.03)', borderRadius: '16px', border: '1px solid rgba(255, 61, 61, 0.08)', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ padding: '0.8rem', background: 'rgba(255, 61, 61, 0.1)', borderRadius: '12px' }}>
                    <Shield size={24} color="#ff4d4d" />
                  </div>
                  <div style={{ flex: 1 }}>
                     <h4 style={{ marginBottom: '0.1rem', fontSize: '1.05rem' }}>Identity Protection</h4>
                     <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Your biometric descriptors are encrypted and never leave the device hardware.</p>
                  </div>
                </div>
             </div>

             <div className="glass-panel" style={{ padding: '1.5rem 2rem', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Lock size={20} color="var(--text-muted)" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 500 }}>Biometric Data History</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>View and manage enrolled faces</p>
                  </div>
                </div>
                <ChevronRight size={20} color="var(--text-muted)" />
             </div>
          </div>
        );
      }
      
      case 'Widgets': {
        const locations = [
          { label: 'Top Left', value: 'top-left' },
          { label: 'Top Right', value: 'top-right' },
          { label: 'Bottom Left', value: 'bottom-left' },
          { label: 'Bottom Right', value: 'bottom-right' },
        ];

        const WidgetRow = ({ name, icon: Icon, id }: any) => {
          const config = widgetSettings[id as keyof typeof widgetSettings] || { enabled: true, location: 'top-right' };
          
          return (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '1.25rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '16px',
              marginBottom: '0.75rem',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '12px', 
                  background: config.enabled ? 'var(--accent-glow)' : 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease'
                }}>
                  <Icon size={22} color={config.enabled ? "var(--accent-primary)" : "var(--text-muted)"} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 500, color: config.enabled ? 'white' : 'var(--text-muted)' }}>{name}</span>
                  <div 
                    onClick={() => {
                        const newSettings = { 
                          ...widgetSettings, 
                          [id]: { ...config, enabled: !config.enabled } 
                        };
                        setWidgetSettings(newSettings);
                    }}
                    style={{ 
                      width: '40px', 
                      height: '20px', 
                      background: config.enabled ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)', 
                      borderRadius: '10px', 
                      position: 'relative',
                      cursor: 'pointer',
                      marginTop: '0.4rem',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ 
                      position: 'absolute', 
                      left: config.enabled ? '22px' : '2px', 
                      top: '2px', 
                      width: '16px', 
                      height: '16px', 
                      background: config.enabled ? 'black' : 'white', 
                      borderRadius: '50%',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }} />
                  </div>
                </div>
              </div>

              {config.enabled && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Location</span>
                  <select
                    value={config.location}
                    onChange={(e) => {
                       const newSettings = { 
                        ...widgetSettings, 
                        [id]: { ...config, location: e.target.value } 
                      };
                      setWidgetSettings(newSettings);
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      padding: '0.5rem 0.8rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      outline: 'none',
                      cursor: 'pointer',
                      minWidth: '130px',
                      appearance: 'none',
                      backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.8rem center',
                      paddingRight: '2rem'
                    }}
                  >
                    {locations.map(loc => (
                      <option key={loc.value} value={loc.value} style={{ background: '#1a1a1a' }}>{loc.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          );
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
             <header style={{ marginBottom: '1rem' }}>
               <h2 style={{ fontSize: '2.2rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Widget Customization</h2>
               <p style={{ color: 'var(--text-muted)' }}>Configure your dashboard modules.</p>
             </header>

             <div className="glass-panel" style={{ padding: '2rem', borderRadius: '24px' }}>
                <WidgetRow name="News" icon={Cpu} id="news" />
                <WidgetRow name="Reminders" icon={Timer} id="reminder" />
                <WidgetRow name="Clock & Weather" icon={Sun} id="clockWeather" />
                <WidgetRow name="Music" icon={Music} id="music" />

                <div style={{ 
                  marginTop: '2rem', 
                  paddingTop: '2rem', 
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    {(() => {
                      const locations = Object.values(widgetSettings).filter((w: any) => w.enabled).map((w: any) => w.location);
                      const hasOverlap = new Set(locations).size !== locations.length;
                      if (hasOverlap) {
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#ff4d4d', fontSize: '0.9rem' }}>
                            <Shield size={16} />
                            <span>Warning: Multiple widgets assigned to same corner</span>
                          </div>
                        );
                      }
                      return (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Locations are unique. No overlaps detected.</p>
                      );
                    })()}
                  </div>

                  <button
                    onClick={async () => {
                      const locations = Object.values(widgetSettings).filter((w: any) => w.enabled).map((w: any) => w.location);
                      const hasOverlap = new Set(locations).size !== locations.length;
                      if (hasOverlap) return;

                      setIsUpdating(true);
                      const success = await saveWidgetsToCloud(widgetSettings);
                      setIsUpdating(false);
                      if (success) {
                        setUpdateStatus('success');
                        setTimeout(() => setUpdateStatus('idle'), 2000);
                      }
                    }}
                    disabled={(() => {
                      const locations = Object.values(widgetSettings).filter((w: any) => w.enabled).map((w: any) => w.location);
                      return new Set(locations).size !== locations.length || isUpdating;
                    })()}
                    className="glass-panel"
                    style={{
                      padding: '0.8rem 2rem',
                      borderRadius: '12px',
                      background: 'var(--accent-primary)',
                      color: 'black',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      opacity: (() => {
                        const locations = Object.values(widgetSettings).filter((w: any) => w.enabled).map((w: any) => w.location);
                        return new Set(locations).size !== locations.length ? 0.5 : 1;
                      })(),
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.8rem'
                    }}
                  >
                    {isUpdating ? <Loader2 className="animate-spin" size={18} /> : (updateStatus === 'success' ? <Check size={18} /> : <Zap size={18} />)}
                    {updateStatus === 'success' ? 'Saved' : 'Save Layout'}
                  </button>
                </div>
             </div>
          </div>
        );
      }


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
            <div style={{ position: 'relative' }}>
              {!bleConnected && (
                <div style={{
                  position: 'absolute',
                  inset: -10,
                  zIndex: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.15)',
                  borderRadius: '32px',
                  pointerEvents: 'none'
                }}>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel" 
                    style={{ 
                      padding: '1.2rem 2.5rem', 
                      borderRadius: '20px', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(20,20,30,0.9)',
                      backdropFilter: 'blur(20px)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
                    }}
                  >
                    <BluetoothOff size={22} color="var(--accent-primary)" />
                    <div>
                      <span style={{ fontWeight: 600, display: 'block', fontSize: '1.1rem' }}>Hardware Link Required</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Connect your ELK controller to unlock these tags</span>
                    </div>
                  </motion.div>
                </div>
              )}

              <div style={{ 
                opacity: bleConnected ? 1 : 0.2, 
                pointerEvents: bleConnected ? 'auto' : 'none', 
                transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                filter: bleConnected ? 'grayscale(0) blur(0px)' : 'grayscale(0.8) blur(3px)'
              }}>
                {/* Power Toggle */}
                <div className="glass-panel" style={{ padding: '1.5rem 2rem', borderRadius: '24px', marginBottom: '2rem' }}>
                  <div
                    onClick={() => {
                      if (!bleConnected) return;
                      const next = !ledPower;
                      setLedPower(next);
                      sendPowerCommand(next);
                    }}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      cursor: bleConnected ? 'pointer' : 'not-allowed' 
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <Power size={22} color={bleConnected && ledPower ? '#4ade80' : 'var(--text-muted)'} />
                      <div>
                        <h4 style={{ fontSize: '1.05rem', color: bleConnected ? 'white' : 'var(--text-muted)' }}>LED Power</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {bleConnected ? (ledPower ? 'Lights are on' : 'Lights are off') : 'Bluetooth disconnected'}
                        </p>
                      </div>
                    </div>
                    <div style={{
                      width: '50px', height: '26px',
                      background: bleConnected && ledPower ? '#4ade80' : 'rgba(255,255,255,0.1)',
                      borderRadius: '20px', position: 'relative',
                      transition: 'all 0.3s ease'
                    }}>
                      <div style={{
                        position: 'absolute',
                        left: bleConnected && ledPower ? '27px' : '3px', top: '3px',
                        width: '20px', height: '20px',
                        background: bleConnected && ledPower ? 'white' : 'rgba(255,255,255,0.7)',
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
                        style={{ cursor: bleConnected ? 'crosshair' : 'not-allowed', borderRadius: '50%' }}
                        onMouseDown={(e) => { if (!bleConnected) return; setIsDraggingWheel(true); handleWheelInteraction(e); }}
                        onMouseMove={(e) => { if (isDraggingWheel && bleConnected) handleWheelInteraction(e); }}
                        onMouseUp={() => setIsDraggingWheel(false)}
                        onMouseLeave={() => setIsDraggingWheel(false)}
                        onTouchStart={(e) => { if (!bleConnected) return; setIsDraggingWheel(true); handleWheelInteraction(e); }}
                        onTouchMove={(e) => { if (isDraggingWheel && bleConnected) handleWheelInteraction(e); }}
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
                              disabled={!bleConnected}
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
                                cursor: bleConnected ? 'text' : 'not-allowed'
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
                          disabled={!bleConnected}
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
                            cursor: bleConnected ? 'text' : 'not-allowed'
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
                        disabled={!bleConnected}
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
                          background: 'transparent', border: 'none', cursor: bleConnected ? 'pointer' : 'not-allowed', padding: '0.5rem'
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
                    disabled={!bleConnected}
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
                      appearance: 'none', outline: 'none', cursor: bleConnected ? 'pointer' : 'not-allowed',
                      background: `linear-gradient(to right, rgba(255,255,255,0.05) 0%, rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}) ${brightness}%, rgba(255,255,255,0.08) ${brightness}%)`,
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Off</span><span>Max</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'Help & Support':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
             <header>
               <h2 style={{ fontSize: '2.2rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Help & Support</h2>
               <p style={{ color: 'var(--text-muted)' }}>Get expert assistance and master your MirrorX experience.</p>
             </header>

             <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 400px)', justifyContent: 'center', gap: '1.5rem' }}>
                {[
                  { 
                    icon: MessageSquare, 
                    title: 'Live Chat', 
                    desc: 'Instant support', 
                    color: 'var(--accent-primary)',
                    onClick: () => setShowChat(true)
                  },
                ].map((item, idx) => (
                  <div key={idx} className="glass-panel" 
                    onClick={item.onClick}
                    style={{ padding: '2rem', borderRadius: '24px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                      <item.icon size={30} color={item.color} />
                    </div>
                    <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{item.title}</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{item.desc}</p>
                  </div>
                ))}
             </div>

             <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FileText size={20} color="var(--accent-primary)" />
                  Common Questions
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                   {[
                     { q: 'How do I bridge the Bluetooth connection?', a: 'Power on your ELK LED strip and ensure no other device is paired. Navigate to the RGB Controller tab and tap Connect.' },
                     { q: 'Can I add multiple user identities?', a: 'MirrorX currently supports a single primary workspace per device. Multi-user switching is planned for a future firmware update.' },
                     { q: 'Where is my biometric data stored?', a: 'Descriptors are stored within the hardware secure element and are never uploaded to the cloud server.' }
                   ].map((faq, idx) => (
                     <div key={idx} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h4 style={{ color: 'var(--accent-primary)', fontSize: '0.95rem', marginBottom: '0.75rem', fontWeight: 600 }}>Q: {faq.q}</h4>
                        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{faq.a}</p>
                     </div>
                   ))}
                </div>
             </div>

             <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem 2rem', background: 'rgba(0,0,0,0.2)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Cpu size={24} color="var(--text-muted)" />
                <div style={{ flex: 1 }}>
                   <div style={{ display: 'flex', gap: '2rem' }}>
                      <div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>System Version</p>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>v2.4.0 (Enterprise)</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>Build</p>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>2024.Q2.MIRROR</p>
                      </div>
                   </div>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>MirrorX Neural Core © 2024</div>
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

      {/* Live Chat Modal */}
      {showChat && (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', width: '380px', height: '550px', zIndex: 9999, display: 'flex', flexDirection: 'column' }} className="glass-panel">
           <div style={{ padding: '1.5rem', background: 'var(--accent-primary)', color: 'black', borderRadius: '24px 24px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                 <div style={{ position: 'relative' }}>
                    <Bot size={24} />
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 8, height: 8, background: '#10b981', borderRadius: '50%', border: '2px solid black' }} />
                 </div>
                 <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>MirrorX Assistant</h4>
                    <p style={{ fontSize: '0.7rem', opacity: 0.8 }}>Online & ready to help</p>
                 </div>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                 <button 
                   onClick={() => {
                     if (confirm('Clear entire chat history?')) {
                       const initial = [{ role: 'assistant', content: "Hello! I'm the MirrorX Virtual Assistant. How can I help you today?" }];
                       setChatHistory(initial);
                       localStorage.setItem('mirrorx_chat_history', JSON.stringify(initial));
                     }
                   }} 
                   style={{ background: 'rgba(0,0,0,0.1)', border: 'none', cursor: 'pointer', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black' }}
                   title="Clear Chat"
                 >
                    <Zap size={14} />
                 </button>
                 <button onClick={() => setShowChat(false)} style={{ background: 'rgba(0,0,0,0.1)', border: 'none', cursor: 'pointer', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black' }}>
                    <X size={18} />
                 </button>
              </div>
           </div>
           
           <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.2)' }}>
              {chatHistory.map((chat: any, idx: any) => (
                <div key={idx} style={{ 
                  alignSelf: chat.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  padding: '1rem',
                  borderRadius: chat.role === 'user' ? '20px 4px 20px 20px' : '4px 20px 20px 20px',
                  background: chat.role === 'user' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                  color: chat.role === 'user' ? 'black' : 'white',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                   {chat.content}
                </div>
              ))}
              {isBotTyping && (
                <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', padding: '0.8rem 1.2rem', borderRadius: '4px 18px 18px 18px', display: 'flex', gap: '4px' }}>
                   <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)' }} />
                   <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)' }} />
                   <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)' }} />
                </div>
              )}
              <div ref={chatEndRef} />
           </div>

           <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '0.8rem' }}>
              <input 
                type="text" 
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                disabled={isBotTyping}
                placeholder={isBotTyping ? "Assistant is thinking..." : "Type your message..."}
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.8rem 1rem', color: 'white', outline: 'none', opacity: isBotTyping ? 0.6 : 1 }}
              />
              <button 
                onClick={handleSendMessage}
                disabled={isBotTyping}
                style={{ background: isBotTyping ? 'rgba(255,255,255,0.1)' : 'var(--accent-primary)', border: 'none', borderRadius: '12px', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isBotTyping ? 'not-allowed' : 'pointer', color: 'black', transition: 'all 0.3s ease' }}>
                 {isBotTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={20} />}
              </button>
           </div>
        </div>
      )}
    </div>
  );
};
