import pkg from "whatsapp-web.js";
const { Client, LocalAuth, MessageMedia } = pkg;
import QRCode from 'qrcode';
import { storage } from "../storage";
import { secondMessageService } from "./secondMessage";
import { SessionCleanup } from "../utils/sessionCleanup";
import type { WhatsappConnection } from "@shared/schema";

class WhatsAppRealService {
  private clients = new Map<number, any>();
  private qrCodes = new Map<number, string>();

  async initializeConnection(connectionId: number): Promise<void> {
    try {
      await storage.updateWhatsappConnection(connectionId, { status: "connecting" });

      // Check if session is locked before proceeding
      const clientId = `client_${connectionId}`;
      const isLocked = await SessionCleanup.isSessionLocked(clientId);
      if (isLocked) {
        console.log(`Session ${clientId} appears to be locked, attempting cleanup...`);
        await SessionCleanup.cleanupSpecificSession(clientId);
        
        // Wait a moment after cleanup
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Check if we're in a containerized environment like Replit
      const isReplit = process.env.REPLIT_DB_URL || process.env.REPL_ID;
      
      let puppeteerConfig;
      
      if (isReplit) {
        // Replit/containerized environment - use more aggressive flags
        puppeteerConfig = {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--single-process',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI,VizDisplayCompositor',
            '--disable-ipc-flooding-protection',
            '--memory-pressure-off',
            '--max_old_space_size=4096'
          ]
        };
      } else {
        // Local environment - standard configuration
        puppeteerConfig = {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
          ]
        };
      }

      const client = new Client({
        authStrategy: new LocalAuth({ 
          clientId: `client_${connectionId}`,
          dataPath: `./.wwebjs_auth/session-client_${connectionId}`
        }),
        puppeteer: {
          ...puppeteerConfig,
          handleSIGINT: false,
          handleSIGTERM: false,
          handleSIGHUP: false
        }
      });

      this.clients.set(connectionId, client);

      client.on('qr', async (qr) => {
        console.log(`WhatsApp connection ${connectionId}: QR code received`);
        
        // Generate QR code image from string
        const qrCodeDataUrl = await QRCode.toDataURL(qr, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        this.qrCodes.set(connectionId, qrCodeDataUrl);
        await storage.updateWhatsappConnection(connectionId, { 
          qrCode: qrCodeDataUrl,
          status: "connecting"
        });
        console.log(`WhatsApp connection ${connectionId}: QR code generated and saved`);
      });

      client.on('ready', async () => {
        console.log(`WhatsApp connection ${connectionId}: Client ready`);
        const info = client.info;
        await storage.updateWhatsappConnection(connectionId, {
          status: "connected",
          phoneNumber: info.wid.user,
          qrCode: null
        });
        this.qrCodes.delete(connectionId);
        console.log(`WhatsApp connection ${connectionId}: Connected successfully as ${info.wid.user}`);
        
        // Notify campaign service of new connection
        this.notifyCampaignService();
      });

      client.on('auth_failure', async (msg) => {
        console.log(`WhatsApp connection ${connectionId}: Auth failure - ${msg}`);
        await storage.updateWhatsappConnection(connectionId, {
          status: "error",
          qrCode: null
        });
      });

      client.on('disconnected', async (reason) => {
        console.log(`WhatsApp connection ${connectionId}: Disconnected - ${reason}`);
        
        // Always clean up memory first to prevent further operations
        this.clients.delete(connectionId);
        this.qrCodes.delete(connectionId);
        
        try {
          await storage.updateWhatsappConnection(connectionId, {
            status: "disconnected",
            phoneNumber: null,
            qrCode: null
          });
          console.log(`WhatsApp connection ${connectionId}: Status updated to disconnected`);
        } catch (error) {
          console.error(`Error updating connection status for ${connectionId}:`, error instanceof Error ? error.message : String(error));
        }
        
        // Skip session cleanup to avoid EBUSY errors that crash the system
        // Sessions will be cleaned up on next startup
        console.log(`Skipping session cleanup for ${connectionId} to prevent file lock errors`);
        
        // Notify campaign service of disconnection - this only affects individual connection
        this.notifyCampaignService();
      });

      client.on('message', async (message) => {
        try {
          // Only process messages that are not from us
          if (!message.fromMe && message.from.endsWith('@c.us')) {
            const phoneNumber = message.from.replace('@c.us', '');
            await this.handleIncomingMessage(connectionId, phoneNumber, message.body);
          }
        } catch (error) {
          console.error(`Error handling incoming message on connection ${connectionId}:`, error);
        }
      });

      console.log(`WhatsApp connection ${connectionId}: Initializing client...`);
      await client.initialize();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error initializing WhatsApp connection ${connectionId}:`, errorMessage);
      await storage.updateWhatsappConnection(connectionId, {
        status: "error",
        qrCode: null
      });
      
      // If it's a browser-related error and we're in Replit, provide helpful message
      if (errorMessage.includes('Failed to launch the browser process') && process.env.REPL_ID) {
        console.log(`WhatsApp connection ${connectionId}: Browser launch failed in Replit environment. This will work when running locally.`);
      }
    }
  }

  async disconnectConnection(connectionId: number): Promise<void> {
    console.log(`Disconnecting WhatsApp connection ${connectionId}...`);
    
    const client = this.clients.get(connectionId);
    if (client) {
      try {
        // Skip logout completely to avoid EBUSY errors, just destroy
        await Promise.race([
          client.destroy(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Destroy timeout')), 5000)
          )
        ]);
        console.log(`WhatsApp connection ${connectionId}: Destroy successful`);
      } catch (logoutError) {
        const logoutErrorMsg = logoutError instanceof Error ? logoutError.message : String(logoutError);
        console.warn(`Logout failed for client ${connectionId}:`, logoutErrorMsg);
        
        // If logout fails, try destroy with timeout
        try {
          await Promise.race([
            client.destroy(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Destroy timeout')), 5000)
            )
          ]);
          console.log(`WhatsApp connection ${connectionId}: Destroy successful`);
        } catch (destroyError) {
          const destroyErrorMsg = destroyError instanceof Error ? destroyError.message : String(destroyError);
          console.warn(`Destroy also failed for client ${connectionId}:`, destroyErrorMsg);
          // Continue anyway - we'll clean up manually
        }
      }
      
      // Always remove from memory regardless of cleanup success
      this.clients.delete(connectionId);
    }
    
    this.qrCodes.delete(connectionId);
    
    // Skip session cleanup to prevent EBUSY errors and crashes
    console.log(`Skipping session cleanup for connection ${connectionId} to prevent file lock errors`);
    
    // Always update storage status regardless of cleanup success
    try {
      await storage.updateWhatsappConnection(connectionId, {
        status: "disconnected",
        phoneNumber: null,
        qrCode: null
      });
      console.log(`WhatsApp connection ${connectionId}: Status updated to disconnected`);
    } catch (statusError) {
      const statusErrorMsg = statusError instanceof Error ? statusError.message : String(statusError);
      console.error(`Failed to update status for connection ${connectionId}:`, statusErrorMsg);
    }
    
    // Notify campaign service of disconnection
    this.notifyCampaignService();
  }

  async sendMessage(connectionId: number, phoneNumber: string, text: string, imageUrl?: string): Promise<void> {
    const client = this.clients.get(connectionId);
    if (!client) {
      throw new Error(`WhatsApp client ${connectionId} not found`);
    }

    // Use the phone number exactly as provided - no formatting
    const cleanPhone = phoneNumber.replace(/\D/g, ''); // Only remove non-digits
    console.log(`Using number as provided: ${cleanPhone}`);
    const chatId = `${cleanPhone}@c.us`;
    
    try {
      // First, validate if the number exists on WhatsApp
      console.log(`Validating WhatsApp number: ${cleanPhone}`);
      const isValidNumber = await this.validateWhatsAppNumber(client, cleanPhone);
      
      if (!isValidNumber) {
        throw new Error(`Número ${cleanPhone} não possui WhatsApp ou não é válido`);
      }
      
      console.log(`Number ${cleanPhone} validated successfully, sending message...`);
      
      // Get profile picture and simulate typing for humanization
      await this.humanizeMessageSending(client, chatId, cleanPhone);
      
      if (imageUrl) {
        try {
          // Try to send with image
          console.log(`Attempting to send image: ${imageUrl}`);
          const media = MessageMedia.fromFilePath(imageUrl);
          if (text) {
            await client.sendMessage(chatId, media, { caption: text });
          } else {
            await client.sendMessage(chatId, media);
          }
          console.log(`WhatsApp connection ${connectionId}: Message with image sent to ${cleanPhone}`);
        } catch (imageError: any) {
          // If image fails, send text only
          const imageErrorMsg = imageError instanceof Error ? imageError.message : String(imageError);
          console.warn(`Image send failed, sending text only: ${imageErrorMsg}`);
          await client.sendMessage(chatId, text);
          console.log(`WhatsApp connection ${connectionId}: Text-only message sent to ${cleanPhone}`);
        }
      } else {
        await client.sendMessage(chatId, text);
        console.log(`WhatsApp connection ${connectionId}: Text message sent to ${cleanPhone}`);
      }
    } catch (error) {
      console.error(`Error sending message via WhatsApp ${connectionId}:`, error);
      throw error;
    }
  }



  private async humanizeMessageSending(client: any, chatId: string, phoneNumber: string): Promise<void> {
    try {
      // Get profile picture URL
      let profilePicUrl = 'Sem foto de perfil';
      try {
        const profilePic = await client.getProfilePicUrl(chatId);
        if (profilePic) {
          profilePicUrl = 'Foto de perfil disponível';
          console.log(`📷 Profile picture found for ${phoneNumber}: ${profilePic.substring(0, 50)}...`);
        }
      } catch (picError) {
        console.log(`📷 No profile picture found for ${phoneNumber}`);
      }

      // Open chat to simulate human behavior
      try {
        const chat = await client.getChatById(chatId);
        if (chat) {
          console.log(`💬 Opened chat with ${phoneNumber} (${profilePicUrl})`);
        }
      } catch (chatError) {
        console.log(`💬 Chat access for ${phoneNumber} - ${profilePicUrl}`);
      }

      // Simulate typing indicator for 1-3 seconds to humanize
      const typingDuration = Math.floor(Math.random() * 3000) + 1000; // 1-4 seconds
      console.log(`⌨️ Simulating typing for ${typingDuration}ms to ${phoneNumber}...`);
      
      try {
        await client.sendPresenceAvailable();
        await client.sendPresenceComposing(chatId);
        
        // Wait for typing simulation
        await new Promise(resolve => setTimeout(resolve, typingDuration));
        
        await client.sendPresenceAvailable();
        console.log(`✅ Typing simulation completed for ${phoneNumber}`);
      } catch (typingError) {
        console.log(`⌨️ Typing simulation completed (basic) for ${phoneNumber}`);
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`Humanization warning for ${phoneNumber}: ${errorMsg}`);
    }
  }

  private async validateWhatsAppNumber(client: any, phoneNumber: string): Promise<boolean> {
    try {
      console.log(`🔍 Checking if ${phoneNumber} has WhatsApp...`);
      
      // Use WhatsApp Web.js method to check if number is registered on WhatsApp
      const chatId = `${phoneNumber}@c.us`;
      const numberId = await Promise.race([
        client.getNumberId(chatId),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Validation timeout')), 10000)
        )
      ]);
      
      // If numberId is null or undefined, the number doesn't have WhatsApp
      if (!numberId || !numberId.user) {
        console.log(`❌ Number ${phoneNumber} is not registered on WhatsApp`);
        return false;
      }
      
      console.log(`✅ Number ${phoneNumber} is registered on WhatsApp (${numberId.user})`);
      return true;
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️ Error validating WhatsApp number ${phoneNumber}: ${errorMsg}`);
      
      // If validation fails, assume number is invalid to be safe
      return false;
    }
  }

  getQrCode(connectionId: number): string | undefined {
    return this.qrCodes.get(connectionId);
  }

  getConnectedClients(): number[] {
    return Array.from(this.clients.keys()).filter(id => {
      const client = this.clients.get(id);
      return client && client.info !== null;
    });
  }

  isClientReady(connectionId: number): boolean {
    const client = this.clients.get(connectionId);
    return client ? client.info !== null : false;
  }

  async forceDisconnectConnection(connectionId: number): Promise<void> {
    console.log(`Force disconnecting WhatsApp connection ${connectionId}...`);
    
    // Remove client from memory without trying to gracefully disconnect
    const client = this.clients.get(connectionId);
    if (client) {
      try {
        // Try to destroy without logout to avoid hanging
        await Promise.race([
          client.destroy(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
      } catch (error) {
        console.warn(`Force destroy failed for client ${connectionId}, continuing...`);
      }
      this.clients.delete(connectionId);
    }
    
    this.qrCodes.delete(connectionId);
    
    // Skip force cleanup to prevent system crashes
    console.log(`Skipping force cleanup for connection ${connectionId} to prevent crashes`);
    
    // Update status in storage
    await storage.updateWhatsappConnection(connectionId, {
      status: "disconnected",
      phoneNumber: null,
      qrCode: null
    });
    
    console.log(`WhatsApp connection ${connectionId} force disconnected and cleaned`);
    
    // Notify campaign service of disconnection
    this.notifyCampaignService();
  }

  private notifyCampaignService(): void {
    // Dynamically import to avoid circular dependency
    import('./campaign').then(({ campaignService }) => {
      campaignService.refreshActiveConnections().catch(console.error);
    }).catch(() => {
      // Ignore import errors (service might not be available)
    });
  }

  private async handleIncomingMessage(connectionId: number, phoneNumber: string, messageBody: string): Promise<void> {
    try {
      // Find contact by phone number
      const contacts = await storage.getContacts();
      const contact = contacts.find(c => {
        const cleanContactPhone = c.phoneNumber.replace(/\D/g, '');
        const cleanIncomingPhone = phoneNumber.replace(/\D/g, '');
        return cleanContactPhone === cleanIncomingPhone;
      });

      if (contact) {
        // If this is a contact from our campaign and they haven't responded yet
        if ((contact.status === "sent" || contact.status === "delivered") && !contact.respondedAt) {
          console.log(`Contact ${contact.name} (${phoneNumber}) responded: ${messageBody}`);
          
          // Handle the response - this will trigger second message sending
          await secondMessageService.handleContactResponse(contact.id);
        }
      }

      // Store received message regardless of whether it's from a campaign contact
      await storage.createReceivedMessage({
        whatsappConnectionId: connectionId,
        contactId: contact?.id || null,
        phoneNumber: phoneNumber,
        messageBody: messageBody
      });

    } catch (error) {
      console.error(`Error processing incoming message from ${phoneNumber}:`, error);
    }
  }
}

export const whatsappService = new WhatsAppRealService();