import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { whatsappService } from "./services/whatsappReal";
import { campaignService } from "./services/campaign";
import { FileProcessorService } from "./services/fileProcessor";
import { 
  insertWhatsappConnectionSchema,
  insertMessageVariationSchema,
  insertCampaignSettingsSchema 
} from "@shared/schema";
import { processManager } from "./processManager";
import { watchdogService } from "./services/watchdog";

// Setup multer for file uploads - save in current directory
const uploadDir = path.join(process.cwd());
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: './', // Save directly in root directory
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  // Broadcast to all connected WebSocket clients
  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // Health Check and Monitoring Routes
  app.get('/api/health', async (req, res) => {
    try {
      const status = processManager.getStatus();
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        processInfo: status
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post('/api/restart', async (req, res) => {
    try {
      await processManager.manualRestart();
      broadcast({ type: 'system_restarted', timestamp: new Date().toISOString() });
      res.json({
        success: true,
        message: 'Sistema reiniciado com sucesso',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Falha ao reiniciar o sistema',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get('/api/watchdog/status', async (req, res) => {
    try {
      const status = watchdogService.getStatus();
      res.json({
        watchdog: status,
        process: processManager.getStatus()
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get watchdog status',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post('/api/watchdog/check', async (req, res) => {
    try {
      await watchdogService.forceHealthCheck();
      res.json({
        success: true,
        message: 'Health check executado com sucesso',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Health check falhou',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // WhatsApp Connections
  app.get('/api/whatsapp-connections', async (req, res) => {
    try {
      const connections = await storage.getWhatsappConnections();
      res.json(connections);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch WhatsApp connections' });
    }
  });

  // Get QR Code for WhatsApp connection
  app.get('/api/whatsapp-connections/:id/qr', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const qrCode = whatsappService.getQrCode(id);
      
      if (qrCode) {
        res.json({ qrCode });
      } else {
        res.status(404).json({ error: 'QR code not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to get QR code' });
    }
  });

  app.post('/api/whatsapp-connections', async (req, res) => {
    try {
      const data = insertWhatsappConnectionSchema.parse(req.body);
      const connection = await storage.createWhatsappConnection(data);
      
      // Initialize WhatsApp connection
      whatsappService.initializeConnection(connection.id);
      
      broadcast({ type: 'whatsapp_connection_created', data: connection });
      res.json(connection);
    } catch (error) {
      res.status(400).json({ error: 'Failed to create WhatsApp connection' });
    }
  });

  app.delete('/api/whatsapp-connections/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await whatsappService.disconnectConnection(id);
      await storage.deleteWhatsappConnection(id);
      
      broadcast({ type: 'whatsapp_connection_deleted', data: { id } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to disconnect WhatsApp' });
    }
  });

  // Force disconnect and cleanup WhatsApp connection
  app.post('/api/whatsapp-connections/:id/force-disconnect', async (req, res) => {
    try {
      const connectionId = parseInt(req.params.id);
      await whatsappService.forceDisconnectConnection(connectionId);
      broadcast({ type: 'whatsapp_force_disconnected', connectionId });
      res.json({ success: true, message: 'Conexão forçadamente desconectada e limpa' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to force disconnect WhatsApp' });
    }
  });

  // Reconnect WhatsApp connection
  app.post('/api/whatsapp-connections/:id/reconnect', async (req, res) => {
    try {
      const connectionId = parseInt(req.params.id);
      
      // Update status to connecting
      await storage.updateWhatsappConnection(connectionId, { 
        status: "connecting",
        phoneNumber: null,
        qrCode: null 
      });
      
      // Initialize WhatsApp connection
      await whatsappService.initializeConnection(connectionId);
      
      broadcast({ type: 'whatsapp_reconnecting', connectionId });
      res.json({ success: true, message: 'Reconectando WhatsApp...' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to reconnect WhatsApp' });
    }
  });

  // Message Variations
  app.get('/api/message-variations', async (req, res) => {
    try {
      const variations = await storage.getMessageVariations();
      res.json(variations);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch message variations' });
    }
  });

  app.put('/api/message-variations/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertMessageVariationSchema.partial().parse(req.body);
      const variation = await storage.updateMessageVariation(id, data);
      
      broadcast({ type: 'message_variation_updated', data: variation });
      res.json(variation);
    } catch (error) {
      res.status(400).json({ error: 'Failed to update message variation' });
    }
  });

  // Image upload for message variations
  app.post('/api/message-variations/:id/image', upload.single('image'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      const imageUrl = req.file.filename; // Just the filename, no leading slash
      const variation = await storage.updateMessageVariation(id, { imageUrl });
      
      broadcast({ type: 'message_variation_updated', data: variation });
      res.json(variation);
    } catch (error) {
      res.status(500).json({ error: 'Failed to upload image' });
    }
  });

  // Remove image from message variation
  app.delete('/api/message-variations/:id/image', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get current variation to remove image reference
      const currentVariation = await storage.getMessageVariation(id);
      if (currentVariation?.imageUrl) {
        // Try to remove file from filesystem (ignore errors)
        try {
          const imagePath = currentVariation.imageUrl.startsWith('/') ? 
            currentVariation.imageUrl.substring(1) : currentVariation.imageUrl;
          fs.unlinkSync(imagePath);
          console.log(`Removed image file: ${imagePath}`);
        } catch (error) {
          console.log(`Could not remove image file: ${currentVariation.imageUrl}`);
        }
      }

      const variation = await storage.updateMessageVariation(id, { imageUrl: null });
      
      broadcast({ type: 'message_variation_updated', data: variation });
      res.json(variation);
    } catch (error) {
      res.status(500).json({ error: 'Failed to remove image' });
    }
  });

  // Contacts
  app.get('/api/contacts', async (req, res) => {
    try {
      const contacts = await storage.getContacts();
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch contacts' });
    }
  });

  app.post('/api/contacts/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const fileContent = fs.readFileSync(req.file.path, 'utf-8');
      const result = FileProcessorService.processContactList(fileContent);
      
      // Clear existing contacts and add new ones
      await storage.clearContacts();
      await storage.createContacts(result.contacts);
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      broadcast({ type: 'contacts_uploaded', data: result.stats });
      res.json(result.stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to process contact list' });
    }
  });

  app.delete('/api/contacts', async (req, res) => {
    try {
      await storage.clearContacts();
      broadcast({ type: 'contacts_cleared' });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to clear contacts' });
    }
  });

  // Campaign Settings
  app.get('/api/campaign-settings', async (req, res) => {
    try {
      const settings = await storage.getCampaignSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch campaign settings' });
    }
  });

  app.put('/api/campaign-settings', async (req, res) => {
    try {
      const data = insertCampaignSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateCampaignSettings(data);
      
      broadcast({ type: 'campaign_settings_updated', data: settings });
      res.json(settings);
    } catch (error) {
      res.status(400).json({ error: 'Failed to update campaign settings' });
    }
  });

  // Campaign Control
  app.post('/api/campaign/start', async (req, res) => {
    try {
      await campaignService.startCampaign();
      const stats = await campaignService.getCampaignStats();
      
      broadcast({ type: 'campaign_started', data: stats });
      res.json({ success: true, stats });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start campaign';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/campaign/pause', async (req, res) => {
    try {
      await campaignService.pauseCampaign();
      const stats = await campaignService.getCampaignStats();
      
      broadcast({ type: 'campaign_paused', data: stats });
      res.json({ success: true, stats });
    } catch (error) {
      res.status(500).json({ error: 'Failed to pause campaign' });
    }
  });

  app.post('/api/campaign/restart', async (req, res) => {
    try {
      const options = {
        resetProgress: req.body.resetProgress || false,
        clearLogs: req.body.clearLogs || false,
        updateContacts: req.body.updateContacts || false
      };
      
      await campaignService.restartCampaign(options);
      const stats = await campaignService.getCampaignStats();
      
      broadcast({ type: 'campaign_restarted', data: { stats, options } });
      res.json({ 
        success: true, 
        stats,
        message: 'Campanha reiniciada com sucesso',
        options
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restart campaign';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/campaign/stats', async (req, res) => {
    try {
      const stats = await campaignService.getCampaignStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch campaign stats' });
    }
  });

  // Campaign Logs
  app.get('/api/campaign-logs', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const logs = await storage.getCampaignLogs(limit);
      
      // Join with related data
      const logsWithDetails = await Promise.all(
        logs.map(async (log) => {
          const contact = log.contactId ? await storage.getContact(log.contactId) : null;
          const whatsapp = log.whatsappConnectionId ? await storage.getWhatsappConnection(log.whatsappConnectionId) : null;
          const variation = log.messageVariationId ? await storage.getMessageVariation(log.messageVariationId) : null;
          
          return {
            ...log,
            contact,
            whatsapp,
            variation
          };
        })
      );
      
      res.json(logsWithDetails);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch campaign logs' });
    }
  });

  app.delete('/api/campaign-logs', async (req, res) => {
    try {
      await storage.clearCampaignLogs();
      broadcast({ type: 'campaign_logs_cleared' });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to clear campaign logs' });
    }
  });

  // Received Messages
  app.get('/api/received-messages', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const messages = await storage.getReceivedMessages(limit);
      
      // Join with related data
      const messagesWithDetails = await Promise.all(
        messages.map(async (message) => {
          const contact = message.contactId ? await storage.getContact(message.contactId) : null;
          const whatsapp = message.whatsappConnectionId ? await storage.getWhatsappConnection(message.whatsappConnectionId) : null;
          
          return {
            ...message,
            contact,
            whatsapp
          };
        })
      );
      
      res.json(messagesWithDetails);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch received messages' });
    }
  });

  app.get('/api/received-messages/contact/:contactId', async (req, res) => {
    try {
      const contactId = parseInt(req.params.contactId);
      const messages = await storage.getReceivedMessagesByContact(contactId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch messages for contact' });
    }
  });

  app.delete('/api/received-messages', async (req, res) => {
    try {
      await storage.clearReceivedMessages();
      broadcast({ type: 'received_messages_cleared' });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to clear received messages' });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));

  // Serve uploaded images from root directory
  app.use('/', express.static(process.cwd(), {
    index: false,
    dotfiles: 'ignore',
    setHeaders: (res, path) => {
      // Only serve specific image files
      if (path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    }
  }));

  return httpServer;
}
