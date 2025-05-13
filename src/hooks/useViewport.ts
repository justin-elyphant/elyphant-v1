
import { useState, useEffect } from 'react';
import { isMobileDevice, isTabletDevice } from '@/utils/device-detection';

export const useViewport = () => {
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);
  const [isMobile, setIsMobile] = useState(isMobileDevice());
  const [isTablet, setIsTablet] = useState(isTabletDevice());
  
  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
      setIsMobile(window.innerWidth < 768 || isMobileDevice());
      setIsTablet(
        (window.innerWidth >= 768 && window.innerWidth < 1024) || 
        isTabletDevice()
      );
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
  };
};
