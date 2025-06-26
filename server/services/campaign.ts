import { storage } from "../storage";
import { whatsappService } from "./whatsappReal";
import { secondMessageService } from "./secondMessage";
import type { Contact, WhatsappConnection, MessageVariation, CampaignSettings } from "@shared/schema";

class CampaignService {
  private campaignInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private activeConnections: number[] = []; // Cache of active connection IDs
  private connectionCheckInterval: NodeJS.Timeout | null = null;

  async startCampaign(): Promise<void> {
    if (this.isRunning) {
      throw new Error("Campaign is already running");
    }

    const settings = await storage.getCampaignSettings();
    if (!settings) {
      throw new Error("Campaign settings not found");
    }

    const connections = await storage.getWhatsappConnections();
    const connectedConnections = connections.filter(conn => conn.status === "connected");
    
    if (connectedConnections.length === 0) {
      throw new Error("No connected WhatsApp accounts found");
    }

    const contacts = await storage.getContacts();
    const pendingContacts = contacts.filter(contact => contact.status === "pending");
    
    if (pendingContacts.length === 0) {
      throw new Error("No pending contacts found");
    }

    const activeVariations = await storage.getMessageVariations();
    const enabledVariations = activeVariations.filter(variation => variation.enabled && variation.text.trim());
    
    if (enabledVariations.length === 0) {
      throw new Error("No enabled message variations found");
    }

    // Initialize active connections cache
    this.activeConnections = connectedConnections.map(conn => conn.id);

    this.isRunning = true;
    await storage.updateCampaignSettings({ isRunning: true });

    // Start connection monitoring
    this.startConnectionMonitoring();

    this.scheduleCampaign();
  }

  async pauseCampaign(): Promise<void> {
    this.isRunning = false;
    if (this.campaignInterval) {
      clearTimeout(this.campaignInterval);
      this.campaignInterval = null;
    }
    
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
    
    // Clear all pending second messages when pausing campaign
    secondMessageService.clearAllScheduledMessages();
    
    this.activeConnections = [];
    
    await storage.updateCampaignSettings({ isRunning: false });
  }

  async restartCampaign(options: {
    resetProgress?: boolean;
    clearLogs?: boolean;
    updateContacts?: boolean;
  } = {}): Promise<void> {
    console.log('Reiniciando campanha com configurações atualizadas...');
    
    // Pause current campaign first
    await this.pauseCampaign();
    
    // Reset campaign progress if requested
    if (options.resetProgress) {
      console.log('Resetando progresso da campanha...');
      
      // Reset all contacts to pending status
      const contacts = await storage.getContacts();
      for (const contact of contacts) {
        if (contact.status !== 'pending') {
          await storage.updateContact(contact.id, {
            status: 'pending',
            sentAt: null,
            respondedAt: null,
            secondMessageSentAt: null,
            errorMessage: null
          });
        }
      }
      
      // Reset campaign indexes
      await storage.updateCampaignSettings({
        currentContactIndex: 0,
        currentWhatsAppIndex: 0
      });
      
      console.log(`${contacts.length} contatos resetados para status pendente`);
    }
    
    // Clear campaign logs if requested
    if (options.clearLogs) {
      console.log('Limpando logs da campanha...');
      await storage.clearCampaignLogs();
    }
    
    // Log restart action
    await storage.createCampaignLog({
      whatsappConnectionId: null,
      contactId: null,
      messageVariationId: null,
      status: "info",
      errorMessage: `Campanha reiniciada - Reset: ${options.resetProgress ? 'Sim' : 'Não'}, Logs limpos: ${options.clearLogs ? 'Sim' : 'Não'}`
    });
    
    // Wait a moment for cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Start campaign with updated configurations
    await this.startCampaign();
    
    console.log('Campanha reiniciada com sucesso');
  }

