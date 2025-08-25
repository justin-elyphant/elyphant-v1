import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

export type HeaderState = 'full' | 'compact' | 'minimal';

interface HeaderStateConfig {
  showSearch: boolean;
  showCart: boolean;
  height: string;
  logoSize: string;
  searchWidth: string;
}

export const useHeaderState = () => {
  const [headerState, setHeaderState] = useState<HeaderState>('full');
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const location = useLocation();

  // State configurations for modern e-commerce behavior
  const stateConfigs: Record<HeaderState, HeaderStateConfig> = {
    full: {
      showSearch: true,
      showCart: true,
      height: 'h-16 md:h-20',
      logoSize: 'w-32 md:w-48',
      searchWidth: 'flex-1 mx-6'
    },
    compact: {
      showSearch: true,
      showCart: true,
      height: 'h-14 md:h-16',
      logoSize: 'w-24 md:w-32',
      searchWidth: 'flex-1 mx-4'
    },
    minimal: {
      showSearch: false,
      showCart: true,
      height: 'h-12 md:h-14',
      logoSize: 'w-20 md:w-24',
      searchWidth: 'flex-1 mx-2'
    }
  };

  // Debounced scroll handler for performance
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    const scrollDifference = currentScrollY - lastScrollY;
    
    // Determine scroll direction
    setIsScrollingUp(scrollDifference < 0);
    
    // Progressive header states based on scroll position
    if (currentScrollY < 50) {
      setHeaderState('full');
    } else if (currentScrollY < 200) {
      setHeaderState('compact');
    } else {
      // Show minimal header when scrolling down, compact when scrolling up
      setHeaderState(scrollDifference > 0 ? 'minimal' : 'compact');
    }
    
    setLastScrollY(currentScrollY);
  }, [lastScrollY]);

  // Throttled scroll listener for better performance
  useEffect(() => {
    let ticking = false;
    
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [handleScroll]);

  // Reset to full header on route change
  useEffect(() => {
    setHeaderState('full');
    setLastScrollY(0);
  }, [location.pathname]);

  const currentConfig = stateConfigs[headerState];
  
  // Auto-detect features based on route
  const isAuthPage = ['/auth', '/reset-password'].includes(location.pathname);
  const finalConfig = {
    ...currentConfig,
    showSearch: currentConfig.showSearch && !isAuthPage,
    showCart: currentConfig.showCart && !isAuthPage
  };

  return {
    headerState,
    isScrollingUp,
    config: finalConfig,
    scrollY: lastScrollY
  };
};