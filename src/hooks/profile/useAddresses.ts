
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserAddress, ShippingAddress } from "@/types/supabase";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";

export const useAddresses = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAddresses = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });
      
      if (error) throw error;
      
      setAddresses(data || []);
    } catch (err) {
      console.error("Error fetching addresses:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  const addAddress = async (name: string, address: ShippingAddress, isDefault: boolean = false) => {
    if (!user) {
      toast.error("You must be logged in to add an address");
      return null;
    }
    
    try {
      // If setting as default, clear existing default
      if (isDefault) {
        await supabase
          .from('user_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .eq('is_default', true);
      }
      
      const { data, error } = await supabase
        .from('user_addresses')
        .insert({
          user_id: user.id,
          name,
          address,
          is_default: isDefault
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setAddresses(prev => [...prev, data]);
      toast.success("Address added successfully");
      
      return data;
    } catch (err) {
      console.error("Error adding address:", err);
      toast.error("Failed to add address");
      throw err;
    }
  };

  const updateAddress = async (id: string, updates: Partial<UserAddress>) => {
    if (!user) {
      toast.error("You must be logged in to update an address");
      return null;
    }
    
    try {
      // If setting as default, clear existing default
      if (updates.is_default) {
        await supabase
          .from('user_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .eq('is_default', true);
      }
      
      const { data, error } = await supabase
        .from('user_addresses')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setAddresses(prev => prev.map(addr => addr.id === id ? data : addr));
      toast.success("Address updated successfully");
      
      return data;
    } catch (err) {
      console.error("Error updating address:", err);
      toast.error("Failed to update address");
      throw err;
    }
  };

  const deleteAddress = async (id: string) => {
    if (!user) {
      toast.error("You must be logged in to delete an address");
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setAddresses(prev => prev.filter(addr => addr.id !== id));
      toast.success("Address deleted successfully");
      
      return true;
    } catch (err) {
      console.error("Error deleting address:", err);
      toast.error("Failed to delete address");
      throw err;
    }
  };

  const setDefaultAddress = async (id: string) => {
    if (!user) {
      toast.error("You must be logged in to set a default address");
      return null;
    }
    
    try {
      // Clear existing default
      await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true);
      
      // Set new default
      const { data, error } = await supabase
        .from('user_addresses')
        .update({ is_default: true })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setAddresses(prev => prev.map(addr => ({
        ...addr,
        is_default: addr.id === id
      })));
      
      toast.success("Default address updated");
      return data;
    } catch (err) {
      console.error("Error setting default address:", err);
      toast.error("Failed to set default address");
      throw err;
    }
  };

  return {
    addresses,
    loading,
    error,
    fetchAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
  };
};