  private async scheduleCampaign(): Promise<void> {
    if (!this.isRunning) return;

    try {
      const settings = await storage.getCampaignSettings();
      if (!settings) return;

      const contacts = await storage.getContacts();
      const pendingContacts = contacts.filter(contact => contact.status === "pending");
      
      if (pendingContacts.length === 0) {
        await this.pauseCampaign();
        return;
      }

      // Use cached active connections instead of querying database every time
      if (this.activeConnections.length === 0) {
        console.log('No active WhatsApp connections available, waiting for connections...');
        // Don't pause, just wait for connections to come back
        if (this.isRunning) {
          this.campaignInterval = setTimeout(() => this.scheduleCampaign(), 10000); // Check again in 10 seconds
        }
        return;
      }

      const connections = await storage.getWhatsappConnections();
      const connectedConnections = connections.filter(conn => this.activeConnections.includes(conn.id));

      // Get current indexes safely
      const currentContactIndex = settings.currentContactIndex || 0;
      const currentWhatsAppIndex = settings.currentWhatsAppIndex || 0;
      
      // Get next contact
      const nextContact = pendingContacts[currentContactIndex % pendingContacts.length];
      
      // Get next WhatsApp connection
      let nextConnectionIndex = currentWhatsAppIndex;
      if (settings.rotationType === "random") {
        nextConnectionIndex = Math.floor(Math.random() * connectedConnections.length);
      } else {
        nextConnectionIndex = currentWhatsAppIndex % connectedConnections.length;
      }
      
      const nextConnection = connectedConnections[nextConnectionIndex];

      // Get message variation
      const variations = await storage.getMessageVariations();
      const enabledVariations = variations.filter(v => v.enabled && v.text.trim());
      let selectedVariation: MessageVariation;
      
      if (settings.randomizeMessages) {
        selectedVariation = enabledVariations[Math.floor(Math.random() * enabledVariations.length)];
      } else {
        selectedVariation = enabledVariations[currentContactIndex % enabledVariations.length];
      }

      // Send message
      await this.sendMessageToContact(nextContact, nextConnection, selectedVariation);

      // Update indexes
      await storage.updateCampaignSettings({
        currentContactIndex: (currentContactIndex + 1) % pendingContacts.length,
        currentWhatsAppIndex: (nextConnectionIndex + 1) % connectedConnections.length
      });

      // Schedule next message
      const delay = this.getRandomDelay(settings.minInterval || 30, settings.maxInterval || 60);
      this.campaignInterval = setTimeout(() => this.scheduleCampaign(), delay * 1000);

    } catch (error) {
      console.error("Campaign execution error:", error);
      
      // Don't pause campaign for individual WhatsApp connection errors
      // Just log the error and continue with next message
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      if (errorMessage.includes('WhatsApp') || errorMessage.includes('client')) {
        console.log("WhatsApp connection error encountered, continuing campaign with next number...");
        
        // Schedule next message with a shorter delay to compensate for the error
        const settings = await storage.getCampaignSettings();
        const delay = Math.min(10, settings?.minInterval || 30); // Use minimum delay of 10 seconds
        this.campaignInterval = setTimeout(() => this.scheduleCampaign(), delay * 1000);
      } else {
        // Only pause for non-WhatsApp related errors
        await this.pauseCampaign();
      }
    }
  }

