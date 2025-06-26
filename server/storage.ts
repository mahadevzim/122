import {
  whatsappConnections,
  messageVariations,
  contacts,
  campaignSettings,
  campaignLogs,
  receivedMessages,
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

export interface IStorage {
  // WhatsApp Connections
  getWhatsappConnections(): Promise<WhatsappConnection[]>;
  getWhatsappConnection(id: number): Promise<WhatsappConnection | undefined>;
  createWhatsappConnection(connection: InsertWhatsappConnection): Promise<WhatsappConnection>;
  updateWhatsappConnection(id: number, connection: Partial<WhatsappConnection>): Promise<WhatsappConnection>;
  deleteWhatsappConnection(id: number): Promise<void>;

  // Message Variations
  getMessageVariations(): Promise<MessageVariation[]>;
  getMessageVariation(id: number): Promise<MessageVariation | undefined>;
  createMessageVariation(variation: InsertMessageVariation): Promise<MessageVariation>;
  updateMessageVariation(id: number, variation: Partial<MessageVariation>): Promise<MessageVariation>;
  deleteMessageVariation(id: number): Promise<void>;

  // Contacts
  getContacts(): Promise<Contact[]>;
  getContact(id: number): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  createContacts(contacts: InsertContact[]): Promise<Contact[]>;
  updateContact(id: number, contact: Partial<Contact>): Promise<Contact>;
  deleteContact(id: number): Promise<void>;
  clearContacts(): Promise<void>;

  // Campaign Settings
  getCampaignSettings(): Promise<CampaignSettings | undefined>;
  createCampaignSettings(settings: InsertCampaignSettings): Promise<CampaignSettings>;
  updateCampaignSettings(settings: Partial<CampaignSettings>): Promise<CampaignSettings>;

  // Campaign Logs
  getCampaignLogs(limit?: number): Promise<CampaignLog[]>;
  createCampaignLog(log: InsertCampaignLog): Promise<CampaignLog>;
  clearCampaignLogs(): Promise<void>;

  // Received Messages
  getReceivedMessages(limit?: number): Promise<ReceivedMessage[]>;
  getReceivedMessagesByContact(contactId: number): Promise<ReceivedMessage[]>;
  createReceivedMessage(message: InsertReceivedMessage): Promise<ReceivedMessage>;
  clearReceivedMessages(): Promise<void>;
}

export class MemStorage implements IStorage {
  private whatsappConnectionsMap = new Map<number, WhatsappConnection>();
  private messageVariationsMap = new Map<number, MessageVariation>();
  private contactsMap = new Map<number, Contact>();
  private campaignSettingsData: CampaignSettings | undefined;
  private campaignLogsMap = new Map<number, CampaignLog>();
  private receivedMessagesMap = new Map<number, ReceivedMessage>();
  
  private currentWhatsappId = 1;
  private currentMessageVariationId = 1;
  private currentContactId = 1;
  private currentCampaignSettingsId = 1;
  private currentCampaignLogId = 1;
  private currentReceivedMessageId = 1;

  constructor() {
    // Initialize default campaign settings
    this.campaignSettingsData = {
      id: 1,
      minInterval: 30,
      maxInterval: 120,
      rotationType: "sequential",
      randomizeMessages: true,
      skipErrors: false,
      logMessages: true,
      isRunning: false,
      currentContactIndex: 0,
      currentWhatsAppIndex: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Initialize default message variations
    for (let i = 1; i <= 3; i++) {
      const variation: MessageVariation = {
        id: i,
        variationNumber: i,
        text: "",
        imageUrl: null,
        enabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.messageVariationsMap.set(i, variation);
      this.currentMessageVariationId = i + 1;
    }
  }

  // WhatsApp Connections
  async getWhatsappConnections(): Promise<WhatsappConnection[]> {
    return Array.from(this.whatsappConnectionsMap.values());
  }

  async getWhatsappConnection(id: number): Promise<WhatsappConnection | undefined> {
    return this.whatsappConnectionsMap.get(id);
  }

  async createWhatsappConnection(connection: InsertWhatsappConnection): Promise<WhatsappConnection> {
    const id = this.currentWhatsappId++;
    const newConnection: WhatsappConnection = {
      ...connection,
      id,
      phoneNumber: connection.phoneNumber || null,
      status: connection.status || "disconnected",
      qrCode: connection.qrCode || null,
      sessionData: connection.sessionData || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.whatsappConnectionsMap.set(id, newConnection);
    return newConnection;
  }

  async updateWhatsappConnection(id: number, connection: Partial<WhatsappConnection>): Promise<WhatsappConnection> {
    const existing = this.whatsappConnectionsMap.get(id);
    if (!existing) {
      throw new Error(`WhatsApp connection with id ${id} not found`);
    }
    const updated = { ...existing, ...connection, updatedAt: new Date() };
    this.whatsappConnectionsMap.set(id, updated);
    return updated;
  }

  async deleteWhatsappConnection(id: number): Promise<void> {
    this.whatsappConnectionsMap.delete(id);
  }

  // Message Variations
  async getMessageVariations(): Promise<MessageVariation[]> {
    return Array.from(this.messageVariationsMap.values());
  }

  async getMessageVariation(id: number): Promise<MessageVariation | undefined> {
    return this.messageVariationsMap.get(id);
  }

  async createMessageVariation(variation: InsertMessageVariation): Promise<MessageVariation> {
    const id = this.currentMessageVariationId++;
    const newVariation: MessageVariation = {
      ...variation,
      id,
      imageUrl: variation.imageUrl || null,
      enabled: variation.enabled ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.messageVariationsMap.set(id, newVariation);
    return newVariation;
  }

  async updateMessageVariation(id: number, variation: Partial<MessageVariation>): Promise<MessageVariation> {
    const existing = this.messageVariationsMap.get(id);
    if (!existing) {
      throw new Error(`Message variation with id ${id} not found`);
    }
    const updated = { ...existing, ...variation, updatedAt: new Date() };
    this.messageVariationsMap.set(id, updated);
    return updated;
  }

  async deleteMessageVariation(id: number): Promise<void> {
    this.messageVariationsMap.delete(id);
  }

  // Contacts
  async getContacts(): Promise<Contact[]> {
    return Array.from(this.contactsMap.values());
  }

  async getContact(id: number): Promise<Contact | undefined> {
    return this.contactsMap.get(id);
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const id = this.currentContactId++;
    const newContact: Contact = {
      ...contact,
      id,
      variable1: contact.variable1 || null,
      variable2: contact.variable2 || null,
      status: contact.status || "pending",
      errorMessage: contact.errorMessage || null,
      sentAt: contact.sentAt || null,
      createdAt: new Date(),
    };
    this.contactsMap.set(id, newContact);
    return newContact;
  }

  async createContacts(contacts: InsertContact[]): Promise<Contact[]> {
    const newContacts: Contact[] = [];
    for (const contact of contacts) {
      const newContact = await this.createContact(contact);
      newContacts.push(newContact);
    }
    return newContacts;
  }

  async updateContact(id: number, contact: Partial<Contact>): Promise<Contact> {
    const existing = this.contactsMap.get(id);
    if (!existing) {
      throw new Error(`Contact with id ${id} not found`);
    }
    const updated = { ...existing, ...contact };
    this.contactsMap.set(id, updated);
    return updated;
  }

  async deleteContact(id: number): Promise<void> {
    this.contactsMap.delete(id);
  }

  async clearContacts(): Promise<void> {
    this.contactsMap.clear();
    this.currentContactId = 1;
  }

  // Campaign Settings
  async getCampaignSettings(): Promise<CampaignSettings | undefined> {
    return this.campaignSettingsData;
  }

  async createCampaignSettings(settings: InsertCampaignSettings): Promise<CampaignSettings> {
    const newSettings: CampaignSettings = {
      ...settings,
      id: this.currentCampaignSettingsId++,
      minInterval: settings.minInterval ?? 30,
      maxInterval: settings.maxInterval ?? 120,
      rotationType: settings.rotationType ?? "sequential",
      randomizeMessages: settings.randomizeMessages ?? true,
      skipErrors: settings.skipErrors ?? false,
      logMessages: settings.logMessages ?? true,
      isRunning: settings.isRunning ?? false,
      currentContactIndex: settings.currentContactIndex ?? 0,
      currentWhatsAppIndex: settings.currentWhatsAppIndex ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.campaignSettingsData = newSettings;
    return newSettings;
  }

  async updateCampaignSettings(settings: Partial<CampaignSettings>): Promise<CampaignSettings> {
    if (!this.campaignSettingsData) {
      throw new Error("Campaign settings not found");
    }
    this.campaignSettingsData = {
      ...this.campaignSettingsData,
      ...settings,
      updatedAt: new Date(),
    };
    return this.campaignSettingsData;
  }

  // Campaign Logs
  async getCampaignLogs(limit: number = 50): Promise<CampaignLog[]> {
    const logs = Array.from(this.campaignLogsMap.values());
    return logs.sort((a, b) => {
      const dateA = a.sentAt ? new Date(a.sentAt).getTime() : 0;
      const dateB = b.sentAt ? new Date(b.sentAt).getTime() : 0;
      return dateB - dateA;
    }).slice(0, limit);
  }

  async createCampaignLog(log: InsertCampaignLog): Promise<CampaignLog> {
    const id = this.currentCampaignLogId++;
    const newLog: CampaignLog = {
      ...log,
      id,
      errorMessage: log.errorMessage || null,
      whatsappConnectionId: log.whatsappConnectionId || null,
      contactId: log.contactId || null,
      messageVariationId: log.messageVariationId || null,
      sentAt: new Date(),
    };
    this.campaignLogsMap.set(id, newLog);
    return newLog;
  }

  async clearCampaignLogs(): Promise<void> {
    this.campaignLogsMap.clear();
    this.currentCampaignLogId = 1;
  }

  // Received Messages
  async getReceivedMessages(limit: number = 50): Promise<ReceivedMessage[]> {
    const messages = Array.from(this.receivedMessagesMap.values());
    return messages.sort((a, b) => {
      const dateA = a.receivedAt ? new Date(a.receivedAt).getTime() : 0;
      const dateB = b.receivedAt ? new Date(b.receivedAt).getTime() : 0;
      return dateB - dateA;
    }).slice(0, limit);
  }

  async getReceivedMessagesByContact(contactId: number): Promise<ReceivedMessage[]> {
    const messages = Array.from(this.receivedMessagesMap.values());
    return messages.filter(msg => msg.contactId === contactId).sort((a, b) => {
      const dateA = a.receivedAt ? new Date(a.receivedAt).getTime() : 0;
      const dateB = b.receivedAt ? new Date(b.receivedAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  async createReceivedMessage(message: InsertReceivedMessage): Promise<ReceivedMessage> {
    const id = this.currentReceivedMessageId++;
    const newMessage: ReceivedMessage = {
      ...message,
      id,
      whatsappConnectionId: message.whatsappConnectionId || null,
      contactId: message.contactId || null,
      receivedAt: new Date(),
    };
    this.receivedMessagesMap.set(id, newMessage);
    return newMessage;
  }

  async clearReceivedMessages(): Promise<void> {
    this.receivedMessagesMap.clear();
    this.currentReceivedMessageId = 1;
  }
}

import { FileStorage } from "./fileStorage";

export const storage = new FileStorage();
