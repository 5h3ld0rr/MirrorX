import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface VoiceAssistantProps {
  user: any;
  onAction?: (action: VoiceAction) => void;
}

export type VoiceAction = 
  | { type: 'PLAY_MUSIC', query: string }
  | { type: 'CHANGE_ACCENT', color: string }
  | { type: 'SET_TIMER', duration: number, unit: 'h' | 'm' | 's' }
  | { type: 'STOP_TIMER' }
  | { type: 'STOP_MUSIC' }
  | { type: 'RESUME_MUSIC' }
  | { type: 'GREETING' };

export const VoiceAssistant = ({ user, onAction }: VoiceAssistantProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isWokenUp, setIsWokenUp] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [showStatus, setShowStatus] = useState(false);
  const wakeTimerRef = useRef<any>(null);

  useEffect(() => {
    if (user && !isListening) {
      setIsListening(true);
    }
  }, [user, isListening]);

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      (v.name.includes('Female')) && v.lang.startsWith('en')
    ) || voices[0];
    
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  const handleCommand = (transcript: string) => {
    const text = transcript.toLowerCase();
    setLastTranscript(transcript);

    // 1. Wake Recognition
    const isWakeWord = text.includes('hi mirror') || text.includes('hello mirror') || text.includes('hey mirror');

    if (isWakeWord && !isWokenUp) {
      const firstName = user?.name ? user.name.split(' ')[0] : 'User';
      speak(`Hi ${firstName}, I'm listening.`);
      onAction?.({ type: 'GREETING' });
      
      setIsWokenUp(true);
      setShowStatus(true);
      setIsProcessing(false);

      // Initialize wake timer
      if (wakeTimerRef.current) clearTimeout(wakeTimerRef.current);
      wakeTimerRef.current = setTimeout(() => {
        setIsWokenUp(false);
        setShowStatus(false);
      }, 10000);

      // If the transcript ONLY contained the wake word, we stop here.
      const cleanedCheck = text.replace(/hi mirror|hello mirror|hey mirror/g, '').trim();
      if (!cleanedCheck) return;
    }

    // Only process further if woken up (or just woken up above)
    if (!isWokenUp) return;

    setIsProcessing(true);
    setShowStatus(true);
    
    // Clean text for command processing
    const commandText = text.replace(/hi mirror|hello mirror|hey mirror/g, '').trim();

    // Refresh wake timer on any command to keep the assistant active
    if (wakeTimerRef.current) clearTimeout(wakeTimerRef.current);
    wakeTimerRef.current = setTimeout(() => {
      setIsWokenUp(false);
      setShowStatus(false);
    }, 12000);

    // 2. Play Music
    if (commandText.includes('play')) {
      const query = commandText.split('play')[1].trim();
      if (query) {
        speak(`Playing ${query}`);
        onAction?.({ type: 'PLAY_MUSIC', query });
      } else {
        speak("What would you like me to play?");
      }
      setIsProcessing(false);
      return;
    }

    // 3. Stop/Resume Music
    if (commandText.includes('stop music') || commandText.includes('pause music')) {
      speak("Music stopped");
      onAction?.({ type: 'STOP_MUSIC' });
      setIsProcessing(false);
      return;
    }
    if (commandText.includes('resume music') || commandText.includes('start music')) {
      speak("Resuming music");
      onAction?.({ type: 'RESUME_MUSIC' });
      setIsProcessing(false);
      return;
    }

    // 4. Set Timer
    const timerMatch = commandText.match(/set (?:a )?timer for (\d+) (minute|second|hour|min|sec)s?/);
    if (timerMatch) {
      const val = parseInt(timerMatch[1]);
      let unit: 'h' | 'm' | 's' = 'm';
      if (timerMatch[2].startsWith('h')) unit = 'h';
      if (timerMatch[2].startsWith('s')) unit = 's';
      
      const unitLabel = unit === 'h' ? 'hour' : unit === 'm' ? 'minute' : 'second';
      speak(`Setting a timer for ${val} ${unitLabel}${val > 1 ? 's' : ''}`);
      onAction?.({ type: 'SET_TIMER', duration: val, unit });
      setIsProcessing(false);
      return;
    }

    if (commandText.includes('stop timer') || commandText.includes('cancel timer')) {
      speak("Timer stopped");
      onAction?.({ type: 'STOP_TIMER' });
      setIsProcessing(false);
      return;
    }

    // 5. Change Accent
    const colorMatch = commandText.match(/(?:change|set) (?:accent )?color to (.*)/) || commandText.match(/color (.*)/);
    if (colorMatch) {
      const color = colorMatch[1].trim();
      speak(`Changing accent color to ${color}`);
      onAction?.({ type: 'CHANGE_ACCENT', color });
      setIsProcessing(false);
      return;
    }
    
    setIsProcessing(false);
  };

  useEffect(() => {
    if (!user || !isListening) return;
        
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleCommand(transcript);
    };

    recognition.onstart = () => {
      // Optional visual feedback for listening start
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'network') {
        setIsListening(false);
        setTimeout(() => { if (user) setIsListening(true); }, 1000); 
      }
    };

    recognition.onend = () => {
      if (isListening) {
        setTimeout(() => {
           try { recognition.start(); } catch (e) { /* Already started */ }
        }, 300);
      }
    };

    if (isListening) {
      try { recognition.start(); } catch (e) { setIsListening(false); }
    }

    return () => {
      recognition.onend = null;
      recognition.stop();
    };
  }, [user, isListening]);

  return (
    <AnimatePresence>
      {showStatus && (
        <motion.div
          initial={{ opacity: 0, y: 20, x: "-50%", scale: 0.9 }}
          animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
          exit={{ opacity: 0, y: 10, x: "-50%", scale: 0.95 }}
          style={{
            position: 'fixed',
            bottom: '7.5rem',
            left: '50%',
            zIndex: 5000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'none'
          }}
        >
          {/* Main Pill HUD */}
          <div style={{
            padding: '0.75rem 2rem',
            borderRadius: '100px',
            background: 'rgba(5, 5, 5, 0.6)',
            backdropFilter: 'blur(30px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px var(--accent-glow)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            minWidth: '320px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Animated Glow Overlay */}
            <motion.div
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ repeat: Infinity, duration: 3 }}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at 20% 50%, var(--accent-primary) 0%, transparent 60%)',
                filter: 'blur(15px)',
                zIndex: -1
              }}
            />

            {/* Voice Waveform Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '24px', width: '32px', justifyContent: 'center' }}>
              {isProcessing ? (
                <Loader2 size={24} className="animate-spin" color="var(--accent-primary)" />
              ) : (
                [...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      height: [8, 20, 12, 18, 8][Math.floor(Math.random() * 5)],
                      opacity: [0.4, 1, 0.6, 1, 0.4]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 0.6 + (i * 0.1),
                      ease: "easeInOut"
                    }}
                    style={{
                      width: '3px',
                      borderRadius: '3px',
                      background: 'var(--accent-primary)',
                      boxShadow: '0 0 8px var(--accent-primary)'
                    }}
                  />
                ))
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
               <span style={{ 
                 fontSize: '0.65rem', 
                 color: 'var(--accent-primary)', 
                 fontWeight: 700, 
                 textTransform: 'uppercase', 
                 letterSpacing: '0.2em',
                 marginBottom: '2px',
                 opacity: 0.8
               }}>
                 {isProcessing ? 'Thinking' : 'Assistant'}
               </span>
               <span style={{ 
                 fontSize: '1.25rem', 
                 fontWeight: 500, 
                 color: 'white',
                 maxWidth: '400px',
                 overflow: 'hidden',
                 textOverflow: 'ellipsis',
                 whiteSpace: 'nowrap',
                 fontFamily: 'Outfit, Inter, sans-serif'
               }}>
                 {lastTranscript || "Listening..."}
               </span>
            </div>
          </div>

          {/* Subtle reflection below */}
          <div style={{
            width: '60%',
            height: '1px',
            marginTop: '8px',
            background: 'linear-gradient(90deg, transparent, var(--accent-primary), transparent)',
            opacity: 0.3,
            filter: 'blur(2px)'
          }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
