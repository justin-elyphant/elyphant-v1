
import { searchProducts } from './services/productSearchService';
import { fetchProductDetails } from './services/productDetailsService';
import { processOrder, getOrderStatus, cancelOrder } from './services/orderProcessingService';

// Re-export all the functions
export { 
  searchProducts, 
  fetchProductDetails,
  processOrder,
  getOrderStatus,
  cancelOrder
};
