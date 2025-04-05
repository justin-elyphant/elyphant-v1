
import React, { createContext, useState, useEffect, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Profile } from "@/types/supabase";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthState } from "./types";
import { 
  getUserProfile as getProfile,
  updateUserProfile as updateProfile,
  resendVerificationEmail as resendEmail,
  sendDeletionEmail,
  initializeStorageBucket
} from "./authUtils";

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
  getUserProfile: async () => null,
  resendVerificationEmail: async () => {},
  updateUserProfile: async () => {},
  deleteUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [bucketInitialized, setBucketInitialized] = useState(false);

  useEffect(() => {
    initializeStorageBucket().then(result => {
      setBucketInitialized(result);
    });
  }, []);

  // Check URL for access_token and handle it
  useEffect(() => {
    const handleAccessToken = async () => {
      // Check if the URL has an access_token parameter (from email verification)
      const params = new URLSearchParams(location.search);
      const accessToken = params.get('access_token');
      
      if (accessToken) {
        try {
          // Process the token (this should trigger the onAuthStateChange event)
          const { data, error } = await supabase.auth.getUser(accessToken);
          
          if (error) {
            console.error("Error processing access token:", error);
            toast.error("Verification link is invalid or has expired");
          } else if (data.user?.email_confirmed_at) {
            // User is verified, redirect and show success message
            toast.success("Email verified successfully!");
            
            // Navigate to dashboard and remove the token from URL
            navigate('/dashboard', { replace: true });
          }
        } catch (err) {
          console.error("Error processing access token:", err);
        }
      }
    };
    
    handleAccessToken();
  }, [location, navigate]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        if (event === 'SIGNED_IN') {
          toast.success('Signed in successfully!');
          navigate('/dashboard');
        } else if (event === 'SIGNED_OUT') {
          toast.info('Signed out');
        } else if (event === 'USER_UPDATED') {
          if (session?.user.email_confirmed_at) {
            toast.success('Email verified successfully!');
            navigate('/dashboard');
          }
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getUserProfile = async () => {
    return await getProfile(user);
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

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      isLoading, 
      signOut, 
      getUserProfile,
      resendVerificationEmail,
      updateUserProfile,
      deleteUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};
