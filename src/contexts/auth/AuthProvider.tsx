
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useAuthSession } from './useAuthSession';
import { useAuthFunctions } from './authHooks';
import { AuthContextProps } from './types';
import { EmployeeDetectionService } from '@/services/employee/EmployeeDetectionService';

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user, session, isLoading, isProcessingToken } = useAuthSession();
  const { signOut, deleteUser } = useAuthFunctions(user);
  const [isEmployee, setIsEmployee] = useState<boolean | null>(null);
  
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

  // Detect employee status when user changes
  useEffect(() => {
    if (user && !isLoading) {
      EmployeeDetectionService.detectEmployee(user).then(detection => {
        setIsEmployee(detection.isEmployee);
        
        if (isDebugMode) {
          console.log('AuthProvider: Employee detection complete', {
            isEmployee: detection.isEmployee,
            reason: detection.reason,
            email: user.email
          });
        }
      }).catch(error => {
        console.error('AuthProvider: Employee detection failed', error);
        setIsEmployee(false);
      });
    } else {
      setIsEmployee(null);
    }
  }, [user, isLoading, isDebugMode]);

  const contextValue: AuthContextProps = {
    user,
    session,
    isLoading,
    signOut,
    deleteUser,
    isDebugMode,
    isEmployee
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
