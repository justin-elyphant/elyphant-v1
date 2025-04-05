
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getUserProfile as fetchUserProfile, updateUserProfile as updateProfile, resendVerificationEmail as resendEmail, sendDeletionEmail } from "./authUtils";
import { Profile } from "@/types/supabase";

export const useAuthFunctions = (user: any) => {
  const navigate = useNavigate();
  const [bucketInitialized, setBucketInitialized] = useState(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getUserProfile = async () => {
    return await fetchUserProfile(user);
  };
  
  const updateUserProfile = async (updates: Partial<Profile>) => {
    await updateProfile(user, updates);
  };
  
  const resendVerificationEmail = async () => {
    await resendEmail(user?.email);
  };

  const deleteUser = async () => {
    if (!user) {
      toast.error('You must be logged in to delete your account');
      return;
    }
    
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();
      
      if (user.email) {
        await sendDeletionEmail(user.email, profileData?.name);
      }
      
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);
      
      if (profileError) throw profileError;
      
      const { error: authError } = await supabase.auth.admin.deleteUser(
        user.id
      );
      
      if (authError) throw authError;
      
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete account');
      throw error;
    }
  };

  return {
    signOut,
    getUserProfile,
    resendVerificationEmail,
    updateUserProfile,
    deleteUser,
    bucketInitialized,
    setBucketInitialized,
  };
};
