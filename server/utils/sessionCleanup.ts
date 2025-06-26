import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

export class SessionCleanup {
  private static readonly SESSION_DIR = './.wwebjs_auth';
  
  static async cleanupSessions(): Promise<void> {
    try {
      if (!fs.existsSync(this.SESSION_DIR)) {
        return;
      }

      const sessions = fs.readdirSync(this.SESSION_DIR);
      
      for (const session of sessions) {
        const sessionPath = path.join(this.SESSION_DIR, session);
        
        try {
          await this.forceRemoveDirectory(sessionPath);
          console.log(`Cleaned up session: ${session}`);
        } catch (error) {
          console.warn(`Could not clean up session ${session}:`, error);
        }
      }
    } catch (error) {
      console.warn('Error during session cleanup:', error);
    }
  }

  static async cleanupSpecificSession(clientId: string): Promise<void> {
    const sessionPath = path.join(this.SESSION_DIR, `session-${clientId}`);
    
    try {
      if (fs.existsSync(sessionPath)) {
        await this.forceRemoveDirectory(sessionPath);
        console.log(`Cleaned up specific session: ${clientId}`);
      }
    } catch (error) {
      console.warn(`Could not clean up session ${clientId}:`, error);
    }
  }

  private static async forceRemoveDirectory(dirPath: string): Promise<void> {
    return new Promise((resolve) => {
      const platform = process.platform;
      let command: string;

      if (platform === 'win32') {
        // Windows: Use multiple attempts and always resolve to prevent crashes
        command = `timeout /t 1 /nobreak > nul 2>&1 && rmdir /s /q "${dirPath}" 2>nul || echo "Cleanup attempted"`;
      } else {
        // Unix-like systems
        command = `rm -rf "${dirPath}" 2>/dev/null || true`;
      }

      exec(command, { timeout: 5000 }, (error) => {
        // Always resolve, never reject to prevent crashes
        if (error) {
          console.warn(`Session cleanup warning (non-critical):`, error.message);
        }
        resolve();
      });
    });
  }

  static async isSessionLocked(clientId: string): Promise<boolean> {
    const sessionPath = path.join(this.SESSION_DIR, `session-${clientId}`);
    const lockFiles = [
      'Default/chrome_debug.log',
      'Default/Preferences',
      'Default/Local State'
    ];

    for (const lockFile of lockFiles) {
      const fullPath = path.join(sessionPath, lockFile);
      try {
        if (fs.existsSync(fullPath)) {
          // Try to access the file to see if it's locked
          fs.accessSync(fullPath, fs.constants.R_OK | fs.constants.W_OK);
        }
      } catch (error) {
        return true; // File is locked
      }
    }
    
    return false;
  }
}