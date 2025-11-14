/**
 * Feature Flags for Payment Flow Migration
 * Enables gradual rollout and A/B testing of Checkout Sessions
 */

interface FeatureFlags {
  USE_CHECKOUT_SESSIONS: boolean;
  USE_LEGACY_PAYMENT_INTENTS: boolean; // Fallback only
  ENABLE_GROUP_GIFT_CHECKOUT_SESSIONS: boolean;
  ENABLE_AUTO_GIFT_CHECKOUT_SESSIONS: boolean;
  ENABLE_PAYMENT_FLOW_LOGGING: boolean;
}

class FeatureFlagService {
  private flags: FeatureFlags = {
    // Default: Checkout Sessions enabled for all new flows
    USE_CHECKOUT_SESSIONS: true,
    
    // Legacy fallback (emergency use only)
    USE_LEGACY_PAYMENT_INTENTS: false,
    
    // Group gifts (migration complete, enabled)
    ENABLE_GROUP_GIFT_CHECKOUT_SESSIONS: true,
    
    // Auto-gifts (migration complete, enabled)
    ENABLE_AUTO_GIFT_CHECKOUT_SESSIONS: true,
    
    // Enhanced logging for debugging
    ENABLE_PAYMENT_FLOW_LOGGING: import.meta.env.DEV
  };

  // Check environment variable overrides
  constructor() {
    if (typeof window !== 'undefined') {
      // Allow runtime overrides via localStorage (dev/testing only)
      const storedFlags = localStorage.getItem('FEATURE_FLAGS');
      if (storedFlags && import.meta.env.DEV) {
        try {
          const parsed = JSON.parse(storedFlags);
          this.flags = { ...this.flags, ...parsed };
          console.log('📋 Feature flags loaded from localStorage:', this.flags);
        } catch (e) {
          console.error('Failed to parse feature flags:', e);
        }
      }
    }
  }

  isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags[flag] === true;
  }

  getAll(): FeatureFlags {
    return { ...this.flags };
  }

  // Dev-only: Set flag at runtime
  setFlag(flag: keyof FeatureFlags, value: boolean): void {
    if (!import.meta.env.DEV) {
      console.warn('Feature flags can only be modified in development');
      return;
    }
    this.flags[flag] = value;
    localStorage.setItem('FEATURE_FLAGS', JSON.stringify(this.flags));
    console.log(`✅ Feature flag ${flag} set to ${value}`);
  }

  // Dev-only: Reset all flags to defaults
  reset(): void {
    if (!import.meta.env.DEV) {
      console.warn('Feature flags can only be reset in development');
      return;
    }
    localStorage.removeItem('FEATURE_FLAGS');
    location.reload();
  }
}

export const featureFlagService = new FeatureFlagService();
export type { FeatureFlags };
