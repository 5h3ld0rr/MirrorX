import { useEffect, useState } from 'react';

interface VoiceAssistantProps {
  user: any;
}

export const VoiceAssistant = ({ user }: VoiceAssistantProps) => {
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (user && !isListening) {
      setIsListening(true);
    }
  }, [user, isListening]);

  useEffect(() => {
    if (!user || !isListening) return;
        
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Using discrete mode for better stability
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    const speakReply = () => {      
      if (!window.speechSynthesis) return;
      if (window.speechSynthesis.speaking) return; // Don't overlap speech

      const firstName = user?.name ? user.name.split(' ')[0] : 'User';
      const text = `Hi ${firstName}, how are you doing?`;
      const utterance = new SpeechSynthesisUtterance(text);
      
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        (v.name.includes('Google') || v.name.includes('Female')) && v.lang.startsWith('en')
      ) || voices[0];
      
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      if (transcript.includes('hi mirror') || transcript.includes('hello mirror') || transcript.includes('hey mirror')) {
        speakReply();
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech Assist Error:', event.error);
      
      if (event.error === 'network') {
        setIsListening(false);
        setTimeout(() => {
          if (user) setIsListening(true);
        }, 1000); 
      }

      if (event.error === 'not-allowed') {
        console.error('Mic access blocked.');
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (isListening) {
        setTimeout(() => {
           try { recognition.start(); } catch (e) { setIsListening(false); }
        }, 300);
      }
    };

    if (isListening) {
      try {
        recognition.start();        
      } catch (e) {
        console.error('Voice Start Error:', e);
        setIsListening(false);
      }
    }

    return () => {
      recognition.onend = null;
      recognition.stop();
    };
  }, [user, isListening]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  return null;
};
