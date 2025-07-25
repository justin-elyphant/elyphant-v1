
import React, { createContext, useContext, ReactNode } from 'react';
import { useAuthSession } from './useAuthSession';
import { useAuthFunctions } from './authHooks';
import { AuthContextProps } from './types';

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user, session, isLoading, isProcessingToken } = useAuthSession();
  const { signOut, deleteUser } = useAuthFunctions(user);
  
  // Debug mode for development
  const isDebugMode = process.env.NODE_ENV === 'development';
  
  // Optimized debug logging (only when necessary)
  if (isDebugMode && (isLoading || isProcessingToken)) {
    console.log("AuthProvider - Loading state:", {
      hasUser: !!user,
      isLoading,
      isProcessingToken
    });
  }

  const contextValue: AuthContextProps = {
    user,
    session,
    isLoading,
    signOut,
    deleteUser,
    isDebugMode
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
