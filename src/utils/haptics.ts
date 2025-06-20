
/**
 * Enhanced haptic feedback utilities for iOS devices with better performance
 */

export const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'selection' | 'impact' | 'notification' | 'success' | 'warning' | 'error' = 'light') => {
  // Check if device supports haptic feedback
  if (typeof window === 'undefined') return;
  
  try {
    // iOS Haptic Feedback API (preferred method)
    // @ts-ignore - iOS specific API
    if ('DeviceMotionEvent' in window && window.DeviceMotionEvent?.requestPermission) {
      // Try to use iOS haptic feedback patterns
      // @ts-ignore - iOS specific haptic patterns
      if (window.navigator?.vibrate) {
        const patterns = {
          light: [5],
          medium: [10],
          heavy: [25],
          selection: [3],
          impact: [15],
          notification: [10, 5, 10],
          success: [5, 5, 15],
          warning: [15, 10, 15],
          error: [25, 10, 25, 10, 25]
        };
        
        window.navigator.vibrate(patterns[type] || patterns.light);
        return;
      }
    }
    
    // Fallback to standard vibration API
    if ('vibrate' in navigator) {
      const vibrationPatterns = {
        light: 10,
        medium: 20,
        heavy: 50,
        selection: [5, 10, 5],
        impact: 30,
        notification: [20, 50, 20],
        success: [10, 10, 30],
        warning: [30, 20, 30],
        error: [50, 20, 50, 20, 50]
      };
      
      const pattern = vibrationPatterns[type] || vibrationPatterns.light;
      navigator.vibrate(pattern);
    }
    
  } catch (error) {
    console.warn('Haptic feedback not supported:', error);
  }
};

export const isHapticSupported = (): boolean => {
  return typeof window !== 'undefined' && 
         ('vibrate' in navigator || 
          // @ts-ignore - iOS specific check
          ('DeviceMotionEvent' in window && window.DeviceMotionEvent?.requestPermission));
};

export const isiOS = (): boolean => {
  return typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const isAndroid = (): boolean => {
  return typeof window !== 'undefined' && /Android/.test(navigator.userAgent);
};

// Enhanced haptic patterns for different interactions
export const HapticPatterns = {
  buttonTap: 'light' as const,
  cardTap: 'medium' as const,
  longPress: 'heavy' as const,
  swipeAction: 'selection' as const,
  addToCart: 'success' as const,
  removeItem: 'warning' as const,
  errorAction: 'error' as const,
  navigationTap: 'light' as const,
  pullRefresh: 'medium' as const,
  zoomIn: 'light' as const,
  zoomOut: 'light' as const,
  imageSwipe: 'selection' as const,
  wishlistAdd: 'success' as const,
  wishlistRemove: 'warning' as const,
  shareAction: 'light' as const,
  focusChange: 'selection' as const
};

// Long press gesture handler with haptic feedback
export const createLongPressHandler = (
  onLongPress: () => void,
  delay: number = 500
) => {
  let pressTimer: NodeJS.Timeout | null = null;
  let startTime: number = 0;
  
  const start = (e: TouchEvent | MouseEvent) => {
    startTime = Date.now();
    pressTimer = setTimeout(() => {
      triggerHapticFeedback('heavy');
      onLongPress();
    }, delay);
    
    // Add visual feedback class
    if (e.target instanceof Element) {
      e.target.classList.add('long-press-active');
    }
  };
  
  const end = (e: TouchEvent | MouseEvent) => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
    
    // Remove visual feedback class
    if (e.target instanceof Element) {
      e.target.classList.remove('long-press-active');
    }
    
    // Light haptic for regular tap if it wasn't a long press
    const duration = Date.now() - startTime;
    if (duration < delay) {
      triggerHapticFeedback('light');
    }
  };
  
  return { start, end };
};

// Request haptic permission on iOS (if needed)
export const requestHapticPermission = async (): Promise<boolean> => {
  if (!isiOS()) return true;
  
  try {
    // @ts-ignore - iOS specific API
    if ('DeviceMotionEvent' in window && typeof DeviceMotionEvent.requestPermission === 'function') {
      // @ts-ignore
      const permission = await DeviceMotionEvent.requestPermission();
      return permission === 'granted';
    }
    return true;
  } catch (error) {
    console.warn('Could not request haptic permission:', error);
    return false;
  }
};

// Accessibility-aware haptic feedback
export const triggerAccessibleHaptic = (type: keyof typeof HapticPatterns, skipIfReducedMotion = true) => {
  // Check for reduced motion preference
  if (skipIfReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  
  triggerHapticFeedback(HapticPatterns[type]);
};
