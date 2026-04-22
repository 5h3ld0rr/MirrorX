import { useState, useEffect } from 'react';
import { socketService } from '../services/socket';

export const BrightnessManager = ({ autoEnabled, manualBrightness }: { autoEnabled: boolean, manualBrightness: number }) => {
  const [autoBrightness, setAutoBrightness] = useState(100);

  useEffect(() => {
    if (!autoEnabled) return;

    const handleUpdate = (data: { lux: number, brightness: number }) => {
      setAutoBrightness(data.brightness);
    };

    socketService.on('brightness:update', handleUpdate);

    return () => {
      socketService.off('brightness:update', handleUpdate);
    };
  }, [autoEnabled]);

  // Use auto value if enabled, otherwise manual
  const effectiveBrightness = autoEnabled ? autoBrightness : manualBrightness;

  // Calculate overlay opacity
  // brightness 100 -> opacity 0
  // brightness 10 -> opacity 0.9
  const opacity = 1 - (effectiveBrightness / 100);

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'black',
        opacity: opacity,
        pointerEvents: 'none',
        zIndex: 999999,
        transition: 'opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    />
  );
};
