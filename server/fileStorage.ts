import fs from "fs/promises";
import path from "path";
import { IStorage } from "./storage";
import {
  type WhatsappConnection,
  type InsertWhatsappConnection,
  type MessageVariation,
  type InsertMessageVariation,
  type Contact,
  type InsertContact,
  type CampaignSettings,
  type InsertCampaignSettings,
  type CampaignLog,
  type InsertCampaignLog,
  type ReceivedMessage,
  type InsertReceivedMessage,
} from "@shared/schema";

export class FileStorage implements IStorage {
  private dataDir = "./data";
  private currentIds = {
    whatsappConnection: 1,
    messageVariation: 4, // Start at 4 since we initialize 3 variations
    contact: 1,
    campaignSettings: 1,
    campaignLog: 1,
    receivedMessage: 1,
  };

  constructor() {
    this.ensureDataDirectory();
    this.initializeDefaultData();
  }

  private async ensureDataDirectory() {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }
  }

  private async initializeDefaultData() {
    // Initialize campaign settings if not exists
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
        currentWhatsAppIndex: 0,
      });
    }

    // Initialize message variations if not exists
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
            enabled: false,
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
          enabled: false,
        });
      }
    }
  }

  private async readFile<T>(fileName: string): Promise<T[]> {
    try {
      const data = await fs.readFile(path.join(this.dataDir, fileName), "utf-8");
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private async writeFile<T>(fileName: string, data: T[]): Promise<void> {
    await fs.writeFile(path.join(this.dataDir, fileName), JSON.stringify(data, null, 2));
  }

  // WhatsApp Connections
  async getWhatsappConnections(): Promise<WhatsappConnection[]> {
    return this.readFile<WhatsappConnection>("whatsapp_connections.txt");
  }

  async getWhatsappConnection(id: number): Promise<WhatsappConnection | undefined> {
    const connections = await this.getWhatsappConnections();
    return connections.find(c => c.id === id);
  }

  async createWhatsappConnection(connection: InsertWhatsappConnection): Promise<WhatsappConnection> {
    const connections = await this.getWhatsappConnections();
    const newConnection: WhatsappConnection = {
      ...connection,
      id: this.currentIds.whatsappConnection++,
      phoneNumber: connection.phoneNumber || null,
      status: connection.status || "disconnected",
      qrCode: connection.qrCode || null,
      sessionData: connection.sessionData || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    connections.push(newConnection);
    await this.writeFile("whatsapp_connections.txt", connections);
    return newConnection;
  }

  async updateWhatsappConnection(id: number, connection: Partial<WhatsappConnection>): Promise<WhatsappConnection> {
    const connections = await this.getWhatsappConnections();
    const index = connections.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error(`WhatsApp connection with id ${id} not found`);
    }
    const updated = { ...connections[index], ...connection, updatedAt: new Date() };
    connections[index] = updated;
    await this.writeFile("whatsapp_connections.txt", connections);
    return updated;
  }

  async deleteWhatsappConnection(id: number): Promise<void> {
    const connections = await this.getWhatsappConnections();
    const filtered = connections.filter(c => c.id !== id);
    await this.writeFile("whatsapp_connections.txt", filtered);
  }

  // Message Variations
  async getMessageVariations(): Promise<MessageVariation[]> {
    return this.readFile<MessageVariation>("message_variations.txt");
  }

  async getMessageVariation(id: number): Promise<MessageVariation | undefined> {
    const variations = await this.getMessageVariations();
    return variations.find(v => v.id === id);
  }

  async createMessageVariation(variation: InsertMessageVariation): Promise<MessageVariation> {
    const variations = await this.getMessageVariations();
    const newVariation: MessageVariation = {
      ...variation,
      id: this.currentIds.messageVariation++,
      imageUrl: variation.imageUrl || null,
      secondMessage: variation.secondMessage || null,
      secondImageUrl: variation.secondImageUrl || null,
      sendSecondMessage: variation.sendSecondMessage ?? false,
      secondMessageDelay: variation.secondMessageDelay ?? 30,
      enabled: variation.enabled ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    variations.push(newVariation);
    await this.writeFile("message_variations.txt", variations);
    return newVariation;
  }

  async updateMessageVariation(id: number, variation: Partial<MessageVariation>): Promise<MessageVariation> {
    const variations = await this.getMessageVariations();
    const index = variations.findIndex(v => v.id === id);
    if (index === -1) {
      throw new Error(`Message variation with id ${id} not found`);
    }
    const updated = { ...variations[index], ...variation, updatedAt: new Date() };
    variations[index] = updated;
    await this.writeFile("message_variations.txt", variations);
    return updated;
  }

  async deleteMessageVariation(id: number): Promise<void> {
    const variations = await this.getMessageVariations();
    const filtered = variations.filter(v => v.id !== id);
    await this.writeFile("message_variations.txt", filtered);
  }

  // Contacts
  async getContacts(): Promise<Contact[]> {
    return this.readFile<Contact>("contacts.txt");
  }

  async getContact(id: number): Promise<Contact | undefined> {
    const contacts = await this.getContacts();
    return contacts.find(c => c.id === id);
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const contacts = await this.getContacts();
    const newContact: Contact = {
      ...contact,
      id: this.currentIds.contact++,
      variable1: contact.variable1 || null,
      variable2: contact.variable2 || null,
      status: contact.status || "pending",
      errorMessage: contact.errorMessage || null,
      sentAt: contact.sentAt || null,
      respondedAt: contact.respondedAt || null,
      secondMessageSentAt: contact.secondMessageSentAt || null,
      createdAt: new Date(),
    };
    contacts.push(newContact);
    await this.writeFile("contacts.txt", contacts);
    return newContact;
  }

  async createContacts(contactsData: InsertContact[]): Promise<Contact[]> {
    const contacts = await this.getContacts();
    const newContacts: Contact[] = contactsData.map(contact => ({
      ...contact,
      id: this.currentIds.contact++,
      variable1: contact.variable1 || null,
      variable2: contact.variable2 || null,
      status: contact.status || "pending",
      errorMessage: contact.errorMessage || null,
      sentAt: contact.sentAt || null,
      respondedAt: contact.respondedAt || null,
      secondMessageSentAt: contact.secondMessageSentAt || null,
      createdAt: new Date(),
    }));
    contacts.push(...newContacts);
    await this.writeFile("contacts.txt", contacts);
    return newContacts;
  }

  async updateContact(id: number, contact: Partial<Contact>): Promise<Contact> {
    const contacts = await this.getContacts();
    const index = contacts.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error(`Contact with id ${id} not found`);
    }
    const updated = { ...contacts[index], ...contact };
    contacts[index] = updated;
    await this.writeFile("contacts.txt", contacts);
    return updated;
  }

  async deleteContact(id: number): Promise<void> {
    const contacts = await this.getContacts();
    const filtered = contacts.filter(c => c.id !== id);
    await this.writeFile("contacts.txt", filtered);
  }

  async clearContacts(): Promise<void> {
    await this.writeFile("contacts.txt", []);
    this.currentIds.contact = 1;
  }

  // Campaign Settings
  async getCampaignSettings(): Promise<CampaignSettings | undefined> {
    let settings = await this.readFile<CampaignSettings>("campaign_settings.txt");
    
    // If no settings exist, create default ones
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
        currentWhatsAppIndex: 0,
      });
      return defaultSettings;
    }
    
    return settings[0];
  }

  async createCampaignSettings(settings: InsertCampaignSettings): Promise<CampaignSettings> {
    const newSettings: CampaignSettings = {
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await this.writeFile("campaign_settings.txt", [newSettings]);
    return newSettings;
  }

  async updateCampaignSettings(settings: Partial<CampaignSettings>): Promise<CampaignSettings> {
    let currentSettings = await this.getCampaignSettings();
    
    // If no settings exist, create them first
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
        currentWhatsAppIndex: 0,
      });
    }
    
    const updated = { ...currentSettings, ...settings, updatedAt: new Date() };
    await this.writeFile("campaign_settings.txt", [updated]);
    return updated;
  }

  // Campaign Logs
  async getCampaignLogs(limit: number = 50): Promise<CampaignLog[]> {
    const logs = await this.readFile<CampaignLog>("campaign_logs.txt");
    return logs.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()).slice(0, limit);
  }

  async createCampaignLog(log: InsertCampaignLog): Promise<CampaignLog> {
    const logs = await this.getCampaignLogs();
    const newLog: CampaignLog = {
      ...log,
      id: this.currentIds.campaignLog++,
      whatsappConnectionId: log.whatsappConnectionId || null,
      contactId: log.contactId || null,
      messageVariationId: log.messageVariationId || null,
      errorMessage: log.errorMessage || null,
      sentAt: new Date(),
    };
    logs.unshift(newLog);
    await this.writeFile("campaign_logs.txt", logs.slice(0, 1000)); // Keep only last 1000 logs
    return newLog;
  }

  async clearCampaignLogs(): Promise<void> {
    await this.writeFile("campaign_logs.txt", []);
    this.currentIds.campaignLog = 1;
  }

  // Received Messages
  async getReceivedMessages(limit: number = 50): Promise<ReceivedMessage[]> {
    const messages = await this.readFile<ReceivedMessage>("received_messages.txt");
    return messages.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()).slice(0, limit);
  }

  async getReceivedMessagesByContact(contactId: number): Promise<ReceivedMessage[]> {
    const messages = await this.readFile<ReceivedMessage>("received_messages.txt");
    return messages.filter(msg => msg.contactId === contactId).sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
  }

  async createReceivedMessage(message: InsertReceivedMessage): Promise<ReceivedMessage> {
    const messages = await this.getReceivedMessages();
    const newMessage: ReceivedMessage = {
      ...message,
      id: this.currentIds.receivedMessage++,
      whatsappConnectionId: message.whatsappConnectionId || null,
      contactId: message.contactId || null,
      receivedAt: new Date(),
    };
    messages.unshift(newMessage);
    await this.writeFile("received_messages.txt", messages.slice(0, 1000)); // Keep only last 1000 messages
    return newMessage;
  }

  async clearReceivedMessages(): Promise<void> {
    await this.writeFile("received_messages.txt", []);
    this.currentIds.receivedMessage = 1;
  }
}