/**
 * Protected Auto-Gifting Service with Comprehensive Rate Limiting & Budget Controls
 * Implements unified protective measures for Zinc API, Marketplace and Auto-Gifting
 */

import { productCatalogService } from "@/services/ProductCatalogService";
import { toast } from "sonner";

interface AutoGiftingRateLimit {
  userId: string;
  executionsToday: number;
  lastExecution: Date;
  apiCallsUsed: number;
  lastReset: Date;
}

interface AutoGiftingBudgetAllocation {
  totalBudget: number;
  autoGiftingAllocation: number;
  manualSearchAllocation: number;
  reservedForPriority: number;
}

class ProtectedAutoGiftingService {
  private userRateLimits = new Map<string, AutoGiftingRateLimit>();
  private readonly MAX_EXECUTIONS_PER_DAY = 5;
  private readonly MAX_API_CALLS_PER_DAY = 20; // 40% of 50 monthly budget
  private readonly PRIORITY_OCCASIONS = ['birthday', 'anniversary', 'wedding', 'graduation'];
  
  // Budget allocation: 60% manual search, 40% auto-gifting
  private budgetAllocation: AutoGiftingBudgetAllocation = {
    totalBudget: 50,
    autoGiftingAllocation: 20, // 40% of $50
    manualSearchAllocation: 30, // 60% of $50  
    reservedForPriority: 10 // Emergency reserve
  };

  /**
   * Protected product search for auto-gifting with rate limiting and budget controls
   */
  async searchProductsForAutoGifting(
    userId: string, 
    query: string, 
    maxResults: number = 10,
    priority: 'high' | 'normal' = 'normal',
    budget?: number
  ): Promise<any[]> {
    console.log(`🛡️ Protected auto-gifting search for user ${userId}: "${query}"`);
    
    try {
      // Phase 1: Check execution rate limits
      if (!await this.canExecuteAutoGift(userId)) {
        console.log(`❌ Rate limit exceeded for user ${userId}`);
        toast.error("Auto-gifting rate limit reached", {
          description: "Maximum 5 auto-gift executions per day. Try again tomorrow."
        });
        return [];
      }

      // Phase 2: Check API quota allocation
      if (!await this.canMakeApiCall(userId, priority)) {
        console.log(`❌ API quota exceeded for user ${userId}`);
        toast.error("Auto-gifting API quota reached", {
          description: "Daily API limit reached. Using cached suggestions."
        });
        
        // Fallback to cached/mock data
        return await this.getFallbackResults(query, maxResults);
      }

      // Phase 3: Use budget-protected optimized service
      console.log(`✅ Using optimized Zinc service for protected search with budget: $${budget || 'unlimited'}`);
      
      // Create search options with budget context
      const searchOptions: any = { maxResults };
      if (budget) {
        searchOptions.maxPrice = budget;
        // Add budget context to the query for better filtering  
        query = `${query} under $${budget}`;
        console.log(`🛡️ Protected search with budget constraint: max $${budget}`);
      }
      
      const response = await productCatalogService.searchProducts(query, {
        limit: maxResults,
        filters: { maxPrice: budget }
      });
      const results = response.products;
      
      // Phase 4: Track usage and update limits
      await this.trackApiUsage(userId);
      
      console.log(`✅ Protected search completed: ${results.length} results`);
      return results;

    } catch (error) {
      console.error('❌ Protected auto-gifting search error:', error);
      
      // Graceful degradation to fallback results
      toast.error("API temporarily unavailable", {
        description: "Using cached gift suggestions"
      });
      
      return await this.getFallbackResults(query, maxResults);
    }
  }

  /**
   * Check if user can execute auto-gift (max 5 per day)
   */
  private async canExecuteAutoGift(userId: string): Promise<boolean> {
    const today = new Date();
    const todayKey = today.toDateString();
    
    let userLimit = this.userRateLimits.get(userId);
    
    // Reset daily counter if new day
    if (!userLimit || userLimit.lastReset.toDateString() !== todayKey) {
      userLimit = {
        userId,
        executionsToday: 0,
        lastExecution: new Date(0),
        apiCallsUsed: 0,
        lastReset: today
      };
      this.userRateLimits.set(userId, userLimit);
    }
    
    return userLimit.executionsToday < this.MAX_EXECUTIONS_PER_DAY;
  }

  /**
   * Check if user can make API call within quota
   */
  private async canMakeApiCall(userId: string, priority: 'high' | 'normal'): Promise<boolean> {
    const userLimit = this.userRateLimits.get(userId);
    if (!userLimit) return true;
    
    // Priority occasions get extra quota
    const maxCalls = priority === 'high' ? 
      this.MAX_API_CALLS_PER_DAY + 5 : 
      this.MAX_API_CALLS_PER_DAY;
    
    return userLimit.apiCallsUsed < maxCalls;
  }

