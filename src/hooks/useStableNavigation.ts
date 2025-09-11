import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Custom hook to prevent rapid navigation calls that can cause infinite loops
 * and random refreshes. Includes debouncing and navigation guards.
 */
export function useStableNavigation() {
  const navigate = useNavigate();
  const lastNavigationRef = useRef<{ path: string; timestamp: number } | null>(null);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const stableNavigate = useCallback((
    path: string, 
    options?: { replace?: boolean; delay?: number }
  ) => {
    const now = Date.now();
    const { replace = false, delay = 0 } = options || {};

    // Prevent rapid duplicate navigations to the same path
    if (lastNavigationRef.current) {
      const { path: lastPath, timestamp: lastTime } = lastNavigationRef.current;
      if (lastPath === path && now - lastTime < 1000) {
        console.log('[Navigation] Preventing duplicate navigation to:', path);
        return;
      }
    }

    // Clear any pending navigation
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    const doNavigate = () => {
      lastNavigationRef.current = { path, timestamp: now };
      navigate(path, { replace });
    };

    if (delay > 0) {
      navigationTimeoutRef.current = setTimeout(doNavigate, delay);
    } else {
      doNavigate();
    }
  }, [navigate]);

  const resetNavigation = useCallback(() => {
    lastNavigationRef.current = null;
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
  }, []);

  return { stableNavigate, resetNavigation };
}