  private async sendMessageToContact(
    contact: Contact,
    connection: WhatsappConnection,
    variation: MessageVariation
  ): Promise<void> {
    try {
      // Replace placeholders with contact data
      let personalizedMessage = variation.text
        .replace(/{nome}/g, contact.name)
        .replace(/{variavel1}/g, contact.variable1 || '')
        .replace(/{variavel2}/g, contact.variable2 || '');
      
      // Use the original phone number exactly as provided in CSV
      const phoneToSend = contact.phoneNumber.replace(/\D/g, '');
      console.log(`Sending to original number: ${phoneToSend} (${contact.variable1})`);
      
      await whatsappService.sendMessage(
        connection.id,
        phoneToSend,
        personalizedMessage,
        variation.imageUrl || undefined
      );

      await storage.updateContact(contact.id, {
        status: "sent",
        sentAt: new Date()
      });

      await storage.createCampaignLog({
        whatsappConnectionId: connection.id,
        contactId: contact.id,
        messageVariationId: variation.id,
        status: "sent",
        errorMessage: null
      });

      // Schedule second message if enabled for this variation
      if (variation.sendSecondMessage && variation.secondMessage?.trim()) {
        await secondMessageService.scheduleSecondMessage(
          contact.id,
          connection.id,
          variation.id
        );
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      await storage.updateContact(contact.id, {
        status: "error",
        errorMessage
      });

      await storage.createCampaignLog({
        whatsappConnectionId: connection.id,
        contactId: contact.id,
        messageVariationId: variation.id,
        status: "error",
        errorMessage
      });

      const settings = await storage.getCampaignSettings();
      
      // For WhatsApp connection errors, always continue unless skipErrors is false
      const isWhatsAppError = errorMessage.includes('WhatsApp') || 
                             errorMessage.includes('client') || 
                             errorMessage.includes('not found') ||
                             errorMessage.includes('disconnected') ||
                             errorMessage.includes('não possui WhatsApp') ||
                             errorMessage.includes('não é válido');
      
      // If it's an invalid WhatsApp number, always continue regardless of skipErrors setting
      const isInvalidNumber = errorMessage.includes('não possui WhatsApp') || 
                             errorMessage.includes('não é válido');
      
      if (!settings?.skipErrors && !isWhatsAppError && !isInvalidNumber) {
        throw error;
      }
      
      // Log that we're continuing despite the error
      if (isInvalidNumber) {
        console.log(`Skipping contact ${contact.id} - invalid WhatsApp number: ${errorMessage}`);
      } else {
        console.log(`Continuing campaign despite error for contact ${contact.id}: ${errorMessage}`);
      }
    }
  }

  private getRandomDelay(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  async getCampaignStats() {
    const contacts = await storage.getContacts();
    const settings = await storage.getCampaignSettings();
    
    const sent = contacts.filter(c => c.status === "sent").length;
    const pending = contacts.filter(c => c.status === "pending").length;
    const errors = contacts.filter(c => c.status === "error").length;
    const responded = contacts.filter(c => c.status === "responded").length;
    const secondSent = contacts.filter(c => c.status === "second_sent").length;
    const total = contacts.length;
    
    return {
      sent,
      pending,
      errors,
      responded,
      secondSent,
      total,
      progress: total > 0 ? Math.round(((sent + responded + secondSent) / total) * 100) : 0,
      isRunning: settings?.isRunning || false,
      activeConnections: this.activeConnections.length
    };
  }

  private startConnectionMonitoring(): void {
    // Check for connection changes every 5 seconds
    this.connectionCheckInterval = setInterval(async () => {
      await this.updateActiveConnections();
    }, 5000);
  }

  private async updateActiveConnections(): Promise<void> {
    if (!this.isRunning) return;

    try {
      const connections = await storage.getWhatsappConnections();
      const currentActiveConnections = connections
        .filter(conn => conn.status === "connected")
        .map(conn => conn.id);

      // Check for newly connected numbers
      const newConnections = currentActiveConnections.filter(id => !this.activeConnections.includes(id));
      if (newConnections.length > 0) {
        console.log(`Adding ${newConnections.length} new WhatsApp connections to campaign:`, newConnections);
        await storage.createCampaignLog({
          whatsappConnectionId: newConnections[0],
          contactId: null,
          messageVariationId: null,
          status: "info",
          errorMessage: `${newConnections.length} nova(s) conexão(ões) WhatsApp adicionada(s) à campanha`
        });
      }

      // Check for disconnected numbers - log individually to avoid mass disconnection appearance
      const disconnectedConnections = this.activeConnections.filter(id => !currentActiveConnections.includes(id));
      if (disconnectedConnections.length > 0) {
        console.log(`Individual WhatsApp disconnections detected:`, disconnectedConnections);
        
        // Log each disconnection individually instead of as a batch
        for (const disconnectedId of disconnectedConnections) {
          await storage.createCampaignLog({
            whatsappConnectionId: disconnectedId,
            contactId: null,
            messageVariationId: null,
            status: "warning",
            errorMessage: `WhatsApp ${disconnectedId} desconectado da campanha`
          });
        }
      }

      // Update the active connections cache
      this.activeConnections = currentActiveConnections;

      // If no connections are active, log but don't pause the campaign
      if (this.activeConnections.length === 0) {
        console.log('All WhatsApp connections lost, campaign will wait for reconnections');
        await storage.createCampaignLog({
          whatsappConnectionId: null,
          contactId: null,
          messageVariationId: null,
          status: "warning",
          errorMessage: 'Aguardando reconexão: todas as conexões WhatsApp foram desconectadas'
        });
      }

    } catch (error) {
      console.error('Error updating active connections:', error);
    }
  }

  // Method to manually refresh active connections (called from WebSocket events)
  async refreshActiveConnections(): Promise<void> {
    if (this.isRunning) {
      await this.updateActiveConnections();
    }
  }
}

export const campaignService = new CampaignService();
