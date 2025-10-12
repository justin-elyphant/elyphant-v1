import { supabase } from "@/integrations/supabase/client";
import { unifiedGiftManagementService } from "./UnifiedGiftManagementService";
import { authDebugService } from "./authDebugService";
import { databaseToForm } from "@/utils/addressStandardization";

export interface UnifiedRecipient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  birthday?: string | null;
  address?: any;
  source: 'connection' | 'pending' | 'address_book';
  relationship_type?: string;
  relationship_context?: {
    closeness_level?: number;
    interaction_frequency?: string;
    shared_interests?: string[];
    special_considerations?: string;
  };
  status?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface AddressBookRecipient {
  id: string;
  name: string;
  email?: string;
  address: any;
  relationship_type?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const unifiedRecipientService = {
  async getAllRecipients(): Promise<UnifiedRecipient[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const recipients: UnifiedRecipient[] = [];

    // Get connected friends
    try {
      const { data: connections } = await supabase
        .from('user_connections')
        .select(`
          id,
          connected_user_id,
          relationship_type,
          status,
          created_at,
          profiles!user_connections_connected_user_id_fkey(
            name,
            email,
            profile_image,
            shipping_address
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (connections) {
        connections.forEach(conn => {
          const profile = conn.profiles as any;
          
          // Normalize address from database format to form format
          let normalizedAddress = null;
          if (profile?.shipping_address) {
            const formAddress = databaseToForm(profile.shipping_address);
            // Convert form format to the display format expected by cart/checkout
            normalizedAddress = {
              name: profile.name || 'Unknown',
              address: formAddress.street,
              addressLine2: formAddress.addressLine2,
              city: formAddress.city,
              state: formAddress.state,
              zipCode: formAddress.zipCode,
              country: formAddress.country
            };
          }
          
          recipients.push({
            id: conn.id,
            name: profile?.name || 'Unknown',
            email: profile?.email,
            address: normalizedAddress,
            source: 'connection',
            relationship_type: conn.relationship_type,
            status: conn.status,
            avatar_url: profile?.profile_image,
            created_at: conn.created_at
          });
        });
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    }

    // Get pending invitations
    try {
      const { data: pendingConnections } = await supabase
        .from('user_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending_invitation');

      if (pendingConnections) {
        pendingConnections.forEach(conn => {
          recipients.push({
            id: conn.id,
            name: conn.pending_recipient_name || 'Unknown',
            email: conn.pending_recipient_email,
            phone: conn.pending_recipient_phone,
            birthday: conn.pending_recipient_dob,
            address: conn.pending_shipping_address,
            source: 'pending',
            relationship_type: conn.relationship_type,
            relationship_context: (conn.relationship_context && typeof conn.relationship_context === 'object') 
              ? conn.relationship_context as any 
              : {},
            status: conn.status,
            created_at: conn.created_at
          });
        });
      }
    } catch (error) {
      console.error('Error fetching pending connections:', error);
    }

    // Get address book recipients
    try {
      const { data: addressBookRecipients } = await supabase
        .from('recipient_profiles')
        .select('*')
        .eq('user_id', user.id);

      if (addressBookRecipients) {
        addressBookRecipients.forEach(recipient => {
          recipients.push({
            id: recipient.id,
            name: recipient.name,
            email: (recipient.preferences && typeof recipient.preferences === 'object' && (recipient.preferences as any)?.email) || null,
            phone: (recipient.preferences && typeof recipient.preferences === 'object' && (recipient.preferences as any)?.phone) || null,
            birthday: (recipient.preferences && typeof recipient.preferences === 'object' && (recipient.preferences as any)?.birthday) || null,
            address: (recipient.preferences && typeof recipient.preferences === 'object' && (recipient.preferences as any)?.shipping_address) || null,
            source: 'address_book',
            relationship_type: recipient.relationship,
            relationship_context: (recipient.preferences && typeof recipient.preferences === 'object' && (recipient.preferences as any)?.relationship_context) || {},
            created_at: recipient.created_at
          });
        });
      }
    } catch (error) {
      console.error('Error fetching address book recipients:', error);
    }

    return recipients.sort((a, b) => a.name.localeCompare(b.name));
  },

  async createAddressBookRecipient(recipientData: {
    name: string;
    email?: string;
    address?: any;
    relationship_type?: string;
    notes?: string;
  }): Promise<AddressBookRecipient> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('recipient_profiles')
      .insert({
        user_id: user.id,
        name: recipientData.name,
        relationship: recipientData.relationship_type || 'friend',
        preferences: {
          email: recipientData.email,
          shipping_address: recipientData.address,
          notes: recipientData.notes
        }
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      address: null // Add missing required field
    };
  },

  async createPendingRecipient(recipientData: {
    name: string;
    email: string;
    address?: any;
    relationship_type?: string;
  }): Promise<any> {
    console.log('🔄 [UNIFIED_RECIPIENT] Creating pending recipient with comprehensive diagnostics:', recipientData);
    
    try {
      // Phase 1: Comprehensive Pre-Operation Diagnostics
      console.log('🏥 [DIAGNOSTICS] Running comprehensive auth and RLS diagnostics...');
      
      const diagnosis = await authDebugService.diagnoseUserConnectionsIssue();
      
      console.log('📊 [DIAGNOSTICS] Diagnosis results:', {
        authValid: diagnosis.authValid,
        rlsErrors: diagnosis.rlsStatus.errors,
        recommendations: diagnosis.recommendations
      });
      
      // Handle critical authentication issues
      if (!diagnosis.authValid) {
        console.error('💥 [DIAGNOSTICS] Authentication validation failed');
        
        // Attempt session refresh if recommended
        if (diagnosis.recommendations.some(r => r.includes('session refresh'))) {
          console.log('🔄 [DIAGNOSTICS] Attempting session refresh...');
          
          const refreshResult = await authDebugService.refreshAndValidateSession();
          
          if (!refreshResult.success) {
            throw new Error(`Authentication failed: ${refreshResult.error || 'Session refresh failed'}`);
          }
          
          console.log('✅ [DIAGNOSTICS] Session refresh successful');
        } else {
          throw new Error('Authentication failed. Please sign in again.');
        }
      }
      
      // Handle RLS policy issues
      if (diagnosis.rlsStatus.errors.length > 0) {
        console.error('💥 [DIAGNOSTICS] RLS policy errors detected:', diagnosis.rlsStatus.errors);
        throw new Error('Database permission denied. Please check your authentication status.');
      }
      
      // Warning for RLS issues that don't block operation
      if (diagnosis.rlsStatus.warnings.length > 0) {
        console.warn('⚠️ [DIAGNOSTICS] RLS warnings:', diagnosis.rlsStatus.warnings);
      }
      
      // Phase 2: Final Authentication State Validation
      const authInfo = await authDebugService.debugAuthentication();
      
      if (!authInfo.sessionValid || !authInfo.dbAuthTest) {
        console.error('💥 [AUTH] Final auth validation failed:', authInfo);
        throw new Error('Authentication state is invalid. Please sign in again.');
      }
      
      console.log('✅ [AUTH] All authentication checks passed:', {
        userId: authInfo.userId,
        email: authInfo.email,
        tokenExpiry: authInfo.tokenExpiry,
        dbAuthTest: authInfo.dbAuthTest
      });
      
      // Enhanced validation
      if (!recipientData.name?.trim()) {
        throw new Error('Recipient name is required');
      }
      
      if (!recipientData.email?.trim()) {
        throw new Error('Recipient email is required');
      }
      
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipientData.email.trim())) {
        throw new Error('Invalid email format');
      }
      
      const result = await unifiedGiftManagementService.createPendingConnection(
        recipientData.email,
        recipientData.name,
        recipientData.relationship_type || 'friend',
        recipientData.address
      );
      
      console.log('✅ [UNIFIED_RECIPIENT] Successfully created pending recipient:', result);
      return result;
      
    } catch (error: any) {
      console.error('💥 [UNIFIED_RECIPIENT] Error creating pending recipient:', {
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        },
        recipientData,
        timestamp: new Date().toISOString()
      });
      
      // Provide specific error messages for common auth issues
      if (error.message?.includes('auth') || error.message?.includes('session')) {
        throw new Error('Authentication issue: ' + error.message);
      }
      
      if (error.message?.includes('JWT') || error.message?.includes('token')) {
        throw new Error('Session expired. Please sign in again.');
      }
      
      if (error.code === 'PGRST301') {
        throw new Error('Permission denied. Please check your authentication.');
      }
      
      throw error;
    }
  },

  async upgradeAddressBookToConnection(addressBookId: string, email: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get the address book recipient
    const { data: addressBookRecipient, error: fetchError } = await supabase
      .from('recipient_profiles')
      .select('*')
      .eq('id', addressBookId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) throw fetchError;

    // Create a pending connection
    await this.createPendingRecipient({
      name: addressBookRecipient.name,
      email,
      address: (addressBookRecipient.preferences && typeof addressBookRecipient.preferences === 'object' && (addressBookRecipient.preferences as any)?.shipping_address) || null,
      relationship_type: addressBookRecipient.relationship
    });

    // Remove from address book
    const { error: deleteError } = await supabase
      .from('recipient_profiles')
      .delete()
      .eq('id', addressBookId)
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;
  },

  async updateAddressBookRecipient(id: string, updates: Partial<AddressBookRecipient> & {
    phone?: string;
    birthday?: string | null;
    relationship_context?: any;
  }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('recipient_profiles')
      .update({
        name: updates.name,
        relationship: updates.relationship_type,
        preferences: {
          email: updates.email,
          phone: updates.phone,
          birthday: updates.birthday,
          shipping_address: updates.address,
          notes: updates.notes,
          relationship_context: updates.relationship_context
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  async deleteAddressBookRecipient(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('recipient_profiles')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  // Helper method to get recipient by ID from any source
  async getRecipientById(id: string): Promise<UnifiedRecipient | null> {
    const recipients = await this.getAllRecipients();
    return recipients.find(r => r.id === id) || null;
  },

  // Helper method to search recipients
  async searchRecipients(query: string): Promise<UnifiedRecipient[]> {
    const recipients = await this.getAllRecipients();
    const searchTerm = query.toLowerCase();
    
    return recipients.filter(recipient => 
      recipient.name.toLowerCase().includes(searchTerm) ||
      recipient.email?.toLowerCase().includes(searchTerm) ||
      recipient.relationship_type?.toLowerCase().includes(searchTerm)
    );
  },

  // Comprehensive update for any recipient type
  async updateRecipient(id: string, updates: {
    name?: string;
    email?: string;
    phone?: string;
    birthday?: string | null;
    address?: any;
    relationship_type?: string;
    relationship_context?: any;
    gift_preferences?: any;
  }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Find the recipient to determine its type
    const recipient = await this.getRecipientById(id);
    if (!recipient) throw new Error('Recipient not found');

    switch (recipient.source) {
      case 'pending':
        await this.updatePendingConnection(id, updates);
        break;
      case 'address_book':
        await this.updateAddressBookRecipient(id, updates);
        break;
      case 'connection':
        // Connected users can only have address overrides and gift preferences updated
        console.warn('Connected user data cannot be directly updated');
        break;
      default:
        throw new Error('Unknown recipient type');
    }
  },

  // Update pending connection
  async updatePendingConnection(connectionId: string, updates: {
    name?: string;
    email?: string;
    phone?: string;
    birthday?: string | null;
    address?: any;
    relationship_type?: string;
    relationship_context?: any;
  }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Validate connectionId
    if (!connectionId || connectionId.trim() === '') {
      throw new Error('Invalid connection ID');
    }

    console.log('🔍 Updating pending connection:', { connectionId, userId: user.id, updates });

    const updateData: any = {};
    
    if (updates.name !== undefined) {
      updateData.pending_recipient_name = updates.name;
    }
    if (updates.email !== undefined) {
      updateData.pending_recipient_email = updates.email;
    }
    if (updates.phone !== undefined) {
      updateData.pending_recipient_phone = updates.phone;
    }
    if (updates.birthday !== undefined) {
      updateData.pending_recipient_dob = updates.birthday;
    }
    if (updates.address !== undefined) {
      // Normalize address data to ensure consistent field names
      const normalizedAddress = {
        street: updates.address.street || updates.address.address || '',
        address_line_2: updates.address.address_line_2 || updates.address.address_line2 || '',
        city: updates.address.city || '',
        state: updates.address.state || '',
        zipCode: updates.address.zipCode || '',
        country: updates.address.country || 'US'
      };
      updateData.pending_shipping_address = normalizedAddress;
    }
    if (updates.relationship_type !== undefined) {
      updateData.relationship_type = updates.relationship_type;
    }
    if (updates.relationship_context !== undefined) {
      updateData.relationship_context = updates.relationship_context;
    }

    console.log('🔍 Update data:', updateData);

    const { error } = await supabase
      .from('user_connections')
      .update(updateData)
      .eq('id', connectionId)
      .eq('user_id', user.id)
      .eq('status', 'pending_invitation');

    if (error) {
      console.error('❌ Error updating pending connection:', error);
      throw error;
    }

    console.log('✅ Successfully updated pending connection');
  }
};