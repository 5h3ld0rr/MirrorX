import { useEffect, useRef, useState } from 'react';
import { useMusic } from '../context/MusicContext';

export const GlobalPlayer = () => {
  const { currentTrack, isPlaying, volume, activeType, setProgress, setDuration } = useMusic();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);

  // Send commands to YouTube iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe && loaded && activeType === 'music') {
      const command = isPlaying ? 'playVideo' : 'pauseVideo';
      iframe.contentWindow?.postMessage(JSON.stringify({ 
        event: 'command', 
        func: command, 
        args: [] 
      }), '*');
    }
  }, [isPlaying, loaded, activeType]);

  // Handle volume changes
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe && loaded && activeType === 'music') {
      iframe.contentWindow?.postMessage(JSON.stringify({ 
        event: 'command', 
        func: 'setVolume', 
        args: [volume] 
      }), '*');
    }
  }, [volume, loaded, activeType]);

  // Sync IFrame Data (Time/Duration)
  useEffect(() => {
    if (!loaded || activeType !== 'music') return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'infoDelivery' && data.info) {
          if (data.info.currentTime !== undefined) setProgress(Math.floor(data.info.currentTime));
          if (data.info.duration !== undefined) setDuration(Math.floor(data.info.duration));
        }
      } catch (e) {
        // Not a JSON message or not from YouTube
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Set up polling for time updates
    const pollInterval = setInterval(() => {
      const iframe = iframeRef.current;
      if (iframe && isPlaying) {
        iframe.contentWindow?.postMessage(JSON.stringify({ event: 'listening' }), '*');
      }
    }, 1000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(pollInterval);
    };
  }, [loaded, activeType, isPlaying, setProgress, setDuration]);

  // Clean up and guards
  if (!currentTrack || activeType !== 'music') {
    return null;
  }

  const handleLoad = () => {
    setLoaded(true);
  };

  const origin = window.location.origin;

  return (
    <div style={{ position: 'fixed', top: -100, left: -100, width: 1, height: 1, opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
      <iframe
        key={currentTrack.id} // Force re-mount on track change
        ref={iframeRef}
        id="global-youtube-player"
        onLoad={handleLoad}
        src={`https://www.youtube.com/embed/${currentTrack.id}?autoplay=1&playlist=${currentTrack.id}&loop=1&enablejsapi=1&origin=${origin}&widget_referrer=${origin}&rel=0&controls=0&modestbranding=1`}
        allow="autoplay; encrypted-media"
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    </div>
  );
};
