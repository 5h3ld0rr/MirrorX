import { useEffect } from 'react';
import { useMusic } from '../context/MusicContext';

interface MusicSyncManagerProps {
  bleConnected: boolean;
  bleCharacteristic: any;
  user: any;
}

export const MusicSyncManager = ({ bleConnected, bleCharacteristic, user }: MusicSyncManagerProps) => {
  const { isPlaying } = useMusic();

  useEffect(() => {
    if (!bleConnected || !bleCharacteristic) return;

    const syncMusic = async () => {
      try {
        if (isPlaying && user?.musicSyncEnabled) {
          // Send Music Mode command (ELK Mode 0x06 usually rhythm)
          // For ELK-BLEDOM, 0x06 is the pulse-to-audio mode
          await bleCharacteristic.writeValue(
            new Uint8Array([0x7E, 0x04, 0x03, 0x06, 0x03, 0xFF, 0xEF])
          );
        } else {
          // Restore User Color if sync disabled or music stopped
          const { r, g, b } = user?.rgbColor || { r: 255, g: 255, b: 255 };
          const bright = user?.brightness ?? 100;
          const sR = Math.round(r * (bright / 100));
          const sG = Math.round(g * (bright / 100));
          const sB = Math.round(b * (bright / 100));
          await bleCharacteristic.writeValue(
            new Uint8Array([0x7E, 0x07, 0x05, 0x03, sR, sG, sB, 0x10, 0xEF])
          );
        }
      } catch (err) {
        console.warn('Music Sync BLE Error:', err);
      }
    };

    syncMusic();
  }, [isPlaying, bleConnected, bleCharacteristic, user?.musicSyncEnabled, user?.rgbColor, user?.brightness]);

  return null;
};
