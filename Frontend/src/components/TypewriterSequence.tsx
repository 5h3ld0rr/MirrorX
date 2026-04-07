import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const TypewriterSequence = ({ 
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
  }, [text, phase, phraseIndex, phrases, typingSpeed, deletingSpeed, pauseDelay, onComplete]);

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
