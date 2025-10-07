// Secure encryption utilities using Web Crypto API
// Replaces the insecure base64 encoding with proper AES-GCM encryption

class SecureEncryption {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12; // 96 bits for GCM
  private static readonly SALT_LENGTH = 16;
  private static readonly ITERATIONS = 100000; // PBKDF2 iterations

  // Derive key from password using PBKDF2
  private static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const passwordBuffer = new TextEncoder().encode(password);
    const importedKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: this.ITERATIONS,
        hash: 'SHA-256'
      },
      importedKey,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Generate secure random bytes
  private static getRandomBytes(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  // SECURITY FIX: Get encryption key from environment or generate secure fallback
  private static getEncryptionKey(): string {
    // Try to get key from environment first
    if (typeof process !== 'undefined' && process.env?.ENCRYPTION_KEY) {
      return process.env.ENCRYPTION_KEY;
    }
    
    // For browser environments, check if it's set in localStorage (dev only)
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      const devKey = localStorage.getItem('dev-encryption-key');
      if (devKey) return devKey;
    }
    
    // Fallback: Generate a session-specific key and warn
    console.warn('SECURITY WARNING: Using fallback encryption key. Please set ENCRYPTION_KEY environment variable.');
    const fallbackKey = 'fallback-' + Math.random().toString(36).substring(2, 15);
    
    // Store in localStorage for development consistency
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      localStorage.setItem('dev-encryption-key', fallbackKey);
    }
    
    return fallbackKey;
  }

  // Encrypt data with AES-GCM
  static async encryptData(data: string, password?: string): Promise<string> {
    try {
      // SECURITY FIX: Get encryption key from environment instead of hardcoded value
      const encryptionPassword = password || this.getEncryptionKey();
      
      const dataBuffer = new TextEncoder().encode(data);
      const salt = this.getRandomBytes(this.SALT_LENGTH);
      const iv = this.getRandomBytes(this.IV_LENGTH);
      
      const key = await this.deriveKey(encryptionPassword, salt);
      
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: iv as BufferSource
        },
        key,
        dataBuffer
      );

      // Combine salt + iv + encrypted data
      const resultBuffer = new Uint8Array(
        this.SALT_LENGTH + this.IV_LENGTH + encryptedBuffer.byteLength
      );
      resultBuffer.set(salt, 0);
      resultBuffer.set(iv, this.SALT_LENGTH);
      resultBuffer.set(new Uint8Array(encryptedBuffer), this.SALT_LENGTH + this.IV_LENGTH);

      // Return base64 encoded result
      return btoa(String.fromCharCode(...resultBuffer));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt data with AES-GCM
  static async decryptData(encryptedData: string, password?: string): Promise<string> {
    try {
      // SECURITY FIX: Get encryption key from environment instead of hardcoded value
      const encryptionPassword = password || this.getEncryptionKey();
      
      // Decode from base64
      const encryptedBuffer = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );

      // Extract salt, iv, and encrypted data
      const salt = encryptedBuffer.slice(0, this.SALT_LENGTH);
      const iv = encryptedBuffer.slice(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
      const data = encryptedBuffer.slice(this.SALT_LENGTH + this.IV_LENGTH);

      const key = await this.deriveKey(encryptionPassword, salt);

      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: iv as BufferSource
        },
        key,
        data
      );

      return new TextDecoder().decode(decryptedBuffer);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Key rotation utility
  static async rotateEncryption(oldEncryptedData: string, oldPassword: string, newPassword: string): Promise<string> {
    const decryptedData = await this.decryptData(oldEncryptedData, oldPassword);
    return this.encryptData(decryptedData, newPassword);
  }
}

// Maintain backward compatibility with existing API
export const encryptData = async (data: string): Promise<string> => {
  return SecureEncryption.encryptData(data);
};

export const decryptData = async (encryptedData: string): Promise<string> => {
  return SecureEncryption.decryptData(encryptedData);
};

// Legacy function for card number masking (no encryption needed)
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

// Export the class for advanced usage
export { SecureEncryption };