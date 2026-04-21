import { useEffect, useRef } from 'react';
import { useMusic } from '../context/MusicContext';

interface UserProfile {
  rgbColor?: { r: number, g: number, b: number };
  brightness?: number;
}

interface MusicSyncManagerProps {
  bleConnected: boolean;
  bleCharacteristic: any;
  user: UserProfile | null | undefined;
}

export const MusicSyncManager = ({ bleConnected, bleCharacteristic, user }: MusicSyncManagerProps) => {
  const { isPlaying } = useMusic();
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastWriteTime = useRef<number>(0);
  const wasSyncingRef = useRef(false);
  
  // Track playback state in a ref for the async loop to allow frame cancellation
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Handle restoration of user preferences when music stops
  useEffect(() => {
    if (!bleConnected || !bleCharacteristic || isPlaying) return;
    
    const restoreUserPreference = async () => {
      if (!wasSyncingRef.current) return;
      
      // Delay restoration to avoid collisions with the closing sync loop
      await new Promise(res => setTimeout(res, 250));
      wasSyncingRef.current = false;
      
      const r = user?.rgbColor?.r ?? 0;
      const g = user?.rgbColor?.g ?? 0;
      const b = user?.rgbColor?.b ?? 0;
      const brightMultiplier = (user?.brightness ?? 0) / 100;
      
      if (r === 0 && g === 0 && b === 0) return;

      const [sR, sG, sB] = [
        Math.round(r * brightMultiplier),
        Math.round(g * brightMultiplier),
        Math.round(b * brightMultiplier)
      ];
      
      // Multi-shot write to ensure the hardware processes the mode change
      for (let i = 0; i < 6; i++) {
        try {
          await bleCharacteristic.writeValue(
            new Uint8Array([0x7E, 0x07, 0x05, 0x03, sR, sG, sB, 0x10, 0xEF])
          );
          await new Promise(res => setTimeout(res, 100));
        } catch (e) {
          /* BLE disconnect or congestion */
        }
      }
    };

    restoreUserPreference();
  }, [isPlaying, bleConnected, bleCharacteristic, user?.rgbColor, user?.brightness]);

  // Handle real-time audio synchronization
  useEffect(() => {
    if (!bleConnected || !bleCharacteristic) return;

    const stopMicSync = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };

    const startMicSync = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContext.state === 'suspended') await audioContext.resume();
        audioContextRef.current = audioContext;
        
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateSync = async () => {
          if (!isPlayingRef.current || !bleConnected || !bleCharacteristic) {
            stopMicSync();
            return;
          }

          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
          const average = sum / bufferLength;
          
          const now = Date.now();
          if (now - lastWriteTime.current > 100) {
            const intensity = Math.min(255, average * 2.5);
            
            if (intensity > 20) {
              const r = user?.rgbColor?.r ?? 255;
              const g = user?.rgbColor?.g ?? 255;
              const b = user?.rgbColor?.b ?? 255;
              const bright = (user?.brightness ?? 100) / 100;
              const scale = (intensity / 255) * bright;
              
              const sR = Math.round(r * scale);
              const sG = Math.round(g * scale);
              const sB = Math.round(b * scale);
              
              await bleCharacteristic.writeValue(
                new Uint8Array([0x7E, 0x07, 0x05, 0x03, sR, sG, sB, 0x10, 0xEF])
              ).catch(() => {});
            } else {
              // Idle glow (keep hardware reactive but stabilized)
              await bleCharacteristic.writeValue(
                new Uint8Array([0x7E, 0x07, 0x05, 0x03, 0x01, 0x01, 0x01, 0x10, 0xEF])
              ).catch(() => {});
            }
            lastWriteTime.current = now;
          }
          
          if (isPlayingRef.current) {
            requestAnimationFrame(updateSync);
          }
        };

        updateSync();
      } catch (err) {
        console.warn('MirrorX LED Error:', err);
      }
    };

    if (isPlaying) {
      wasSyncingRef.current = true;
      startMicSync();
    } else {
      stopMicSync();
    }

    return () => stopMicSync();
  }, [isPlaying, bleConnected, bleCharacteristic, user?.rgbColor, user?.brightness]);

  return null;
};
