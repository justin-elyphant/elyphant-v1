
/**
 * Utility functions for device detection and feature capability checks
 */

/**
 * Checks if the current device is touch-enabled
 * @returns boolean indicating if touch is supported
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  );
}

/**
 * Checks if the current device is a mobile device
 * @returns boolean indicating if the device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Checks if the current device is a tablet
 * @returns boolean indicating if the device is a tablet
 */
export function isTabletDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if device is iPad or Android tablet
  const isIPad = /iPad/i.test(navigator.userAgent);
  const isAndroidTablet = /Android/i.test(navigator.userAgent) && !/Mobile/i.test(navigator.userAgent);
  
  return isIPad || isAndroidTablet || (window.innerWidth >= 768 && window.innerWidth < 1024);
}

/**
 * Checks if the browser supports the Web Speech API for speech recognition
 * @returns boolean indicating if speech recognition is supported
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

/**
 * Checks if the device has a small screen (mobile)
 * @returns boolean indicating if the screen is small
 */
export function isSmallScreen(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.innerWidth < 768;
}

/**
 * Checks if the device is in portrait orientation
 * @returns boolean indicating if the device is in portrait mode
 */
export function isPortraitOrientation(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.innerHeight > window.innerWidth;
}

/**
 * Gets the device pixel ratio for high-DPI screens
 * @returns the device pixel ratio
 */
export function getDevicePixelRatio(): number {
  if (typeof window === 'undefined') return 1;
  
  return window.devicePixelRatio || 1;
}

/**
 * Checks if the device is using iOS
 * @returns boolean indicating if the device is running iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent;
  // Fixed: Removed MSStream check to resolve TypeScript error
  return /iPad|iPhone|iPod/.test(userAgent);
}

/**
 * Checks if the device is using Android
 * @returns boolean indicating if the device is running Android
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /Android/.test(navigator.userAgent);
}
