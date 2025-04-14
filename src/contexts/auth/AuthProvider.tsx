
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();
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
          // Profile data with fallbacks for each field
          const profileData = {
            id: user.id,
            email: user.email || localStorage.getItem("userEmail") || '',
            name: user.user_metadata?.name || 
                  localStorage.getItem("userName") || 
                  user.email?.split('@')[0] || 
                  'User',
            updated_at: new Date().toISOString()
          };
          
          console.log("Creating/updating profile with data:", profileData);
          
          const response = await supabase.functions.invoke('create-profile', {
            body: {
              user_id: user.id,
              profile_data: profileData
            }
          });
          
          if (response.error) {
            console.error("Error creating profile in auth provider:", response.error);
            
            // Try direct profile creation as fallback
            const { error: directError } = await supabase
              .from('profiles')
              .upsert({
                id: user.id,
                email: profileData.email,
                name: profileData.name,
                updated_at: profileData.updated_at
              })
              .select()
              .single();
              
            if (directError) {
              console.error("Direct profile creation also failed:", directError);
              toast.error("Failed to create your profile. Some features may be limited.");
            } else {
              console.log("Profile created/updated through direct DB access");
            }
          } else {
            console.log("Profile created/updated successfully in auth provider:", response.data);
            
            // Clear flags after successful profile creation
            localStorage.removeItem("newSignUp");
            localStorage.removeItem("fromSignIn");
            
            // Navigate to profile setup as appropriate if not already there
            if (location.pathname !== '/profile-setup') {
              navigate('/profile-setup', { replace: true });
            }
          }
        } catch (err) {
          console.error("Failed to create/update profile in auth provider:", err);
        }
      };
      
      createOrUpdateProfile();
    }
  }, [user, location.pathname, navigate]);

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
