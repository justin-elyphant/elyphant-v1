
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

  // Enhanced check for new signup flow from localStorage with retry logic
  useEffect(() => {
    const isNewSignUp = localStorage.getItem("newSignUp") === "true";
    
    // If this is a new signup and we're not already on profile setup, redirect
    if (isNewSignUp && location.pathname !== '/profile-setup') {
      console.log("Detected new signup flag, redirecting to profile setup");
      
      // Use progressive redirect strategy
      navigate('/profile-setup', { replace: true });
      
      // Clear the flag after redirection (will be reset if needed)
      setTimeout(() => {
        // Only clear if we're now on the profile setup page
        if (window.location.pathname === '/profile-setup') {
          console.log("Successfully redirected to profile setup, clearing flag");
          localStorage.removeItem("newSignUp");
        } else {
          // Try another redirect method if we're still not on profile setup
          console.log("Still not on profile setup, trying direct location change");
          window.location.href = '/profile-setup';
        }
      }, 1000);
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
