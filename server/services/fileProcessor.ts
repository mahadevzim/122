import type { InsertContact } from "@shared/schema";

export class FileProcessorService {
  static processContactList(fileContent: string): { 
    contacts: InsertContact[], 
    stats: { loaded: number, formatted: number, errors: number } 
  } {
    const lines = fileContent.split('\n').filter(line => line.trim());
    const contacts: InsertContact[] = [];
    const errors: string[] = [];

    for (const line of lines) {
      try {
        const parts = line.split(',').map(s => s.trim());
        
        if (parts.length < 2) {
          errors.push(`Invalid line format: ${line}`);
          continue;
        }

        const [phone, variable1, variable2] = parts;
        const name = variable1 || phone; // Use variable1 as name, fallback to phone

        const formattedNumber = this.formatBrazilianPhoneNumber(phone);
        if (!formattedNumber) {
          errors.push(`Invalid phone number: ${phone}`);
          continue;
        }

        contacts.push({
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
      contacts,
      stats: {
        loaded: lines.length,
        formatted: contacts.length,
        errors: errors.length
      }
    };
  }

  private static formatBrazilianPhoneNumber(phone: string): string | null {
    try {
      // Remove all non-digit characters
      const digits = phone.replace(/\D/g, '');
      
      // Basic validation - just check if it has reasonable length
      if (digits.length < 10 || digits.length > 13) {
        return null;
      }

      // Return the number exactly as provided, just cleaned of non-digits
      // Don't add country code or modify the format
      return digits;
    } catch {
      return null;
    }
  }

  static validatePhoneNumber(number: string): boolean {
    const digits = number.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 13;
  }
}
