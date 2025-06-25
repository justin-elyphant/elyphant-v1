
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
  const cartContext = useCart();
  
  // Safely access cart methods with fallbacks
  const cartItems = cartContext?.cartItems || [];
  const deliveryGroups = cartContext?.deliveryGroups || [];
  const getUnassignedItems = cartContext?.getUnassignedItems || (() => cartItems);
  
  const deliveryScenario: DeliveryScenario = useMemo(() => {
    try {
      const unassignedItems = getUnassignedItems();
      const hasAssignedItems = deliveryGroups.length > 0;
      
      if (unassignedItems.length === cartItems.length) {
        // All items unassigned - likely self purchase
        return 'self';
      } else if (unassignedItems.length === 0) {
        // All items assigned to recipients - pure gift scenario
        return 'gift';
      } else {
        // Mix of assigned and unassigned items
        return 'mixed';
      }
    } catch (error) {
      console.error('Error determining delivery scenario:', error);
      // Default to self purchase if there's any error
      return 'self';
    }
  }, [cartItems, deliveryGroups, getUnassignedItems]);

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
          tabs: ['recipients', 'schedule', 'payment'],
          requiresShipping: false,
          requiresRecipients: true,
          requiresScheduling: true,
        };
      case 'mixed':
        return {
          scenario: 'mixed',
          tabs: ['delivery', 'schedule', 'payment'],
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
