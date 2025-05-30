import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthContextProps, AuthState } from './types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Default context state
const defaultContextState: AuthContextProps = {
  session: null,
  user: null,
  isLoading: true,
  signOut: async () => {},
  deleteUser: async () => {},
  isDebugMode: false
};

// Create the context
const AuthContext = createContext<AuthContextProps>(defaultContextState);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    isLoading: true
  });
  const [isDebugMode] = useState<boolean>(false);

  // Initialize auth state from Supabase
  useEffect(() => {
    // Set the initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        session,
        user: session?.user ?? null,
        isLoading: false
      });
    }).catch(error => {
      console.error("Error getting session:", error);
      setState(prev => ({ ...prev, isLoading: false }));
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        session,
        user: session?.user ?? null,
        isLoading: false
      });
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Sign in error:", error);
        toast.error("Failed to sign in", {
          description: error.message
        });
        return { error, data: null };
      }
      
      toast.success("Signed in successfully");
      return { error: null, data: data.session };
    } catch (err) {
      console.error("Sign in exception:", err);
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      toast.error("Sign in failed");
      return { error, data: null };
    }
  }, []);

  // Sign up with email and password
  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) {
        console.error("Sign up error:", error);
        toast.error("Failed to sign up", {
          description: error.message
        });
        return { error, data: { user: null, session: null } };
      }
      
      toast.success("Signed up successfully", {
        description: "Please check your email for verification."
      });
      return { error: null, data };
    } catch (err) {
      console.error("Sign up exception:", err);
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      toast.error("Sign up failed");
      return { error, data: { user: null, session: null } };
    }
  }, []);

  // Sign out (updated: clear all state + onboarding localStorage keys)
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();

      // Remove all relevant keys on logout to avoid state leaks
      const keysToClear = [
        "userId",
        "userEmail",
        "userName",
        "newSignUp",
        "userIntent",
        "onboardingComplete",
        "onboardingSkipped",
        "onboardingSkippedTime",
        "bypassVerification",
        "profileSetupLoading",
        "emailVerified",
        "verifiedEmail",
        // --- Add these keys relevant to onboarding flow ---
        "pendingVerificationEmail",
        "pendingVerificationName",
        "verificationResendCount",
        "signupStep"
      ];
      keysToClear.forEach((key) => localStorage.removeItem(key));

      setState({
        session: null,
        user: null,
        isLoading: false
      });

      navigate('/');
      toast.success("Signed out successfully");

      // Extra: log for debugging
      // eslint-disable-next-line no-console
      console.log("All onboarding/auth localStorage cleared (signOut). State reset.");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  }, [navigate]);

  // Delete user account (updated: now calls edge function)
  const deleteUser = useCallback(async () => {
    try {
      if (!state.user) {
        toast.error("No user is signed in");
        return;
      }
      
      console.log("Initiating account deletion for user:", state.user.id);
      
      // Call the edge function to delete the account
      const { data, error } = await supabase.functions.invoke('delete-user-account', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) {
        console.error("Error deleting account:", error);
        throw new Error(error.message || "Failed to delete account");
      }

      console.log("Account deletion successful:", data);
      
      // Clear all localStorage keys
      const keysToClear = [
        "userId", "userEmail", "userName", "newSignUp", "userIntent",
        "onboardingComplete", "onboardingSkipped", "onboardingSkippedTime",
        "bypassVerification", "profileSetupLoading", "emailVerified",
        "verifiedEmail", "pendingVerificationEmail", "pendingVerificationName",
        "verificationResendCount", "signupStep", "recent_marketplace_searches"
      ];
      keysToClear.forEach((key) => localStorage.removeItem(key));

      // Update state
      setState({
        session: null,
        user: null,
        isLoading: false
      });

      toast.success("Account deleted successfully");
      navigate('/');
      
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account", {
        description: error instanceof Error ? error.message : "Please try again"
      });
      throw error;
    }
  }, [state.user, navigate]);

  // Create context value
  const value: AuthContextProps = {
    ...state,
    signIn,
    signUp,
    signOut,
    deleteUser,
    isDebugMode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
