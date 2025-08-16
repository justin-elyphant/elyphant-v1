/**
 * Auto-Gift Permission Service
 * Handles permission checking for auto-gifting between users
 */

import { Connection } from '@/types/connections';
import { protectedAutoGiftingService } from './protected-auto-gifting-service';
import { supabase } from '@/integrations/supabase/client';

export type AutoGiftPermissionStatus = 'ready' | 'setup_needed' | 'blocked';

export interface AutoGiftPermissionResult {
  status: AutoGiftPermissionStatus;
  canAutoGift: boolean;
  missingData: Array<'shipping' | 'birthday' | 'email'>;
  blockedData: Array<'shipping' | 'birthday' | 'email'>;
  hasActiveRules: boolean;
  withinRateLimits: boolean;
  reasonCode: string;
  userFriendlyMessage: string;
}

class AutoGiftPermissionService {
  /**
   * Check comprehensive auto-gift permission status for a connection
   */
  async checkAutoGiftPermission(
    userId: string,
    connection: Connection
  ): Promise<AutoGiftPermissionResult> {
    try {
      // Step 1: Check data verification status
      const missingData = this.checkMissingData(connection);
      const blockedData = this.checkBlockedData(connection);
      
      // Step 2: Check if user has auto-gifting rules for this connection
      const hasActiveRules = await this.checkActiveAutoGiftRules(userId, connection.id);
      
      // Step 3: Check rate limits and protective measures
      const withinRateLimits = await this.checkRateLimits(userId);
      
      // Step 4: Check emergency circuit breaker
      const circuitBreakerOk = await protectedAutoGiftingService.checkEmergencyCircuitBreaker();
      
      // Determine overall status
      const status = this.determineStatus({
        missingData,
        blockedData,
        hasActiveRules,
        withinRateLimits,
        circuitBreakerOk
      });
      
      return {
        status,
        canAutoGift: status === 'ready',
        missingData,
        blockedData,
        hasActiveRules,
        withinRateLimits: withinRateLimits && circuitBreakerOk,
        reasonCode: this.getReasonCode(status, { missingData, blockedData, hasActiveRules }),
        userFriendlyMessage: this.getUserFriendlyMessage(status, connection.name, {
          missingData,
          blockedData,
          hasActiveRules
        })
      };
      
    } catch (error) {
      console.error('Error checking auto-gift permission:', error);
      return {
        status: 'blocked',
        canAutoGift: false,
        missingData: [],
        blockedData: [],
        hasActiveRules: false,
        withinRateLimits: false,
        reasonCode: 'service_error',
        userFriendlyMessage: 'Auto-gifting temporarily unavailable'
      };
    }
  }

  /**
   * Check what data is missing for auto-gifting
   */
  private checkMissingData(connection: Connection): Array<'shipping' | 'birthday' | 'email'> {
    const missing: Array<'shipping' | 'birthday' | 'email'> = [];
    
    if (connection.dataStatus.shipping === 'missing') {
      missing.push('shipping');
    }
    if (connection.dataStatus.birthday === 'missing') {
      missing.push('birthday');
    }
    if (connection.dataStatus.email === 'missing') {
      missing.push('email');
    }
    
    return missing;
  }

  /**
   * Check what data is blocked by the connection
   */
  private checkBlockedData(connection: Connection): Array<'shipping' | 'birthday' | 'email'> {
    const blocked: Array<'shipping' | 'birthday' | 'email'> = [];
    
    if (connection.dataStatus.shipping === 'blocked') {
      blocked.push('shipping');
    }
    if (connection.dataStatus.birthday === 'blocked') {
      blocked.push('birthday');
    }
    if (connection.dataStatus.email === 'blocked') {
      blocked.push('email');
    }
    
    return blocked;
  }

  /**
   * Check if user has active auto-gifting rules for this connection
   */
  private async checkActiveAutoGiftRules(userId: string, connectionId: string): Promise<boolean> {
    try {
      const { data: rules, error } = await supabase
        .from('auto_gifting_rules')
        .select('id')
        .eq('user_id', userId)
        .eq('recipient_id', connectionId)
        .eq('is_active', true)
        .limit(1);

      if (error) throw error;
      return (rules?.length || 0) > 0;
    } catch (error) {
      console.error('Error checking auto-gift rules:', error);
      return false;
    }
  }

  /**
   * Check user's rate limits with protective service
   */
  private async checkRateLimits(userId: string): Promise<boolean> {
    try {
      const rateLimitStatus = protectedAutoGiftingService.getUserRateLimitStatus(userId);
      return rateLimitStatus.executionsRemaining > 0;
    } catch (error) {
      console.error('Error checking rate limits:', error);
      return false;
    }
  }

  /**
   * Determine overall permission status
   */
  private determineStatus({
    missingData,
    blockedData,
    hasActiveRules,
    withinRateLimits,
    circuitBreakerOk
  }: {
    missingData: string[];
    blockedData: string[];
    hasActiveRules: boolean;
    withinRateLimits: boolean;
    circuitBreakerOk: boolean;
  }): AutoGiftPermissionStatus {
    // Blocked if any data is blocked or circuit breaker active
    if (blockedData.length > 0 || !circuitBreakerOk) {
      return 'blocked';
    }

    // Setup needed if missing critical data or no rules set up
    if (missingData.includes('shipping') || missingData.includes('birthday') || !hasActiveRules) {
      return 'setup_needed';
    }

    // Ready if all conditions met
    if (hasActiveRules && withinRateLimits && circuitBreakerOk) {
      return 'ready';
    }

    return 'setup_needed';
  }

  /**
   * Get machine-readable reason code
   */
  private getReasonCode(
    status: AutoGiftPermissionStatus,
    details: { missingData: string[]; blockedData: string[]; hasActiveRules: boolean }
  ): string {
    if (status === 'blocked') {
      if (details.blockedData.length > 0) {
        return 'data_blocked';
      }
      return 'system_blocked';
    }

    if (status === 'setup_needed') {
      if (!details.hasActiveRules) {
        return 'no_rules_configured';
      }
      if (details.missingData.length > 0) {
        return 'missing_required_data';
      }
      return 'configuration_incomplete';
    }

    return 'auto_gift_ready';
  }

  /**
   * Get user-friendly status message
   */
  private getUserFriendlyMessage(
    status: AutoGiftPermissionStatus,
    connectionName: string,
    details: { missingData: string[]; blockedData: string[]; hasActiveRules: boolean }
  ): string {
    switch (status) {
      case 'ready':
        return `Auto-gifting is set up for ${connectionName}`;
        
      case 'setup_needed':
        if (!details.hasActiveRules) {
          return `Set up auto-gifting for ${connectionName}`;
        }
        if (details.missingData.length > 0) {
          const missing = details.missingData.join(' and ');
          return `Request ${missing} from ${connectionName}`;
        }
        return `Complete auto-gift setup for ${connectionName}`;
        
      case 'blocked':
        if (details.blockedData.length > 0) {
          return `${connectionName} has restricted data sharing`;
        }
        return 'Auto-gifting temporarily unavailable';
        
      default:
        return 'Auto-gift status unknown';
    }
  }
}

export const autoGiftPermissionService = new AutoGiftPermissionService();