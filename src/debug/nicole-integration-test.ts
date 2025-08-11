/**
 * Test script to verify Nicole → Marketplace integration
 */

// Test the DirectNicoleMarketplaceService
const testNicoleIntegration = () => {
  console.log('🧪 Testing Nicole → Marketplace Integration');
  
  // Test data mimicking Nicole chat context
  const testNicoleContext = {
    budget: [75, 175],
    interests: ['concerts', 'cooking'],
    recipient: 'friend',
    occasion: 'birthday',
    source: 'test'
  };

  const testQuery = 'gifts for friend birthday concerts cooking';

  // Dispatch Nicole search event
  window.dispatchEvent(new CustomEvent('nicole-search', {
    detail: {
      query: testQuery,
      nicoleContext: testNicoleContext
    }
  }));

  console.log('🧪 Test event dispatched:', { testQuery, testNicoleContext });
};

// Test budget standardization
const testBudgetStandardization = () => {
  console.log('🧪 Testing budget standardization');
  
  // Different budget formats that should all work
  const budgetFormats = [
    [50, 100],                    // Array format
    { min: 50, max: 100 },       // Object format
    { minPrice: 50, maxPrice: 100 }, // Alternative object format
  ];

  budgetFormats.forEach((budget, index) => {
    console.log(`🧪 Testing budget format ${index + 1}:`, budget);
  });
};

// Export for debugging (with proper typing)
declare global {
  interface Window {
    testNicoleIntegration: () => void;
    testBudgetStandardization: () => void;
  }
}

window.testNicoleIntegration = testNicoleIntegration;
window.testBudgetStandardization = testBudgetStandardization;

console.log('🧪 Nicole integration tests loaded. Run:');
console.log('- window.testNicoleIntegration() to test the search flow');
console.log('- window.testBudgetStandardization() to test budget handling');