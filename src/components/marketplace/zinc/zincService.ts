
import { searchProducts } from './services/productSearchService';
import { fetchProductDetails } from './services/productDetailsService';
import { processOrder, getOrderStatus, cancelOrder } from './services/orderProcessingService';

// Re-export all the services for direct import
export { 
  searchProducts, 
  fetchProductDetails,
  processOrder,
  getOrderStatus,
  cancelOrder
};

/**
 * Test a live purchase through the Zinc API
 * @param productId The product ID to purchase
 * @returns The processed order data
 */
export const testPurchase = async (productId: string) => {
  // Create a test order request
  const orderRequest = {
    retailer: 'amazon',
    products: [
      {
        product_id: productId,
        quantity: 1
      }
    ],
    shipping_address: {
      first_name: 'Test',
      last_name: 'User',
      address_line1: '123 Test Street',
      zip_code: '94043',
      city: 'Mountain View',
      state: 'CA',
      country: 'US',
      phone_number: '5555555555'
    },
    payment_method: {
      name_on_card: 'Test User',
      number: '4242424242424242',
      expiration_month: 1,
      expiration_year: 2030,
      security_code: '123'
    },
    billing_address: {
      first_name: 'Test',
      last_name: 'User',
      address_line1: '123 Test Street',
      zip_code: '94043',
      city: 'Mountain View',
      state: 'CA',
      country: 'US',
      phone_number: '5555555555'
    },
    is_gift: false,
    is_test: true // Add this flag to indicate a test order
  };

  // Process the order
  return await processOrder(orderRequest);
};
