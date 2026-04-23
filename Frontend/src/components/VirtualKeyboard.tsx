import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete, CornerDownLeft, ArrowUp, ZoomIn, ZoomOut, GripHorizontal, X } from 'lucide-react';

export const VirtualKeyboard = () => {
  const [isShift, setIsShift] = useState(false);
  const [activeInput, setActiveInput] = useState<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [keyboardScale, setKeyboardScale] = useState(1);
  const dragConstraintsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        const type = target.getAttribute('type');
        if (type && ['range', 'checkbox', 'radio', 'button', 'submit', 'color', 'file'].includes(type.toLowerCase())) {
            return;
        }
        setActiveInput(target as HTMLInputElement | HTMLTextAreaElement);
      }
    };

    const handleBlur = (e: FocusEvent) => {
      const related = e.relatedTarget as HTMLElement;
      if (!related || (related.tagName !== 'INPUT' && related.tagName !== 'TEXTAREA')) {
        setActiveInput(null);
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.virtual-keyboard-panel')) return;
      
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
         const type = target.getAttribute('type');
         if (!type || !['range', 'checkbox', 'radio', 'button', 'submit', 'color', 'file'].includes(type.toLowerCase())) {
             setActiveInput(target as HTMLInputElement | HTMLTextAreaElement);
             return;
         }
      }
      
      setActiveInput(null);
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
         (document.activeElement as HTMLElement).blur();
      }
    };
    
    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('blur', handleBlur, true);
    document.addEventListener('pointerdown', handlePointerDown, true);
    
    return () => {
      document.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('blur', handleBlur, true);
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, []);

  const handleKeyPress = (key: string) => {
    if (!activeInput) return;
    
    // Ensure input is focused for execCommand to work
    activeInput.focus();
    
    if (key === '{backspace}') {
      // Use native delete command to handle cursor and history correctly
      document.execCommand('delete', false);
    } else if (key === '{enter}') {
        activeInput.dispatchEvent(new KeyboardEvent('keydown', { 
          key: 'Enter', 
          code: 'Enter', 
          bubbles: true,
          cancelable: true
        }));
        if (activeInput.form) {
            activeInput.form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
    } else if (key === '{shift}') {
      setIsShift(!isShift);
    } else if (key === '{space}') {
      document.execCommand('insertText', false, ' ');
    } else {
      const char = isShift ? key.toUpperCase() : key;
      document.execCommand('insertText', false, char);
      if (isShift) setIsShift(false);
    }
  };

  const rows = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '\''],
    ['{shift}', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '{backspace}'],
    ['@', '{space}', '{enter}']
  ];

  return (
    <div 
      style={{ 
        position: 'fixed', 
        inset: activeInput ? 0 : 'auto', 
        zIndex: 10000, 
        pointerEvents: 'none',
        visibility: activeInput ? 'visible' : 'hidden'
      }} 
      ref={dragConstraintsRef}
    >
       <AnimatePresence>
         {activeInput && (
           <motion.div 
             drag
             dragConstraints={dragConstraintsRef}
             dragElastic={0.1}
             dragMomentum={false}
             initial={{ opacity: 0, y: 50, scale: 0.9 }}
             animate={{ opacity: 1, y: 0, scale: keyboardScale }}
             exit={{ opacity: 0, y: 50, scale: 0.8 }}
             transition={{ type: 'spring', damping: 25, stiffness: 300 }}
             className="glass-panel virtual-keyboard-panel"
             style={{ 
               pointerEvents: 'auto',
               position: 'absolute',
               bottom: '4rem',
               right: '2rem',
               padding: '1.5rem', 
               borderRadius: '32px', 
               background: 'rgba(10, 10, 15, 0.85)', 
               backdropFilter: 'blur(30px)', 
               border: '1px solid rgba(255,255,255,0.1)', 
               display: 'flex', 
               flexDirection: 'column', 
               gap: '0.6rem', 
               width: '800px', 
               boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
               transformOrigin: 'bottom right'
             }}
             onMouseDown={(e) => e.preventDefault()}
           >
              {/* Draggable & Size Control Header */}
              <div 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '0.5rem', 
                  cursor: 'grab',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid rgba(255,255,255,0.05)'
                }} 
              >
                 <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <motion.button 
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '0.2rem' }} 
                      onClick={() => setKeyboardScale(Math.max(0.6, keyboardScale - 0.1))}
                    >
                      <ZoomOut size={18} />
                    </motion.button>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: 800 }}>{Math.round(keyboardScale * 100)}%</span>
                    <motion.button 
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '0.2rem' }} 
                      onClick={() => setKeyboardScale(Math.min(1.5, keyboardScale + 0.1))}
                    >
                      <ZoomIn size={18} />
                    </motion.button>
                 </div>
                 
                 <div style={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.1)' }}>
                    <GripHorizontal size={24} />
                 </div>
                 
                 <motion.button 
                   whileHover={{ scale: 1.1, color: 'white' }} whileTap={{ scale: 0.9 }}
                   style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '0.2rem' }} 
                   onClick={() => {
                     setActiveInput(null);
                     if (activeInput) activeInput.blur();
                   }}
                 >
                    <X size={20} />
                 </motion.button>
              </div>

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
    </div>
  );
}
