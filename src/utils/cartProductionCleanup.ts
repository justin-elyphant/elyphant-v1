/**
 * One-time production deployment cleanup
 * Run this in App.tsx on mount to clear legacy carts
 */
export const performProductionCartCleanup = (): void => {
  try {
    const CLEANUP_VERSION_KEY = 'cart_cleanup_v2_completed';
    
    // Only run once per browser
    if (localStorage.getItem(CLEANUP_VERSION_KEY)) {
      return;
    }
    
    console.log('[PRODUCTION CLEANUP] Running one-time cart cleanup');
    
    // Find all cart keys
    const cartKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('cart_') || key === 'guest_cart')) {
        cartKeys.push(key);
      }
    }
    
    // Clear ALL carts (they'll be recreated with proper version)
    cartKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`[PRODUCTION CLEANUP] Removed legacy cart: ${key}`);
    });
    
    // Mark cleanup as complete
    localStorage.setItem(CLEANUP_VERSION_KEY, new Date().toISOString());
    
    console.log(`[PRODUCTION CLEANUP] Cleared ${cartKeys.length} legacy carts`);
    
  } catch (error) {
    console.error('[PRODUCTION CLEANUP] Failed:', error);
  }
};
