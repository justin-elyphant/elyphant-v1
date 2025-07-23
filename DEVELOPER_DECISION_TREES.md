# 🌳 DEVELOPER DECISION TREES
## Quick Reference Guide for Unified Systems Development

This document provides decision trees to help developers navigate the unified systems architecture quickly and correctly.

---

## 🎯 PRIMARY DECISION: WHICH SYSTEM TO USE?

```
Need to implement a feature?
├── 🛒 Involves products/catalog?
│   ├── Search/Browse → UnifiedMarketplaceService
│   ├── Product Details → UnifiedMarketplaceService  
│   ├── Add to Cart → UnifiedPaymentService (calls Marketplace)
│   └── Product Management → UnifiedMarketplaceService
├── 💳 Involves payments/orders?
│   ├── Customer Payment → UnifiedPaymentService
│   ├── Cart Management → UnifiedPaymentService
│   ├── Order Creation → UnifiedPaymentService + orderService
│   └── Amazon Fulfillment → process-zinc-order Edge Function
├── 🏪 Involves Amazon Business?
│   ├── Product Search → Enhanced Zinc API (via Marketplace)
│   ├── Order Processing → process-zinc-order Edge Function
│   └── Business Credentials → Edge Functions ONLY
└── 🤖 Involves AI/Chat?
    └── Future: UnifiedNicoleAI (planned)
```

---

## 🛒 PRODUCT & MARKETPLACE DECISION TREE

```
Working with products?
├── 🔍 Search Products
│   ├── General Search → unifiedMarketplaceService.searchProducts()
│   ├── Amazon Specific → unifiedMarketplaceService.searchProducts() (handles Zinc internally)
│   └── Best Sellers → unifiedMarketplaceService.getBestSellers()
├── 📄 Product Details
│   ├── By ID → unifiedMarketplaceService.getProductDetails(id)
│   ├── Bulk Details → unifiedMarketplaceService.getBulkProductDetails(ids)
│   └── Enhanced Details → Service handles enhancement automatically
├── 🏷️ Product Categories
│   ├── Browse Categories → unifiedMarketplaceService.getCategories()
│   └── Category Products → unifiedMarketplaceService.getProductsByCategory()
└── ❌ NEVER DO
    ├── Direct Zinc API calls from frontend
    ├── Bypass marketplace service for any product operations
    └── Create parallel product fetching systems
```

---

## 💳 PAYMENT & CART DECISION TREE

```
Working with cart/payments?
├── 🛒 Cart Operations
│   ├── Add Item → unifiedPaymentService.addToCart(productId, quantity)
│   │   └── (Internally calls UnifiedMarketplaceService for validation)
│   ├── Remove Item → unifiedPaymentService.removeFromCart(productId)
│   ├── Update Quantity → unifiedPaymentService.updateQuantity(productId, qty)
│   └── Clear Cart → unifiedPaymentService.clearCart()
├── 💰 Payment Processing
│   ├── Create Payment Intent → unifiedPaymentService.createPaymentIntent()
│   ├── Process Customer Payment → Stripe API (via service)
│   ├── Amazon Order Fulfillment → process-zinc-order Edge Function
│   └── Order Completion → unifiedPaymentService.processPaymentSuccess()
├── 🎁 Recipient Management
│   ├── Assign Recipient → unifiedPaymentService.assignItemToRecipient()
│   ├── Delivery Groups → Computed from cart items
│   └── Gift Options → Handled in checkout flow
└── ❌ NEVER DO
    ├── Direct Stripe API calls from components
    ├── Mix customer and business payment methods
    ├── Bypass UnifiedMarketplaceService for product validation
    └── Access business payment methods directly
```

---

## 🏪 AMAZON & ZINC DECISION TREE

```
Working with Amazon Business?
├── 🔍 Product Search
│   ├── Search Amazon Products → UnifiedMarketplaceService
│   │   └── (Service internally uses Enhanced Zinc API)
│   ├── Best Seller Detection → Handled automatically
│   └── Product Enhancement → Automatic in marketplace service
├── 📦 Order Processing
│   ├── Amazon Order → process-zinc-order Edge Function ONLY
│   ├── Order Status → Via Edge Function
│   ├── Order Tracking → Via Edge Function
│   └── Cancel Order → Via Edge Function
├── 🔐 Credentials & Auth
│   ├── Amazon Business Login → Edge Function secrets ONLY
│   ├── Zinc API Key → Edge Function secrets ONLY
│   └── Payment Methods → business_payment_methods table ONLY
└── ❌ ABSOLUTELY FORBIDDEN
    ├── Direct Zinc API calls from frontend/services
    ├── Exposing Amazon credentials in frontend
    ├── Modifying payment_method structure
    └── Bypassing Edge Functions for any Zinc operations
```

---

## 🛠️ DEBUGGING DECISION TREE