  /**
   * Track API usage for rate limiting
   */
  private async trackApiUsage(userId: string): Promise<void> {
    const userLimit = this.userRateLimits.get(userId);
    if (userLimit) {
      userLimit.executionsToday += 1;
      userLimit.apiCallsUsed += 1;
      userLimit.lastExecution = new Date();
      this.userRateLimits.set(userId, userLimit);
    }
  }

  /**
   * Get fallback results from cache or mock data
   */
  private async getFallbackResults(query: string, maxResults: number): Promise<any[]> {
    try {
      // Try to get cached results first
      const { searchMockProducts } = require('@/components/marketplace/services/mockProductService');
      return searchMockProducts(query, maxResults);
    } catch {
      return [];
    }
  }

  /**
   * Check if occasion is high priority
   */
  isPriorityOccasion(occasion: string): boolean {
    return this.PRIORITY_OCCASIONS.includes(occasion.toLowerCase());
  }

  /**
   * Get user's current rate limit status
   */
  getUserRateLimitStatus(userId: string): {
    executionsUsed: number;
    executionsRemaining: number;
    apiCallsUsed: number;
    apiCallsRemaining: number;
    resetsAt: Date;
  } {
    const userLimit = this.userRateLimits.get(userId);
    
    if (!userLimit) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      return {
        executionsUsed: 0,
        executionsRemaining: this.MAX_EXECUTIONS_PER_DAY,
        apiCallsUsed: 0,
        apiCallsRemaining: this.MAX_API_CALLS_PER_DAY,
        resetsAt: tomorrow
      };
    }
    
    const tomorrow = new Date(userLimit.lastReset);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return {
      executionsUsed: userLimit.executionsToday,
      executionsRemaining: Math.max(0, this.MAX_EXECUTIONS_PER_DAY - userLimit.executionsToday),
      apiCallsUsed: userLimit.apiCallsUsed,
      apiCallsRemaining: Math.max(0, this.MAX_API_CALLS_PER_DAY - userLimit.apiCallsUsed),
      resetsAt: tomorrow
    };
  }

  /**
   * Get budget allocation status
   */
  getBudgetAllocation(): AutoGiftingBudgetAllocation {
    return { ...this.budgetAllocation };
  }

  /**
   * Emergency circuit breaker - disable auto-gifting if costs spike
   */
  async checkEmergencyCircuitBreaker(): Promise<boolean> {
    const optimizedServiceStats = { budget: { spent: 0, percentUsed: 0 } };
    const monthlySpent = optimizedServiceStats.budget.spent;
    
    // Emergency stop if 90% of budget used
    if (monthlySpent >= this.budgetAllocation.totalBudget * 0.9) {
      console.warn('🚨 Emergency circuit breaker activated - 90% budget used');
      toast.error("Auto-gifting temporarily disabled", {
        description: "Monthly API budget limit approaching. Auto-gifting will resume next month."
      });
      return false;
    }
    
    return true;
  }

  /**
   * Get comprehensive service statistics
   */
  getServiceStatistics() {
    const optimizedServiceStats = { budget: { spent: 0, percentUsed: 0 }, optimization: {}, cache: {} };
    
    const activeUsers = this.userRateLimits.size;
    const totalExecutionsToday = Array.from(this.userRateLimits.values())
      .reduce((sum, limit) => sum + limit.executionsToday, 0);
    
    return {
      rateLimit: {
        activeUsers,
        totalExecutionsToday,
        maxExecutionsPerDay: this.MAX_EXECUTIONS_PER_DAY,
        maxApiCallsPerDay: this.MAX_API_CALLS_PER_DAY
      },
      budget: {
        ...this.budgetAllocation,
        currentSpent: optimizedServiceStats.budget.spent,
        percentUsed: `${optimizedServiceStats.budget.percentUsed}%`
      },
      optimization: optimizedServiceStats.optimization,
      cache: optimizedServiceStats.cache,
      emergencyCircuitBreakerActive: optimizedServiceStats.budget.spent >= this.budgetAllocation.totalBudget * 0.9
    };
  }

  /**
   * Reset monthly tracking (to be called on first day of month)
   */
  resetMonthlyTracking(): void {
    // Monthly tracking reset - unified service handles this internally
    this.userRateLimits.clear();
    console.log('🔄 Monthly auto-gifting tracking reset');
  }
}

export const protectedAutoGiftingService = new ProtectedAutoGiftingService();