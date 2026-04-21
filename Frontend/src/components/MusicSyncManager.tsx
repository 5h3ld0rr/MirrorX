import { useEffect, useRef } from 'react';
import { useMusic } from '../context/MusicContext';

interface MusicSyncManagerProps {
  bleConnected: boolean;
  bleCharacteristic: any;
  user: any;
}

export const MusicSyncManager = ({ bleConnected, bleCharacteristic, user }: MusicSyncManagerProps) => {
  const { isPlaying } = useMusic();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastWriteTime = useRef<number>(0);

  useEffect(() => {
    if (!bleConnected || !bleCharacteristic) return;

    const startMicSync = async () => {
      try {
        // Request Microphone Access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateSync = async () => {
          if (!isPlaying || !bleConnected || !bleCharacteristic) {
            stopMicSync();
            return;
          }

          analyser.getByteFrequencyData(dataArray);

          // Calculate average volume/intensity
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;

          // Throttle BLE writes to 100ms to prevent controller crash
          const now = Date.now();
          if (now - lastWriteTime.current > 100) {
            // Map average volume to brightness/color
            const intensity = Math.min(255, average * 2.5); // Boost signal
            
            if (intensity > 20) { // Noise floor
              const { r, g, b } = user?.rgbColor || { r: 0, g: 242, b: 255 };
              const bright = (user?.brightness ?? 100) / 100;
              
              // Scale color by current intensity
              const sR = Math.round(r * bright * (intensity / 255));
              const sG = Math.round(g * bright * (intensity / 255));
              const sB = Math.round(b * bright * (intensity / 255));

              // Send 9-byte Static Color Command (Fast frequency response)
              await bleCharacteristic.writeValue(
                new Uint8Array([0x7E, 0x07, 0x05, 0x03, sR, sG, sB, 0x10, 0xEF])
              ).catch(() => {});
            } else {
              // Dim down if quiet
              await bleCharacteristic.writeValue(
                new Uint8Array([0x7E, 0x07, 0x05, 0x03, 0x01, 0x01, 0x01, 0x10, 0xEF])
              ).catch(() => {});
            }
            lastWriteTime.current = now;
          }

          if (isPlaying) {
            requestAnimationFrame(updateSync);
          }
        };

        updateSync();
      } catch (err) {
        console.error('Microphone Sync Error:', err);
        // Fallback: Just trigger Hardware Mic Mode if software mic fails
        await bleCharacteristic.writeValue(new Uint8Array([0x7E, 0x07, 0x03, 0x80, 0x03, 0xFF, 0xFF, 0x00, 0xEF])).catch(() => {});
      }
    };

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

    if (isPlaying) {
      startMicSync();
    } else {
      stopMicSync();
      // Restoration: Turn off Music Mode by sending static color
      if (bleConnected && bleCharacteristic) {
        const { r, g, b } = user?.rgbColor || { r: 255, g: 255, b: 255 };
        const bright = user?.brightness ?? 100;
        bleCharacteristic.writeValue(
          new Uint8Array([0x7E, 0x07, 0x05, 0x03, Math.round(r * (bright / 100)), Math.round(g * (bright / 100)), Math.round(b * (bright / 100)), 0x10, 0xEF])
        ).catch(() => {});
      }
    }

    return () => stopMicSync();
  }, [isPlaying, bleConnected, bleCharacteristic, user?.rgbColor, user?.brightness]);

  return null;
};
