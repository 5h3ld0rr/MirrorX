import { useEffect, useRef, useState } from 'react';
import { useMusic } from '../context/MusicContext';

export const GlobalPlayer = () => {
  const { currentTrack, isPlaying, volume, activeType, progress, duration, setProgress, setDuration, isLoop, skipForward, seekRequest } = useMusic();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const progressRef = useRef(progress);
  const durationRef = useRef(duration);
  const loadedRef = useRef(loaded);
  const trackIdAtLoad = useRef<string | null>(null);
  const lastProgress = useRef(0);
  const staleCounter = useRef(0);

  // Sync refs
  useEffect(() => {
    progressRef.current = progress;
    durationRef.current = duration;
    loadedRef.current = loaded;
  }, [progress, duration, loaded]);

  // Reset loaded state and metrics when track changes
  useEffect(() => {
    setLoaded(false);
    setProgress(0);
    setDuration(0);
  }, [currentTrack?.id]);

  const sendCommand = (func: string, args: any[] = []) => {
    const iframe = iframeRef.current;
    if (iframe && loaded && activeType === 'music') {
      iframe.contentWindow?.postMessage(JSON.stringify({ 
        event: 'command', func, args 
      }), '*');
    }
  };

  // Play/Pause Control
  useEffect(() => {
    sendCommand(isPlaying ? 'playVideo' : 'pauseVideo');
  }, [isPlaying, loaded, activeType]);

  // Volume & Track Sync
  useEffect(() => {
    sendCommand('setVolume', [volume]);
  }, [volume, loaded, activeType, currentTrack?.id]);
  
  // Seek Handler
  useEffect(() => {
    if (seekRequest) {
      sendCommand('seekTo', [seekRequest.time, true]);
    }
  }, [seekRequest, loaded, activeType]);

  // Main Event Listener & Controller
  useEffect(() => {
    if (!loaded || activeType !== 'music') return;

    const handleMessage = (event: MessageEvent) => {
      if (!loadedRef.current || trackIdAtLoad.current !== currentTrack?.id) return;
      
      try {
        const data = JSON.parse(event.data);
        
        // Time & Duration updates
        if (data.event === 'infoDelivery' && data.info) {
          if (data.info.currentTime !== undefined) setProgress(Math.floor(data.info.currentTime));
          if (data.info.duration !== undefined) setDuration(Math.floor(data.info.duration));
        }

        // Initialize state on Ready
        if (data.event === 'onReady') {
          sendCommand('setVolume', [volume]);
        }

        // Playback state transitions
        if (data.event === 'onStateChange') {
          const rawState = data.info !== undefined ? data.info : (data.args ? data.args[0] : data.data);
          const state = typeof rawState === 'object' ? rawState.playbackQuality : rawState; // Handle object wrapper if present
          
          // Basic state mapping for standard events
          const finalState = typeof rawState === 'number' ? rawState : (data.info?.playerState);

          if (finalState === 0 || state === 0) { // ENDED
            if (isLoop) {
              sendCommand('seekTo', [0, true]);
              sendCommand('playVideo');
            } else {
              skipForward();
            }
          }
        }
      } catch (e) { /* Ignore non-JSON or external messages */ }
    };

    window.addEventListener('message', handleMessage);
    
    // Watchdog for missing ENDED events
    const watchdog = setInterval(() => {
      if (isPlaying) {
        // Heartbeat to keep iFrame communication active
        iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening' }), '*');
        
        // Staleness Heartbeat
        if (progressRef.current === lastProgress.current && isPlaying) {
          staleCounter.current++;
        } else {
          staleCounter.current = 0;
        }
        lastProgress.current = progressRef.current;

        const isNearEnd = durationRef.current > 0 && progressRef.current >= durationRef.current - 1;
        
        // If we are near end and stuck for 4 seconds, or reached duration + 1
        if ((isNearEnd && staleCounter.current >= 4) || (durationRef.current > 0 && progressRef.current >= durationRef.current + 1)) {
          if (!isLoop) skipForward();
        }
      }
    }, 1000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(watchdog);
    };
  }, [loaded, activeType, isPlaying, setProgress, setDuration, isLoop, skipForward]);

  if (!currentTrack || activeType !== 'music') return null;

  const handleLoad = () => {
    setLoaded(true);
    trackIdAtLoad.current = currentTrack?.id;
  };

  const origin = window.location.origin;

  return (
    <div style={{ position: 'fixed', top: -100, left: -100, width: 1, height: 1, opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
      <iframe
        key={currentTrack.id} // Force re-mount on track change
        ref={iframeRef}
        id="global-youtube-player"
        onLoad={handleLoad}
        src={`https://www.youtube.com/embed/${currentTrack.id}?autoplay=1&enablejsapi=1&origin=${origin}&widget_referrer=${origin}&rel=0&controls=0&modestbranding=1`}
        allow="autoplay; encrypted-media"
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    </div>
  );
};
