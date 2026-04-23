import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let i2c: any;
try {
  // Only attempt to load i2c-bus on Linux or if it exists
  if (process.platform === 'linux') {
    i2c = require('i2c-bus');
  }
} catch (e) {
  console.warn('⚠️ i2c-bus module not found. Hardware sensor will be disabled.');
}

class BrightnessService {
  private i2cBus: any;
  private readonly ADDRESS = 0x23; // Default BH1750 address
  private readonly COMMAND = 0x10; // Continuously H-Resolution Mode
  private io: any;
  private interval: NodeJS.Timeout | null = null;
  private lastLux = 0;

  constructor() {
    try {
      if (i2c) {
        this.i2cBus = i2c.openSync(1);
        console.log('✅ BH1750 Sensor Initialized on I2C Bus 1');
      } else {
        throw new Error('i2c-bus module missing');
      }
    } catch (err) {
      console.warn('⚠️ BH1750 Sensor not found or hardware not available. Falling back to mock mode.');
      this.i2cBus = null;
    }
  }

  public setIo(io: any) {
    this.io = io;
  }

  public setAutoBrightness(enabled: boolean) {
    if (enabled && !this.interval) {
      this.startPolling();
    } else if (!enabled && this.interval) {
      this.stopPolling();
    }
  }

  private startPolling() {
    this.interval = setInterval(() => {
      this.readLux();
    }, 2000); // Poll every 2 seconds
  }

  private stopPolling() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private readLux() {
    let lux = 0;
    if (this.i2cBus) {
      try {
        const buffer = Buffer.alloc(2);
        this.i2cBus.readI2cBlockSync(this.ADDRESS, this.COMMAND, 2, buffer);
        lux = (buffer[0] << 8 | buffer[1]) / 1.2;
      } catch (err) {
        console.error('❌ Error reading from BH1750:', err);
        return;
      }
    } else {
      // Mock data for development - simulate natural light changes
      const base = 300;
      const variation = Math.sin(Date.now() / 10000) * 200; // Oscillate
      lux = Math.max(0, base + variation + (Math.random() * 20 - 10));
    }

    // Moving average for smoothing (0.2 weight for new reading)
    this.lastLux = this.lastLux === 0 ? lux : (this.lastLux * 0.8 + lux * 0.2);
    const brightness = this.calculateBrightness(this.lastLux);

    if (this.io) {
      this.io.emit('brightness:update', { lux: Math.round(this.lastLux), brightness });
    }
  }

  private calculateBrightness(lux: number): number {
    // Increased sensitivity: reach 100% brightness at 800 lux (bright indoor)
    // Minimum floor increased to 10% for better visibility
    const maxLux = 800; 
    const minB = 10;
    const maxB = 100;
    
    if (lux <= 0.1) return minB;
    if (lux >= maxLux) return maxB;
    
    // Square root curve: rises quickly in low light to ensure visibility, then tapers
    const normalized = lux / maxLux;
    const b = minB + Math.sqrt(normalized) * (maxB - minB);
    
    return Math.min(maxB, Math.max(minB, Math.round(b)));
  }
}

export const brightnessService = new BrightnessService();
