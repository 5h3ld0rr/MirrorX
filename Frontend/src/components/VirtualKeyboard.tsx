import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, Minimize2, Delete, CornerDownLeft, ArrowUp } from 'lucide-react';

export const VirtualKeyboard = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isShift, setIsShift] = useState(false);
  const [activeInput, setActiveInput] = useState<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setActiveInput(target as HTMLInputElement | HTMLTextAreaElement);
        setIsExpanded(true);
      }
    };
    
    // Use capture phase to ensure we always get focus events globally
    document.addEventListener('focus', handleFocus, true);
    
    return () => {
      document.removeEventListener('focus', handleFocus, true);
    };
  }, []);

  const handleKeyPress = (key: string) => {
    if (!activeInput) return;
    
    const start = activeInput.selectionStart || 0;
    const end = activeInput.selectionEnd || 0;
    const val = activeInput.value;
    let newVal = val;

    if (key === '{backspace}') {
      if (start === end && start > 0) {
        newVal = val.slice(0, start - 1) + val.slice(end);
        updateInput(newVal, start - 1);
      } else if (start !== end) {
        newVal = val.slice(0, start) + val.slice(end);
        updateInput(newVal, start);
      }
    } else if (key === '{enter}') {
        activeInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
        if (activeInput.form) {
            // Need to simulate a submit if it's within a form
            activeInput.form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
    } else if (key === '{shift}') {
      setIsShift(!isShift);
    } else if (key === '{space}') {
      newVal = val.slice(0, start) + ' ' + val.slice(end);
      updateInput(newVal, start + 1);
    } else {
      const char = isShift ? key.toUpperCase() : key;
      newVal = val.slice(0, start) + char + val.slice(end);
      updateInput(newVal, start + 1);
      if (isShift) setIsShift(false); // auto reset shift after one character
    }
  };

  const updateInput = (newVal: string, newPos: number) => {
    if (!activeInput) return;
    activeInput.value = newVal;
    const tracker = (activeInput as any)._valueTracker;
    if (tracker) {
        tracker.setValue('');
    }
    // Dispatch input array so React's onChange fires
    activeInput.dispatchEvent(new Event('input', { bubbles: true }));
    activeInput.setSelectionRange(newPos, newPos);
  };

  const rows = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '\''],
    ['{shift}', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '{backspace}'],
    ['@', '{space}', '{enter}']
  ];

  return (
    <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', pointerEvents: 'none' }}>
       
       <AnimatePresence>
         {isExpanded && (
           <motion.div 
             initial={{ opacity: 0, scale: 0.95, y: 20 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.95, y: 20 }}
             className="glass-panel"
             style={{ 
               pointerEvents: 'auto',
               padding: '1.5rem', 
               borderRadius: '32px', 
               background: 'rgba(10, 10, 15, 0.85)', 
               backdropFilter: 'blur(30px)', 
               border: '1px solid rgba(255,255,255,0.1)', 
               display: 'flex', 
               flexDirection: 'column', 
               gap: '0.6rem', 
               width: '800px', 
               boxShadow: '0 30px 60px rgba(0,0,0,0.6)' 
             }}
             onMouseDown={(e) => e.preventDefault()} // Prevent losing focus on input
           >
              {rows.map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                   {row.map(key => {
                      let label: any = isShift && key.length === 1 ? key.toUpperCase() : key;
                      let width = '55px';
                      let bg = 'rgba(255,255,255,0.06)';
                      let color = 'white';

                      if (key === '{backspace}') { 
                        label = <Delete size={20} />; 
                        width = '80px'; 
                        bg = 'rgba(255,50,100,0.2)'; 
                      }
                      if (key === '{enter}') { 
                        label = <CornerDownLeft size={20} />; 
                        width = '120px'; 
                        bg = 'linear-gradient(135deg, #00f2ff, #0066ff)'; 
                      }
                      if (key === '{shift}') { 
                        label = <ArrowUp size={20} />; 
                        width = '80px'; 
                        bg = isShift ? '#00f2ff' : 'rgba(255,255,255,0.1)'; 
                        color = isShift ? 'black' : 'white';
                      }
                      if (key === '{space}') { 
                        label = 'SPACE'; 
                        width = '400px'; 
                      }
                      
                      return (
                        <button
                          key={key}
                          onMouseDown={(e) => { e.preventDefault(); handleKeyPress(key); }}
                          style={{
                            width, 
                            height: '55px',
                            background: bg,
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '14px',
                            color,
                            fontSize: '1.2rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.1s',
                            boxShadow: key === '{enter}' ? '0 10px 20px rgba(0, 242, 255, 0.3)' : 'none'
                          }}
                          onPointerDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
                          onPointerUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          {label}
                        </button>
                      );
                   })}
                </div>
              ))}
           </motion.div>
         )}
       </AnimatePresence>

       {/* Floating Toggle Button */}
       <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className="glass-panel"
          style={{ 
            pointerEvents: 'auto',
            width: '60px', 
            height: '60px', 
            borderRadius: '30px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: 0,
            background: isExpanded ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(0, 242, 255, 0.2))',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}
       >
          {isExpanded ? <Minimize2 size={24} color="white" /> : <Keyboard size={24} color="#00f2ff" />}
       </motion.button>
    </div>
  );
}
