
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuthSession } from './useAuthSession';
import { useAuthFunctions } from './authHooks';
import { AuthContextProps } from './types';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { user, session, isLoading, isProcessingToken } = useAuthSession();
  const [isDebugMode, setIsDebugMode] = useState(false);
  const { signOut, deleteUser } = useAuthFunctions(user);

  // Ensure profile exists for authenticated users
  useEffect(() => {
    if (!user) return;
  
    const isNewSignUp = localStorage.getItem("newSignUp") === "true";
    const fromSignIn = localStorage.getItem("fromSignIn") === "true";
    
    // Only run profile creation if flags are set or on initial auth
    if (user && (isNewSignUp || fromSignIn)) {
      console.log("AuthProvider detected auth flag, ensuring profile exists for user:", user.id);
      
      const createOrUpdateProfile = async () => {
        try {
          // Check if profile already exists
          const { data: existingProfile, error: profileCheckError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
            
          if (profileCheckError) {
            console.error("Error checking existing profile:", profileCheckError);
          }
          
          // Profile data with fallbacks for each field
          const profileData = {
            id: user.id,
            email: user.email || localStorage.getItem("userEmail") || '',
            name: user.user_metadata?.name || 
                  localStorage.getItem("userName") || 
                  user.email?.split('@')[0] || 
                  'User',
            // Preserve existing fields if profile already exists
            bio: existingProfile?.bio || `Hi, I'm ${user.user_metadata?.name || user.email?.split('@')[0] || 'there'}!`,
            profile_image: existingProfile?.profile_image || user.user_metadata?.profile_image || null,
            dob: existingProfile?.dob || null,
            shipping_address: existingProfile?.shipping_address || null,
            gift_preferences: existingProfile?.gift_preferences || [],
            important_dates: existingProfile?.important_dates || [],
            data_sharing_settings: existingProfile?.data_sharing_settings || {
              dob: "friends",
              shipping_address: "private",
              gift_preferences: "public"
            },
            updated_at: new Date().toISOString()
          };
          
          console.log("Creating/updating profile with data:", profileData);
          
          // Use direct database call to create/update profile
          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert(profileData)
            .select()
            .single();
              
          if (upsertError) {
            console.error("Profile creation/update failed:", upsertError);
            toast.error("Failed to create your profile. Some features may be limited.");
          } else {
            console.log("Profile created/updated successfully");
            
            // Clear flags after successful profile creation
            localStorage.removeItem("newSignUp");
            localStorage.removeItem("fromSignIn");
          }
        } catch (err) {
          console.error("Failed to create/update profile in auth provider:", err);
        }
      };
      
      createOrUpdateProfile();
    }
  }, [user]);

  const toggleDebugMode = () => {
    setIsDebugMode(!isDebugMode);
  };

  const value: AuthContextProps = {
    user,
    session,
    isLoading,
    isDebugMode,
    toggleDebugMode,
    isProcessingToken,
    signOut,
    deleteUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
