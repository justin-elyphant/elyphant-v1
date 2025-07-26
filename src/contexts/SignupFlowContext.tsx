import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SignupFlowContextType {
  isSignupFlowActive: boolean;
  setSignupFlowActive: (active: boolean) => void;
  preventNavigation: boolean;
  setPrevention: (prevent: boolean) => void;
}

const SignupFlowContext = createContext<SignupFlowContextType | undefined>(undefined);

export const SignupFlowProvider = ({ children }: { children: ReactNode }) => {
  const [isSignupFlowActive, setIsSignupFlowActive] = useState(false);
  const [preventNavigation, setPrevention] = useState(false);

  const setSignupFlowActive = (active: boolean) => {
    console.log(`🔄 SignupFlowContext: Setting signup flow ${active ? 'ACTIVE' : 'INACTIVE'}`);
    setIsSignupFlowActive(active);
    setPrevention(active); // When signup flow is active, prevent navigation
  };

  return (
    <SignupFlowContext.Provider
      value={{
        isSignupFlowActive,
        setSignupFlowActive,
        preventNavigation,
        setPrevention
      }}
    >
      {children}
    </SignupFlowContext.Provider>
  );
};

export const useSignupFlow = () => {
  const context = useContext(SignupFlowContext);
  if (!context) {
    throw new Error('useSignupFlow must be used within SignupFlowProvider');
  }
  return context;
};