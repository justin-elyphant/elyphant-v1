import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

interface HeaderStateConfig {
  showSearch: boolean;
  showCart: boolean;
  height: string;
  logoSize: string;
  searchWidth: string;
}

export const useHeaderState = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const location = useLocation();

  // Simplified consistent configuration - no layout changes
  const config: HeaderStateConfig = {
    showSearch: true,
    showCart: true,
    height: 'h-12 md:h-14',
    logoSize: 'w-32 md:w-48',
    searchWidth: 'flex-1 mx-6'
  };

  // Simple scroll handler for subtle visual changes only
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    setIsScrolled(currentScrollY > 20);
    setLastScrollY(currentScrollY);
  }, []);

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

  // Reset scroll state on route change
  useEffect(() => {
    setIsScrolled(false);
    setLastScrollY(0);
  }, [location.pathname]);

  // Auto-detect features based on route
  const isAuthPage = ['/auth', '/reset-password'].includes(location.pathname);
  const finalConfig = {
    ...config,
    showSearch: config.showSearch && !isAuthPage,
    showCart: config.showCart && !isAuthPage
  };

  return {
    isScrolled,
    config: finalConfig,
    scrollY: lastScrollY
  };
};