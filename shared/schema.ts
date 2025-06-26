import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const whatsappConnections = pgTable("whatsapp_connections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phoneNumber: text("phone_number"),
  status: text("status").notNull().default("disconnected"), // disconnected, connecting, connected, error
  qrCode: text("qr_code"),
  sessionData: jsonb("session_data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messageVariations = pgTable("message_variations", {
  id: serial("id").primaryKey(),
  variationNumber: integer("variation_number").notNull(), // 1, 2, or 3
  text: text("text").notNull(),
  imageUrl: text("image_url"),
  secondMessage: text("second_message"), // Optional second message
  secondImageUrl: text("second_image_url"), // Optional second message image
  sendSecondMessage: boolean("send_second_message").default(false), // Enable second message
  secondMessageDelay: integer("second_message_delay").default(30), // Delay in seconds before sending second message
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  formattedNumber: text("formatted_number").notNull(),
  variable1: text("variable1"),
  variable2: text("variable2"),
  status: text("status").default("pending"), // pending, sent, error, responded, second_sent
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  respondedAt: timestamp("responded_at"), // When they responded to first message
  secondMessageSentAt: timestamp("second_message_sent_at"), // When second message was sent
  createdAt: timestamp("created_at").defaultNow(),
});

export const campaignSettings = pgTable("campaign_settings", {
  id: serial("id").primaryKey(),
  minInterval: integer("min_interval").default(30),
  maxInterval: integer("max_interval").default(120),
  rotationType: text("rotation_type").default("sequential"), // sequential, random
  randomizeMessages: boolean("randomize_messages").default(true),
  skipErrors: boolean("skip_errors").default(false),
  logMessages: boolean("log_messages").default(true),
  isRunning: boolean("is_running").default(false),
  currentContactIndex: integer("current_contact_index").default(0),
  currentWhatsAppIndex: integer("current_whatsapp_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const campaignLogs = pgTable("campaign_logs", {
  id: serial("id").primaryKey(),
  whatsappConnectionId: integer("whatsapp_connection_id").references(() => whatsappConnections.id),
  contactId: integer("contact_id").references(() => contacts.id),
  messageVariationId: integer("message_variation_id").references(() => messageVariations.id),
  status: text("status").notNull(), // sent, error
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at").defaultNow(),
});

export const receivedMessages = pgTable("received_messages", {
  id: serial("id").primaryKey(),
  whatsappConnectionId: integer("whatsapp_connection_id").references(() => whatsappConnections.id),
  contactId: integer("contact_id").references(() => contacts.id),
  phoneNumber: text("phone_number").notNull(),
  messageBody: text("message_body").notNull(),
  receivedAt: timestamp("received_at").defaultNow(),
});

// Insert schemas
export const insertWhatsappConnectionSchema = createInsertSchema(whatsappConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageVariationSchema = createInsertSchema(messageVariations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
});

export const insertCampaignSettingsSchema = createInsertSchema(campaignSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignLogSchema = createInsertSchema(campaignLogs).omit({
  id: true,
  sentAt: true,
});

export const insertReceivedMessageSchema = createInsertSchema(receivedMessages).omit({
  id: true,
  receivedAt: true,
});

// Types
export type WhatsappConnection = typeof whatsappConnections.$inferSelect;
export type InsertWhatsappConnection = z.infer<typeof insertWhatsappConnectionSchema>;
export type MessageVariation = typeof messageVariations.$inferSelect;
export type InsertMessageVariation = z.infer<typeof insertMessageVariationSchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type CampaignSettings = typeof campaignSettings.$inferSelect;
export type InsertCampaignSettings = z.infer<typeof insertCampaignSettingsSchema>;
export type CampaignLog = typeof campaignLogs.$inferSelect;
export type InsertCampaignLog = z.infer<typeof insertCampaignLogSchema>;
export type ReceivedMessage = typeof receivedMessages.$inferSelect;
export type InsertReceivedMessage = z.infer<typeof insertReceivedMessageSchema>;
