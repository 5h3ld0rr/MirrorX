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
        const fs = require('fs');
        
        // 1. Force unexport if already exists to ensure clean state
        try {
          if (fs.existsSync(`/sys/class/gpio/gpio${this.MOTION_GPIO}`)) {
            fs.writeFileSync('/sys/class/gpio/unexport', String(this.MOTION_GPIO));
            // Small sync delay to let kernel process unexport
            const start = Date.now();
            while (Date.now() - start < 100) {}
          }
        } catch (e) {}

        // 2. Try simple initialization first (no edge detection)
        try {
          this.pir = new Gpio(this.MOTION_GPIO, 'in', 'both');
        } catch (e: any) {
          console.warn(`⚠️ PIR 'both' edges failed: ${e.message}. Trying 'rising'...`);
          try {
            this.pir = new Gpio(this.MOTION_GPIO, 'in', 'rising');
          } catch (e2: any) {
             console.warn(`⚠️ PIR 'rising' edges failed: ${e2.message}. Trying basic 'in'...`);
             this.pir = new Gpio(this.MOTION_GPIO, 'in');
          }
        }
        
        console.log(`✅ PIR Sensor initialized on GPIO ${this.MOTION_GPIO}`);

        this.pir.watch((err: any, value: number) => {
          if (err) {
            console.error('[MotionService] Error watching PIR:', err);
            return;
          }
          const isDetected = value === 1;
          if (isDetected) this.lastMotionTime = Date.now();
          if (this.io) this.io.emit('motion:update', { isDetected, timestamp: this.lastMotionTime });
        });

      } catch (error: any) {
        let msg = error.message;
        if (msg.includes('EINVAL') || msg.includes('EACCES')) {
          msg += ' (If on Pi 5, use node-libgpiod instead of onoff)';
        }
        console.warn(`❌ PIR Sensor hardware error: ${msg}. Mock mode enabled.`);
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
