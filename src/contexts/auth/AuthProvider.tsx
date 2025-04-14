
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

  // More robust check for new signup flow and ensuring profile exists
  useEffect(() => {
    const isNewSignUp = localStorage.getItem("newSignUp") === "true";
    const fromSignIn = localStorage.getItem("fromSignIn") === "true";
    
    // Handle user just logged in or signed up - ensure profile exists
    if (user && (isNewSignUp || fromSignIn)) {
      console.log("AuthProvider detected auth flag, ensuring profile exists");
      
      const createOrUpdateProfile = async () => {
        try {
          console.log("Creating/updating profile for user:", user.id);
          
          const profileData = {
            email: user.email,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            updated_at: new Date().toISOString()
          };
          
          const response = await supabase.functions.invoke('create-profile', {
            body: {
              user_id: user.id,
              profile_data: profileData
            }
          });
          
          if (response.error) {
            console.error("Error creating profile in auth provider:", response.error);
          } else {
            console.log("Profile created/updated in auth provider:", response.data);
            
            // Clear flags after successful profile creation
            localStorage.removeItem("newSignUp");
            localStorage.removeItem("fromSignIn");
            
            // Navigate to profile setup or dashboard as appropriate
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
