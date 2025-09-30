import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useSimpleNicole } from "@/hooks/useSimpleNicole";

interface NicoleDropdownContextValue {
  // State
  isDropdownOpen: boolean;
  isModalOpen: boolean;
  
  // Actions
  openDropdown: () => void;
  closeDropdown: () => void;
  toggleDropdown: () => void;
  expandToModal: () => void;
  minimizeToDropdown: () => void;
  closeAll: () => void;
  
  // Nicole state from hook
  messages: Array<{ role: 'user' | 'assistant'; content: string; ctaButtons?: any[] }>;
  context: any;
  isLoading: boolean;
  isAuthLoading: boolean;
  sendMessage: (message: string) => Promise<any>;
  startDynamicGreeting: (greetingContext?: any) => Promise<any>;
  clearConversation: () => void;
}

const NicoleDropdownContext = createContext<NicoleDropdownContextValue | undefined>(undefined);

export const useNicoleDropdown = () => {
  const context = useContext(NicoleDropdownContext);
  if (!context) {
    throw new Error("useNicoleDropdown must be used within NicoleDropdownProvider");
  }
  return context;
};

interface NicoleDropdownProviderProps {
  children: ReactNode;
}

export const NicoleDropdownProvider: React.FC<NicoleDropdownProviderProps> = ({ children }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Get Nicole functionality from the hook
  const nicoleHook = useSimpleNicole();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      nicoleHook.clearConversation();
    };
  }, []);

  const openDropdown = useCallback(() => {
    setIsDropdownOpen(true);
    setIsModalOpen(false);
  }, []);

  const closeDropdown = useCallback(() => {
    setIsDropdownOpen(false);
  }, []);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(prev => !prev);
    setIsModalOpen(false);
  }, []);

  const expandToModal = useCallback(() => {
    setIsDropdownOpen(false);
    setIsModalOpen(true);
  }, []);

  const minimizeToDropdown = useCallback(() => {
    setIsModalOpen(false);
    setIsDropdownOpen(true);
  }, []);

  const closeAll = useCallback(() => {
    setIsDropdownOpen(false);
    setIsModalOpen(false);
  }, []);

  const value: NicoleDropdownContextValue = {
    isDropdownOpen,
    isModalOpen,
    openDropdown,
    closeDropdown,
    toggleDropdown,
    expandToModal,
    minimizeToDropdown,
    closeAll,
    ...nicoleHook
  };

  return (
    <NicoleDropdownContext.Provider value={value}>
      {children}
    </NicoleDropdownContext.Provider>
  );
};
