import React, { createContext, useContext, useState } from 'react';
import type { YouTubeVideo } from '../services/youtube';

interface MusicContextType {
  currentTrack: YouTubeVideo | null;
  isPlaying: boolean;
  volume: number;
  playTrack: (track: YouTubeVideo) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<YouTubeVideo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);

  const playTrack = (track: YouTubeVideo) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const pauseTrack = () => setIsPlaying(false);
  const resumeTrack = () => {
    if (currentTrack) setIsPlaying(true);
  };
  const togglePlay = () => setIsPlaying(!isPlaying);

  return (
    <MusicContext.Provider value={{
      currentTrack,
      isPlaying,
      volume,
      playTrack,
      pauseTrack,
      resumeTrack,
      togglePlay,
      setVolume,
    }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};
