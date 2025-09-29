# UNIFIED SYSTEMS COORDINATION

## 🏗️ UNIFIED SERVICE ARCHITECTURE OVERVIEW

This document defines the coordination rules between all unified services to prevent conflicts, ensure proper boundaries, and maintain system integrity.

## 🎯 SERVICE HIERARCHY AND DEPENDENCIES

### FOUNDATION SERVICES (Level 1)
Services that other services depend on:

#### **UnifiedAuthService** 🔐
- **Purpose**: Authentication and security foundation
- **Dependencies**: Supabase Auth, AuthCache, AuthSecurity, AuthProtection
- **Provides**: User authentication, session management, security validation
- **Used By**: All other unified services for auth validation

### CORE BUSINESS SERVICES (Level 2)
Services that handle primary business logic:

#### **UnifiedProfileService** 👤
- **Purpose**: User profile and personal data management
- **Dependencies**: UnifiedAuthService (auth validation)
- **Provides**: Profile data, user preferences, personal information
- **Used By**: UnifiedGiftManagementService, UnifiedLocationService

#### **UnifiedPaymentService** 💳
- **Purpose**: Payment processing and financial operations
- **Dependencies**: UnifiedAuthService (auth validation)
- **Provides**: Payment processing, billing, subscription management
- **Used By**: UnifiedMarketplaceService, UnifiedGiftManagementService

#### **UnifiedLocationService** 📍
- **Purpose**: Location and address management
- **Dependencies**: UnifiedAuthService (auth validation), GooglePlacesService
- **Provides**: Address validation, geocoding, shipping calculations
- **Used By**: UnifiedPaymentService (shipping), UnifiedMarketplaceService (location-based search)

### BUSINESS LOGIC SERVICES (Level 3)
Services that combine multiple core services:

#### **UnifiedGiftManagementService** 🎁
- **Purpose**: Gift list and gift management operations
- **Dependencies**: UnifiedAuthService, UnifiedProfileService, UnifiedPaymentService
- **Provides**: Gift list management, gift recommendations, sharing
- **Used By**: UnifiedMarketplaceService (gift-related products)

#### **UnifiedMarketplaceService** 🛍️
- **Purpose**: Product catalog and marketplace operations
- **Dependencies**: UnifiedAuthService, UnifiedLocationService, UnifiedGiftManagementService
- **Provides**: Product search, catalog management, recommendations
- **Used By**: React components, shopping interfaces

## 🚦 SERVICE COORDINATION RULES

### RULE 1: RESPECT HIERARCHY DEPENDENCIES
Services can only depend on services at their level or below:

```typescript
// ✅ CORRECT: Core service using foundation service
class UnifiedProfileService {
  async updateProfile(data: ProfileData) {
    const user = await unifiedAuthService.getCurrentUser(); // Level 2 → Level 1 ✅
    return this.processUpdate(user.id, data);
  }
}

// ❌ WRONG: Foundation service depending on core service
class UnifiedAuthService {
  async signIn(email: string, password: string) {
    const result = await this.authenticate(email, password);
    await unifiedProfileService.initProfile(result.user.id); // Level 1 → Level 2 ❌
    return result;
  }
}
```

### RULE 2: NO HORIZONTAL DEPENDENCIES AT SAME LEVEL
Services at the same level should not directly depend on each other:

```typescript
// ✅ CORRECT: Business logic service coordinating core services
class UnifiedGiftManagementService {
  async createGiftList(data: GiftListData) {
    const user = await unifiedAuthService.getCurrentUser(); // Level 3 → Level 1 ✅
    const profile = await unifiedProfileService.getProfile(user.id); // Level 3 → Level 2 ✅
    return this.processGiftList(data, profile);
  }
}

// ❌ WRONG: Core service directly calling another core service
class UnifiedProfileService {
  async updateProfile(data: ProfileData) {
    const location = await unifiedLocationService.validateAddress(data.address); // Level 2 → Level 2 ❌
    return this.update(data);
  }
}
```

### RULE 3: USE COORDINATION PATTERNS FOR CROSS-LEVEL COMMUNICATION

#### **Event-Driven Coordination**:
```typescript
// ✅ CORRECT: Foundation service notifies without direct dependencies
class UnifiedAuthService {
  async signIn(email: string, password: string) {
    const result = await this.authenticate(email, password);
    
    if (result.success) {
      // Emit event instead of direct service calls
      this.emitAuthEvent('user_authenticated', { 
        userId: result.user.id,
        timestamp: Date.now()
      });
    }
    
    return result;
  }
}

// Services listen for auth events
class UnifiedProfileService {
  constructor() {
    unifiedAuthService.on('user_authenticated', this.handleUserAuth.bind(this));
  }
  
  private async handleUserAuth(data: { userId: string }) {
    await this.initializeProfileIfNeeded(data.userId);
  }
}
```

#### **Factory Pattern Coordination**:
```typescript
// ✅ CORRECT: Coordination through factory/manager
class ServiceCoordinator {
  async handleUserSignIn(email: string, password: string) {
    // 1. Authenticate first
    const authResult = await unifiedAuthService.signIn(email, password);
    
    if (authResult.success) {
      // 2. Initialize dependent services
      await Promise.all([
        unifiedProfileService.warmCache(authResult.user.id),
        unifiedGiftManagementService.initializeUserData(authResult.user.id),
        unifiedLocationService.loadUserAddresses(authResult.user.id)
      ]);
    }
    
    return authResult;
  }
}
```

