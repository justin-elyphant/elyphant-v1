// DEPRECATED: This file contains insecure base64 encoding
// Use src/utils/secureEncryption.ts for proper AES encryption
// This file is kept for backward compatibility only

import { encryptData as secureEncryptData, decryptData as secureDecryptData } from './secureEncryption';

console.warn('SECURITY WARNING: Using deprecated encryption utilities. Migrate to secureEncryption.ts');

export const encryptData = async (data: string): Promise<string> => {
  // Migrate to secure encryption
  return secureEncryptData(data);
};

export const decryptData = async (encryptedData: string): Promise<string> => {
  // Try new encryption first, fallback to old for backward compatibility
  try {
    return await secureDecryptData(encryptedData);
  } catch (error) {
    // Fallback to old base64 decoding for existing data
    console.warn('Falling back to insecure base64 decoding. Please re-encrypt this data.');
    try {
      return atob(encryptedData);
    } catch (fallbackError) {
      console.error('Both decryption methods failed:', error, fallbackError);
      throw new Error('Failed to decrypt data');
    }
  }
};

export const maskCardNumber = (cardNumber: string): string => {
  if (cardNumber.length < 4) return cardNumber;
  return '**** **** **** ' + cardNumber.slice(-4);
};

export const getCardType = (cardNumber: string): string => {
  const number = cardNumber.replace(/\s/g, '');
  
  if (number.startsWith('4')) return 'visa';
  if (number.startsWith('5') || number.startsWith('2')) return 'mastercard';
  if (number.startsWith('3')) return 'amex';
  if (number.startsWith('6')) return 'discover';
  
  return 'unknown';
};