import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { YouTubeVideo } from '../services/youtube';

interface MusicContextType {
  currentTrack: YouTubeVideo | null;
  queue: YouTubeVideo[];
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  setDuration: (seconds: number) => void;
  // YouTube specific
  activeId: string | null;
  activeType: 'music' | 'video' | null;
  playTrack: (track: YouTubeVideo, newQueue?: YouTubeVideo[]) => void;
  playVideo: (video: YouTubeVideo) => void;
  stopAll: () => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  setProgress: (seconds: number) => void;
  skipForward: () => void;
  skipBackward: () => void;
  addToQueue: (track: YouTubeVideo) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<YouTubeVideo | null>(null);
  const [activeVideo, setActiveVideo] = useState<YouTubeVideo | null>(null);
  const [queue, setQueue] = useState<YouTubeVideo[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [activeType, setActiveType] = useState<'music' | 'video' | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // Sync Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        if (progress < duration && duration > 0) {
          setProgress(prev => prev + 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval!);
  }, [isPlaying, progress, duration]);

  const playTrack = useCallback((track: YouTubeVideo, newQueue?: YouTubeVideo[]) => {
    setActiveVideo(null);
    setCurrentTrack(track);
    if (newQueue) setQueue(newQueue);
    setIsPlaying(true);
    setActiveType('music');
    setProgress(0);
    setDuration(0);
  }, []);

  const playVideo = useCallback((video: YouTubeVideo) => {
    setCurrentTrack(null);
    setIsPlaying(true);
    setActiveVideo(video);
    setActiveType('video');
    setProgress(0);
    setDuration(0);
  }, []);

  const stopAll = useCallback(() => {
    setCurrentTrack(null);
    setActiveVideo(null);
    setIsPlaying(false);
    setActiveType(null);
  }, []);

  const pauseTrack = useCallback(() => setIsPlaying(false), []);
  const resumeTrack = useCallback(() => {
    if (currentTrack) setIsPlaying(true);
  }, [currentTrack]);
  const togglePlay = useCallback(() => setIsPlaying(prev => !prev), []);

  const skipForward = useCallback(() => {
    if (queue.length === 0) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
    if (currentIndex !== -1 && currentIndex < queue.length - 1) {
      playTrack(queue[currentIndex + 1]);
    }
  }, [queue, currentTrack, playTrack]);

  const skipBackward = useCallback(() => {
    if (queue.length === 0) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
    if (currentIndex > 0) {
      playTrack(queue[currentIndex - 1]);
    }
  }, [queue, currentTrack, playTrack]);

  const addToQueue = useCallback((track: YouTubeVideo) => {
    setQueue(prev => [...prev, track]);
  }, []);
  return (
    <MusicContext.Provider value={{
      currentTrack: activeType === 'music' ? currentTrack : activeVideo,
      queue,
      isPlaying,
      volume,
      progress,
      duration,
      setDuration,
      activeId: activeType === 'music' ? currentTrack?.id || null : activeVideo?.id || null,
      activeType,
      playTrack,
      playVideo,
      stopAll,
      pauseTrack,
      resumeTrack,
      togglePlay,
      setVolume,
      setProgress,
      skipForward,
      skipBackward,
      addToQueue,
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
