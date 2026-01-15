import { supabase } from "@/integrations/supabase/client";

export interface ResolvedAddress {
  address: any;
  source: 'user_verified' | 'giver_provided' | 'missing';
  recipient_id?: string;
  connection_id?: string;
  is_verified: boolean;
  needs_confirmation?: boolean;
}

export interface AddressResolutionResult {
  success: boolean;
  address?: ResolvedAddress;
  error?: string;
  requiresAddressRequest?: boolean;
}

class RecipientAddressResolver {
  
  /**
   * Resolve recipient address using hierarchy:
   * 1. Confirmed user's profiles.shipping_address (if connection is accepted)
   * 2. Giver-provided pending_shipping_address (if connection is pending)
   * 3. Missing - requires address request
   */
  async resolveRecipientAddress(
    userId: string, 
    recipientId: string
  ): Promise<AddressResolutionResult> {
    console.log(`🏠 Resolving address for recipient ${recipientId} from user ${userId}`);
    
    try {
      // First, check if we have an accepted connection and verified user address
      const acceptedConnection = await this.getAcceptedConnectionAddress(userId, recipientId);
      if (acceptedConnection.success && acceptedConnection.address) {
        console.log(`✅ Found verified user address for accepted connection`);
        return acceptedConnection;
      }

      // Second, check for pending connection with giver-provided address
      const pendingConnection = await this.getPendingConnectionAddress(userId, recipientId);
      if (pendingConnection.success && pendingConnection.address) {
        console.log(`📋 Found giver-provided address for pending connection`);
        return pendingConnection;
      }

      // No address available - requires address request
      console.log(`❌ No address found - requires address request`);
      return {
        success: false,
        requiresAddressRequest: true,
        error: 'No shipping address available for recipient'
      };

    } catch (error) {
      console.error('Error resolving recipient address:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Address resolution failed'
      };
    }
  }

  /**
   * Check for accepted connection with verified user address
   */
  private async getAcceptedConnectionAddress(
    userId: string, 
    recipientId: string
  ): Promise<AddressResolutionResult> {
    const { data: connection, error } = await supabase
      .from('user_connections')
      .select(`
        id,
        status,
        profiles!user_connections_connected_user_id_fkey(
          id,
          shipping_address,
          address_verified
        )
      `)
      .eq('user_id', userId)
      .eq('connected_user_id', recipientId)
      .eq('status', 'accepted')
      .single();

    if (error || !connection) {
      return { success: false };
    }

    const profile = Array.isArray(connection.profiles) ? connection.profiles[0] : connection.profiles;
    if (profile?.shipping_address && this.isValidAddress(profile.shipping_address)) {
      return {
        success: true,
        address: {
          address: profile.shipping_address,
          source: 'user_verified',
          recipient_id: recipientId,
          connection_id: connection.id,
          is_verified: profile.address_verified || false
        }
      };
    }

    return { success: false };
  }

  /**
   * Check for pending connection with giver-provided address
   */
  private async getPendingConnectionAddress(
    userId: string, 
    recipientId: string
  ): Promise<AddressResolutionResult> {
    // For pending connections, we need to match by email since recipientId might not exist yet
    const { data: connections, error } = await supabase
      .from('user_connections')
      .select(`
        id,
        status,
        pending_shipping_address,
        pending_recipient_email,
        connected_user_id
      `)
      .eq('user_id', userId)
      .eq('status', 'pending_invitation');

    if (error || !connections) {
      return { success: false };
    }

    // Try to find connection by recipientId if it exists
    let connection = connections.find(conn => conn.connected_user_id === recipientId);
    
    // If not found by recipientId, we might need to match by email later
    if (!connection && connections.length > 0) {
      // For now, just take the first pending connection with an address
      connection = connections.find(conn => 
        conn.pending_shipping_address && 
        this.isValidAddress(conn.pending_shipping_address)
      );
    }

    if (connection?.pending_shipping_address && this.isValidAddress(connection.pending_shipping_address)) {
      return {
        success: true,
        address: {
          address: connection.pending_shipping_address,
          source: 'giver_provided',
          connection_id: connection.id,
          is_verified: false,
          needs_confirmation: true
        }
      };
    }

    return { success: false };
  }

