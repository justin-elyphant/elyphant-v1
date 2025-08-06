import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type NicoleUIMode = 'floating' | 'search' | 'closed';

interface NicoleState {
  activeMode: NicoleUIMode;
  sessionId: string;
  isTransitioning: boolean;
  contextData?: {
    mode?: string;
    capability?: string;
    selectedIntent?: string;
  };
}

interface NicoleStateContextType {
  state: NicoleState;
  actions: {
    activateMode: (mode: NicoleUIMode, contextData?: any) => void;
    closeAllModes: () => void;
    setTransitioning: (transitioning: boolean) => void;
    canActivateMode: (mode: NicoleUIMode) => boolean;
  };
}

const NicoleStateContext = createContext<NicoleStateContextType | undefined>(undefined);

interface NicoleStateProviderProps {
  children: ReactNode;
}

export const NicoleStateProvider: React.FC<NicoleStateProviderProps> = ({ children }) => {
  const [state, setState] = useState<NicoleState>({
    activeMode: 'closed',
    sessionId: `nicole-unified-${Date.now()}`,
    isTransitioning: false,
    contextData: undefined
  });

  const activateMode = useCallback((mode: NicoleUIMode, contextData?: any) => {
    setState(prev => {
      // If trying to activate the same mode, do nothing
      if (prev.activeMode === mode) return prev;
      
      // If transitioning, ignore new activation requests
      if (prev.isTransitioning) return prev;
      
      return {
        ...prev,
        activeMode: mode,
        isTransitioning: true,
        contextData: contextData || undefined
      };
    });

    // Clear transitioning state after a short delay
    setTimeout(() => {
      setState(prev => ({ ...prev, isTransitioning: false }));
    }, 300);
  }, []);

  const closeAllModes = useCallback(() => {
    setState(prev => ({
      ...prev,
      activeMode: 'closed',
      isTransitioning: false,
      contextData: undefined
    }));
  }, []);

  const setTransitioning = useCallback((transitioning: boolean) => {
    setState(prev => ({ ...prev, isTransitioning: transitioning }));
  }, []);

  const canActivateMode = useCallback((mode: NicoleUIMode) => {
    // Can always close
    if (mode === 'closed') return true;
    
    // Can't activate if currently transitioning
    if (state.isTransitioning) return false;
    
    // Can activate if no other mode is active or if activating the same mode
    return state.activeMode === 'closed' || state.activeMode === mode;
  }, [state.activeMode, state.isTransitioning]);

  const contextValue: NicoleStateContextType = {
    state,
    actions: {
      activateMode,
      closeAllModes,
      setTransitioning,
      canActivateMode
    }
  };

  return (
    <NicoleStateContext.Provider value={contextValue}>
      {children}
    </NicoleStateContext.Provider>
  );
};

export const useNicoleState = () => {
  const context = useContext(NicoleStateContext);
  if (context === undefined) {
    throw new Error('useNicoleState must be used within a NicoleStateProvider');
  }
  return context;
};