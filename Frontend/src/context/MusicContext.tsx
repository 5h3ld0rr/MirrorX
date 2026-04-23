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
  toggleMute: () => void;
  seekTo: (seconds: number) => void;
  seekRequest: { time: number; ts: number } | null;
  setProgress: (seconds: number) => void;
  skipForward: () => void;
  skipBackward: () => void;
  addToQueue: (track: YouTubeVideo) => void;
  isShuffle: boolean;
  isLoop: boolean;
  toggleShuffle: () => void;
  toggleLoop: () => void;
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
  const [seekRequest, setSeekRequest] = useState<{ time: number; ts: number } | null>(null);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isLoop, setIsLoop] = useState(false);

  // Methods

  const playTrack = useCallback((track: YouTubeVideo, newQueue?: YouTubeVideo[]) => {
    setActiveVideo(null);
    setCurrentTrack(track);
    if (newQueue) setQueue(newQueue);
    setIsPlaying(true);
    setActiveType('music');
    setProgress(0);
    setDuration(0);
    setSeekRequest(null);
  }, []);

  const playVideo = useCallback((video: YouTubeVideo) => {
    setCurrentTrack(null);
    setIsPlaying(true);
    setActiveVideo(video);
    setActiveType('video');
    setProgress(0);
    setDuration(0);
    setSeekRequest(null);
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
    const currentIndex = queue.findIndex(t => t.id === (currentTrack?.id || activeVideo?.id));
    
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      playTrack(queue[randomIndex]);
    } else if (currentIndex !== -1 && currentIndex < queue.length - 1) {
      playTrack(queue[currentIndex + 1]);
    } else if (currentIndex === queue.length - 1) {
      // Loop back to start of queue if loop is on or just reached end
      playTrack(queue[0]);
    }
  }, [queue, currentTrack, activeVideo, isShuffle, playTrack]);

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

  const toggleMute = useCallback(() => {
    setVolume(prev => prev === 0 ? 70 : 0);
  }, []);

  const seekTo = useCallback((seconds: number) => {
    setProgress(seconds);
    setSeekRequest({ time: seconds, ts: Date.now() });
  }, []);

  const toggleShuffle = useCallback(() => setIsShuffle(prev => !prev), []);
  const toggleLoop = useCallback(() => setIsLoop(prev => !prev), []);

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
      toggleMute,
      seekTo,
      seekRequest,
      setProgress,
      skipForward,
      skipBackward,
      addToQueue,
      isShuffle,
      isLoop,
      toggleShuffle,
      toggleLoop,
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
