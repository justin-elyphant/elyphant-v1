
import { useMemo } from 'react';
import { useCart } from '@/contexts/CartContext';

export type DeliveryScenario = 'self' | 'gift' | 'mixed';

export interface AdaptiveCheckoutFlow {
  scenario: DeliveryScenario;
  tabs: string[];
  requiresShipping: boolean;
  requiresRecipients: boolean;
  requiresScheduling: boolean;
}

export const useAdaptiveCheckout = () => {
  const { cartItems, cartGroups } = useCart();
  
  const deliveryScenario: DeliveryScenario = useMemo(() => {
    try {
      const selfItems = cartItems.filter(item => !item.assignedConnectionId);
      const giftItems = cartItems.filter(item => item.assignedConnectionId);
      
      if (giftItems.length === 0) {
        // All items for self
        return 'self';
      } else if (selfItems.length === 0) {
        // All items are gifts
        return 'gift';
      } else {
        // Mix of self and gift items
        return 'mixed';
      }
    } catch (error) {
      console.error('Error determining delivery scenario:', error);
      return 'self';
    }
  }, [cartItems]);

  const adaptiveFlow: AdaptiveCheckoutFlow = useMemo(() => {
    switch (deliveryScenario) {
      case 'self':
        return {
          scenario: 'self',
          tabs: ['shipping', 'payment'],
          requiresShipping: true,
          requiresRecipients: false,
          requiresScheduling: false,
        };
      case 'gift':
        return {
          scenario: 'gift',
          tabs: ['gift-options', 'payment'],
          requiresShipping: false,
          requiresRecipients: true,
          requiresScheduling: true,
        };
      case 'mixed':
        return {
          scenario: 'mixed',
          tabs: ['shipping', 'gift-options', 'payment'],
          requiresShipping: true,
          requiresRecipients: true,
          requiresScheduling: true,
        };
      default:
        return {
          scenario: 'self',
          tabs: ['shipping', 'payment'],
          requiresShipping: true,
          requiresRecipients: false,
          requiresScheduling: false,
        };
    }
  }, [deliveryScenario]);

  const getScenarioDescription = () => {
    switch (deliveryScenario) {
      case 'self':
        return 'Shopping for yourself';
      case 'gift':
        return 'Sending gifts to recipients';
      case 'mixed':
        return 'Mixed delivery (self + gifts)';
      default:
        return '';
    }
  };

  return {
    deliveryScenario,
    adaptiveFlow,
    getScenarioDescription,
  };
};