  /**
   * Validate that an address object has required fields
   */
  private isValidAddress(address: any): boolean {
    if (!address || typeof address !== 'object') return false;
    
    // Check for required fields
    const requiredFields = ['address_line1', 'city', 'state', 'zip_code'];
    return requiredFields.every(field => 
      address[field] && 
      typeof address[field] === 'string' && 
      address[field].trim().length > 0
    );
  }

  /**
   * Get address for order processing - returns the best available address with metadata
   */
  async getAddressForOrder(
    userId: string, 
    recipientId: string
  ): Promise<{
    address: any;
    metadata: {
      source: string;
      is_verified: boolean;
      needs_confirmation: boolean;
      connection_id?: string;
    };
  } | null> {
    const resolution = await this.resolveRecipientAddress(userId, recipientId);
    
    if (!resolution.success || !resolution.address) {
      return null;
    }

    return {
      address: resolution.address.address,
      metadata: {
        source: resolution.address.source,
        is_verified: resolution.address.is_verified,
        needs_confirmation: resolution.address.needs_confirmation || false,
        connection_id: resolution.address.connection_id
      }
    };
  }

  /**
   * Request address from recipient if none available
   */
  async requestAddressFromRecipient(
    userId: string, 
    recipientEmail: string,
    recipientName: string,
    message?: string
  ): Promise<{ success: boolean; requestId?: string; error?: string }> {
    try {
      console.log(`📤 Sending address request to ${recipientEmail}`);
      
      // Find recipient ID from email
      const { data: recipientProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', recipientEmail)
        .single();

      const { data, error } = await supabase
        .from('address_requests')
        .insert({
          requester_id: userId,
          recipient_id: recipientProfile?.id || userId, // Fallback if not found
          recipient_email: recipientEmail,
          message: message || `Hi ${recipientName}, I'd like to send you a gift! Could you please share your shipping address?`,
          include_notifications: true,
          reminder_schedule: '3_days'
        })
        .select()
        .single();

      if (error) throw error;

      // Send the actual email request via orchestrator
      const { error: emailError } = await supabase.functions.invoke('ecommerce-email-orchestrator', {
        body: {
          eventType: 'address_request',
          recipientEmail,
          data: {
            recipientEmail,
            recipientName,
            requesterName: 'User',
            requestId: data.id,
            message: message || `Hi ${recipientName}, I'd like to send you a gift! Could you please share your shipping address?`,
            requestUrl: window.location.origin + '/address-request'
          }
        }
      });

      if (emailError) {
        console.error('Failed to send address request email:', emailError);
        // Don't fail the whole request - the database record is created
      }

      return {
        success: true,
        requestId: data.id
      };

    } catch (error) {
      console.error('Error requesting address:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to request address'
      };
    }
  }

  /**
   * Validate if a connection has a verified address for auto-gifting
   * Used to enforce address verification for connection-based gifts
   * @returns { isValid: boolean, reason?: string }
   */
  async validateConnectionAddressForAutoGift(
    userId: string,
    recipientId: string
  ): Promise<{ isValid: boolean; reason?: string }> {
    console.log(`🔍 Validating address verification for auto-gift: user ${userId} → recipient ${recipientId}`);
    
    const result = await this.getAddressForOrder(userId, recipientId);
    
    if (!result || !result.address) {
      console.log(`❌ Validation failed: No address available`);
      return { 
        isValid: false, 
        reason: 'No address available for this connection' 
      };
    }
    
    if (!result.metadata.is_verified) {
      console.log(`❌ Validation failed: Address is not verified`);
      return { 
        isValid: false, 
        reason: 'Recipient address has not been verified' 
      };
    }
    
    console.log(`✅ Validation passed: Address is verified`);
    return { isValid: true };
  }
}

export const recipientAddressResolver = new RecipientAddressResolver();