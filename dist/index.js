var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/fileStorage.ts
import fs from "fs/promises";
import path from "path";
var FileStorage;
var init_fileStorage = __esm({
  "server/fileStorage.ts"() {
    "use strict";
    FileStorage = class {
      dataDir = "./data";
      currentIds = {
        whatsappConnection: 1,
        messageVariation: 4,
        // Start at 4 since we initialize 3 variations
        contact: 1,
        campaignSettings: 1,
        campaignLog: 1,
        receivedMessage: 1
      };
      constructor() {
        this.ensureDataDirectory();
        this.initializeDefaultData();
      }
      async ensureDataDirectory() {
        try {
          await fs.access(this.dataDir);
        } catch {
          await fs.mkdir(this.dataDir, { recursive: true });
        }
      }
      async initializeDefaultData() {
        try {
          await this.getCampaignSettings();
        } catch {
          await this.createCampaignSettings({
            minInterval: 30,
            maxInterval: 120,
            rotationType: "sequential",
            randomizeMessages: true,
            skipErrors: false,
            logMessages: true,
            isRunning: false,
            currentContactIndex: 0,
            currentWhatsAppIndex: 0
          });
        }
        try {
          const variations = await this.getMessageVariations();
          if (variations.length === 0) {
            for (let i = 1; i <= 3; i++) {
              await this.createMessageVariation({
                variationNumber: i,
                text: "",
                imageUrl: null,
                secondMessage: null,
                secondImageUrl: null,
                sendSecondMessage: false,
                secondMessageDelay: 30,
                enabled: false
              });
            }
          }
        } catch {
          for (let i = 1; i <= 3; i++) {
            await this.createMessageVariation({
              variationNumber: i,
              text: "",
              imageUrl: null,
              secondMessage: null,
              secondImageUrl: null,
              sendSecondMessage: false,
              secondMessageDelay: 30,
              enabled: false
            });
          }
        }
      }
      async readFile(fileName) {
        try {
          const data = await fs.readFile(path.join(this.dataDir, fileName), "utf-8");
          return JSON.parse(data);
        } catch {
          return [];
        }
      }
      async writeFile(fileName, data) {
        await fs.writeFile(path.join(this.dataDir, fileName), JSON.stringify(data, null, 2));
      }
      // WhatsApp Connections
      async getWhatsappConnections() {
        return this.readFile("whatsapp_connections.txt");
      }
      async getWhatsappConnection(id) {
        const connections = await this.getWhatsappConnections();
        return connections.find((c) => c.id === id);
      }
      async createWhatsappConnection(connection) {
        const connections = await this.getWhatsappConnections();
        const newConnection = {
          ...connection,
          id: this.currentIds.whatsappConnection++,
          phoneNumber: connection.phoneNumber || null,
          status: connection.status || "disconnected",
          qrCode: connection.qrCode || null,
          sessionData: connection.sessionData || null,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        connections.push(newConnection);
        await this.writeFile("whatsapp_connections.txt", connections);
        return newConnection;
      }
      async updateWhatsappConnection(id, connection) {
        const connections = await this.getWhatsappConnections();
        const index = connections.findIndex((c) => c.id === id);
        if (index === -1) {
          throw new Error(`WhatsApp connection with id ${id} not found`);
        }
        const updated = { ...connections[index], ...connection, updatedAt: /* @__PURE__ */ new Date() };
        connections[index] = updated;
        await this.writeFile("whatsapp_connections.txt", connections);
        return updated;
      }
      async deleteWhatsappConnection(id) {
        const connections = await this.getWhatsappConnections();
        const filtered = connections.filter((c) => c.id !== id);
        await this.writeFile("whatsapp_connections.txt", filtered);
      }
      // Message Variations
      async getMessageVariations() {
        return this.readFile("message_variations.txt");
      }
      async getMessageVariation(id) {
        const variations = await this.getMessageVariations();
        return variations.find((v) => v.id === id);
      }
      async createMessageVariation(variation) {
        const variations = await this.getMessageVariations();
        const newVariation = {
          ...variation,
          id: this.currentIds.messageVariation++,
          imageUrl: variation.imageUrl || null,
          secondMessage: variation.secondMessage || null,
          secondImageUrl: variation.secondImageUrl || null,
          sendSecondMessage: variation.sendSecondMessage ?? false,
          secondMessageDelay: variation.secondMessageDelay ?? 30,
          enabled: variation.enabled ?? true,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        variations.push(newVariation);
        await this.writeFile("message_variations.txt", variations);
        return newVariation;
      }
      async updateMessageVariation(id, variation) {
        const variations = await this.getMessageVariations();
        const index = variations.findIndex((v) => v.id === id);
        if (index === -1) {
          throw new Error(`Message variation with id ${id} not found`);
        }
        const updated = { ...variations[index], ...variation, updatedAt: /* @__PURE__ */ new Date() };
        variations[index] = updated;
        await this.writeFile("message_variations.txt", variations);
        return updated;
      }
      async deleteMessageVariation(id) {
        const variations = await this.getMessageVariations();
        const filtered = variations.filter((v) => v.id !== id);
        await this.writeFile("message_variations.txt", filtered);
      }
      // Contacts
      async getContacts() {
        return this.readFile("contacts.txt");
      }
      async getContact(id) {
        const contacts2 = await this.getContacts();
        return contacts2.find((c) => c.id === id);
      }
      async createContact(contact) {
        const contacts2 = await this.getContacts();
        const newContact = {
          ...contact,
          id: this.currentIds.contact++,
          variable1: contact.variable1 || null,
          variable2: contact.variable2 || null,
          status: contact.status || "pending",
          errorMessage: contact.errorMessage || null,
          sentAt: contact.sentAt || null,
          respondedAt: contact.respondedAt || null,
          secondMessageSentAt: contact.secondMessageSentAt || null,
          createdAt: /* @__PURE__ */ new Date()
        };
        contacts2.push(newContact);
        await this.writeFile("contacts.txt", contacts2);
        return newContact;
      }
      async createContacts(contactsData) {
        const contacts2 = await this.getContacts();
        const newContacts = contactsData.map((contact) => ({
          ...contact,
          id: this.currentIds.contact++,
          variable1: contact.variable1 || null,
          variable2: contact.variable2 || null,
          status: contact.status || "pending",
          errorMessage: contact.errorMessage || null,
          sentAt: contact.sentAt || null,
          respondedAt: contact.respondedAt || null,
          secondMessageSentAt: contact.secondMessageSentAt || null,
          createdAt: /* @__PURE__ */ new Date()
        }));
        contacts2.push(...newContacts);
        await this.writeFile("contacts.txt", contacts2);
        return newContacts;
      }
      async updateContact(id, contact) {
        const contacts2 = await this.getContacts();
        const index = contacts2.findIndex((c) => c.id === id);
        if (index === -1) {
          throw new Error(`Contact with id ${id} not found`);
        }
        const updated = { ...contacts2[index], ...contact };
        contacts2[index] = updated;
        await this.writeFile("contacts.txt", contacts2);
        return updated;
      }
      async deleteContact(id) {
        const contacts2 = await this.getContacts();
        const filtered = contacts2.filter((c) => c.id !== id);
        await this.writeFile("contacts.txt", filtered);
      }
      async clearContacts() {
        await this.writeFile("contacts.txt", []);
        this.currentIds.contact = 1;
      }
      // Campaign Settings
      async getCampaignSettings() {
        let settings = await this.readFile("campaign_settings.txt");
        if (settings.length === 0) {
          const defaultSettings = await this.createCampaignSettings({
            minInterval: 30,
            maxInterval: 120,
            rotationType: "sequential",
            randomizeMessages: true,
            skipErrors: true,
            logMessages: true,
            isRunning: false,
            currentContactIndex: 0,
            currentWhatsAppIndex: 0
          });
          return defaultSettings;
        }
        return settings[0];
      }
      async createCampaignSettings(settings) {
        const newSettings = {
          ...settings,
          id: 1,
          minInterval: settings.minInterval ?? 30,
          maxInterval: settings.maxInterval ?? 120,
          rotationType: settings.rotationType || "sequential",
          randomizeMessages: settings.randomizeMessages ?? true,
          skipErrors: settings.skipErrors ?? false,
          logMessages: settings.logMessages ?? true,
          isRunning: settings.isRunning ?? false,
          currentContactIndex: settings.currentContactIndex ?? 0,
          currentWhatsAppIndex: settings.currentWhatsAppIndex ?? 0,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        await this.writeFile("campaign_settings.txt", [newSettings]);
        return newSettings;
      }
      async updateCampaignSettings(settings) {
        let currentSettings = await this.getCampaignSettings();
        if (!currentSettings) {
          currentSettings = await this.createCampaignSettings({
            minInterval: 30,
            maxInterval: 120,
            rotationType: "sequential",
            randomizeMessages: true,
            skipErrors: true,
            logMessages: true,
            isRunning: false,
            currentContactIndex: 0,
            currentWhatsAppIndex: 0
          });
        }
        const updated = { ...currentSettings, ...settings, updatedAt: /* @__PURE__ */ new Date() };
        await this.writeFile("campaign_settings.txt", [updated]);
        return updated;
      }
      // Campaign Logs
      async getCampaignLogs(limit = 50) {
        const logs = await this.readFile("campaign_logs.txt");
        return logs.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()).slice(0, limit);
      }
      async createCampaignLog(log2) {
        const logs = await this.getCampaignLogs();
        const newLog = {
          ...log2,
          id: this.currentIds.campaignLog++,
          whatsappConnectionId: log2.whatsappConnectionId || null,
          contactId: log2.contactId || null,
          messageVariationId: log2.messageVariationId || null,
          errorMessage: log2.errorMessage || null,
          sentAt: /* @__PURE__ */ new Date()
        };
        logs.unshift(newLog);
        await this.writeFile("campaign_logs.txt", logs.slice(0, 1e3));
        return newLog;
      }
      async clearCampaignLogs() {
        await this.writeFile("campaign_logs.txt", []);
        this.currentIds.campaignLog = 1;
      }
      // Received Messages
      async getReceivedMessages(limit = 50) {
        const messages = await this.readFile("received_messages.txt");
        return messages.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()).slice(0, limit);
      }
      async getReceivedMessagesByContact(contactId) {
        const messages = await this.readFile("received_messages.txt");
        return messages.filter((msg) => msg.contactId === contactId).sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
      }
      async createReceivedMessage(message) {
        const messages = await this.getReceivedMessages();
        const newMessage = {
          ...message,
          id: this.currentIds.receivedMessage++,
          whatsappConnectionId: message.whatsappConnectionId || null,
          contactId: message.contactId || null,
          receivedAt: /* @__PURE__ */ new Date()
        };
        messages.unshift(newMessage);
        await this.writeFile("received_messages.txt", messages.slice(0, 1e3));
        return newMessage;
      }
      async clearReceivedMessages() {
        await this.writeFile("received_messages.txt", []);
        this.currentIds.receivedMessage = 1;
      }
    };
  }
});

// server/storage.ts
var storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_fileStorage();
    storage = new FileStorage();
  }
});

