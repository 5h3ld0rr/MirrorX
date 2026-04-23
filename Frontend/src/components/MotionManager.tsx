import React, { useEffect } from 'react';
import { socketService } from '../services/socket';

interface MotionManagerProps {
  enabled: boolean;
  onMotionDetected: () => void;
}

export const MotionManager: React.FC<MotionManagerProps> = ({ enabled, onMotionDetected }) => {
  useEffect(() => {
    if (!enabled) return;

    const handleMotion = (data: { isDetected: boolean, timestamp: number }) => {
      if (data.isDetected) {
        onMotionDetected();
      }
    };

    socketService.on('motion:update', handleMotion);

    return () => {
      socketService.off('motion:update', handleMotion);
    };
  }, [enabled, onMotionDetected]);

  return null; // Invisible manager
};
