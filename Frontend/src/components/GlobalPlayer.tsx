import { useEffect, useRef } from 'react';
import { useMusic } from '../context/MusicContext';

export const GlobalPlayer = () => {
  const { currentTrack, isPlaying, volume } = useMusic();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!currentTrack || !iframeRef.current) return;

    // We use the YouTube IFrame API via postMessage for basic controls
    // For a more robust implementation, the YouTube IFrame API script should be loaded
    const iframe = iframeRef.current;
    
    if (isPlaying) {
      iframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'playVideo' }), '*');
    } else {
      iframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo' }), '*');
    }
  }, [isPlaying, currentTrack]);

  useEffect(() => {
    if (!iframeRef.current) return;
    iframeRef.current.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [volume] }), '*');
  }, [volume]);

  if (!currentTrack) return null;

  return (
    <div style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}>
      <iframe
        ref={iframeRef}
        id="global-youtube-player"
        width="1"
        height="1"
        src={`https://www.youtube.com/embed/${currentTrack.id}?enablejsapi=1&autoplay=1&controls=0`}
        title="YouTube video player"
        frameBorder="0"
        allow="autoplay; encrypted-media"
      />
    </div>
  );
};