// server/services/secondMessage.ts
var SecondMessageService, secondMessageService;
var init_secondMessage = __esm({
  "server/services/secondMessage.ts"() {
    "use strict";
    init_storage();
    init_whatsappReal();
    SecondMessageService = class {
      pendingSecondMessages = /* @__PURE__ */ new Map();
      // contactId -> timeout
      async scheduleSecondMessage(contactId, whatsappConnectionId, variationId) {
        this.clearScheduledSecondMessage(contactId);
        const variation = await storage.getMessageVariation(variationId);
        if (!variation || !variation.sendSecondMessage || !variation.secondMessage?.trim()) {
          return;
        }
        console.log(`Contact ${contactId} marked for potential second message after response`);
      }
      async sendSecondMessage(contactId, whatsappConnectionId, variation) {
        const contact = await storage.getContact(contactId);
        if (!contact) {
          throw new Error(`Contact ${contactId} not found`);
        }
        if (contact.secondMessageSentAt) {
          console.log(`Second message already sent to contact ${contactId}`);
          return;
        }
        if (contact.status !== "responded" && contact.status !== "sent") {
          console.log(`Contact ${contactId} status is ${contact.status}, skipping second message`);
          return;
        }
        try {
          let personalizedSecondMessage = variation.secondMessage.replace(/{nome}/g, contact.name).replace(/{variavel1}/g, contact.variable1 || "").replace(/{variavel2}/g, contact.variable2 || "");
          const phoneToSend = contact.phoneNumber.replace(/\D/g, "");
          await whatsappService.sendMessage(
            whatsappConnectionId,
            phoneToSend,
            personalizedSecondMessage,
            variation.secondImageUrl || void 0
          );
          await storage.updateContact(contactId, {
            status: contact.status === "responded" ? "responded" : "second_sent",
            secondMessageSentAt: /* @__PURE__ */ new Date()
          });
          await storage.createCampaignLog({
            whatsappConnectionId,
            contactId,
            messageVariationId: variation.id,
            status: "second_sent",
            errorMessage: null
          });
          console.log(`Second message sent to ${contact.name} (${phoneToSend})`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          await storage.createCampaignLog({
            whatsappConnectionId,
            contactId,
            messageVariationId: variation.id,
            status: "error",
            errorMessage: `Second message error: ${errorMessage}`
          });
          throw error;
        }
      }
      async handleContactResponse(contactId) {
        this.clearScheduledSecondMessage(contactId);
        await storage.updateContact(contactId, {
          status: "responded",
          respondedAt: /* @__PURE__ */ new Date()
        });
        console.log(`Contact ${contactId} responded, scheduling second message`);
        await this.sendSecondMessageAfterResponse(contactId);
      }
      async sendSecondMessageAfterResponse(contactId) {
        try {
          const contact = await storage.getContact(contactId);
          if (!contact) {
            console.error(`Contact ${contactId} not found for second message`);
            return;
          }
          if (contact.secondMessageSentAt) {
            console.log(`Second message already sent to contact ${contactId}`);
            return;
          }
          const logs = await storage.getCampaignLogs();
          const firstMessageLog = logs.find(
            (log2) => log2.contactId === contactId && (log2.status === "sent" || log2.status === "delivered")
          );
          if (!firstMessageLog) {
            console.error(`No first message log found for contact ${contactId}`);
            return;
          }
          if (!firstMessageLog.messageVariationId) {
            console.error(`No message variation ID found for contact ${contactId}`);
            return;
          }
          const variation = await storage.getMessageVariation(firstMessageLog.messageVariationId);
          if (!variation || !variation.sendSecondMessage || !variation.secondMessage?.trim()) {
            console.log(`No second message configured for variation ${firstMessageLog.messageVariationId}`);
            return;
          }
          const delayMs = (variation.secondMessageDelay || 30) * 1e3;
          const timeout = setTimeout(async () => {
            try {
              if (firstMessageLog.whatsappConnectionId) {
                await this.sendSecondMessage(contactId, firstMessageLog.whatsappConnectionId, variation);
              }
            } catch (error) {
              console.error(`Error sending second message to contact ${contactId}:`, error);
            }
            this.pendingSecondMessages.delete(contactId);
          }, delayMs);
          this.pendingSecondMessages.set(contactId, timeout);
          console.log(`Second message scheduled for contact ${contactId} in ${delayMs / 1e3} seconds`);
        } catch (error) {
          console.error(`Error scheduling second message for contact ${contactId}:`, error);
        }
      }
      clearScheduledSecondMessage(contactId) {
        const timeout = this.pendingSecondMessages.get(contactId);
        if (timeout) {
          clearTimeout(timeout);
          this.pendingSecondMessages.delete(contactId);
        }
      }
      // Clear all pending second messages (useful when stopping campaign)
      clearAllScheduledMessages() {
        this.pendingSecondMessages.forEach((timeout) => {
          clearTimeout(timeout);
        });
        this.pendingSecondMessages.clear();
      }
      // Get stats about pending second messages
      getPendingSecondMessageStats() {
        return {
          totalPending: this.pendingSecondMessages.size,
          contactIds: Array.from(this.pendingSecondMessages.keys())
        };
      }
    };
    secondMessageService = new SecondMessageService();
  }
});

// server/utils/sessionCleanup.ts
import fs2 from "fs";
import path2 from "path";
import { exec } from "child_process";
var SessionCleanup;
var init_sessionCleanup = __esm({
  "server/utils/sessionCleanup.ts"() {
    "use strict";
    SessionCleanup = class {
      static SESSION_DIR = "./.wwebjs_auth";
      static async cleanupSessions() {
        try {
          if (!fs2.existsSync(this.SESSION_DIR)) {
            return;
          }
          const sessions = fs2.readdirSync(this.SESSION_DIR);
          for (const session of sessions) {
            const sessionPath = path2.join(this.SESSION_DIR, session);
            try {
              await this.forceRemoveDirectory(sessionPath);
              console.log(`Cleaned up session: ${session}`);
            } catch (error) {
              console.warn(`Could not clean up session ${session}:`, error);
            }
          }
        } catch (error) {
          console.warn("Error during session cleanup:", error);
        }
      }
      static async cleanupSpecificSession(clientId) {
        const sessionPath = path2.join(this.SESSION_DIR, `session-${clientId}`);
        try {
          if (fs2.existsSync(sessionPath)) {
            await this.forceRemoveDirectory(sessionPath);
            console.log(`Cleaned up specific session: ${clientId}`);
          }
        } catch (error) {
          console.warn(`Could not clean up session ${clientId}:`, error);
        }
      }
      static async forceRemoveDirectory(dirPath) {
        return new Promise((resolve) => {
          const platform = process.platform;
          let command;
          if (platform === "win32") {
            command = `timeout /t 1 /nobreak > nul 2>&1 && rmdir /s /q "${dirPath}" 2>nul || echo "Cleanup attempted"`;
          } else {
            command = `rm -rf "${dirPath}" 2>/dev/null || true`;
          }
          exec(command, { timeout: 5e3 }, (error) => {
            if (error) {
              console.warn(`Session cleanup warning (non-critical):`, error.message);
            }
            resolve();
          });
        });
      }
      static async isSessionLocked(clientId) {
        const sessionPath = path2.join(this.SESSION_DIR, `session-${clientId}`);
        const lockFiles = [
          "Default/chrome_debug.log",
          "Default/Preferences",
          "Default/Local State"
        ];
        for (const lockFile of lockFiles) {
          const fullPath = path2.join(sessionPath, lockFile);
          try {
            if (fs2.existsSync(fullPath)) {
              fs2.accessSync(fullPath, fs2.constants.R_OK | fs2.constants.W_OK);
            }
          } catch (error) {
            return true;
          }
        }
        return false;
      }
    };
  }
});

// server/services/campaign.ts
var campaign_exports = {};
__export(campaign_exports, {
  campaignService: () => campaignService
});
var CampaignService, campaignService;
var init_campaign = __esm({
  "server/services/campaign.ts"() {
    "use strict";
    init_storage();
    init_whatsappReal();
    init_secondMessage();
    CampaignService = class {
      campaignInterval = null;
      isRunning = false;
      activeConnections = [];
      // Cache of active connection IDs
      connectionCheckInterval = null;
      async startCampaign() {
        if (this.isRunning) {
          throw new Error("Campaign is already running");
        }
        const settings = await storage.getCampaignSettings();
        if (!settings) {
          throw new Error("Campaign settings not found");
        }
        const connections = await storage.getWhatsappConnections();
        const connectedConnections = connections.filter((conn) => conn.status === "connected");
        if (connectedConnections.length === 0) {
          throw new Error("No connected WhatsApp accounts found");
        }
        const contacts2 = await storage.getContacts();
        const pendingContacts = contacts2.filter((contact) => contact.status === "pending");
        if (pendingContacts.length === 0) {
          throw new Error("No pending contacts found");
        }
        const activeVariations = await storage.getMessageVariations();
        const enabledVariations = activeVariations.filter((variation) => variation.enabled && variation.text.trim());
        if (enabledVariations.length === 0) {
          throw new Error("No enabled message variations found");
        }
        this.activeConnections = connectedConnections.map((conn) => conn.id);
        this.isRunning = true;
        await storage.updateCampaignSettings({ isRunning: true });
        this.startConnectionMonitoring();
        this.scheduleCampaign();
      }
      async pauseCampaign() {
        this.isRunning = false;
        if (this.campaignInterval) {
          clearTimeout(this.campaignInterval);
          this.campaignInterval = null;
        }
        if (this.connectionCheckInterval) {
          clearInterval(this.connectionCheckInterval);
          this.connectionCheckInterval = null;
        }
        secondMessageService.clearAllScheduledMessages();
        this.activeConnections = [];
        await storage.updateCampaignSettings({ isRunning: false });
      }
      async restartCampaign(options = {}) {
        console.log("Reiniciando campanha com configura\xE7\xF5es atualizadas...");
        await this.pauseCampaign();
        if (options.resetProgress) {
          console.log("Resetando progresso da campanha...");
          const contacts2 = await storage.getContacts();
          for (const contact of contacts2) {
            if (contact.status !== "pending") {
              await storage.updateContact(contact.id, {
                status: "pending",
                sentAt: null,
                respondedAt: null,
                secondMessageSentAt: null,
                errorMessage: null
              });
            }
          }
          await storage.updateCampaignSettings({
            currentContactIndex: 0,
            currentWhatsAppIndex: 0
          });
          console.log(`${contacts2.length} contatos resetados para status pendente`);
        }
        if (options.clearLogs) {
          console.log("Limpando logs da campanha...");
          await storage.clearCampaignLogs();
        }
        await storage.createCampaignLog({
          whatsappConnectionId: null,
          contactId: null,
          messageVariationId: null,
          status: "info",
          errorMessage: `Campanha reiniciada - Reset: ${options.resetProgress ? "Sim" : "N\xE3o"}, Logs limpos: ${options.clearLogs ? "Sim" : "N\xE3o"}`
        });
        await new Promise((resolve) => setTimeout(resolve, 1e3));
        await this.startCampaign();
        console.log("Campanha reiniciada com sucesso");
      }
      async scheduleCampaign() {
        if (!this.isRunning) return;
        try {
          const settings = await storage.getCampaignSettings();
          if (!settings) return;
          const contacts2 = await storage.getContacts();
          const pendingContacts = contacts2.filter((contact) => contact.status === "pending");
          if (pendingContacts.length === 0) {
            await this.pauseCampaign();
            return;
          }
          if (this.activeConnections.length === 0) {
            console.log("No active WhatsApp connections available, waiting for connections...");
            if (this.isRunning) {
              this.campaignInterval = setTimeout(() => this.scheduleCampaign(), 1e4);
            }
            return;
          }
          const connections = await storage.getWhatsappConnections();
          const connectedConnections = connections.filter((conn) => this.activeConnections.includes(conn.id));
          const currentContactIndex = settings.currentContactIndex || 0;
          const currentWhatsAppIndex = settings.currentWhatsAppIndex || 0;
          const nextContact = pendingContacts[currentContactIndex % pendingContacts.length];
          let nextConnectionIndex = currentWhatsAppIndex;
          if (settings.rotationType === "random") {
            nextConnectionIndex = Math.floor(Math.random() * connectedConnections.length);
          } else {
            nextConnectionIndex = currentWhatsAppIndex % connectedConnections.length;
          }
          const nextConnection = connectedConnections[nextConnectionIndex];
          const variations = await storage.getMessageVariations();
          const enabledVariations = variations.filter((v) => v.enabled && v.text.trim());
          let selectedVariation;
          if (settings.randomizeMessages) {
            selectedVariation = enabledVariations[Math.floor(Math.random() * enabledVariations.length)];
          } else {
            selectedVariation = enabledVariations[currentContactIndex % enabledVariations.length];
          }
          await this.sendMessageToContact(nextContact, nextConnection, selectedVariation);
          await storage.updateCampaignSettings({
            currentContactIndex: (currentContactIndex + 1) % pendingContacts.length,
            currentWhatsAppIndex: (nextConnectionIndex + 1) % connectedConnections.length
          });
          const delay = this.getRandomDelay(settings.minInterval || 30, settings.maxInterval || 60);
          this.campaignInterval = setTimeout(() => this.scheduleCampaign(), delay * 1e3);
        } catch (error) {
          console.error("Campaign execution error:", error);
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          if (errorMessage.includes("WhatsApp") || errorMessage.includes("client")) {
            console.log("WhatsApp connection error encountered, continuing campaign with next number...");
            const settings = await storage.getCampaignSettings();
            const delay = Math.min(10, settings?.minInterval || 30);
            this.campaignInterval = setTimeout(() => this.scheduleCampaign(), delay * 1e3);
          } else {
            await this.pauseCampaign();
          }
        }
      }
      async sendMessageToContact(contact, connection, variation) {
        try {
          let personalizedMessage = variation.text.replace(/{nome}/g, contact.name).replace(/{variavel1}/g, contact.variable1 || "").replace(/{variavel2}/g, contact.variable2 || "");
          const phoneToSend = contact.phoneNumber.replace(/\D/g, "");
          console.log(`Sending to original number: ${phoneToSend} (${contact.variable1})`);
          await whatsappService.sendMessage(
            connection.id,
            phoneToSend,
            personalizedMessage,
            variation.imageUrl || void 0
          );
          await storage.updateContact(contact.id, {
            status: "sent",
            sentAt: /* @__PURE__ */ new Date()
          });
          await storage.createCampaignLog({
            whatsappConnectionId: connection.id,
            contactId: contact.id,
            messageVariationId: variation.id,
            status: "sent",
            errorMessage: null
          });
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
          const isWhatsAppError = errorMessage.includes("WhatsApp") || errorMessage.includes("client") || errorMessage.includes("not found") || errorMessage.includes("disconnected") || errorMessage.includes("n\xE3o possui WhatsApp") || errorMessage.includes("n\xE3o \xE9 v\xE1lido");
          const isInvalidNumber = errorMessage.includes("n\xE3o possui WhatsApp") || errorMessage.includes("n\xE3o \xE9 v\xE1lido");
          if (!settings?.skipErrors && !isWhatsAppError && !isInvalidNumber) {
            throw error;
          }
          if (isInvalidNumber) {
            console.log(`Skipping contact ${contact.id} - invalid WhatsApp number: ${errorMessage}`);
          } else {
            console.log(`Continuing campaign despite error for contact ${contact.id}: ${errorMessage}`);
          }
        }
      }
      getRandomDelay(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }
      async getCampaignStats() {
        const contacts2 = await storage.getContacts();
        const settings = await storage.getCampaignSettings();
        const sent = contacts2.filter((c) => c.status === "sent").length;
        const pending = contacts2.filter((c) => c.status === "pending").length;
        const errors = contacts2.filter((c) => c.status === "error").length;
        const responded = contacts2.filter((c) => c.status === "responded").length;
        const secondSent = contacts2.filter((c) => c.status === "second_sent").length;
        const total = contacts2.length;
        return {
          sent,
          pending,
          errors,
          responded,
          secondSent,
          total,
          progress: total > 0 ? Math.round((sent + responded + secondSent) / total * 100) : 0,
          isRunning: settings?.isRunning || false,
          activeConnections: this.activeConnections.length
        };
      }
      startConnectionMonitoring() {
        this.connectionCheckInterval = setInterval(async () => {
          await this.updateActiveConnections();
        }, 5e3);
      }
      async updateActiveConnections() {
        if (!this.isRunning) return;
        try {
          const connections = await storage.getWhatsappConnections();
          const currentActiveConnections = connections.filter((conn) => conn.status === "connected").map((conn) => conn.id);
          const newConnections = currentActiveConnections.filter((id) => !this.activeConnections.includes(id));
          if (newConnections.length > 0) {
            console.log(`Adding ${newConnections.length} new WhatsApp connections to campaign:`, newConnections);
            await storage.createCampaignLog({
              whatsappConnectionId: newConnections[0],
              contactId: null,
              messageVariationId: null,
              status: "info",
              errorMessage: `${newConnections.length} nova(s) conex\xE3o(\xF5es) WhatsApp adicionada(s) \xE0 campanha`
            });
          }
          const disconnectedConnections = this.activeConnections.filter((id) => !currentActiveConnections.includes(id));
          if (disconnectedConnections.length > 0) {
            console.log(`Individual WhatsApp disconnections detected:`, disconnectedConnections);
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
          this.activeConnections = currentActiveConnections;
          if (this.activeConnections.length === 0) {
            console.log("All WhatsApp connections lost, campaign will wait for reconnections");
            await storage.createCampaignLog({
              whatsappConnectionId: null,
              contactId: null,
              messageVariationId: null,
              status: "warning",
              errorMessage: "Aguardando reconex\xE3o: todas as conex\xF5es WhatsApp foram desconectadas"
            });
          }
        } catch (error) {
          console.error("Error updating active connections:", error);
        }
      }
      // Method to manually refresh active connections (called from WebSocket events)
      async refreshActiveConnections() {
        if (this.isRunning) {
          await this.updateActiveConnections();
        }
      }
    };
    campaignService = new CampaignService();
  }
});

// server/services/whatsappReal.ts
import pkg from "whatsapp-web.js";
import QRCode from "qrcode";
var Client, LocalAuth, MessageMedia, WhatsAppRealService, whatsappService;
var init_whatsappReal = __esm({
  "server/services/whatsappReal.ts"() {
    "use strict";
    init_storage();
    init_secondMessage();
    init_sessionCleanup();
    ({ Client, LocalAuth, MessageMedia } = pkg);
    WhatsAppRealService = class {
      clients = /* @__PURE__ */ new Map();
      qrCodes = /* @__PURE__ */ new Map();
      async initializeConnection(connectionId) {
        try {
          await storage.updateWhatsappConnection(connectionId, { status: "connecting" });
          const clientId = `client_${connectionId}`;
          const isLocked = await SessionCleanup.isSessionLocked(clientId);
          if (isLocked) {
            console.log(`Session ${clientId} appears to be locked, attempting cleanup...`);
            await SessionCleanup.cleanupSpecificSession(clientId);
            await new Promise((resolve) => setTimeout(resolve, 2e3));
          }
          const isReplit = process.env.REPLIT_DB_URL || process.env.REPL_ID;
          let puppeteerConfig;
          if (isReplit) {
            puppeteerConfig = {
              headless: true,
              args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-accelerated-2d-canvas",
                "--no-first-run",
                "--no-zygote",
                "--disable-gpu",
                "--single-process",
                "--disable-background-timer-throttling",
                "--disable-backgrounding-occluded-windows",
                "--disable-renderer-backgrounding",
                "--disable-features=TranslateUI,VizDisplayCompositor",
                "--disable-ipc-flooding-protection",
                "--memory-pressure-off",
                "--max_old_space_size=4096"
              ]
            };
          } else {
            puppeteerConfig = {
              headless: true,
              args: [
                "--no-sandbox",
                "--disable-setuid-sandbox"
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
          client.on("qr", async (qr) => {
            console.log(`WhatsApp connection ${connectionId}: QR code received`);
            const qrCodeDataUrl = await QRCode.toDataURL(qr, {
              width: 256,
              margin: 2,
              color: {
                dark: "#000000",
                light: "#FFFFFF"
              }
            });
            this.qrCodes.set(connectionId, qrCodeDataUrl);
            await storage.updateWhatsappConnection(connectionId, {
              qrCode: qrCodeDataUrl,
              status: "connecting"
            });
            console.log(`WhatsApp connection ${connectionId}: QR code generated and saved`);
          });
          client.on("ready", async () => {
            console.log(`WhatsApp connection ${connectionId}: Client ready`);
            const info = client.info;
            await storage.updateWhatsappConnection(connectionId, {
              status: "connected",
              phoneNumber: info.wid.user,
              qrCode: null
            });
            this.qrCodes.delete(connectionId);
            console.log(`WhatsApp connection ${connectionId}: Connected successfully as ${info.wid.user}`);
            this.notifyCampaignService();
          });
          client.on("auth_failure", async (msg) => {
            console.log(`WhatsApp connection ${connectionId}: Auth failure - ${msg}`);
            await storage.updateWhatsappConnection(connectionId, {
              status: "error",
              qrCode: null
            });
          });
          client.on("disconnected", async (reason) => {
            console.log(`WhatsApp connection ${connectionId}: Disconnected - ${reason}`);
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
            console.log(`Skipping session cleanup for ${connectionId} to prevent file lock errors`);
            this.notifyCampaignService();
          });
          client.on("message", async (message) => {
            try {
              if (!message.fromMe && message.from.endsWith("@c.us")) {
                const phoneNumber = message.from.replace("@c.us", "");
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
          if (errorMessage.includes("Failed to launch the browser process") && process.env.REPL_ID) {
            console.log(`WhatsApp connection ${connectionId}: Browser launch failed in Replit environment. This will work when running locally.`);
          }
        }
      }
      async disconnectConnection(connectionId) {
        console.log(`Disconnecting WhatsApp connection ${connectionId}...`);
        const client = this.clients.get(connectionId);
        if (client) {
          try {
            await Promise.race([
              client.destroy(),
              new Promise(
                (_, reject) => setTimeout(() => reject(new Error("Destroy timeout")), 5e3)
              )
            ]);
            console.log(`WhatsApp connection ${connectionId}: Destroy successful`);
          } catch (logoutError) {
            const logoutErrorMsg = logoutError instanceof Error ? logoutError.message : String(logoutError);
            console.warn(`Logout failed for client ${connectionId}:`, logoutErrorMsg);
            try {
              await Promise.race([
                client.destroy(),
                new Promise(
                  (_, reject) => setTimeout(() => reject(new Error("Destroy timeout")), 5e3)
                )
              ]);
              console.log(`WhatsApp connection ${connectionId}: Destroy successful`);
            } catch (destroyError) {
              const destroyErrorMsg = destroyError instanceof Error ? destroyError.message : String(destroyError);
              console.warn(`Destroy also failed for client ${connectionId}:`, destroyErrorMsg);
            }
          }
          this.clients.delete(connectionId);
        }
        this.qrCodes.delete(connectionId);
        console.log(`Skipping session cleanup for connection ${connectionId} to prevent file lock errors`);
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
        this.notifyCampaignService();
      }
      async sendMessage(connectionId, phoneNumber, text2, imageUrl) {
        const client = this.clients.get(connectionId);
        if (!client) {
          throw new Error(`WhatsApp client ${connectionId} not found`);
        }
        const cleanPhone = phoneNumber.replace(/\D/g, "");
        console.log(`Using number as provided: ${cleanPhone}`);
        const chatId = `${cleanPhone}@c.us`;
        try {
          console.log(`Validating WhatsApp number: ${cleanPhone}`);
          const isValidNumber = await this.validateWhatsAppNumber(client, cleanPhone);
          if (!isValidNumber) {
            throw new Error(`N\xFAmero ${cleanPhone} n\xE3o possui WhatsApp ou n\xE3o \xE9 v\xE1lido`);
          }
          console.log(`Number ${cleanPhone} validated successfully, sending message...`);
          await this.humanizeMessageSending(client, chatId, cleanPhone);
          if (imageUrl) {
            try {
              console.log(`Attempting to send image: ${imageUrl}`);
              const media = MessageMedia.fromFilePath(imageUrl);
              if (text2) {
                await client.sendMessage(chatId, media, { caption: text2 });
              } else {
                await client.sendMessage(chatId, media);
              }
              console.log(`WhatsApp connection ${connectionId}: Message with image sent to ${cleanPhone}`);
            } catch (imageError) {
              const imageErrorMsg = imageError instanceof Error ? imageError.message : String(imageError);
              console.warn(`Image send failed, sending text only: ${imageErrorMsg}`);
              await client.sendMessage(chatId, text2);
              console.log(`WhatsApp connection ${connectionId}: Text-only message sent to ${cleanPhone}`);
            }
          } else {
            await client.sendMessage(chatId, text2);
            console.log(`WhatsApp connection ${connectionId}: Text message sent to ${cleanPhone}`);
          }
        } catch (error) {
          console.error(`Error sending message via WhatsApp ${connectionId}:`, error);
          throw error;
        }
      }
      async humanizeMessageSending(client, chatId, phoneNumber) {
        try {
          let profilePicUrl = "Sem foto de perfil";
          try {
            const profilePic = await client.getProfilePicUrl(chatId);
            if (profilePic) {
              profilePicUrl = "Foto de perfil dispon\xEDvel";
              console.log(`\u{1F4F7} Profile picture found for ${phoneNumber}: ${profilePic.substring(0, 50)}...`);
            }
          } catch (picError) {
            console.log(`\u{1F4F7} No profile picture found for ${phoneNumber}`);
          }
          try {
            const chat = await client.getChatById(chatId);
            if (chat) {
              console.log(`\u{1F4AC} Opened chat with ${phoneNumber} (${profilePicUrl})`);
            }
          } catch (chatError) {
            console.log(`\u{1F4AC} Chat access for ${phoneNumber} - ${profilePicUrl}`);
          }
          const typingDuration = Math.floor(Math.random() * 3e3) + 1e3;
          console.log(`\u2328\uFE0F Simulating typing for ${typingDuration}ms to ${phoneNumber}...`);
          try {
            await client.sendPresenceAvailable();
            await client.sendPresenceComposing(chatId);
            await new Promise((resolve) => setTimeout(resolve, typingDuration));
            await client.sendPresenceAvailable();
            console.log(`\u2705 Typing simulation completed for ${phoneNumber}`);
          } catch (typingError) {
            console.log(`\u2328\uFE0F Typing simulation completed (basic) for ${phoneNumber}`);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.warn(`Humanization warning for ${phoneNumber}: ${errorMsg}`);
        }
      }
      async validateWhatsAppNumber(client, phoneNumber) {
        try {
          console.log(`\u{1F50D} Checking if ${phoneNumber} has WhatsApp...`);
          const chatId = `${phoneNumber}@c.us`;
          const numberId = await Promise.race([
            client.getNumberId(chatId),
            new Promise(
              (_, reject) => setTimeout(() => reject(new Error("Validation timeout")), 1e4)
            )
          ]);
          if (!numberId || !numberId.user) {
            console.log(`\u274C Number ${phoneNumber} is not registered on WhatsApp`);
            return false;
          }
          console.log(`\u2705 Number ${phoneNumber} is registered on WhatsApp (${numberId.user})`);
          return true;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.warn(`\u26A0\uFE0F Error validating WhatsApp number ${phoneNumber}: ${errorMsg}`);
          return false;
        }
      }
      getQrCode(connectionId) {
        return this.qrCodes.get(connectionId);
      }
      getConnectedClients() {
        return Array.from(this.clients.keys()).filter((id) => {
          const client = this.clients.get(id);
          return client && client.info !== null;
        });
      }
      isClientReady(connectionId) {
        const client = this.clients.get(connectionId);
        return client ? client.info !== null : false;
      }
      async forceDisconnectConnection(connectionId) {
        console.log(`Force disconnecting WhatsApp connection ${connectionId}...`);
        const client = this.clients.get(connectionId);
        if (client) {
          try {
            await Promise.race([
              client.destroy(),
              new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5e3))
            ]);
          } catch (error) {
            console.warn(`Force destroy failed for client ${connectionId}, continuing...`);
          }
          this.clients.delete(connectionId);
        }
        this.qrCodes.delete(connectionId);
        console.log(`Skipping force cleanup for connection ${connectionId} to prevent crashes`);
        await storage.updateWhatsappConnection(connectionId, {
          status: "disconnected",
          phoneNumber: null,
          qrCode: null
        });
        console.log(`WhatsApp connection ${connectionId} force disconnected and cleaned`);
        this.notifyCampaignService();
      }
      notifyCampaignService() {
        Promise.resolve().then(() => (init_campaign(), campaign_exports)).then(({ campaignService: campaignService2 }) => {
          campaignService2.refreshActiveConnections().catch(console.error);
        }).catch(() => {
        });
      }
      async handleIncomingMessage(connectionId, phoneNumber, messageBody) {
        try {
          const contacts2 = await storage.getContacts();
          const contact = contacts2.find((c) => {
            const cleanContactPhone = c.phoneNumber.replace(/\D/g, "");
            const cleanIncomingPhone = phoneNumber.replace(/\D/g, "");
            return cleanContactPhone === cleanIncomingPhone;
          });
          if (contact) {
            if ((contact.status === "sent" || contact.status === "delivered") && !contact.respondedAt) {
              console.log(`Contact ${contact.name} (${phoneNumber}) responded: ${messageBody}`);
              await secondMessageService.handleContactResponse(contact.id);
            }
          }
          await storage.createReceivedMessage({
            whatsappConnectionId: connectionId,
            contactId: contact?.id || null,
            phoneNumber,
            messageBody
          });
        } catch (error) {
          console.error(`Error processing incoming message from ${phoneNumber}:`, error);
        }
      }
    };
    whatsappService = new WhatsAppRealService();
  }
});

// server/index.ts
import express3 from "express";

// server/routes.ts
init_storage();
init_whatsappReal();
init_campaign();
import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import path3 from "path";
import fs3 from "fs";

// server/services/fileProcessor.ts
var FileProcessorService = class {
  static processContactList(fileContent) {
    const lines = fileContent.split("\n").filter((line) => line.trim());
    const contacts2 = [];
    const errors = [];
    for (const line of lines) {
      try {
        const parts = line.split(",").map((s) => s.trim());
        if (parts.length < 2) {
          errors.push(`Invalid line format: ${line}`);
          continue;
        }
        const [phone, variable1, variable2] = parts;
        const name = variable1 || phone;
        const formattedNumber = this.formatBrazilianPhoneNumber(phone);
        if (!formattedNumber) {
          errors.push(`Invalid phone number: ${phone}`);
          continue;
        }
        contacts2.push({
          name,
          phoneNumber: phone,
          formattedNumber,
          variable1: variable1 || null,
          variable2: variable2 || null,
          status: "pending",
          errorMessage: null,
          sentAt: null
        });
      } catch (error) {
        errors.push(`Error processing line: ${line}`);
      }
    }
    return {
      contacts: contacts2,
      stats: {
        loaded: lines.length,
        formatted: contacts2.length,
        errors: errors.length
      }
    };
  }
  static formatBrazilianPhoneNumber(phone) {
    try {
      const digits = phone.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 13) {
        return null;
      }
      return digits;
    } catch {
      return null;
    }
  }
  static validatePhoneNumber(number) {
    const digits = number.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 13;
  }
};

// shared/schema.ts
import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var whatsappConnections = pgTable("whatsapp_connections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phoneNumber: text("phone_number"),
  status: text("status").notNull().default("disconnected"),
  // disconnected, connecting, connected, error
  qrCode: text("qr_code"),
  sessionData: jsonb("session_data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var messageVariations = pgTable("message_variations", {
  id: serial("id").primaryKey(),
  variationNumber: integer("variation_number").notNull(),
  // 1, 2, or 3
  text: text("text").notNull(),
  imageUrl: text("image_url"),
  secondMessage: text("second_message"),
  // Optional second message
  secondImageUrl: text("second_image_url"),
  // Optional second message image
  sendSecondMessage: boolean("send_second_message").default(false),
  // Enable second message
  secondMessageDelay: integer("second_message_delay").default(30),
  // Delay in seconds before sending second message
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  formattedNumber: text("formatted_number").notNull(),
  variable1: text("variable1"),
  variable2: text("variable2"),
  status: text("status").default("pending"),
  // pending, sent, error, responded, second_sent
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  respondedAt: timestamp("responded_at"),
  // When they responded to first message
  secondMessageSentAt: timestamp("second_message_sent_at"),
  // When second message was sent
  createdAt: timestamp("created_at").defaultNow()
});
var campaignSettings = pgTable("campaign_settings", {
  id: serial("id").primaryKey(),
  minInterval: integer("min_interval").default(30),
  maxInterval: integer("max_interval").default(120),
  rotationType: text("rotation_type").default("sequential"),
  // sequential, random
  randomizeMessages: boolean("randomize_messages").default(true),
  skipErrors: boolean("skip_errors").default(false),
  logMessages: boolean("log_messages").default(true),
  isRunning: boolean("is_running").default(false),
  currentContactIndex: integer("current_contact_index").default(0),
  currentWhatsAppIndex: integer("current_whatsapp_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var campaignLogs = pgTable("campaign_logs", {
  id: serial("id").primaryKey(),
  whatsappConnectionId: integer("whatsapp_connection_id").references(() => whatsappConnections.id),
  contactId: integer("contact_id").references(() => contacts.id),
  messageVariationId: integer("message_variation_id").references(() => messageVariations.id),
  status: text("status").notNull(),
  // sent, error
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at").defaultNow()
});
var receivedMessages = pgTable("received_messages", {
  id: serial("id").primaryKey(),
  whatsappConnectionId: integer("whatsapp_connection_id").references(() => whatsappConnections.id),
  contactId: integer("contact_id").references(() => contacts.id),
  phoneNumber: text("phone_number").notNull(),
  messageBody: text("message_body").notNull(),
  receivedAt: timestamp("received_at").defaultNow()
});
var insertWhatsappConnectionSchema = createInsertSchema(whatsappConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertMessageVariationSchema = createInsertSchema(messageVariations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true
});
var insertCampaignSettingsSchema = createInsertSchema(campaignSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertCampaignLogSchema = createInsertSchema(campaignLogs).omit({
  id: true,
  sentAt: true
});
var insertReceivedMessageSchema = createInsertSchema(receivedMessages).omit({
  id: true,
  receivedAt: true
});

// server/processManager.ts
init_whatsappReal();
init_campaign();
init_secondMessage();
var ProcessManager = class {
  restartCount = 0;
  maxRestarts = 50;
  restartDelay = 5e3;
  // 5 seconds
  lastCrashTime = 0;
  crashThreshold = 3e4;
  // 30 seconds
  isShuttingDown = false;
  constructor() {
    this.setupGlobalErrorHandlers();
  }
  setupGlobalErrorHandlers() {
    process.on("uncaughtException", (error) => {
      console.error("\u{1F6A8} Uncaught Exception:", error);
      this.handleCrash("uncaughtException", error);
    });
    process.on("unhandledRejection", (reason, promise) => {
      console.error("\u{1F6A8} Unhandled Rejection at:", promise, "reason:", reason);
      this.handleCrash("unhandledRejection", reason);
    });
    process.on("SIGTERM", () => {
      console.log("\u{1F4F1} Received SIGTERM, gracefully shutting down...");
      this.gracefulShutdown();
    });
    process.on("SIGINT", () => {
      console.log("\u{1F4F1} Received SIGINT, gracefully shutting down...");
      this.gracefulShutdown();
    });
    process.on("warning", (warning) => {
      console.warn("\u26A0\uFE0F Process warning:", warning.name, warning.message);
    });
  }
  handleCrash(type, error) {
    if (this.isShuttingDown) {
      return;
    }
    const now = Date.now();
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`\u{1F4A5} Application crashed (${type}):`, errorMessage);
    if (errorMessage.includes("EBUSY") || errorMessage.includes("resource busy or locked") || errorMessage.includes("chrome_debug.log")) {
      console.warn(`\u26A0\uFE0F Session cleanup error detected - ignoring crash to prevent restart loop`);
      return;
    }
    if (now - this.lastCrashTime < this.crashThreshold) {
      this.restartCount++;
      console.warn(`\u26A0\uFE0F Rapid restart detected. Count: ${this.restartCount}/${this.maxRestarts}`);
    } else {
      this.restartCount = 1;
    }
    this.lastCrashTime = now;
    if (this.restartCount > 5) {
      this.restartDelay = Math.min(3e4, this.restartDelay * 1.5);
      console.warn(`\u{1F504} Increasing restart delay to ${this.restartDelay}ms`);
    }
    if (this.restartCount <= this.maxRestarts) {
      console.log(`\u{1F504} Attempting restart ${this.restartCount}/${this.maxRestarts} in ${this.restartDelay}ms...`);
      this.scheduleRestart();
    } else {
      console.error(`\u{1F480} Maximum restart attempts (${this.maxRestarts}) reached. Exiting.`);
      process.exit(1);
    }
  }
  scheduleRestart() {
    setTimeout(async () => {
      try {
        await this.cleanupServices();
        console.log("\u{1F504} Restarting application services...");
        await this.reinitializeServices();
        console.log("\u2705 Application services restarted successfully");
        this.restartDelay = 5e3;
      } catch (restartError) {
        console.error("\u274C Failed to restart services:", restartError);
        this.handleCrash("restart_failure", restartError);
      }
    }, this.restartDelay);
  }
  async cleanupServices() {
    console.log("\u{1F9F9} Cleaning up services...");
    try {
      if (campaignService) {
        await campaignService.pauseCampaign();
        console.log("\u2705 Campaign service stopped");
      }
    } catch (error) {
      console.warn("\u26A0\uFE0F Error stopping campaign service:", error);
    }
    try {
      if (secondMessageService) {
        secondMessageService.clearAllScheduledMessages();
        console.log("\u2705 Second message service cleared");
      }
    } catch (error) {
      console.warn("\u26A0\uFE0F Error clearing second message service:", error);
    }
    try {
      const connectedClients = whatsappService.getConnectedClients();
      for (const connectionId of connectedClients) {
        await whatsappService.forceDisconnectConnection(connectionId);
      }
      console.log("\u2705 WhatsApp connections disconnected");
    } catch (error) {
      console.warn("\u26A0\uFE0F Error disconnecting WhatsApp services:", error);
    }
    await new Promise((resolve) => setTimeout(resolve, 2e3));
  }
  async reinitializeServices() {
    console.log("\u{1F527} Reinitializing services...");
    console.log("\u2705 Services ready for reinitialization");
  }
  async gracefulShutdown() {
    if (this.isShuttingDown) {
      return;
    }
    this.isShuttingDown = true;
    console.log("\u{1F6D1} Initiating graceful shutdown...");
    try {
      await this.cleanupServices();
      console.log("\u2705 Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      console.error("\u274C Error during graceful shutdown:", error);
      process.exit(1);
    }
  }
  // Health check method
  getStatus() {
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
  async manualRestart() {
    console.log("\u{1F504} Manual restart initiated...");
    this.restartCount = 0;
    await this.cleanupServices();
    await this.reinitializeServices();
    console.log("\u2705 Manual restart completed");
  }
};
var processManager = new ProcessManager();

// server/services/watchdog.ts
init_whatsappReal();
init_campaign();
init_storage();
var WatchdogService = class {
  healthCheckInterval = null;
  checkIntervalMs = 3e4;
  // 30 seconds
  lastHealthCheck = Date.now();
  consecutiveFailures = 0;
  maxFailures = 3;
  isRecovering = false;
  constructor() {
    this.startHealthChecking();
  }
  startHealthChecking() {
    console.log("\u{1F415} Watchdog service iniciado - modo passivo (n\xE3o interfere com conex\xF5es)");
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
        this.consecutiveFailures = 0;
      } catch (error) {
        this.consecutiveFailures++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.warn(`\u26A0\uFE0F Health check falhou (${this.consecutiveFailures}/${this.maxFailures}):`, errorMsg);
      }
      this.lastHealthCheck = Date.now();
    }, this.checkIntervalMs);
  }
  async performHealthCheck() {
    try {
      const connections = await storage.getWhatsappConnections();
      const connectedCount = connections.filter((c) => c.status === "connected").length;
      if (connectedCount > 0) {
        console.log(`Watchdog: ${connectedCount} WhatsApp connections active`);
      }
      const stats = await campaignService.getCampaignStats();
      if (stats) {
        console.log(`Watchdog: Campaign service responsive - ${stats.sent} sent, ${stats.pending} pending`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`Watchdog: Health check warning - ${errorMsg}`);
    }
  }
  async reconnectWhatsApp(connectionId) {
    try {
      console.log(`\u{1F504} Detectada conex\xE3o problem\xE1tica ${connectionId}, marcando como desconectada...`);
      await storage.updateWhatsappConnection(connectionId, {
        status: "disconnected",
        phoneNumber: null,
        qrCode: null
      });
      console.log(`\u26A0\uFE0F WhatsApp ${connectionId} marcado como desconectado - usu\xE1rio pode reconectar manualmente`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`\u274C Falha ao atualizar status do WhatsApp ${connectionId}:`, errorMsg);
    }
  }
  async initiateRecovery() {
    if (this.isRecovering) {
      return;
    }
    this.isRecovering = true;
    console.log("\u{1F527} Iniciando recupera\xE7\xE3o autom\xE1tica do sistema...");
    try {
      console.log("1. Pausando campanhas...");
      await campaignService.pauseCampaign();
      console.log("2. Verificando conex\xF5es problem\xE1ticas...");
      const connections = await storage.getWhatsappConnections();
      for (const connection of connections) {
        if (connection.status === "connected") {
          const isActuallyReady = whatsappService.isClientReady(connection.id);
          if (!isActuallyReady) {
            console.log(`Desconectando conex\xE3o problem\xE1tica ${connection.id}...`);
            await whatsappService.forceDisconnectConnection(connection.id);
          }
        }
      }
      console.log("3. Aguardando estabiliza\xE7\xE3o...");
      await new Promise((resolve) => setTimeout(resolve, 3e3));
      console.log("4. Recupera\xE7\xE3o conclu\xEDda - usu\xE1rio pode reconectar manualmente");
      console.log("\u2705 Recupera\xE7\xE3o autom\xE1tica conclu\xEDda");
      this.consecutiveFailures = 0;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("\u274C Falha na recupera\xE7\xE3o autom\xE1tica:", errorMsg);
    } finally {
      this.isRecovering = false;
    }
  }
  getStatus() {
    return {
      lastHealthCheck: new Date(this.lastHealthCheck).toISOString(),
      consecutiveFailures: this.consecutiveFailures,
      maxFailures: this.maxFailures,
      isRecovering: this.isRecovering,
      nextCheckIn: Math.max(0, this.checkIntervalMs - (Date.now() - this.lastHealthCheck))
    };
  }
  async forceHealthCheck() {
    console.log("\u{1F50D} Executando health check manual...");
    await this.performHealthCheck();
    console.log("\u2705 Health check manual conclu\xEDdo");
  }
  stop() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log("\u{1F415} Watchdog service parado");
    }
  }
};
var watchdogService = new WatchdogService();

// server/routes.ts
var uploadDir = path3.join(process.cwd());
if (!fs3.existsSync(uploadDir)) {
  fs3.mkdirSync(uploadDir, { recursive: true });
}
var upload = multer({
  storage: multer.diskStorage({
    destination: "./",
    // Save directly in root directory
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path3.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB limit
  }
});
async function registerRoutes(app2) {
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");
    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });
  });
  const broadcast = (data) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };
  app2.get("/api/health", async (req, res) => {
    try {
      const status = processManager.getStatus();
      res.json({
        status: "healthy",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        processInfo: status
      });
    } catch (error) {
      res.status(500).json({
        status: "unhealthy",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.post("/api/restart", async (req, res) => {
    try {
      await processManager.manualRestart();
      broadcast({ type: "system_restarted", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
      res.json({
        success: true,
        message: "Sistema reiniciado com sucesso",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Falha ao reiniciar o sistema",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/watchdog/status", async (req, res) => {
    try {
      const status = watchdogService.getStatus();
      res.json({
        watchdog: status,
        process: processManager.getStatus()
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to get watchdog status",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.post("/api/watchdog/check", async (req, res) => {
    try {
      await watchdogService.forceHealthCheck();
      res.json({
        success: true,
        message: "Health check executado com sucesso",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Health check falhou",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/whatsapp-connections", async (req, res) => {
    try {
      const connections = await storage.getWhatsappConnections();
      res.json(connections);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch WhatsApp connections" });
    }
  });
  app2.get("/api/whatsapp-connections/:id/qr", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const qrCode = whatsappService.getQrCode(id);
      if (qrCode) {
        res.json({ qrCode });
      } else {
        res.status(404).json({ error: "QR code not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to get QR code" });
    }
  });
  app2.post("/api/whatsapp-connections", async (req, res) => {
    try {
      const data = insertWhatsappConnectionSchema.parse(req.body);
      const connection = await storage.createWhatsappConnection(data);
      whatsappService.initializeConnection(connection.id);
      broadcast({ type: "whatsapp_connection_created", data: connection });
      res.json(connection);
    } catch (error) {
      res.status(400).json({ error: "Failed to create WhatsApp connection" });
    }
  });
  app2.delete("/api/whatsapp-connections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await whatsappService.disconnectConnection(id);
      await storage.deleteWhatsappConnection(id);
      broadcast({ type: "whatsapp_connection_deleted", data: { id } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to disconnect WhatsApp" });
    }
  });
  app2.post("/api/whatsapp-connections/:id/force-disconnect", async (req, res) => {
    try {
      const connectionId = parseInt(req.params.id);
      await whatsappService.forceDisconnectConnection(connectionId);
      broadcast({ type: "whatsapp_force_disconnected", connectionId });
      res.json({ success: true, message: "Conex\xE3o for\xE7adamente desconectada e limpa" });
    } catch (error) {
      res.status(500).json({ error: "Failed to force disconnect WhatsApp" });
    }
  });
  app2.post("/api/whatsapp-connections/:id/reconnect", async (req, res) => {
    try {
      const connectionId = parseInt(req.params.id);
      await storage.updateWhatsappConnection(connectionId, {
        status: "connecting",
        phoneNumber: null,
        qrCode: null
      });
      await whatsappService.initializeConnection(connectionId);
      broadcast({ type: "whatsapp_reconnecting", connectionId });
      res.json({ success: true, message: "Reconectando WhatsApp..." });
    } catch (error) {
      res.status(500).json({ error: "Failed to reconnect WhatsApp" });
    }
  });
  app2.get("/api/message-variations", async (req, res) => {
    try {
      const variations = await storage.getMessageVariations();
      res.json(variations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch message variations" });
    }
  });
  app2.put("/api/message-variations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertMessageVariationSchema.partial().parse(req.body);
      const variation = await storage.updateMessageVariation(id, data);
      broadcast({ type: "message_variation_updated", data: variation });
      res.json(variation);
    } catch (error) {
      res.status(400).json({ error: "Failed to update message variation" });
    }
  });
  app2.post("/api/message-variations/:id/image", upload.single("image"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }
      const imageUrl = req.file.filename;
      const variation = await storage.updateMessageVariation(id, { imageUrl });
      broadcast({ type: "message_variation_updated", data: variation });
      res.json(variation);
    } catch (error) {
      res.status(500).json({ error: "Failed to upload image" });
    }
  });
  app2.delete("/api/message-variations/:id/image", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const currentVariation = await storage.getMessageVariation(id);
      if (currentVariation?.imageUrl) {
        try {
          const imagePath = currentVariation.imageUrl.startsWith("/") ? currentVariation.imageUrl.substring(1) : currentVariation.imageUrl;
          fs3.unlinkSync(imagePath);
          console.log(`Removed image file: ${imagePath}`);
        } catch (error) {
          console.log(`Could not remove image file: ${currentVariation.imageUrl}`);
        }
      }
      const variation = await storage.updateMessageVariation(id, { imageUrl: null });
      broadcast({ type: "message_variation_updated", data: variation });
      res.json(variation);
    } catch (error) {
      res.status(500).json({ error: "Failed to remove image" });
    }
  });
  app2.get("/api/contacts", async (req, res) => {
    try {
      const contacts2 = await storage.getContacts();
      res.json(contacts2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });
  app2.post("/api/contacts/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }
      const fileContent = fs3.readFileSync(req.file.path, "utf-8");
      const result = FileProcessorService.processContactList(fileContent);
      await storage.clearContacts();
      await storage.createContacts(result.contacts);
      fs3.unlinkSync(req.file.path);
      broadcast({ type: "contacts_uploaded", data: result.stats });
      res.json(result.stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to process contact list" });
    }
  });
  app2.delete("/api/contacts", async (req, res) => {
    try {
      await storage.clearContacts();
      broadcast({ type: "contacts_cleared" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear contacts" });
    }
  });
  app2.get("/api/campaign-settings", async (req, res) => {
    try {
      const settings = await storage.getCampaignSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch campaign settings" });
    }
  });
  app2.put("/api/campaign-settings", async (req, res) => {
    try {
      const data = insertCampaignSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateCampaignSettings(data);
      broadcast({ type: "campaign_settings_updated", data: settings });
      res.json(settings);
    } catch (error) {
      res.status(400).json({ error: "Failed to update campaign settings" });
    }
  });
  app2.post("/api/campaign/start", async (req, res) => {
    try {
      await campaignService.startCampaign();
      const stats = await campaignService.getCampaignStats();
      broadcast({ type: "campaign_started", data: stats });
      res.json({ success: true, stats });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start campaign";
      res.status(400).json({ error: message });
    }
  });
  app2.post("/api/campaign/pause", async (req, res) => {
    try {
      await campaignService.pauseCampaign();
      const stats = await campaignService.getCampaignStats();
      broadcast({ type: "campaign_paused", data: stats });
      res.json({ success: true, stats });
    } catch (error) {
      res.status(500).json({ error: "Failed to pause campaign" });
    }
  });
  app2.post("/api/campaign/restart", async (req, res) => {
    try {
      const options = {
        resetProgress: req.body.resetProgress || false,
        clearLogs: req.body.clearLogs || false,
        updateContacts: req.body.updateContacts || false
      };
      await campaignService.restartCampaign(options);
      const stats = await campaignService.getCampaignStats();
      broadcast({ type: "campaign_restarted", data: { stats, options } });
      res.json({
        success: true,
        stats,
        message: "Campanha reiniciada com sucesso",
        options
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to restart campaign";
      res.status(500).json({ error: message });
    }
  });
  app2.get("/api/campaign/stats", async (req, res) => {
    try {
      const stats = await campaignService.getCampaignStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch campaign stats" });
    }
  });
  app2.get("/api/campaign-logs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const logs = await storage.getCampaignLogs(limit);
      const logsWithDetails = await Promise.all(
        logs.map(async (log2) => {
          const contact = log2.contactId ? await storage.getContact(log2.contactId) : null;
          const whatsapp = log2.whatsappConnectionId ? await storage.getWhatsappConnection(log2.whatsappConnectionId) : null;
          const variation = log2.messageVariationId ? await storage.getMessageVariation(log2.messageVariationId) : null;
          return {
            ...log2,
            contact,
            whatsapp,
            variation
          };
        })
      );
      res.json(logsWithDetails);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch campaign logs" });
    }
  });
  app2.delete("/api/campaign-logs", async (req, res) => {
    try {
      await storage.clearCampaignLogs();
      broadcast({ type: "campaign_logs_cleared" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear campaign logs" });
    }
  });
  app2.get("/api/received-messages", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const messages = await storage.getReceivedMessages(limit);
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
      res.status(500).json({ error: "Failed to fetch received messages" });
    }
  });
  app2.get("/api/received-messages/contact/:contactId", async (req, res) => {
    try {
      const contactId = parseInt(req.params.contactId);
      const messages = await storage.getReceivedMessagesByContact(contactId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages for contact" });
    }
  });
  app2.delete("/api/received-messages", async (req, res) => {
    try {
      await storage.clearReceivedMessages();
      broadcast({ type: "received_messages_cleared" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear received messages" });
    }
  });
  app2.use("/uploads", express.static(uploadDir));
  app2.use("/", express.static(process.cwd(), {
    index: false,
    dotfiles: "ignore",
    setHeaders: (res, path6) => {
      if (path6.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        res.setHeader("Cache-Control", "public, max-age=3600");
      }
    }
  }));
  return httpServer;
}

// server/vite.ts
import express2 from "express";
import fs4 from "fs";
import path5 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path4 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path4.resolve(import.meta.dirname, "client", "src"),
      "@shared": path4.resolve(import.meta.dirname, "shared"),
      "@assets": path4.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path4.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path4.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path5.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs4.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path5.resolve(import.meta.dirname, "public");
  if (!fs4.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path5.resolve(distPath, "index.html"));
  });
}

// server/index.ts
init_sessionCleanup();
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path6 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path6.startsWith("/api")) {
      let logLine = `${req.method} ${path6} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  console.log("Cleaning up session files...");
  await SessionCleanup.cleanupSessions();
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
