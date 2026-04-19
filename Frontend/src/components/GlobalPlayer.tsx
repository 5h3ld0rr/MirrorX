import { useEffect, useRef, useState } from 'react';
import { useMusic } from '../context/MusicContext';

export const GlobalPlayer = () => {
  const { currentTrack, isPlaying, volume, activeType } = useMusic();
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
        src={`https://www.youtube-nocookie.com/embed/${currentTrack.id}?autoplay=1&playlist=${currentTrack.id}&loop=1&enablejsapi=1&origin=${origin}&widget_referrer=${origin}&rel=0&controls=0&modestbranding=1`}
        allow="autoplay; encrypted-media"
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    </div>
  );
};
