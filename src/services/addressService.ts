
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { ShippingAddress } from '@/types/shipping';
import { DatabaseAddress, FormAddress, databaseToForm, formToDatabase } from '@/utils/addressStandardization';
import { toast } from 'sonner';

export interface AddressWithId extends DatabaseAddress {
  id: string;
  name: string;
  is_default: boolean;
}

export class AddressService {
  private static instance: AddressService;
  
  static getInstance(): AddressService {
    if (!AddressService.instance) {
      AddressService.instance = new AddressService();
    }
    return AddressService.instance;
  }

  async getUserAddresses(userId: string): Promise<AddressWithId[]> {
    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });

      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        is_default: row.is_default,
        ...(row.address as any)
      })) as AddressWithId[];
    } catch (error) {
      console.error('Error fetching user addresses:', error);
      return [];
    }
  }

  async saveAddressToProfile(userId: string, address: FormAddress, name: string = 'Default Address', setAsDefault: boolean = false): Promise<boolean> {
    try {
      // Convert form address to database format
      const dbAddress = formToDatabase(address);
      
      // If setting as default, clear existing default
      if (setAsDefault) {
        await supabase
          .from('user_addresses')
          .update({ is_default: false })
          .eq('user_id', userId)
          .eq('is_default', true);
      }

      const { error } = await supabase
        .from('user_addresses')
        .insert({
          user_id: userId,
          name,
          address: dbAddress as any,
          is_default: setAsDefault
        });

      if (error) throw error;
      
      // Also update profile shipping_address if this is the default
      if (setAsDefault) {
        await supabase
          .from('profiles')
          .update({ shipping_address: dbAddress as any })
          .eq('id', userId);
      }

      toast.success('Address saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
      return false;
    }
  }

  async getDefaultAddress(userId: string): Promise<FormAddress | null> {
    try {
      // First try to get from user_addresses table
      const { data: addressData } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', userId)
        .eq('is_default', true)
        .single();

      if (addressData) {
        return databaseToForm(addressData.address as any);
      }

      // Fallback to profile shipping_address
      const { data: profileData } = await supabase
        .from('profiles')
        .select('shipping_address')
        .eq('id', userId)
        .single();

      if (profileData?.shipping_address) {
        return databaseToForm(profileData.shipping_address as any);
      }

      return null;
    } catch (error) {
      console.error('Error getting default address:', error);
      return null;
    }
  }

  async updateProfileShippingAddress(userId: string, address: FormAddress): Promise<boolean> {
    try {
      const dbAddress = formToDatabase(address);
      
      const { error } = await supabase
        .from('profiles')
        .update({ shipping_address: dbAddress as any })
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating profile shipping address:', error);
      return false;
    }
  }
}

export const addressService = AddressService.getInstance();
