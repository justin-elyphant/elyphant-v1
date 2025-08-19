/**
 * Simplified Auto-Gift Permission Service
 * Handles permission checking for auto-gifting between users
 */

import { Connection } from '@/types/connections';
import { protectedAutoGiftingService } from './protected-auto-gifting-service';
import { supabase } from '@/integrations/supabase/client';
import { unifiedProfileService } from './profiles/UnifiedProfileService';

export type AutoGiftPermissionStatus = 'ready' | 'setup_needed' | 'disabled';

export interface AutoGiftPermissionResult {
  status: AutoGiftPermissionStatus;
  canAutoGift: boolean;
  isAutoGiftEnabled: boolean;
  hasCompleteProfile: boolean;
  reasonCode: string;
  userFriendlyMessage: string;
}

class AutoGiftPermissionService {
  /**
   * Check simplified auto-gift permission status for a connection
   */
  async checkAutoGiftPermission(
    userId: string,
    connection: Connection
  ): Promise<AutoGiftPermissionResult> {
    try {
      // Step 1: Check if auto-gifting is enabled for this connection
      const isAutoGiftEnabled = await this.checkAutoGiftEnabled(userId, connection.id);
      
      // Step 2: Check if user profile is complete
      const hasCompleteProfile = await this.checkProfileCompleteness(userId);
      
      // Step 3: Check rate limits and protective measures
      const withinRateLimits = await this.checkRateLimits(userId);
      
      // Step 4: Check emergency circuit breaker
      const circuitBreakerOk = await protectedAutoGiftingService.checkEmergencyCircuitBreaker();
      
      // Determine overall status
      const status = this.determineSimplifiedStatus({
        isAutoGiftEnabled,
        hasCompleteProfile,
        withinRateLimits,
        circuitBreakerOk
      });
      
      return {
        status,
        canAutoGift: status === 'ready',
        isAutoGiftEnabled,
        hasCompleteProfile,
        reasonCode: this.getSimplifiedReasonCode(status, { isAutoGiftEnabled, hasCompleteProfile }),
        userFriendlyMessage: this.getSimplifiedUserFriendlyMessage(status, connection.name, {
          isAutoGiftEnabled,
          hasCompleteProfile
        })
      };
      
    } catch (error) {
      console.error('Error checking auto-gift permission:', error);
      return {
        status: 'disabled',
        canAutoGift: false,
        isAutoGiftEnabled: false,
        hasCompleteProfile: false,
        reasonCode: 'service_error',
        userFriendlyMessage: 'Auto-gifting temporarily unavailable'
      };
    }
  }

  /**
   * Check if auto-gifting is enabled for this connection via direct database query
   */
  private async checkAutoGiftEnabled(userId: string, connectionId: string): Promise<boolean> {
    try {
      console.log('🔍 Checking auto-gift enabled status for:', { userId, connectionId });
      
      // Query BOTH directions of the connection and find the one where the USER is granting permissions TO the connection
      const { data, error } = await supabase
        .from('user_connections')
        .select('data_access_permissions, user_id, connected_user_id')
        .or(`and(user_id.eq.${userId},connected_user_id.eq.${connectionId}),and(user_id.eq.${connectionId},connected_user_id.eq.${userId})`)
        .eq('status', 'accepted');

      console.log('📊 Bidirectional connection query result:', { data, error });

      if (error) {
        console.error('❌ Error querying user_connections:', error);
        return false;
      }

      if (!data || data.length === 0) {
        console.log('❌ No connection data found');
        return false;
      }

      // Find the record where the current user is the one GRANTING permissions (user_id = userId)
      // This is the record that contains the permissions the current user has granted to their connection
      const userGrantingRecord = data.find(record => record.user_id === userId);
      
      console.log('👤 User granting permissions record:', userGrantingRecord);

      if (!userGrantingRecord || !userGrantingRecord.data_access_permissions) {
        console.log('❌ No user granting record or permissions found');
        return false;
      }

      const permissions = userGrantingRecord.data_access_permissions as any;
      console.log('🔐 Current permissions granted by user:', permissions);
      
      // Check if at least one required permission is enabled
      const hasAnyPermission = permissions.shipping_address || permissions.dob || permissions.email;
      console.log('✅ User has granted auto-gift permissions:', hasAnyPermission);
      
      return hasAnyPermission;
    } catch (error) {
      console.error('💥 Exception checking auto-gift enabled status:', error);
      return false;
    }
  }

