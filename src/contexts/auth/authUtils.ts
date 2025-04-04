
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";
import { Profile } from "@/types/supabase";

export const getUserProfile = async (user: User | null) => {
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  return data;
};

export const updateUserProfile = async (user: User | null, updates: Partial<Profile>) => {
  if (!user) {
    toast.error('You must be logged in to update your profile');
    return;
  }
  
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);
    
  if (error) {
    console.error('Error updating user profile:', error);
    toast.error('Failed to update profile');
    throw error;
  }
  
  toast.success('Profile updated successfully');
};

export const resendVerificationEmail = async (userEmail: string | undefined) => {
  if (!userEmail) {
    toast.error('No email address available');
    return;
  }
  
  const currentUrl = window.location.origin;
  const redirectTo = `${currentUrl}/dashboard`;
  
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: userEmail,
    options: {
      emailRedirectTo: redirectTo,
    },
  });
  
  if (error) {
    console.error('Error resending verification email:', error);
    toast.error('Failed to resend verification email');
  } else {
    toast.success('Verification email sent!');
  }
};

export const sendDeletionEmail = async (email: string, name: string | null) => {
  try {
    const { error } = await supabase.functions.invoke('send-deletion-email', {
      body: { email, name }
    });
    
    if (error) throw error;
    
    console.log("Deletion confirmation email sent successfully");
  } catch (error) {
    console.error("Failed to send deletion confirmation email:", error);
    // Continue with deletion even if email fails
  }
};

export const initializeStorageBucket = async () => {
  try {
    const { data, error } = await supabase.storage.getBucket('avatars');
    
    if (error && error.message.includes('does not exist')) {
      await supabase.storage.createBucket('avatars', {
        public: true,
        fileSizeLimit: 1024 * 1024 * 5,
      });
      
      await supabase.storage.from('avatars').createSignedUrl('dummy.txt', 1);
    }
    return true;
  } catch (err) {
    console.error("Error initializing storage bucket:", err);
    return false;
  }
};
