import { storage } from "../storage";
import { whatsappService } from "./whatsappReal";
import type { Contact, MessageVariation } from "@shared/schema";

class SecondMessageService {
  private pendingSecondMessages = new Map<number, NodeJS.Timeout>(); // contactId -> timeout

  async scheduleSecondMessage(
    contactId: number, 
    whatsappConnectionId: number, 
    variationId: number
  ): Promise<void> {
    // Clear any existing scheduled second message for this contact
    this.clearScheduledSecondMessage(contactId);

    const variation = await storage.getMessageVariation(variationId);
    if (!variation || !variation.sendSecondMessage || !variation.secondMessage?.trim()) {
      return;
    }

    // Store the contact info for potential second message after response
    // Don't schedule automatically - only when contact responds
    console.log(`Contact ${contactId} marked for potential second message after response`);
  }

  private async sendSecondMessage(
    contactId: number,
    whatsappConnectionId: number, 
    variation: MessageVariation
  ): Promise<void> {
    const contact = await storage.getContact(contactId);
    if (!contact) {
      throw new Error(`Contact ${contactId} not found`);
    }

    // Check if second message was already sent
    if (contact.secondMessageSentAt) {
      console.log(`Second message already sent to contact ${contactId}`);
      return;
    }

    // For second message service, we SHOULD send when contact responded
    // Only skip if contact status is not "responded" or "sent"
    if (contact.status !== "responded" && contact.status !== "sent") {
      console.log(`Contact ${contactId} status is ${contact.status}, skipping second message`);
      return;
    }

    try {
      // Replace placeholders with contact data
      let personalizedSecondMessage = variation.secondMessage!
        .replace(/{nome}/g, contact.name)
        .replace(/{variavel1}/g, contact.variable1 || '')
        .replace(/{variavel2}/g, contact.variable2 || '');
      
      const phoneToSend = contact.phoneNumber.replace(/\D/g, '');
      
      await whatsappService.sendMessage(
        whatsappConnectionId,
        phoneToSend,
        personalizedSecondMessage,
        variation.secondImageUrl || undefined
      );

      // Update contact status and timestamp
      // Keep the responded status but mark second message as sent
      await storage.updateContact(contactId, {
        status: contact.status === "responded" ? "responded" : "second_sent",
        secondMessageSentAt: new Date()
      });

      // Log the second message
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

  async handleContactResponse(contactId: number): Promise<void> {
    // Cancel any pending second message for this contact
    this.clearScheduledSecondMessage(contactId);

    // Update contact status to responded
    await storage.updateContact(contactId, {
      status: "responded",
      respondedAt: new Date()
    });

    console.log(`Contact ${contactId} responded, scheduling second message`);

    // Now schedule and send the second message since contact responded
    await this.sendSecondMessageAfterResponse(contactId);
  }

  private async sendSecondMessageAfterResponse(contactId: number): Promise<void> {
    try {
      const contact = await storage.getContact(contactId);
      if (!contact) {
        console.error(`Contact ${contactId} not found for second message`);
        return;
      }

      // Check if second message was already sent
      if (contact.secondMessageSentAt) {
        console.log(`Second message already sent to contact ${contactId}`);
        return;
      }

      // Get the campaign logs to find which variation was used for first message
      const logs = await storage.getCampaignLogs();
      const firstMessageLog = logs.find(log => 
        log.contactId === contactId && 
        (log.status === "sent" || log.status === "delivered")
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

      // Get delay and schedule second message
      const delayMs = (variation.secondMessageDelay || 30) * 1000;
      
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

      console.log(`Second message scheduled for contact ${contactId} in ${delayMs/1000} seconds`);

    } catch (error) {
      console.error(`Error scheduling second message for contact ${contactId}:`, error);
    }
  }

  private clearScheduledSecondMessage(contactId: number): void {
    const timeout = this.pendingSecondMessages.get(contactId);
    if (timeout) {
      clearTimeout(timeout);
      this.pendingSecondMessages.delete(contactId);
    }
  }

  // Clear all pending second messages (useful when stopping campaign)
  clearAllScheduledMessages(): void {
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
}

export const secondMessageService = new SecondMessageService();