// Simple encryption utilities for sensitive data
// Note: In production, you should use a more robust encryption solution

const ENCRYPTION_KEY = "elyphant-business-card-encryption-key-2024";

export const encryptData = (data: string): string => {
  try {
    // In a real implementation, use proper encryption like AES
    // For now, using base64 encoding as placeholder
    return btoa(data);
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
};

export const decryptData = (encryptedData: string): string => {
  try {
    // In a real implementation, use proper decryption
    // For now, using base64 decoding as placeholder
    return atob(encryptedData);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
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