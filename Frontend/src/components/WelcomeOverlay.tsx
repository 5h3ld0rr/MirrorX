import { memo } from 'react';
import { motion } from 'framer-motion';
import { TypewriterSequence } from './TypewriterSequence';

export const WelcomeOverlay = memo(({ user, onComplete }: { user: any, onComplete: () => void }) => {
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return `Good Morning, ${user.name}.`;
    if (hour < 17) return `Good Afternoon, ${user.name}.`;
    return `Good Evening, ${user.name}.`;
  })();

  const phrases = [
    greeting,
    "Welcome back to MirrorX."
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(80px) brightness(0.4)',
        backgroundColor: 'rgba(0,0,0,0.6)',
        pointerEvents: 'none'
      }}
    >
      <TypewriterSequence phrases={phrases} onComplete={onComplete} />
    </motion.div>
  );
});
