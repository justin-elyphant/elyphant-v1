/*
 * ========================================================================
 * 🔗 STRIPE CLIENT MANAGER - CENTRALIZED STRIPE ORCHESTRATION
 * ========================================================================
 * 
 * Single point of control for all Stripe client operations in the 
 * UnifiedPaymentService ecosystem. Replaces scattered stripePromise
 * initializations across components.
 * 
 * CRITICAL ARCHITECTURE:
 * - Only UnifiedPaymentService should use this directly
 * - Components get Stripe access through UnifiedPaymentService hooks
 * - Maintains single Stripe client instance across application
 * 
 * INTEGRATION BOUNDARIES:
 * - Used by: UnifiedPaymentService
 * - Used by: Payment form components (via Elements provider)
 * - Never used: Direct component access (use hooks instead)
 * 
 * Last update: 2025-01-23 (Week 5 Cleanup)
 * ========================================================================
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';

class StripeClientManager {
  private stripePromise: Promise<Stripe | null> | null = null;
  private stripePublishableKey: string | null = null;

  constructor() {
    this.initializeStripe();
  }

  /**
   * Initialize Stripe with publishable key
   * Supports multiple environment configurations
   */
  private initializeStripe(): void {
    // Use the Stripe publishable key from environment or fallback to your live key
    this.stripePublishableKey = 
      import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 
      'pk_live_51PxcV7JPK0Zkd1vcAlsGEoYr82Lr7eGxIiYeOG0Gne4lAfwIWOcw3MMJCyL4jk41NDxx5HlYwO8xkhUm3svy8imt00IWkGpE0Z';

    if (!this.stripePublishableKey) {
      console.error('❌ STRIPE CONFIGURATION ERROR: Publishable key not found. Payment functionality will not work.');
      return;
    }

    console.log('✅ Initializing Stripe with key:', this.stripePublishableKey.substring(0, 20) + '...');

    // Create single Stripe instance
    this.stripePromise = loadStripe(this.stripePublishableKey);
  }

  /**
   * Get Stripe instance (for Elements provider)
   * CRITICAL: Only use this for Elements wrapper
   */
  getStripePromise(): Promise<Stripe | null> | null {
    if (!this.stripePromise) {
      console.error('Stripe not initialized. Check publishable key configuration.');
      return null;
    }
    return this.stripePromise;
  }

  /**
   * Get initialized Stripe instance
   * For direct Stripe API calls (advanced usage)
   */
  async getStripeInstance(): Promise<Stripe | null> {
    if (!this.stripePromise) {
      console.error('❌ STRIPE ERROR: Stripe not initialized. Check publishable key configuration.');
      console.error('Current config:', this.getConfigurationStatus());
      return null;
    }

    try {
      const stripe = await this.stripePromise;
      if (!stripe) {
        console.error('❌ STRIPE ERROR: Failed to load Stripe. Check network connection and key validity.');
        console.error('Publishable key:', this.stripePublishableKey?.substring(0, 20) + '...');
      }
      return stripe;
    } catch (error) {
      console.error('❌ STRIPE ERROR: Exception while loading Stripe:', error);
      return null;
    }
  }

  /**
   * Check if Stripe is properly configured
   */
  isConfigured(): boolean {
    return !!(this.stripePublishableKey && this.stripePublishableKey !== 'pk_test_51...');
  }

  /**
   * Get configuration status for debugging
   */
  getConfigurationStatus(): {
    configured: boolean;
    keyPresent: boolean;
    keyValid: boolean;
  } {
    const keyPresent = !!this.stripePublishableKey;
    const keyValid = keyPresent && this.stripePublishableKey !== 'pk_test_51...';
    
    return {
      configured: this.isConfigured(),
      keyPresent,
      keyValid
    };
  }

  /**
   * Reinitialize Stripe (for dynamic key updates)
   */
  reinitialize(newPublishableKey?: string): void {
    if (newPublishableKey) {
      this.stripePublishableKey = newPublishableKey;
    }
    this.stripePromise = null;
    this.initializeStripe();
  }
}

// Export singleton instance
export const stripeClientManager = new StripeClientManager();
export default stripeClientManager;