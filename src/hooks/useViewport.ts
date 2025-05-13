
import { useState, useEffect } from 'react';
import { isMobileDevice, isTabletDevice, getViewportSize } from '@/utils/device-detection';

export function useViewport() {
  const [isMobile, setIsMobile] = useState<boolean>(isMobileDevice());
  const [isTablet, setIsTablet] = useState<boolean>(isTabletDevice());
  const [viewportSize, setViewportSize] = useState<string>(getViewportSize());
  const [width, setWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 0);
  const [height, setHeight] = useState<number>(typeof window !== 'undefined' ? window.innerHeight : 0);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(isMobileDevice());
      setIsTablet(isTabletDevice());
      setViewportSize(getViewportSize());
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };

    // Set initial values
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    viewportSize,
    width,
    height,
    isSmallScreen: width < 640, // xs
    isMediumScreen: width >= 640 && width < 1024, // sm and md
    isLargeScreen: width >= 1024, // lg and xl
  };
}
