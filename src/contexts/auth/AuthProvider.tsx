
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthSession } from './useAuthSession';
import { useAuthFunctions } from './authHooks';
import { AuthContextProps } from './types';

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

  // Check for new signup flow from localStorage
  useEffect(() => {
    const isNewSignUp = localStorage.getItem("newSignUp") === "true";
    
    // If this is a new signup and we're not already on profile setup, redirect
    if (isNewSignUp && location.pathname !== '/profile-setup') {
      console.log("Detected new signup flag, redirecting to profile setup");
      navigate('/profile-setup', { replace: true });
      
      // Clear the flag after redirection (will be reset if needed)
      setTimeout(() => {
        localStorage.removeItem("newSignUp");
      }, 5000);
    }
  }, [location.pathname, navigate]);

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
