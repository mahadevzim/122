import { whatsappService } from './whatsappReal';
import { campaignService } from './campaign';
import { storage } from '../storage';

class WatchdogService {
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly checkIntervalMs = 30000; // 30 seconds
  private lastHealthCheck = Date.now();
  private consecutiveFailures = 0;
  private readonly maxFailures = 3;
  private isRecovering = false;

  constructor() {
    this.startHealthChecking();
  }

  private startHealthChecking(): void {
    console.log('🐕 Watchdog service iniciado - modo passivo (não interfere com conexões)');
    
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
        this.consecutiveFailures = 0;
      } catch (error) {
        this.consecutiveFailures++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.warn(`⚠️ Health check falhou (${this.consecutiveFailures}/${this.maxFailures}):`, errorMsg);
        
        // Disable automatic recovery completely to prevent interference
        // if (this.consecutiveFailures >= this.maxFailures && !this.isRecovering) {
        //   console.error('🚨 Sistema instável detectado - iniciando recuperação automática');
        //   await this.initiateRecovery();
        // }
      }
      
      this.lastHealthCheck = Date.now();
    }, this.checkIntervalMs);
  }

  private async performHealthCheck(): Promise<void> {
    // Passive health check - only monitor, don't change anything
    try {
      const connections = await storage.getWhatsappConnections();
      
      // Just log status without making any changes
      const connectedCount = connections.filter(c => c.status === 'connected').length;
      if (connectedCount > 0) {
        console.log(`Watchdog: ${connectedCount} WhatsApp connections active`);
      }
      
      // Check campaign service health without throwing errors
      const stats = await campaignService.getCampaignStats();
      if (stats) {
        console.log(`Watchdog: Campaign service responsive - ${stats.sent} sent, ${stats.pending} pending`);
      }
      
    } catch (error) {
      // Don't throw errors, just log them
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`Watchdog: Health check warning - ${errorMsg}`);
    }
  }

  private async reconnectWhatsApp(connectionId: number): Promise<void> {
    try {
      console.log(`🔄 Detectada conexão problemática ${connectionId}, marcando como desconectada...`);
      
      // Just mark as disconnected instead of trying to reconnect automatically
      // This prevents the watchdog from interfering with user's manual connections
      await storage.updateWhatsappConnection(connectionId, { 
        status: "disconnected",
        phoneNumber: null,
        qrCode: null 
      });
      
      console.log(`⚠️ WhatsApp ${connectionId} marcado como desconectado - usuário pode reconectar manualmente`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Falha ao atualizar status do WhatsApp ${connectionId}:`, errorMsg);
    }
  }

  private async initiateRecovery(): Promise<void> {
    if (this.isRecovering) {
      return;
    }
    
    this.isRecovering = true;
    console.log('🔧 Iniciando recuperação automática do sistema...');
    
    try {
      // Step 1: Pause campaign to prevent further issues
      console.log('1. Pausando campanhas...');
      await campaignService.pauseCampaign();
      
      // Step 2: Only disconnect problematic connections, not all
      console.log('2. Verificando conexões problemáticas...');
      const connections = await storage.getWhatsappConnections();
      for (const connection of connections) {
        if (connection.status === 'connected') {
          const isActuallyReady = whatsappService.isClientReady(connection.id);
          if (!isActuallyReady) {
            console.log(`Desconectando conexão problemática ${connection.id}...`);
            await whatsappService.forceDisconnectConnection(connection.id);
          }
        }
      }
      
      // Step 3: Wait for cleanup
      console.log('3. Aguardando estabilização...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Step 4: Don't automatically reconnect - let user do it manually
      // This prevents the watchdog from interfering with user's manual connections
      console.log('4. Recuperação concluída - usuário pode reconectar manualmente');
      
      console.log('✅ Recuperação automática concluída');
      this.consecutiveFailures = 0;
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ Falha na recuperação automática:', errorMsg);
    } finally {
      this.isRecovering = false;
    }
  }

  public getStatus(): object {
    return {
      lastHealthCheck: new Date(this.lastHealthCheck).toISOString(),
      consecutiveFailures: this.consecutiveFailures,
      maxFailures: this.maxFailures,
      isRecovering: this.isRecovering,
      nextCheckIn: Math.max(0, this.checkIntervalMs - (Date.now() - this.lastHealthCheck))
    };
  }

  public async forceHealthCheck(): Promise<void> {
    console.log('🔍 Executando health check manual...');
    await this.performHealthCheck();
    console.log('✅ Health check manual concluído');
  }

  public stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('🐕 Watchdog service parado');
    }
  }
}

export const watchdogService = new WatchdogService();