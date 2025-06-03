
// Haptic feedback utility for iOS devices
export const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'selection' = 'light') => {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      // Check if we're on iOS and have haptic feedback support
      if ('hapticFeedback' in window) {
        const haptic = (window as any).hapticFeedback;
        switch (type) {
          case 'light':
            haptic.impactOccurred('light');
            break;
          case 'medium':
            haptic.impactOccurred('medium');
            break;
          case 'heavy':
            haptic.impactOccurred('heavy');
            break;
          case 'selection':
            haptic.selectionChanged();
            break;
        }
      } else {
        // Fallback for Android and other devices
        const patterns = {
          light: [10],
          medium: [50],
          heavy: [100],
          selection: [25]
        };
        navigator.vibrate(patterns[type]);
      }
    } catch (error) {
      console.warn('Haptic feedback not supported:', error);
    }
  }
};
