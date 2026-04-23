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
      // Added --app and --user-data-dir to ensure a clean kiosk instance
      command = `chromium-browser --kiosk --app=${url} --noerrdialogs --disable-infobars --check-for-update-interval=31536000 --autoplay-policy=no-user-gesture-required --disable-session-crashed-bubble --user-data-dir=/tmp/mirror_browser`;
    } else if (process.platform === 'win32') {
      // For Windows, calling chrome directly is more reliable for kiosk mode
      command = `start chrome --new-window --kiosk --app=${url} --noerrdialogs --disable-infobars --disable-session-crashed-bubble --user-data-dir=%TEMP%\\mirror_browser`;
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
