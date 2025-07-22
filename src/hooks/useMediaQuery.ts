
import { useState, useEffect } from 'react';

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Guard against SSR and iframe issues
    if (typeof window === 'undefined') return;
    
    let media: MediaQueryList;
    
    try {
      media = window.matchMedia(query);
      setMatches(media.matches);
      
      const listener = (e: MediaQueryListEvent) => {
        setMatches(e.matches);
      };
      
      // Use the modern addEventListener if available
      if (media.addEventListener) {
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
      } else {
        // Fallback for older browsers
        media.addListener(listener);
        return () => media.removeListener(listener);
      }
    } catch (error) {
      console.warn('MediaQuery not supported:', error);
      return;
    }
  }, [query]); // Only depend on query, not matches

  return matches;
};