```
Something not working?
├── 🔍 Identify the System
│   ├── Cart/Payment Issue → Check UnifiedPaymentService logs
│   ├── Product Issue → Check UnifiedMarketplaceService cache
│   ├── Amazon Issue → Check process-zinc-order Edge Function logs
│   └── UI Issue → Check component error boundaries
├── 🔄 Check Service Integration
│   ├── UnifiedPaymentService → UnifiedMarketplaceService calls working?
│   ├── Amazon orders → process-zinc-order calls working?
│   ├── Product validation → Marketplace service responding?
│   └── Authentication → User session valid?
├── 📊 Verify Protection Boundaries
│   ├── No direct API calls being made?
│   ├── Service hierarchy being followed?
│   ├── Payment architecture separation maintained?
│   └── Edge Functions handling external APIs?
└── 🚨 Escalation Path
    ├── Service Integration Issue → Check UNIFIED_SYSTEMS_COORDINATION.md
    ├── Protection Violation → Check protection measures docs
    ├── Amazon/Zinc Issue → Check ZINC_API_PROTECTION_MEASURES.md
    └── Payment Issue → Check UNIFIED_PAYMENT_PROTECTION_MEASURES.md
```

---

## 🆕 NEW FEATURE DECISION TREE

```
Adding a new feature?
├── 📋 Planning Phase
│   ├── Does feature exist in any service? → Use existing
│   ├── Which service should own it? → Use decision trees above
│   ├── Will it affect multiple services? → Plan coordination
│   └── What protection boundaries apply? → Check protection docs
├── 🏗️ Implementation Phase
│   ├── Start with appropriate service (see trees above)
│   ├── Follow service integration hierarchy
│   ├── Maintain protection boundaries
│   └── Add proper error handling
├── ✅ Testing Phase
│   ├── Test individual service functionality
│   ├── Test service integration points
│   ├── Verify protection boundaries respected
│   └── Test full user flow end-to-end
└── 📚 Documentation Phase
    ├── Update service documentation
    ├── Update protection measures if needed
    ├── Update decision trees if needed
    └── Add example usage in service files
```

---

## 🔧 COMMON PATTERNS & SOLUTIONS

### Pattern 1: Adding Items to Cart
```typescript
// ✅ CORRECT PATTERN
const handleAddToCart = async (productId: string, quantity: number) => {
  try {
    // UnifiedPaymentService will call UnifiedMarketplaceService internally
    await unifiedPaymentService.addToCart(productId, quantity);
  } catch (error) {
    console.error('Failed to add to cart:', error);
  }
};
```

### Pattern 2: Processing Amazon Orders
```typescript
// ✅ CORRECT PATTERN  
const processAmazonOrder = async (orderId: string) => {
  try {
    // Always use Edge Function, never direct Zinc API
    const { data, error } = await supabase.functions.invoke('process-zinc-order', {
      body: { orderId }
    });
  } catch (error) {
    console.error('Failed to process Amazon order:', error);
  }
};
```

### Pattern 3: Product Search with Validation
```typescript
// ✅ CORRECT PATTERN
const searchProducts = async (query: string) => {
  try {
    // UnifiedMarketplaceService handles Zinc integration internally
    const products = await unifiedMarketplaceService.searchProducts(query);
    return products; // Already normalized and enhanced
  } catch (error) {
    console.error('Search failed:', error);
  }
};
```

---

## 🚨 ANTI-PATTERNS TO AVOID

### ❌ Anti-Pattern 1: Bypassing Services
```typescript
// WRONG - Bypassing UnifiedMarketplaceService
const product = await fetch('/api/products/' + productId);

// WRONG - Direct Zinc API calls
const order = await fetch('https://api.zinc.io/orders', { ... });

// WRONG - Bypassing payment service for cart
localStorage.setItem('cart', JSON.stringify(items));
```

### ❌ Anti-Pattern 2: Mixed Payment Architecture
```typescript
// WRONG - Mixing customer and business payments
const customerPayment = await stripe.charges.create({ ... });
const businessPayment = await zinc.orders.create({ ... });
```

### ❌ Anti-Pattern 3: Service Hierarchy Violations
```typescript
// WRONG - Component directly calling multiple services
const component = () => {
  const products = await unifiedMarketplaceService.search();
  const cart = await unifiedPaymentService.getCart();
  const order = await zinc.processOrder(); // VIOLATION!
};
```

---

## 📞 QUICK REFERENCE CONTACTS

### Internal Documentation:
- **Service Coordination**: UNIFIED_SYSTEMS_COORDINATION.md
- **Payment Protection**: UNIFIED_PAYMENT_PROTECTION_MEASURES.md  
- **Zinc Protection**: ZINC_API_PROTECTION_MEASURES.md

### External Support:
- **Zinc API Issues**: Joey at Zinc
- **Stripe Integration**: Stripe Dashboard + Documentation
- **Supabase Edge Functions**: Supabase Dashboard Logs

---

*Quick Reference Version: 2025-01-23 (Week 3 Implementation)*