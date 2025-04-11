
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

  // Enhanced check for new signup flow from localStorage
  useEffect(() => {
    // Only run this effect if we're not already on profile-setup
    if (location.pathname !== '/profile-setup') {
      const isNewSignUp = localStorage.getItem("newSignUp") === "true";
      
      if (isNewSignUp) {
        console.log("AuthProvider detected new signup flag, redirecting to profile setup");
        
        // Use a direct, reliable navigation method
        navigate('/profile-setup', { replace: true });
      }
    } else if (location.pathname === '/profile-setup') {
      // We're on profile setup now, consider clearing the flag
      console.log("On profile setup page, clearing newSignUp flag");
      localStorage.removeItem("newSignUp");
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
