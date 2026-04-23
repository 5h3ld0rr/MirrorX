import { exec } from 'child_process';
import os from 'os';

export class BrowserService {
  private static instance: BrowserService;
  private browserStarted: boolean = false;

  private constructor() {}

  public static getInstance(): BrowserService {
    if (!BrowserService.instance) {
      BrowserService.instance = new BrowserService();
    }
    return BrowserService.instance;
  }

  /**
   * Opens the specified URL in the browser.
   * On Raspberry Pi, it uses Chromium in kiosk mode.
   */
  public openUrl(url: string) {
    if (this.browserStarted) return;

    console.log(`🌐 Opening browser for: ${url}`);
    
    let command = '';
    
    if (process.platform === 'linux') {
      // Optimized for Raspberry Pi (Kiosk Mode)
      // Added permission bypass flags and treated localhost as a secure origin for camera/location access
      const chromeFlags = `--kiosk --app=${url} --noerrdialogs --disable-infobars --check-for-update-interval=31536000 --autoplay-policy=no-user-gesture-required --disable-session-crashed-bubble --user-data-dir=/tmp/mirror_browser --password-store=basic --use-fake-ui-for-media-stream --unsafely-treat-insecure-origin-as-secure=http://localhost:5173,http://localhost:4173`;
      
      // Search for the V4L2 converter in all common paths (libcamera and the new rpicam stack)
      const preload = `export LD_PRELOAD=$(ls /usr/lib/aarch64-linux-gnu/libcamera/v4l2-convert.so /usr/lib/arm-linux-gnueabihf/libcamera/v4l2-convert.so /usr/lib/aarch64-linux-gnu/rpicam-apps/v4l2-convert.so 2>/dev/null | head -n 1)`;
      
      // Support both X11 (DISPLAY) and Wayland
      command = `
        export DISPLAY=:0; 
        export WAYLAND_DISPLAY=wayland-0; 
        ${preload}; 
        if command -v chromium-browser >/dev/null; then chromium-browser ${chromeFlags};
        elif command -v chromium >/dev/null; then chromium ${chromeFlags};
        elif command -v google-chrome >/dev/null; then google-chrome ${chromeFlags};
        fi
      `.replace(/\n/g, ' ').trim();
    } else if (process.platform === 'win32') {
      // For Windows, calling chrome directly is more reliable for kiosk mode
      command = `start chrome --new-window --kiosk --app=${url} --noerrdialogs --disable-infobars --disable-session-crashed-bubble --user-data-dir=%TEMP%\\mirror_browser --password-store=basic`;
    } else {
      command = `open ${url}`;
    }

    exec(command, (error) => {
      if (error) {
        console.error(`❌ Failed to open browser: ${error.message}`);
      } else {
        this.browserStarted = true;
        console.log("✅ Browser launched successfully.");
      }
    });
  }
}

export const browserService = BrowserService.getInstance();
