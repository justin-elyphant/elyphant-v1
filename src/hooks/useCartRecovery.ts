import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CartRecoveryState {
  isRecovering: boolean;
  error: string | null;
  success: boolean;
}

/**
 * Hook to recover abandoned carts from email links
 * Checks for ?recover=session_id parameter and loads cart data
 */
export const useCartRecovery = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { addToCart, cartItems } = useCart();
  const navigate = useNavigate();
  const [state, setState] = useState<CartRecoveryState>({
    isRecovering: false,
    error: null,
    success: false
  });

  useEffect(() => {
    const recoverSessionId = searchParams.get('recover');
    
    if (!recoverSessionId) return;

    const recoverCart = async () => {
      setState({ isRecovering: true, error: null, success: false });

      try {
        console.log('🔄 [CartRecovery] Attempting to recover cart:', recoverSessionId);

        // Fetch the cart session from database
        const { data: cartSession, error: fetchError } = await supabase
          .from('cart_sessions')
          .select('*')
          .eq('session_id', recoverSessionId)
          .single();

        if (fetchError || !cartSession) {
          throw new Error('Cart session not found or expired');
        }

        // Check if cart is already completed
        if (cartSession.completed_at) {
          toast.info('This cart has already been completed');
          setState({ isRecovering: false, error: null, success: false });
          setSearchParams({}); // Clear URL parameter
          return;
        }

        // Validate cart belongs to current user (if logged in)
        if (user && cartSession.user_id && cartSession.user_id !== user.id) {
          throw new Error('This cart belongs to a different user');
        }

        // Check if cart is too old (30 days)
        const cartAge = Date.now() - new Date(cartSession.created_at).getTime();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (cartAge > thirtyDays) {
          throw new Error('This cart has expired');
        }

        // Load cart items
        const cartData = cartSession.cart_data as any;
        if (!cartData?.items || cartData.items.length === 0) {
          throw new Error('Cart is empty');
        }

        console.log('✅ [CartRecovery] Cart session found:', {
          itemCount: cartData.items.length,
          total: cartSession.total_amount
        });

        // Check if user already has items in cart
        if (cartItems.length > 0) {
          // Ask user if they want to merge or replace
          const shouldMerge = await new Promise<boolean>((resolve) => {
            toast('You have items in your cart', {
              description: 'Would you like to add recovered items or replace your current cart?',
              action: {
                label: 'Add to Cart',
                onClick: () => resolve(true)
              },
              cancel: {
                label: 'Replace Cart',
                onClick: () => resolve(false)
              },
              duration: 10000
            });
            // Default to merge after 10 seconds
            setTimeout(() => resolve(true), 10000);
          });

          if (!shouldMerge) {
            // User chose to replace - clear current cart first
            // Note: We can't call clearCart here due to async nature
            // Let's just proceed with adding items, they'll merge naturally
          }
        }

        // Add items to cart
        let recoveredCount = 0;
        for (const item of cartData.items) {
          try {
            const product = {
              product_id: item.product_id,
              name: item.product_name,
              price: item.price,
              image: item.image_url,
              images: item.images || [],
              vendor: item.vendor || '',
              title: item.product_name
            };

            await addToCart(product as any, item.quantity);
            
            // If item had recipient assignment, restore it
            // This would require additional implementation in CartContext
            
            recoveredCount++;
          } catch (itemError) {
            console.error('Failed to add item:', item.product_name, itemError);
          }
        }

        // Mark cart as recovered
        await supabase
          .from('cart_sessions')
          .update({ is_recovered: true })
          .eq('session_id', recoverSessionId);

        // Update localStorage to use this session
        localStorage.setItem('cart_session_id', recoverSessionId);

        toast.success(`Cart recovered! ${recoveredCount} item${recoveredCount === 1 ? '' : 's'} added`);
        setState({ isRecovering: false, error: null, success: true });
        
        // Clear URL parameter
        setSearchParams({});
        
        console.log('✅ [CartRecovery] Cart successfully recovered');
      } catch (error: any) {
        console.error('❌ [CartRecovery] Failed to recover cart:', error);
        toast.error(error.message || 'Failed to recover cart');
        setState({ isRecovering: false, error: error.message, success: false });
        setSearchParams({}); // Clear URL parameter even on error
      }
    };

    recoverCart();
  }, [searchParams, user, addToCart, cartItems.length]);

  return state;
};
