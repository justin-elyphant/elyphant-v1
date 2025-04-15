
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch the current user's profile
  const fetchProfile = useCallback(async (userId = user?.id) => {
    if (!userId) {
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching profile data for user:', userId);
      
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching profile:', fetchError);
        setError(fetchError as any);
        return null;
      }
      
      console.log('Profile fetched successfully:', data);
      setProfile(data);
      return data;
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch profile on component mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Update the user's profile
  const updateProfile = async (profileData: any) => {
    if (!user?.id) {
      throw new Error('No user ID available');
    }
    
    try {
      console.log('Updating profile for user:', user.id);
      console.log('Profile data to update:', profileData);
      
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id)
        .select();
      
      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
      
      console.log('Profile updated successfully:', data);
      setProfile(data[0] || data);
      return data;
    } catch (err) {
      console.error('Failed to update profile:', err);
      throw err;
    }
  };

  // Force refetch profile data - useful for settings pages
  const refetchProfile = useCallback(async () => {
    console.log('Force refetching profile data');
    return fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetchProfile
  };
};
