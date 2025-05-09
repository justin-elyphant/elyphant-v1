
import React, { createContext, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useAuthSession } from '@/hooks/auth/useAuthSession';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isProcessingToken: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  isProcessingToken: false,
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

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoading,
        isProcessingToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
