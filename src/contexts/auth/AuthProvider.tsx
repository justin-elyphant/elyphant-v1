
import React, { createContext, useContext, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { AuthState } from "./types";
import { useAuthSession } from "./useAuthSession";
import { useAuthFunctions } from "./authHooks";
import { initializeStorageBucket } from "./authUtils";

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
  const { user, session, isLoading } = useAuthSession();
  const {
    signOut,
    getUserProfile,
    resendVerificationEmail,
    updateUserProfile,
    deleteUser,
    bucketInitialized,
    setBucketInitialized
  } = useAuthFunctions(user);

  useEffect(() => {
    initializeStorageBucket().then(result => {
      setBucketInitialized(result);
    });
  }, []);

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
