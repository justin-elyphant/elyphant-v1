/**
 * Simple test to verify Nicole → Marketplace integration
 */

// Test the flow by navigating to marketplace with Nicole context
const testNicoleMarketplace = () => {
  console.log('🧪 Testing Nicole → Marketplace Integration');
  
  // Simulate Nicole search with budget and interests
  const testUrl = '/marketplace?search=concerts+cooking+netflix+gifts&source=nicole&minPrice=75&maxPrice=175&recipient=me&occasion=birthday';
  
  console.log('🧪 Navigating to marketplace with Nicole context:', testUrl);
  
  // Navigate to the test URL
  window.location.href = testUrl;
};

// Make it available globally for testing
(window as any).testNicoleMarketplace = testNicoleMarketplace;

console.log('🧪 Nicole → Marketplace test loaded');
console.log('🧪 Run: window.testNicoleMarketplace() to test the integration');