  /**
   * Check if user profile has required data for auto-gifting
   */
  private async checkProfileCompleteness(userId: string): Promise<boolean> {
    try {
      const profile = await unifiedProfileService.getProfileById(userId);
      if (!profile) return false;

      const hasShipping = !!(profile.shipping_address && 
        (profile.shipping_address as any).address_line1);
      const hasBirthday = !!(profile.dob);
      const hasEmail = !!(profile.email);

      return hasShipping && hasBirthday && hasEmail;
    } catch (error) {
      console.error('Error checking profile completeness:', error);
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
   * Determine simplified permission status
   */
  private determineSimplifiedStatus({
    isAutoGiftEnabled,
    hasCompleteProfile,
    withinRateLimits,
    circuitBreakerOk
  }: {
    isAutoGiftEnabled: boolean;
    hasCompleteProfile: boolean;
    withinRateLimits: boolean;
    circuitBreakerOk: boolean;
  }): AutoGiftPermissionStatus {
    // If auto-gifting is disabled, return disabled
    if (!isAutoGiftEnabled) {
      return 'disabled';
    }

    // If profile is incomplete, need setup
    if (!hasCompleteProfile) {
      return 'setup_needed';
    }

    // If within limits and circuit breaker ok, ready
    if (withinRateLimits && circuitBreakerOk) {
      return 'ready';
    }

    return 'setup_needed';
  }

  /**
   * Get simplified machine-readable reason code
   */
  private getSimplifiedReasonCode(
    status: AutoGiftPermissionStatus,
    details: { isAutoGiftEnabled: boolean; hasCompleteProfile: boolean }
  ): string {
    if (status === 'disabled') {
      return 'auto_gift_disabled';
    }

    if (status === 'setup_needed') {
      if (!details.hasCompleteProfile) {
        return 'incomplete_profile';
      }
      return 'configuration_incomplete';
    }

    return 'auto_gift_ready';
  }

  /**
   * Get simplified user-friendly status message
   */
  private getSimplifiedUserFriendlyMessage(
    status: AutoGiftPermissionStatus,
    connectionName: string,
    details: { isAutoGiftEnabled: boolean; hasCompleteProfile: boolean }
  ): string {
    switch (status) {
      case 'ready':
        return `Auto-gifting enabled for ${connectionName}`;
        
      case 'setup_needed':
        if (!details.hasCompleteProfile) {
          return `Complete your profile to enable auto-gifting`;
        }
        return `Auto-gifting setup needed`;
        
      case 'disabled':
        return `Auto-gifting disabled for ${connectionName}`;
        
      default:
        return 'Auto-gift status unknown';
    }
  }

  /**
   * Toggle auto-gifting permission for a connection (bidirectional)
   */
  async toggleAutoGiftPermission(userId: string, connectionId: string, enabled: boolean): Promise<{ success: boolean; error?: string }> {
    console.log('🔧 toggleAutoGiftPermission called:', { userId, connectionId, enabled });
    
    try {
      const permissions = {
        shipping_address: enabled,
        dob: enabled,
        email: enabled
      };

      console.log('📋 Setting permissions to:', permissions);
      
      // CRITICAL FIX: Only update the record where the CURRENT USER is granting permissions
      // This means user_id = userId (current user) and connected_user_id = connectionId (the connection)
      console.log('🎯 Updating specific user connection record where user_id =', userId, 'and connected_user_id =', connectionId);

      const { data, error } = await supabase
        .from('user_connections')
        .update({ 
          data_access_permissions: permissions,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)           // Current user is the one granting permissions
        .eq('connected_user_id', connectionId)  // To this specific connection
        .eq('status', 'accepted');

      console.log('📊 Database update result:', { data, error });

      if (error) {
        console.error('❌ Error toggling auto-gift permission:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Auto-gift permission toggle successful - updated specific record only');
      return { success: true };
    } catch (error: any) {
      console.error('💥 Exception in toggleAutoGiftPermission:', error);
      return { success: false, error: error.message || 'Failed to update auto-gift permission' };
    }
  }
}

export const autoGiftPermissionService = new AutoGiftPermissionService();