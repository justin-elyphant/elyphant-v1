
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
  
  // Enhanced debugging
  console.log("AuthProvider - Current state:", {
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    hasSession: !!session,
    isLoading,
    isProcessingToken,
    localStorage_userId: localStorage.getItem('userId'),
    localStorage_userEmail: localStorage.getItem('userEmail')
  });

  // Clear stale localStorage if user is null but localStorage has data
  if (!user && !isLoading && !isProcessingToken) {
    const storedUserId = localStorage.getItem('userId');
    const storedUserEmail = localStorage.getItem('userEmail');
    
    if (storedUserId || storedUserEmail) {
      console.log("Clearing stale localStorage data - user is null but localStorage has data");
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
    }
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
