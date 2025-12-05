/*
 * ========================================================================
 * 🔗 UNIFIED PAYMENT SERVICE TYPES
 * ========================================================================
 * 
 * Centralized type definitions for the UnifiedPaymentService ecosystem.
 * These types ensure consistency across all payment-related components.
 * 
 * Last major update: 2025-01-23 (Week 1 Implementation)
 * ========================================================================
 */

import { CartItem } from '@/contexts/CartContext';
import { Order } from '@/services/orderService';

// ============================================================================
// PAYMENT PROCESSING TYPES
// ============================================================================

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  orderId?: string;
  error?: string;
  details?: any;
}

export interface StripePaymentIntent {
  client_secret: string;
  payment_intent_id: string;
}

export interface PaymentProcessingOptions {
  saveAddress?: boolean;
  addressName?: string;
  isGift?: boolean;
  giftMessage?: string;
  scheduledDeliveryDate?: string;
  isSurpriseGift?: boolean;
}

// ============================================================================
// CART STATE TYPES
// ============================================================================

export interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  isProcessing: boolean;
}

export interface CartChangeEvent {
  type: 'add' | 'remove' | 'update' | 'clear' | 'assign_recipient';
  productId?: string;
  quantity?: number;
  recipientId?: string;
  cartState: CartState;
}

// ============================================================================
// ORDER PROCESSING TYPES
// ============================================================================

export interface OrderProcessingResult {
  order: Order;
  requiresZincProcessing: boolean;
  zincProcessingInitiated: boolean;
  error?: string;
}

export interface ZincOrderRequest {
  orderId: string;
  isTestMode?: boolean;
  debugMode?: boolean;
}

// ============================================================================
// INTEGRATION TYPES
// ============================================================================

export interface ServiceIntegrationStatus {
  productCatalogService: 'connected' | 'disconnected' | 'error';
  enhancedZincApiSystem: 'connected' | 'disconnected' | 'error';
  stripeApi: 'connected' | 'disconnected' | 'error';
  supabaseDatabase: 'connected' | 'disconnected' | 'error';
}

export interface PaymentServiceHealth {
  status: 'healthy' | 'degraded' | 'error';
  integrationStatus: ServiceIntegrationStatus;
  lastHealthCheck: Date;
  errors: string[];
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface UnifiedPaymentEvent {
  type: 'cart_change' | 'payment_started' | 'payment_completed' | 'order_created' | 'zinc_processing';
  timestamp: Date;
  data: any;
  userId?: string;
  sessionId?: string;
}

// ============================================================================
// MIGRATION TYPES
// ============================================================================

export interface MigrationStatus {
  cartContextMigrated: boolean;
  checkoutFormMigrated: boolean;
  paymentMethodsMigrated: boolean;
  orderServiceIntegrated: boolean;
  completionPercentage: number;
}

export interface LegacyCompatibilityLayer {
  cartContextCompat: boolean;
  directStripeCompat: boolean;
  orderServiceCompat: boolean;
}