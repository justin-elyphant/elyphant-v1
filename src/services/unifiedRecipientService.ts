import { supabase } from "@/integrations/supabase/client";
import { pendingGiftsService } from "./pendingGiftsService";

export interface UnifiedRecipient {
  id: string;
  name: string;
  email?: string;
  address?: any;
  source: 'connection' | 'pending' | 'address_book';
  relationship_type?: string;
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
          recipients.push({
            id: conn.id,
            name: profile?.name || 'Unknown',
            email: profile?.email,
            address: profile?.shipping_address,
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
            address: conn.pending_shipping_address,
            source: 'pending',
            relationship_type: conn.relationship_type,
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
            email: recipient.preferences?.email,
            address: recipient.preferences?.shipping_address,
            source: 'address_book',
            relationship_type: recipient.relationship,
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
    return data;
  },

  async createPendingRecipient(recipientData: {
    name: string;
    email: string;
    address?: any;
    relationship_type?: string;
  }): Promise<any> {
    return pendingGiftsService.createPendingConnection(
      recipientData.email,
      recipientData.name,
      recipientData.relationship_type || 'friend',
      recipientData.address
    );
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
      address: addressBookRecipient.preferences?.shipping_address,
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

  async updateAddressBookRecipient(id: string, updates: Partial<AddressBookRecipient>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('recipient_profiles')
      .update({
        name: updates.name,
        relationship: updates.relationship_type,
        preferences: {
          email: updates.email,
          shipping_address: updates.address,
          notes: updates.notes
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

  // Update pending connection
  async updatePendingConnection(connectionId: string, updates: {
    name?: string;
    email?: string;
    address?: any;
    relationship_type?: string;
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
    if (updates.address !== undefined) {
      // Normalize address data to ensure consistent field names
      const normalizedAddress = {
        street: updates.address.street || '',
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