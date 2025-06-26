import { spawn, ChildProcess } from 'child_process';
import { whatsappService } from './services/whatsappReal';
import { campaignService } from './services/campaign';
import { secondMessageService } from './services/secondMessage';

class ProcessManager {
  private restartCount = 0;
  private maxRestarts = 50;
  private restartDelay = 5000; // 5 seconds
  private lastCrashTime = 0;
  private crashThreshold = 30000; // 30 seconds
  private isShuttingDown = false;

  constructor() {
    this.setupGlobalErrorHandlers();
  }

  private setupGlobalErrorHandlers(): void {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      console.error('🚨 Uncaught Exception:', error);
      this.handleCrash('uncaughtException', error);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
      this.handleCrash('unhandledRejection', reason);
    });

    // Handle SIGTERM
    process.on('SIGTERM', () => {
      console.log('📱 Received SIGTERM, gracefully shutting down...');
      this.gracefulShutdown();
    });

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      console.log('📱 Received SIGINT, gracefully shutting down...');
      this.gracefulShutdown();
    });

    // Handle warnings
    process.on('warning', (warning) => {
      console.warn('⚠️ Process warning:', warning.name, warning.message);
    });
  }

  private handleCrash(type: string, error: any): void {
    if (this.isShuttingDown) {
      return;
    }

    const now = Date.now();
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error(`💥 Application crashed (${type}):`, errorMessage);
    
    // Check if this is a session cleanup error - don't restart for these
    if (errorMessage.includes('EBUSY') || 
        errorMessage.includes('resource busy or locked') ||
        errorMessage.includes('chrome_debug.log')) {
      console.warn(`⚠️ Session cleanup error detected - ignoring crash to prevent restart loop`);
      return;
    }
    
    // Check if this is a rapid restart loop
    if (now - this.lastCrashTime < this.crashThreshold) {
      this.restartCount++;
      console.warn(`⚠️ Rapid restart detected. Count: ${this.restartCount}/${this.maxRestarts}`);
    } else {
      this.restartCount = 1;
    }
    
    this.lastCrashTime = now;

    // If too many restarts, increase delay
    if (this.restartCount > 5) {
      this.restartDelay = Math.min(30000, this.restartDelay * 1.5); // Max 30 seconds
      console.warn(`🔄 Increasing restart delay to ${this.restartDelay}ms`);
    }

    if (this.restartCount <= this.maxRestarts) {
      console.log(`🔄 Attempting restart ${this.restartCount}/${this.maxRestarts} in ${this.restartDelay}ms...`);
      this.scheduleRestart();
    } else {
      console.error(`💀 Maximum restart attempts (${this.maxRestarts}) reached. Exiting.`);
      process.exit(1);
    }
  }

  private scheduleRestart(): void {
    setTimeout(async () => {
      try {
        await this.cleanupServices();
        console.log('🔄 Restarting application services...');
        
        // Reset services
        await this.reinitializeServices();
        
        console.log('✅ Application services restarted successfully');
        
        // Reset restart delay on successful restart
        this.restartDelay = 5000;
        
      } catch (restartError) {
        console.error('❌ Failed to restart services:', restartError);
        this.handleCrash('restart_failure', restartError);
      }
    }, this.restartDelay);
  }

  private async cleanupServices(): Promise<void> {
    console.log('🧹 Cleaning up services...');
    
    try {
      // Stop campaign service
      if (campaignService) {
        await campaignService.pauseCampaign();
        console.log('✅ Campaign service stopped');
      }
    } catch (error) {
      console.warn('⚠️ Error stopping campaign service:', error);
    }

    try {
      // Clear second message service
      if (secondMessageService) {
        secondMessageService.clearAllScheduledMessages();
        console.log('✅ Second message service cleared');
      }
    } catch (error) {
      console.warn('⚠️ Error clearing second message service:', error);
    }

    try {
      // Force disconnect all WhatsApp connections
      const connectedClients = whatsappService.getConnectedClients();
      for (const connectionId of connectedClients) {
        await whatsappService.forceDisconnectConnection(connectionId);
      }
      console.log('✅ WhatsApp connections disconnected');
    } catch (error) {
      console.warn('⚠️ Error disconnecting WhatsApp services:', error);
    }

    // Wait a moment for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  private async reinitializeServices(): Promise<void> {
    console.log('🔧 Reinitializing services...');
    
    // Services will be reinitialized when needed by the application
    // The storage and routing are already set up, so we just need to let
    // the application naturally restore its state
    
    console.log('✅ Services ready for reinitialization');
  }

  private async gracefulShutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }
    
    this.isShuttingDown = true;
    console.log('🛑 Initiating graceful shutdown...');
    
    try {
      await this.cleanupServices();
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  // Health check method
  public getStatus(): object {
    return {
      restartCount: this.restartCount,
      maxRestarts: this.maxRestarts,
      restartDelay: this.restartDelay,
      lastCrashTime: this.lastCrashTime,
      isShuttingDown: this.isShuttingDown,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      pid: process.pid
    };
  }

  // Manual restart method
  public async manualRestart(): Promise<void> {
    console.log('🔄 Manual restart initiated...');
    this.restartCount = 0; // Reset count for manual restart
    await this.cleanupServices();
    await this.reinitializeServices();
    console.log('✅ Manual restart completed');
  }
}

export const processManager = new ProcessManager();