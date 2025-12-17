
/**
 * Enhanced haptic feedback utilities with native Capacitor support
 * - iOS: Native Taptic Engine via @capacitor/haptics
 * - Android: Native vibration via @capacitor/haptics
 * - Android Web: Web Vibration API fallback
 * - iOS Safari: Graceful no-op (Apple blocks vibration)
 */

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export type HapticType = 
  | 'light' 
  | 'medium' 
  | 'heavy' 
  | 'selection' 
  | 'impact' 
  | 'notification' 
  | 'success' 
  | 'warning' 
  | 'error';

/**
 * Trigger haptic feedback - uses native Capacitor on iOS/Android apps,
 * falls back to Web Vibration API on Android browsers
 */
export const triggerHapticFeedback = async (type: HapticType = 'light'): Promise<void> => {
  if (typeof window === 'undefined') return;
  
  // Check for reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  
  try {
    // Use native Capacitor haptics when running as native app
    if (Capacitor.isNativePlatform()) {
      await triggerNativeHaptic(type);
      return;
    }
    
    // Fallback to Web Vibration API (works on Android browsers)
    triggerWebVibration(type);
  } catch (error) {
    // Silently fail - haptics are enhancement, not critical
    console.debug('Haptic feedback not available:', error);
  }
};

/**
 * Native Capacitor haptics for iOS Taptic Engine and Android vibration
 */
const triggerNativeHaptic = async (type: HapticType): Promise<void> => {
  switch (type) {
    // Impact styles
    case 'light':
      await Haptics.impact({ style: ImpactStyle.Light });
      break;
    case 'medium':
      await Haptics.impact({ style: ImpactStyle.Medium });
      break;
    case 'heavy':
      await Haptics.impact({ style: ImpactStyle.Heavy });
      break;
    
    // Selection feedback (subtle tap)
    case 'selection':
      await Haptics.selectionStart();
      await Haptics.selectionEnd();
      break;
    
    // Notification styles
    case 'success':
      await Haptics.notification({ type: NotificationType.Success });
      break;
    case 'warning':
      await Haptics.notification({ type: NotificationType.Warning });
      break;
    case 'error':
      await Haptics.notification({ type: NotificationType.Error });
      break;
    
    // Aliases
    case 'impact':
      await Haptics.impact({ style: ImpactStyle.Medium });
      break;
    case 'notification':
      await Haptics.notification({ type: NotificationType.Success });
      break;
    
    default:
      await Haptics.impact({ style: ImpactStyle.Light });
  }
};

/**
 * Web Vibration API fallback for Android browsers
 * Note: iOS Safari does NOT support vibration API
 */
const triggerWebVibration = (type: HapticType): void => {
  if (!('vibrate' in navigator)) return;
  
  const vibrationPatterns: Record<HapticType, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 50,
    selection: 5,
    impact: 30,
    notification: [20, 50, 20],
    success: [10, 10, 30],
    warning: [30, 20, 30],
    error: [50, 20, 50, 20, 50]
  };
  
  const pattern = vibrationPatterns[type] || vibrationPatterns.light;
  navigator.vibrate(pattern);
};

/**
 * Check if haptic feedback is supported on current platform
 */
export const isHapticSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Native Capacitor apps always support haptics
  if (Capacitor.isNativePlatform()) return true;
  
  // Web Vibration API (Android browsers only)
  return 'vibrate' in navigator;
};

/**
 * Check if running on iOS device
 */
export const isiOS = (): boolean => {
  return typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
};

/**
 * Check if running on Android device
 */
export const isAndroid = (): boolean => {
  return typeof window !== 'undefined' && /Android/.test(navigator.userAgent);
};

/**
 * E-commerce haptic patterns - semantic mapping for common interactions
 */
export const HapticPatterns = {
  // Cart actions
  addToCart: 'success' as const,
  removeItem: 'warning' as const,
  updateQuantity: 'light' as const,
  clearCart: 'warning' as const,
  
  // Wishlist actions
  wishlistAdd: 'success' as const,
  wishlistRemove: 'warning' as const,
  
  // Navigation & UI
  buttonTap: 'light' as const,
  cardTap: 'medium' as const,
  navigationTap: 'light' as const,
  tabSwitch: 'selection' as const,
  
  // Gestures
  longPress: 'heavy' as const,
  swipeAction: 'selection' as const,
  pullRefresh: 'medium' as const,
  
  // Product interaction
  zoomIn: 'light' as const,
  zoomOut: 'light' as const,
  imageSwipe: 'selection' as const,
  
  // Feedback
  errorAction: 'error' as const,
  successAction: 'success' as const,
  shareAction: 'light' as const,
  focusChange: 'selection' as const,
  
  // Checkout
  checkoutStart: 'medium' as const,
  orderConfirmed: 'success' as const,
  paymentError: 'error' as const
};

/**
 * Convenience function using semantic patterns
 */
export const triggerAccessibleHaptic = (pattern: keyof typeof HapticPatterns): void => {
  triggerHapticFeedback(HapticPatterns[pattern]);
};

/**
 * Long press gesture handler with haptic feedback
 */
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
    
    if (e.target instanceof Element) {
      e.target.classList.add('long-press-active');
    }
  };
  
  const end = (e: TouchEvent | MouseEvent) => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
    
    if (e.target instanceof Element) {
      e.target.classList.remove('long-press-active');
    }
    
    const duration = Date.now() - startTime;
    if (duration < delay) {
      triggerHapticFeedback('light');
    }
  };
  
  return { start, end };
};
