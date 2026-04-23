import { Server } from 'socket.io';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export class MotionService {
  private io: any;
  private pir: any = null;
  private isMotionEnabled: boolean = true;
  private lastMotionTime: number = Date.now();
  private MOTION_GPIO = Number(process.env.PIR_GPIO) || 4; // Default GPIO 4 (Physical Pin 7)

  constructor() {
    this.initHardware();
  }

  public setIo(io: any) {
    this.io = io;
  }

  private initHardware() {
    if (process.platform === 'linux') {
      try {
        const { Gpio } = require('onoff');
        
        // Try to initialize with 'both' edges. If it fails with EINVAL, try 'rising'.
        try {
          this.pir = new Gpio(this.MOTION_GPIO, 'in', 'both');
        } catch (e: any) {
          if (e.code === 'EINVAL') {
            console.warn(`⚠️ PIR 'both' edges not supported on GPIO ${this.MOTION_GPIO}, falling back to 'rising'`);
            this.pir = new Gpio(this.MOTION_GPIO, 'in', 'rising');
          } else {
            throw e;
          }
        }
        
        console.log(`✅ PIR Sensor initialized on GPIO ${this.MOTION_GPIO}`);

        this.pir.watch((err: any, value: number) => {
          if (err) {
            console.error('[MotionService] Error watching PIR:', err);
            return;
          }

          const isDetected = value === 1;
          if (isDetected) {
            this.lastMotionTime = Date.now();
          }

          if (this.io) {
            this.io.emit('motion:update', { 
              isDetected, 
              timestamp: this.lastMotionTime 
            });
          }
        });

      } catch (error: any) {
        console.warn(`⚠️ PIR Sensor hardware error: ${error.message}. Mock mode enabled.`);
      }
    } else {
      console.log('[MotionService] Non-linux platform. Running in simulation mode.');
      // Simulation mode for development
      setInterval(() => {
        const isDetected = Math.random() > 0.8; // Occasional motion
        if (isDetected) this.lastMotionTime = Date.now();
        
        if (this.io) {
          this.io.emit('motion:update', { 
            isDetected, 
            timestamp: this.lastMotionTime 
          });
        }
      }, 10000);
    }
  }

  public cleanup() {
    if (this.pir) {
      this.pir.unexport();
    }
  }
}

export const motionService = new MotionService();