## 🔒 BOUNDARY ENFORCEMENT

### DATABASE ACCESS BOUNDARIES:
```typescript
// ✅ CORRECT: Each service manages its own data domain
class UnifiedProfileService {
  async getProfile(userId: string) {
    return supabase.from('profiles').select('*').eq('user_id', userId); // ✅ Profiles domain
  }
}

class UnifiedGiftManagementService {
  async getGiftLists(userId: string) {
    return supabase.from('gift_lists').select('*').eq('user_id', userId); // ✅ Gifts domain
  }
}

// ❌ WRONG: Service accessing another service's data domain
class UnifiedProfileService {
  async getProfileWithGifts(userId: string) {
    const profile = await supabase.from('profiles').select('*').eq('user_id', userId);
    const gifts = await supabase.from('gift_lists').select('*').eq('user_id', userId); // ❌ Wrong domain
    return { profile, gifts };
  }
}
```

### API BOUNDARY ENFORCEMENT:
```typescript
// ✅ CORRECT: Use service APIs, not direct database access
class UnifiedMarketplaceService {
  async getGiftRecommendations(userId: string) {
    const giftLists = await unifiedGiftManagementService.getUserGiftLists(userId); // ✅ Service API
    return this.generateRecommendations(giftLists);
  }
}

// ❌ WRONG: Bypass service APIs
class UnifiedMarketplaceService {
  async getGiftRecommendations(userId: string) {
    const giftLists = await supabase.from('gift_lists').select('*').eq('user_id', userId); // ❌ Bypass
    return this.generateRecommendations(giftLists);
  }
}
```

## 🚨 CONFLICT RESOLUTION

### WHEN SERVICES NEED TO SHARE FUNCTIONALITY:

#### **Option 1: Extract to Lower Level Service**
```typescript
// Move shared functionality to a foundation service
class UnifiedAuthService {
  async validateUserAccess(userId: string, resource: string): Promise<boolean> {
    // Shared validation logic that multiple services need
  }
}
```

#### **Option 2: Create Utility Service**
```typescript
// Create a utility service for shared functionality
class SharedValidationService {
  async validateInput(data: any, schema: any): Promise<ValidationResult> {
    // Shared validation that doesn't belong to any specific domain
  }
}
```

#### **Option 3: Coordination Service**
```typescript
// Create coordination service for complex cross-service operations
class GiftCoordinationService {
  async createGiftWithPayment(giftData: GiftData, paymentData: PaymentData) {
    const gift = await unifiedGiftManagementService.createGift(giftData);
    const payment = await unifiedPaymentService.processPayment(paymentData);
    return { gift, payment };
  }
}
```

## 📊 SERVICE HEALTH MONITORING

### COORDINATION HEALTH CHECKS:
```typescript
class ServiceCoordinationHealth {
  async checkServiceIntegration() {
    return {
      auth_service: await this.checkAuthServiceHealth(),
      profile_service: await this.checkProfileServiceHealth(),
      coordination_points: await this.checkCoordinationHealth(),
      boundary_violations: await this.detectBoundaryViolations()
    };
  }
}
```

### BOUNDARY VIOLATION DETECTION:
- Monitor for direct database calls that bypass service APIs
- Track service dependency violations
- Alert on circular dependencies
- Validate service boundary compliance

## 🔄 MIGRATION AND EVOLUTION

### WHEN ADDING NEW SERVICES:
1. **Identify Level**: Determine which level the new service belongs to
2. **Map Dependencies**: Identify which existing services it depends on
3. **Define Boundaries**: Clearly define what data/functionality it owns
4. **Update Coordination**: Update this document with new service integration rules

### WHEN REFACTORING EXISTING SERVICES:
1. **Preserve Boundaries**: Maintain existing service boundaries during refactoring
2. **Update Coordination**: Update coordination patterns if needed
3. **Validate Dependencies**: Ensure dependency hierarchy is maintained
4. **Test Integration**: Verify all service integrations still work

## 🎯 BEST PRACTICES

### DO'S:
- ✅ Use service APIs instead of direct database access
- ✅ Respect the service hierarchy
- ✅ Implement proper error handling at service boundaries
- ✅ Use caching within service boundaries
- ✅ Emit events for cross-service coordination when needed

### DON'TS:
- ❌ Create circular dependencies between services
- ❌ Bypass service APIs for "performance" reasons
- ❌ Mix service responsibilities
- ❌ Store service A's data in service B's database tables
- ❌ Hard-code service integration logic in components

## 📋 INTEGRATION CHECKLIST

Before deploying changes that affect multiple services:

- [ ] Service hierarchy respected (no upward dependencies)
- [ ] No horizontal dependencies at same level
- [ ] Proper error handling at service boundaries
- [ ] Cache invalidation coordinated across services
- [ ] Event-driven patterns used for cross-service communication
- [ ] Database boundaries maintained
- [ ] API boundaries enforced
- [ ] Integration tests pass for all affected services
- [ ] Documentation updated for any new coordination patterns

This coordination document ensures that our unified service architecture remains maintainable, scalable, and conflict-free as the system evolves.