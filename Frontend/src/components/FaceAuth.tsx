import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';
import { API_BASE_URL, exchangeToken } from '../lib/api';
import { CONFIG } from '../config';

export const FaceAuth = forwardRef(({ onUserAuth, hasInteracted, isLoggedIn, onActivity, isPaused, isOnline, onStatusChange }: {
  onUserAuth: (user: any) => void,
  hasInteracted: boolean,
  isLoggedIn: boolean,
  onActivity?: () => void,
  isPaused?: boolean,
  isOnline?: boolean,
  onStatusChange?: (status: string) => void
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatusInternal] = useState('Idle');

  const setStatus = (newStatus: string) => {
    setStatusInternal(newStatus);
    if (onStatusChange) onStatusChange(newStatus);
  };

  const [isCameraEnabled, setIsCameraEnabled] = useState(false);

  useImperativeHandle(ref, () => ({
    getBlob: async (): Promise<Blob | null> => {
      if (!videoRef.current || !canvasRef.current) return null;
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0);
      return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
    }
  }));

  const intervalRef = useRef<any>(null);
  const failCountRef = useRef<number>(0);

  useEffect(() => {
    if (hasInteracted && !isLoggedIn) {
      if (!isOnline) {
        setStatus('OFFLINE');
        stopCamera();
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }

      if (!isPaused) {
        startCamera();
        intervalRef.current = setInterval(captureAndAuth, CONFIG.FACE_SCAN_INTERVAL);
      } else {
        setStatus('Registration Preview Active');
      }
    } else {
      failCountRef.current = 0;
      stopCamera();
      setStatus('Idle');
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopCamera();
    };
  }, [hasInteracted, isLoggedIn, isPaused, isOnline]);

  useEffect(() => {
    if (isCameraEnabled && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraEnabled]);

  const startCamera = async () => {
    if (isLoggedIn || !hasInteracted || isPaused || !isOnline) return;
    
    try {
      if (streamRef.current) {
        setIsCameraEnabled(true);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Double check state after async call
      if (isLoggedIn || !hasInteracted) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      streamRef.current = stream;
      setIsCameraEnabled(true);
    } catch (err) {
      console.error(err);
      setStatus('Camera Error');
      setIsCameraEnabled(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraEnabled(false);
  };

  const captureAndAuth = async () => {
    if (!videoRef.current || !canvasRef.current || isScanning) return;

    if (failCountRef.current >= CONFIG.MAX_FACE_SCAN_FAIL_COUNT) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      stopCamera();
      return;
    }

    if (onActivity) onActivity();

    setIsScanning(true);
    setStatus('Scanning...');

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      canvas.toBlob(async (blob) => {
        if (blob) {
          const formData = new FormData();
          formData.append('photo', blob, 'face.jpg');

          try {
            const response = await axios.post(`${API_BASE_URL}/auth/login`, formData);
            if (response.data.success) {
              failCountRef.current = 0;
              setStatus('Authenticated');
              const idToken = await exchangeToken(response.data.token);
              onUserAuth({ ...response.data.user, token: idToken });
            } else {
              handleFailure('Face not recognized');
            }
          } catch (err: any) {
            if (!err.response) {
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              setStatus('Backend unavailable');
              setIsCameraEnabled(false);
            } else {
              const errorMsg = err.response?.data?.error || 'Searching...';
              handleFailure(errorMsg);
            }
          }
        }
        setIsScanning(false);
      }, 'image/jpeg');
    }
  };

  const handleFailure = (msg: string) => {
    failCountRef.current += 1;
    if (failCountRef.current >= CONFIG.MAX_FACE_SCAN_FAIL_COUNT) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      stopCamera();
      setStatus('Max attempts reached. Please let screen turn off to retry.');
    } else {
      setStatus(msg);
    }
  };

  if (isLoggedIn) return null;

  return (
    <div className="main-content">
      {isCameraEnabled && (
        <div className={`scanning-ring ${isScanning ? 'active' : ''}`}>
          <video ref={videoRef} autoPlay muted playsInline />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div className="scan-line"></div>
        </div>
      )}
      {status !== 'Idle' && (
        <div style={{
          position: 'absolute',
          bottom: '-3rem',
          textAlign: 'center',
          width: '100%'
        }}>
          <div
            className="glitch-text"
            style={{
              fontSize: '0.8rem',
              color: (status.includes('closer') || status.includes('far')) ? '#ff4d4d' : (isScanning ? 'var(--accent-primary)' : 'var(--text-muted)'),
              fontWeight: '400',
              textTransform: 'uppercase',
              letterSpacing: '0.1rem'
            }}
          >
          </div>
        </div>
      )}
    </div>
  );
});
