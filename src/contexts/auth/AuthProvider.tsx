
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useAuthSession } from '@/hooks/auth/useAuthSession';
import { useDebugMode } from '@/hooks/useDebugMode';
import { useAuthFunctions } from './authHooks';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isProcessingToken: boolean;
  isDebugMode: boolean;
  signOut: () => Promise<void>;
  deleteUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  isProcessingToken: false,
  isDebugMode: false,
  signOut: async () => {},
  deleteUser: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, user, isLoading, isProcessingToken } = useAuthSession();
  const [isDebugMode] = useDebugMode();
  const { signOut, deleteUser } = useAuthFunctions(user);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoading,
        isProcessingToken,
        isDebugMode,
        signOut,
        deleteUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
