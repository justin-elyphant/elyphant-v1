
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserSpecialDate, SharingLevel } from "@/types/supabase";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";

export const useSpecialDates = () => {
  const { user } = useAuth();
  const [specialDates, setSpecialDates] = useState<UserSpecialDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSpecialDates = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('user_special_dates')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setSpecialDates(data || []);
    } catch (err) {
      console.error("Error fetching special dates:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecialDates();
  }, [user]);

  const addSpecialDate = async (dateType: 'birthday' | 'anniversary' | 'custom', date: string, visibility: SharingLevel = 'friends') => {
    if (!user) {
      toast.error("You must be logged in to add a special date");
      return null;
    }
    
    try {
      // Check for existing date of same type
      const { data: existingData } = await supabase
        .from('user_special_dates')
        .select('id')
        .eq('user_id', user.id)
        .eq('date_type', dateType);
      
      if (existingData && existingData.length > 0) {
        return updateSpecialDate(existingData[0].id, { date, visibility });
      }
      
      const { data, error } = await supabase
        .from('user_special_dates')
        .insert({
          user_id: user.id,
          date_type: dateType,
          date,
          visibility
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setSpecialDates(prev => [...prev, data]);
      toast.success(`${dateType.charAt(0).toUpperCase() + dateType.slice(1)} added successfully`);
      
      return data;
    } catch (err) {
      console.error(`Error adding ${dateType}:`, err);
      toast.error(`Failed to add ${dateType}`);
      throw err;
    }
  };

  const updateSpecialDate = async (id: string, updates: Partial<UserSpecialDate>) => {
    if (!user) {
      toast.error("You must be logged in to update a special date");
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from('user_special_dates')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setSpecialDates(prev => prev.map(date => date.id === id ? data : date));
      toast.success("Special date updated successfully");
      
      return data;
    } catch (err) {
      console.error("Error updating special date:", err);
      toast.error("Failed to update special date");
      throw err;
    }
  };

  const deleteSpecialDate = async (id: string) => {
    if (!user) {
      toast.error("You must be logged in to delete a special date");
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('user_special_dates')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setSpecialDates(prev => prev.filter(date => date.id !== id));
      toast.success("Special date deleted successfully");
      
      return true;
    } catch (err) {
      console.error("Error deleting special date:", err);
      toast.error("Failed to delete special date");
      throw err;
    }
  };

  const updateVisibility = async (id: string, visibility: SharingLevel) => {
    return updateSpecialDate(id, { visibility });
  };

  return {
    specialDates,
    loading,
    error,
    fetchSpecialDates,
    addSpecialDate,
    updateSpecialDate,
    deleteSpecialDate,
    updateVisibility
  };
};
