
import { useState, useEffect } from 'react';

type DebugOptions = {
  bypassAuth: boolean;
  mockUserId?: string;
  mockUserEmail?: string;
};

const DEFAULT_DEBUG_OPTIONS: DebugOptions = {
  bypassAuth: false,
  mockUserId: 'test-user-id',
  mockUserEmail: 'test@example.com',
};

/**
 * Hook to enable debug/test mode features throughout the app
 * This can be toggled via a URL parameter or localStorage
 */
export const useDebugMode = (): [boolean, DebugOptions] => {
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [debugOptions, setDebugOptions] = useState<DebugOptions>(DEFAULT_DEBUG_OPTIONS);

  useEffect(() => {
    // Check URL parameters for debug mode
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get('debug');
    
    // Check localStorage for persisted debug mode
    const storedDebugMode = localStorage.getItem('debug_mode');
    
    // Enable debug mode if either is set
    if (debugParam === 'true' || storedDebugMode === 'true') {
      setIsDebugMode(true);
      
      // Store in localStorage to persist across page loads
      if (debugParam === 'true' && !storedDebugMode) {
        localStorage.setItem('debug_mode', 'true');
      }
      
      // Load any custom debug options from localStorage
      const storedOptions = localStorage.getItem('debug_options');
      if (storedOptions) {
        try {
          const parsedOptions = JSON.parse(storedOptions);
          setDebugOptions({
            ...DEFAULT_DEBUG_OPTIONS,
            ...parsedOptions
          });
        } catch (e) {
          console.error('Failed to parse debug options:', e);
        }
      }
    }
    
    // Add a global method to toggle debug mode (accessible from console)
    (window as any).toggleDebugMode = (enable?: boolean, options?: Partial<DebugOptions>) => {
      const newState = enable === undefined ? !isDebugMode : enable;
      setIsDebugMode(newState);
      
      if (newState) {
        localStorage.setItem('debug_mode', 'true');
        
        // Update options if provided
        if (options) {
          const newOptions = { ...debugOptions, ...options };
          setDebugOptions(newOptions);
          localStorage.setItem('debug_options', JSON.stringify(newOptions));
          console.log('Debug options updated:', newOptions);
        }
      } else {
        localStorage.removeItem('debug_mode');
      }
      
      console.log(`Debug mode ${newState ? 'enabled' : 'disabled'}`);
      return newState;
    };
  }, [isDebugMode, debugOptions]);

  return [isDebugMode, debugOptions];
};
