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
  const [isProcessingToken, setIsProcessingToken] = useState(false);
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
      const params = new URLSearchParams(location.hash.substring(1) || location.search);
      const accessToken = params.get('access_token') || null;
      
      if (accessToken && !isProcessingToken) {
        try {
          setIsProcessingToken(true);
          console.log("Processing access token from URL");
          
          // Get the email and verified parameters if they exist
          const email = params.get('email') || null;
          const verified = params.get('verified') === 'true';
          
          // Check if we're in the signup flow with verified=true
          if (verified && email && location.pathname === '/sign-up') {
            console.log("Detected verified=true in URL with email:", email);
            
            // No need to navigate - we're already on /sign-up
            // The SignUp component will handle the verified parameter
            setIsProcessingToken(false);
            return;
          }
          
          // Exchange the access token for a session
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error("Error getting session:", sessionError);
            toast.error("Verification failed: Invalid or expired token");
            setIsProcessingToken(false);
          } else if (sessionData?.session) {
            console.log("Session obtained from token");
            setSession(sessionData.session);
            setUser(sessionData.session.user);
            
            // Set a flag to show verification success message
            localStorage.setItem('email_just_verified', 'true');
            
            // Navigate to dashboard and remove the token from URL
            navigate('/dashboard', { replace: true });
            toast.success("Email verification successful!");
            setIsProcessingToken(false);
          }
        } catch (err) {
          console.error("Error processing access token:", err);
          setIsProcessingToken(false);
          toast.error("Failed to process verification. Please try again.");
        }
      }
    };
    
    handleAccessToken();
  }, [location, navigate, isProcessingToken]);

  // Setup auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state change event:", event);
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        if (event === 'SIGNED_IN') {
          toast.success('Signed in successfully!');
          
          // If this is right after email verification
          const emailJustVerified = localStorage.getItem('email_just_verified');
          if (emailJustVerified === 'true') {
            toast.success('Email verified successfully!');
            localStorage.removeItem('email_just_verified');
          }
          
          // Check if we're in the signup flow with verified=true
          const params = new URLSearchParams(location.search);
          const verified = params.get('verified') === 'true';
          
          if (verified && location.pathname === '/sign-up') {
            console.log("Already on sign-up page with verified=true, not navigating");
            // Don't navigate - let the signup component handle the flow
          } else {
            // Otherwise navigate to dashboard
            navigate('/dashboard');
          }
        } else if (event === 'SIGNED_OUT') {
          toast.info('Signed out');
        } else if (event === 'USER_UPDATED') {
          const emailJustVerified = localStorage.getItem('email_just_verified');
          
          if (session?.user.email_confirmed_at && emailJustVerified === 'true') {
            toast.success('Email verified successfully!');
            localStorage.removeItem('email_just_verified');
            
            // Check current location - if we're already on sign-up, don't navigate away
            if (location.pathname !== '/sign-up') {
              navigate('/dashboard');
            }
          }
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname, location.search]);

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
