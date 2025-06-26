import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length === 11) {
    return `+55 ${digits.slice(2, 4)} ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  
  if (digits.length === 13 && digits.startsWith('55')) {
    return `+55 ${digits.slice(2, 4)} ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  
  return phone;
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
}

export function getConnectionStatusColor(status: string): string {
  switch (status) {
    case 'connected':
      return 'text-green-600 bg-green-100';
    case 'connecting':
      return 'text-yellow-600 bg-yellow-100';
    case 'error':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

export function getConnectionStatusIcon(status: string): string {
  switch (status) {
    case 'connected':
      return 'fas fa-check';
    case 'connecting':
      return 'fas fa-spinner fa-spin';
    case 'error':
      return 'fas fa-exclamation-triangle';
    default:
      return 'fas fa-minus';
  }
}
