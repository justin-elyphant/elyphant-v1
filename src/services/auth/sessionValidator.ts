import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

/**
 * Session Validation Service
 * Provides utilities for validating session integrity and detecting account switching
 */

export interface SessionValidationResult {
  isValid: boolean;
  reason?: string;
  action?: 'force_signout' | 'clear_storage' | 'none';
}

export class SessionValidator {
  /**
   * Validate that session user matches stored user ID
   */
  static async validateSessionUser(session: Session | null): Promise<SessionValidationResult> {
    if (!session?.user) {
      return { isValid: true, action: 'none' };
    }

    const storedUserId = localStorage.getItem('userId');
    const sessionUserId = session.user.id;

    // No stored user ID - first time login, this is fine
    if (!storedUserId) {
      return { isValid: true, action: 'none' };
    }

    // User ID mismatch - critical security issue
    if (storedUserId !== sessionUserId) {
      console.error('Session validation failed: User ID mismatch', {
        stored: storedUserId,
        session: sessionUserId,
        email: session.user.email
      });

      // Log security event
      await this.logSecurityEvent(sessionUserId, 'session_validation_failed', {
        stored_user_id: storedUserId,
        session_user_id: sessionUserId,
        mismatch_type: 'user_id',
        detection_method: 'session_validator'
      });

      return {
        isValid: false,
        reason: 'User ID mismatch between session and localStorage',
        action: 'force_signout'
      };
    }

    return { isValid: true, action: 'none' };
  }

  /**
   * Validate that all critical localStorage keys are in sync with session
   */
  static validateStorageSync(session: Session | null): SessionValidationResult {
    if (!session?.user) {
      return { isValid: true, action: 'none' };
    }

    const storedUserId = localStorage.getItem('userId');
    const storedEmail = localStorage.getItem('userEmail');
    
    const sessionUserId = session.user.id;
    const sessionEmail = session.user.email;

    // Check user ID sync
    if (storedUserId && storedUserId !== sessionUserId) {
      return {
        isValid: false,
        reason: 'User ID out of sync',
        action: 'clear_storage'
      };
    }

    // Check email sync (if email exists in session)
    if (sessionEmail && storedEmail && storedEmail !== sessionEmail) {
      console.warn('Email mismatch in storage', {
        stored: storedEmail,
        session: sessionEmail
      });
      
      return {
        isValid: false,
        reason: 'Email out of sync',
        action: 'clear_storage'
      };
    }

    return { isValid: true, action: 'none' };
  }

  /**
   * Comprehensive session validation
   */
  static async validateSession(session: Session | null): Promise<SessionValidationResult> {
    // Validate user ID match
    const userValidation = await this.validateSessionUser(session);
    if (!userValidation.isValid) {
      return userValidation;
    }

    // Validate storage sync
    const storageValidation = this.validateStorageSync(session);
    if (!storageValidation.isValid) {
      return storageValidation;
    }

    return { isValid: true, action: 'none' };
  }

  /**
   * Log security events to the database
   */
  private static async logSecurityEvent(
    userId: string,
    eventType: string,
    details: Record<string, any>
  ): Promise<void> {
    try {
      await supabase.from('security_logs').insert({
        user_id: userId,
        event_type: eventType,
        details: {
          ...details,
          timestamp: new Date().toISOString(),
          url: window.location.href
        },
        user_agent: navigator.userAgent,
        risk_level: 'high'
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Force sign out and clear all data
   */
  static async forceSignOut(reason: string): Promise<void> {
    console.warn('Forcing sign out:', reason);

    try {
      // Log the forced sign out
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await this.logSecurityEvent(session.user.id, 'forced_signout', {
          reason,
          timestamp: new Date().toISOString()
        });
      }

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Clear all storage
      const theme = localStorage.getItem('theme');
      const language = localStorage.getItem('language');
      
      localStorage.clear();
      sessionStorage.clear();
      
      // Restore preferences
      if (theme) localStorage.setItem('theme', theme);
      if (language) localStorage.setItem('language', language);

      // Reload page
      window.location.reload();
    } catch (error) {
      console.error('Error during forced sign out:', error);
      // Force reload anyway
      window.location.reload();
    }
  }

  /**
   * Clear storage and sync with current session
   */
  static clearAndSyncStorage(session: Session | null): void {
    if (!session?.user) {
      localStorage.clear();
      return;
    }

    // Preserve theme/language
    const theme = localStorage.getItem('theme');
    const language = localStorage.getItem('language');

    // Clear all
    localStorage.clear();

    // Restore preferences
    if (theme) localStorage.setItem('theme', theme);
    if (language) localStorage.setItem('language', language);

    // Sync with session
    localStorage.setItem('userId', session.user.id);
    if (session.user.email) {
      localStorage.setItem('userEmail', session.user.email);
    }
    if (session.user.user_metadata?.name) {
      localStorage.setItem('userName', session.user.user_metadata.name);
    }
  }
}
