import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth';
import { CartItem } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Custom hook to track cart sessions for abandoned cart detection
 * 
 * This hook:
 * - Creates/updates cart sessions in real-time
 * - Tracks cart abandonment for email recovery
 * - Marks carts as completed on checkout
 */
export const useCartSessionTracking = (
  cartItems: CartItem[], 
  totalAmount: number,
  shippingCost: number = 0,
  isCheckoutPage: boolean = false
) => {
  const { user } = useAuth();
  const sessionIdRef = useRef<string | null>(null);

  // Initialize or get session ID
  useEffect(() => {
    if (!sessionIdRef.current) {
      const existingSessionId = localStorage.getItem('cart_session_id');
      if (existingSessionId) {
        sessionIdRef.current = existingSessionId;
      } else {
        const newSessionId = crypto.randomUUID();
        localStorage.setItem('cart_session_id', newSessionId);
        sessionIdRef.current = newSessionId;
      }
    }
  }, []);

  // Track cart updates
  useEffect(() => {
    // ONLY write to cart_sessions on checkout page
    // Do NOT track on every cart change - user_carts is the source of truth
    if (!isCheckoutPage) {
      return;
    }
    
    const trackCartSession = async () => {
      if (!sessionIdRef.current || cartItems.length === 0) return;

      try {
        const cartData = {
          items: cartItems.map(item => ({
            product_id: item.product.product_id,
            product_name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            recipient_assignment: item.recipientAssignment ? {
              connectionId: item.recipientAssignment.connectionId,
              connectionName: item.recipientAssignment.connectionName,
              deliveryGroupId: item.recipientAssignment.deliveryGroupId,
              giftMessage: item.recipientAssignment.giftMessage,
              scheduledDeliveryDate: item.recipientAssignment.scheduledDeliveryDate,
              shippingAddress: item.recipientAssignment.shippingAddress,
              address_verified: item.recipientAssignment.address_verified,
              address_verification_method: item.recipientAssignment.address_verification_method,
              address_verified_at: item.recipientAssignment.address_verified_at,
              address_last_updated: item.recipientAssignment.address_last_updated
            } : null
          })),
          shippingCost
        };

        await supabase.from('cart_sessions').upsert({
          session_id: sessionIdRef.current,
          user_id: user?.id || null,
          cart_data: cartData,
          total_amount: totalAmount,
          last_updated: new Date().toISOString(),
          ...(isCheckoutPage && { checkout_initiated_at: new Date().toISOString() })
        }, {
          onConflict: 'session_id'
        });

        console.log('✅ Cart session tracked:', sessionIdRef.current);
      } catch (error) {
        console.error('❌ Failed to track cart session:', error);
      }
    };

    trackCartSession();
  }, [cartItems, totalAmount, shippingCost, user?.id, isCheckoutPage]);

  // Mark cart as completed
  const markCartCompleted = async () => {
    if (!sessionIdRef.current) return;

    try {
      await supabase
        .from('cart_sessions')
        .update({ 
          completed_at: new Date().toISOString(),
          is_recovered: false // Reset recovery flag
        })
        .eq('session_id', sessionIdRef.current);

      console.log('✅ Cart marked as completed:', sessionIdRef.current);
      
      // Clear session and create new one for next cart
      localStorage.removeItem('cart_session_id');
      sessionIdRef.current = null;
    } catch (error) {
      console.error('❌ Failed to mark cart as completed:', error);
    }
  };

  return {
    sessionId: sessionIdRef.current,
    markCartCompleted
  };
};
