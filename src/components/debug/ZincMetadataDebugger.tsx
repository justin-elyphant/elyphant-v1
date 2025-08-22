/**
 * ZINC METADATA DEBUG CONSOLE COMPONENT
 * Temporary component to verify Zinc metadata implementation
 */

import React, { useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { validateCartZincMetadata, logZincMetadataDebug } from '@/utils/zincMetadataValidator';

const ZincMetadataDebugger: React.FC = () => {
  const { cartItems } = useCart();

  useEffect(() => {
    console.group('[ZINC DEBUG] Cart Metadata Verification');
    
    console.log('Cart items count:', cartItems.length);
    
    if (cartItems.length > 0) {
      const products = cartItems.map(item => item.product);
      logZincMetadataDebug(products, 'Current Cart');
      
      const validation = validateCartZincMetadata(cartItems);
      console.log('Validation summary:', validation.summary);
      
      cartItems.forEach((item, index) => {
        console.log(`Item ${index + 1}: ${item.product.title}`, {
          product_id: item.product.product_id,
          productSource: item.product.productSource,
          isZincApiProduct: item.product.isZincApiProduct,
          retailer: item.product.retailer,
          vendor: item.product.vendor,
          price: item.product.price,
          quantity: item.quantity
        });
      });
    } else {
      console.log('Cart is empty - no items to validate');
    }
    
    console.groupEnd();
  }, [cartItems]);

  return null; // This component is for debugging only
};

export default ZincMetadataDebugger;