import { spawn } from 'child_process';
import { analyzeFace } from './faceService.js';
import { Server } from 'socket.io';

export class CameraFaceService {
  private io: Server | null = null;
  private isScanning: boolean = false;
  private scanInterval: NodeJS.Timeout | null = null;
  private isActive: boolean = false;
  private failCount: number = 0;

  constructor() {}

  public setIo(io: Server) {
    this.io = io;
  }

  public startService() {
    if (this.isActive) return;
    this.isActive = true;
    console.log("📸 Camera Face Detection Service started.");
    this.scheduleNextScan();
  }

  public stopService() {
    this.isActive = false;
    if (this.scanInterval) {
      clearTimeout(this.scanInterval);
      this.scanInterval = null;
    }
    console.log("📸 Camera Face Detection Service stopped.");
  }

  private scheduleNextScan() {
    if (!this.isActive) return;
    
    // Scan every 3 seconds when idle
    this.scanInterval = setTimeout(() => {
      this.performScan();
    }, 3000);
  }

  private async performScan() {
    if (this.isScanning || !this.isActive) return;
    this.isScanning = true;

    try {
      const imageBuffer = await this.captureImage();
      if (imageBuffer) {
        const result = await analyzeFace(imageBuffer);
        
        if (result.success) {
          console.log("👤 Face detected by Camera Service! Waking up mirror...");
          this.io?.emit('motion:update', { 
            isDetected: true, 
            timestamp: Date.now(),
            source: 'camera'
          });
          // Stop scanning for a while to allow auth to happen on frontend
          this.stopService();
          setTimeout(() => this.startService(), 30000); // Resume after 30s
        }
      }
    } catch (err) {
      console.error("❌ Camera Scan Error:", err);
    } finally {
      this.isScanning = false;
      this.scheduleNextScan();
    }
  }

  private captureImage(): Promise<Buffer | null> {
    return new Promise((resolve) => {
      if (process.platform !== 'linux') {
        resolve(null);
        return;
      }

      // Using libcamera-still for RPi 4/5 (modern stack)
      // --immediate: don't wait for auto-exposure to settle (faster but darker)
      // --width 640 --height 480: low res for speed
      // -o -: output to stdout
      const capture = spawn('libcamera-still', [
        '--timeout', '1',
        '--width', '640',
        '--height', '480',
        '--immediate',
        '--nopreview',
        '-o', '-'
      ]);

      let chunks: Buffer[] = [];
      capture.stdout.on('data', (chunk) => {
        chunks.push(chunk);
      });

      capture.on('close', (code) => {
        if (code === 0 && chunks.length > 0) {
          resolve(Buffer.concat(chunks));
        } else {
          resolve(null);
        }
      });

      capture.on('error', () => {
        resolve(null);
      });
    });
  }
}

export const cameraFaceService = new CameraFaceService();
