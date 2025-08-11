/**
 * Test script to verify Nicole → Marketplace integration 
 * **PHASE 4: Enhanced testing and logging**
 */

// Test the DirectNicoleMarketplaceService
const testNicoleIntegration = () => {
  console.log('🧪 PHASE 4: Testing Nicole → Marketplace Integration');
  
  // Test data mimicking Nicole chat context with budget
  const testNicoleContext = {
    budget: [75, 175],
    interests: ['concerts', 'cooking'],
    recipient: 'friend',
    occasion: 'birthday',
    source: 'test'
  };

  const testQuery = 'concerts cooking netflix gifts';

  console.log('🧪 PHASE 4: Simulating Nicole search with budget filtering...');
  console.log('🧪 Expected: Products should be $75-$175 and match interests');

  // Navigate directly to the marketplace URL with Nicole context
  const marketplaceUrl = `/marketplace?search=${encodeURIComponent(testQuery)}&source=nicole&minPrice=75&maxPrice=175&recipient=friend&occasion=birthday`;
  console.log('🧪 PHASE 4: Navigate to:', marketplaceUrl);
  
  // For testing, simulate navigation
  if (window.location.pathname !== '/marketplace') {
    window.location.href = marketplaceUrl;
  }

  console.log('🧪 PHASE 4: Test context set:', { testQuery, testNicoleContext });
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

console.log('🧪 PHASE 4: Nicole integration tests loaded. Run:');
console.log('- window.testNicoleIntegration() to test Nicole → Marketplace flow');
console.log('- window.testBudgetStandardization() to test budget handling');
console.log('🧪 PHASE 4: Check console for "🎯 DirectNicole" and "🎯 PHASE 1" logs');