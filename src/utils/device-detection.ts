
/**
 * Device detection utility functions
 */

/**
 * Detects if the current device is a mobile device
 * @returns {boolean} True if the device is mobile
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
};

/**
 * Detects if the current device is a tablet
 * @returns {boolean} True if the device is a tablet
 */
export const isTabletDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent;
  
  // Check if it's an iPad specifically
  const isIpad = /iPad/i.test(userAgent);
  
  // Check for other tablets based on screen size
  const isTablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent);
  
  // Use screen size as additional check
  const hasTabletScreenSize = window.innerWidth >= 600 && window.innerWidth < 1200;
  
  return isIpad || isTablet || (isMobileDevice() && hasTabletScreenSize);
};

/**
 * Detects if the current device is a desktop
 * @returns {boolean} True if the device is desktop
 */
export const isDesktopDevice = (): boolean => {
  return !isMobileDevice() && !isTabletDevice();
};

/**
 * Determines if the current device is a touch device
 * @returns {boolean} True if touch is supported
 */
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return (('ontouchstart' in window) ||
     (navigator.maxTouchPoints > 0));
};

/**
 * Detects viewport size category
 * @returns {string} 'xs', 'sm', 'md', 'lg', or 'xl'
 */
export const getViewportSize = (): string => {
  if (typeof window === 'undefined') return 'md';
  
  const width = window.innerWidth;
  
  if (width < 640) return 'xs';  // Extra small
  if (width < 768) return 'sm';  // Small
  if (width < 1024) return 'md'; // Medium
  if (width < 1280) return 'lg'; // Large
  return 'xl';                   // Extra large
};

/**
 * Checks if the window matches the given breakpoint
 * @param {string} breakpoint - 'xs', 'sm', 'md', 'lg', or 'xl'
 * @returns {boolean} True if the breakpoint matches
 */
export const matchesBreakpoint = (breakpoint: string): boolean => {
  const size = getViewportSize();
  return size === breakpoint;
};

/**
 * Detects if the browser is Safari
 * @returns {boolean} True if the browser is Safari
 */
export const isSafari = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent;
  return userAgent.includes('Safari') && !userAgent.includes('Chrome');
};

/**
 * Detects if the device is iOS
 * @returns {boolean} True if the device is iOS
 */
export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent;
  // Fixed: Removed MSStream check to resolve TypeScript error
  return /iPad|iPhone|iPod/.test(userAgent);
};

/**
 * Detects if the device is Android
 * @returns {boolean} True if the device is Android
 */
export const isAndroid = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /Android/.test(navigator.userAgent);
};
