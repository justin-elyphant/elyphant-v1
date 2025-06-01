
/**
 * Haptic feedback utilities for iOS devices
 */

export const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'selection' | 'impact' | 'notification' = 'light') => {
  // Check if device supports haptic feedback
  if (typeof window === 'undefined') return;
  
  try {
    // Modern Haptic Feedback API
    if ('vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(20);
          break;
        case 'heavy':
          navigator.vibrate(50);
          break;
        case 'selection':
          navigator.vibrate([5, 10, 5]);
          break;
        case 'impact':
          navigator.vibrate(30);
          break;
        case 'notification':
          navigator.vibrate([20, 50, 20]);
          break;
      }
    }
    
    // iOS Haptic Feedback (if available)
    // @ts-ignore - iOS specific API
    if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') {
      // This is an iOS device with haptic support
      // The actual haptic feedback will be handled by CSS touch-action and user interaction
    }
  } catch (error) {
    console.warn('Haptic feedback not supported:', error);
  }
};

export const isHapticSupported = (): boolean => {
  return typeof window !== 'undefined' && 'vibrate' in navigator;
};

export const isiOS = (): boolean => {
  return typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
};
