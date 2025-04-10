
import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { AuthState } from "./types";
import { useAuthSession } from './useAuthSession';
import { useAuthFunctions } from "./authHooks";
import { initializeStorageBucket } from "./authUtils";
import { useDebugMode } from "@/hooks/useDebugMode";

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  isLoading: true,
  isDebugMode: false,
  signOut: async () => {},
  getUserProfile: async () => null,
  resendVerificationEmail: async () => {},
  updateUserProfile: async () => {},
  deleteUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session, isLoading } = useAuthSession();
  const [isDebugMode, debugOptions] = useDebugMode();
  
  const {
    signOut,
    getUserProfile,
    resendVerificationEmail,
    updateUserProfile,
    deleteUser,
    bucketInitialized,
    setBucketInitialized
  } = useAuthFunctions(isDebugMode ? { id: debugOptions.mockUserId, email: debugOptions.mockUserEmail } : user);

  useEffect(() => {
    if (isDebugMode && debugOptions.bypassAuth) {
      console.log('🔧 Debug mode enabled: Authentication bypass active');
      console.log(`Using mock user: ID=${debugOptions.mockUserId}, Email=${debugOptions.mockUserEmail}`);
    }
  }, [isDebugMode, debugOptions]);

  useEffect(() => {
    initializeStorageBucket().then(result => {
      setBucketInitialized(result);
    });
  }, [setBucketInitialized]);

  // Create a mock user and session if we're in debug mode with bypass
  const effectiveUser = (isDebugMode && debugOptions.bypassAuth) 
    ? { id: debugOptions.mockUserId, email: debugOptions.mockUserEmail } as User
    : user;
  
  const effectiveSession = (isDebugMode && debugOptions.bypassAuth && !session) 
    ? { user: effectiveUser } as Session
    : session;
  
  const effectiveIsLoading = (isDebugMode && debugOptions.bypassAuth) ? false : isLoading;

  return (
    <AuthContext.Provider value={{ 
      user: effectiveUser, 
      session: effectiveSession, 
      isLoading: effectiveIsLoading,
      isDebugMode,
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
