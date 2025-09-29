import { AuthSecuritySettings } from './authTypes';

/**
 * AuthProtection - Protection wrapper for UnifiedAuthService
 * Follows the same pattern as other unified services
 */
export class AuthProtection {
  private settings: AuthSecuritySettings = {
    enableRateLimit: true,
    enableAuditLogging: true,
    enableSuspiciousActivityDetection: true,
    tokenCacheEnabled: true
  };

  /**
   * Update security settings
   */
  updateSettings(newSettings: Partial<AuthSecuritySettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Get current security settings
   */
  getSettings(): AuthSecuritySettings {
    return { ...this.settings };
  }

  /**
   * Check if feature is enabled
   */
  isEnabled(feature: keyof AuthSecuritySettings): boolean {
    return this.settings[feature];
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): { isValid: boolean; score: number; feedback: string[] } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score++; else feedback.push('At least 8 characters');
    if (/[a-z]/.test(password)) score++; else feedback.push('At least one lowercase letter');
    if (/[A-Z]/.test(password)) score++; else feedback.push('At least one uppercase letter');
    if (/\d/.test(password)) score++; else feedback.push('At least one number');
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++; else feedback.push('At least one special character');

    return {
      isValid: score >= 4,
      score,
      feedback
    };
  }

  /**
   * Sanitize email input
   */
  sanitizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generate secure session storage key
   */
  generateSecureKey(prefix: string, identifier: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `${prefix}_${identifier}_${timestamp}_${random}`;
  }

  /**
   * Validate session storage data
   */
  validateStorageData(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    
    // Check for required fields and expiration
    const requiredFields = ['timestamp', 'expires'];
    for (const field of requiredFields) {
      if (!(field in data)) return false;
    }

    // Check if not expired
    return Date.now() <= data.expires;
  }

  /**
   * Clean up sensitive data from storage
   */
  cleanupStorage(keys: string[]): void {
    keys.forEach(key => {
      try {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to cleanup storage key: ${key}`, error);
      }
    });
  }

  /**
   * Check for common attack patterns
   */
  detectAttackPatterns(input: string): { isSuspicious: boolean; patterns: string[] } {
    const patterns: string[] = [];
    const suspiciousPatterns = [
      { name: 'SQL Injection', regex: /(union|select|insert|update|delete|drop|exec)/i },
      { name: 'XSS', regex: /(<script|javascript:|onload=|onerror=)/i },
      { name: 'Path Traversal', regex: /(\.\.\/|\.\.\\)/i }
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.regex.test(input)) {
        patterns.push(pattern.name);
      }
    }

    return {
      isSuspicious: patterns.length > 0,
      patterns
    };
  }
}

export const authProtection = new AuthProtection();