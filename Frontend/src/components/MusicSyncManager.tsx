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
  const smoothedIntensity = useRef(0);
  const smoothedBass = useRef(0);
  
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
          
          // --- MAXIMUM NOISE REJECTION ---
          // Concentration on bins [0, 1] (lowest) to isolate true kicks
          const subBass = (dataArray[0] + dataArray[1]) / 2; 

          // High hard threshold: Any rumble/typing below 55 is ignored completely
          const gatedBass = subBass > 55 ? (subBass - 55) * 1.0 : 0;
          
          // Low multiplier to ensure only peaks matter
          const rawIntensity = gatedBass * 0.8;
          
          // --- PUNCH ENGINE ---
          const target = rawIntensity;
          const alpha = target > smoothedIntensity.current ? 0.85 : 0.35; 
          smoothedIntensity.current = (target * alpha) + (smoothedIntensity.current * (1 - alpha));
          
          smoothedBass.current = (subBass * 0.4) + (smoothedBass.current * 0.6);

          const now = Date.now();
          if (now - lastWriteTime.current > 65) {
            // Ultra-Strict Output Gate (135)
            const normalized = Math.min(1.0, (smoothedIntensity.current * 1.4) / 255);
            let intensity = Math.pow(normalized, 2.0) * 255; 
            intensity = Math.min(255, intensity); 
            
            const r = user?.rgbColor?.r ?? 0;
            const g = user?.rgbColor?.g ?? 0;
            const b = user?.rgbColor?.b ?? 255;
            const bright = (user?.brightness ?? 100) / 100;
            console.log(intensity);

            if (intensity > 20) {
              const scale = (intensity / 255) * bright;
              
              const peakBoost = smoothedBass.current > 240 ? (smoothedBass.current - 240) / 40 : 0;
              
              const sR = Math.min(255, Math.round((r * scale) + (255 * peakBoost * scale)));
              const sG = Math.min(255, Math.round((g * scale) + (255 * peakBoost * scale)));
              const sB = Math.min(255, Math.round((b * scale) + (255 * peakBoost * scale)));
              
              await bleCharacteristic.writeValue(
                new Uint8Array([0x7E, 0x07, 0x05, 0x03, sR, sG, sB, 0x10, 0xEF])
              ).catch(() => {});
            } else {
              // Forced Ultra-Dim "Blue Floor"
              await bleCharacteristic.writeValue(
                new Uint8Array([0x7E, 0x07, 0x05, 0x03, 0x00, 0x00, 0x01, 0x10, 0xEF])
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
