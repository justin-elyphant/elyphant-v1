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
    
    // Always check and ensure profile exists for the user
    console.log("AuthProvider detected auth status change, ensuring profile exists for user:", user.id);
    
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

        // If profile exists and has all required fields, no need to continue
        if (existingProfile && 
            existingProfile.name && 
            existingProfile.email && 
            existingProfile.bio) {
          console.log("Profile already exists with required fields:", existingProfile.id);
          return;
        }
        
        // Get interests from localStorage if available
        let interests = [];
        const storedInterests = localStorage.getItem("userInterests");
        if (storedInterests) {
          try {
            interests = JSON.parse(storedInterests);
          } catch (e) {
            console.error("Error parsing interests from localStorage:", e);
          }
        }
        
        // Create username from name if needed
        const name = user.user_metadata?.name || 
                  localStorage.getItem("userName") || 
                  user.email?.split('@')[0] || 
                  'User';
                  
        const username = existingProfile?.username || 
                      name.toLowerCase().replace(/\s+/g, '_') || 
                      `user_${Date.now().toString(36)}`;
        
        // Profile data with fallbacks for each field
        const profileData = {
          id: user.id,
          email: user.email || localStorage.getItem("userEmail") || '',
          name: name,
          username: username,
          // Preserve existing fields if profile already exists
          bio: existingProfile?.bio || `Hi, I'm ${name}!`,
          profile_image: existingProfile?.profile_image || user.user_metadata?.profile_image || null,
          dob: existingProfile?.dob || null,
          shipping_address: existingProfile?.shipping_address || {},
          gift_preferences: existingProfile?.gift_preferences || interests.map(interest => ({
            category: interest,
            importance: "medium"
          })),
          important_dates: existingProfile?.important_dates || [],
          data_sharing_settings: existingProfile?.data_sharing_settings || {
            dob: "friends",
            shipping_address: "private",
            gift_preferences: "public"
          },
          updated_at: new Date().toISOString()
        };
        
        console.log("Creating/updating profile with data:", JSON.stringify(profileData, null, 2));
        
        // Try multiple times to ensure profile is created
        let attempts = 0;
        let success = false;
        
        while (attempts < 3 && !success) {
          attempts++;
          console.log(`AuthProvider: Attempt ${attempts} to create/update profile`);
          
          try {
            // Use direct database call to create/update profile
            const { data, error } = await supabase
              .from('profiles')
              .upsert(profileData)
              .select();
                
            if (error) {
              console.error(`Profile creation/update failed (attempt ${attempts}):`, error);
              if (attempts === 3) throw error;
            } else {
              console.log("Profile created/updated successfully:", data);
              success = true;
              
              // Clear flags after successful profile creation
              localStorage.removeItem("newSignUp");
              localStorage.removeItem("fromSignIn");
              localStorage.removeItem("userInterests");
            }
          } catch (error) {
            console.error(`Error in upsert operation (attempt ${attempts}):`, error);
            // On last attempt, throw to exit the while loop
            if (attempts === 3) throw error;
            // Otherwise wait and try again
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        if (!success) {
          console.error("Failed to create/update profile after multiple attempts");
          // Don't show error to user as this happens in the background
        }
      } catch (err) {
        console.error("Failed to create/update profile in auth provider:", err);
      }
    };
    
    createOrUpdateProfile();
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
