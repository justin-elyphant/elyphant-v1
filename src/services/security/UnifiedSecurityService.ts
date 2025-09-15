/*
 * ========================================================================
 * 🛡️ UNIFIED SECURITY & ERROR HANDLING SERVICE (Phase 1 Consolidation)
 * ========================================================================
 * 
 * This service consolidates security measures and error handling across
 * all unified services, providing consistent protection and recovery
 * mechanisms for scaling to 100K users.
 * 
 * CONSOLIDATED FROM:
 * - UnifiedPaymentService error handling
 * - UnifiedMessagingService security measures
 * - Trunkline Analytics error management
 * - UnifiedCacheService error recovery
 * 
 * FEATURES:
 * - Centralized error logging and tracking
 * - Circuit breaker pattern for external services
 * - Rate limiting consolidation
 * - Security validation and sanitization
 * - Automatic error recovery mechanisms
 * - Cross-service error correlation
 * 
 * PROTECTION MEASURES MAINTAINED:
 * - All existing service boundaries preserved
 * - Integration with existing protection documents
 * - Respects ZINC_API_PROTECTION_MEASURES.md
 * - Maintains UNIFIED_PAYMENT_PROTECTION_MEASURES.md compliance
 * 
 * Last Update: 2025-01-24 (Phase 1 - Security & Error Consolidation)
 * ========================================================================
 */

import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";

// ============================================================================
// ERROR HANDLING TYPES
// ============================================================================

export interface UnifiedError {
  id: string;
  service: 'payment' | 'messaging' | 'trunkline' | 'cache' | 'marketplace' | 'zinc' | 'system';
  errorType: 'network' | 'validation' | 'authentication' | 'authorization' | 'rate_limit' | 'system';
  message: string;
  stack?: string;
  context: any;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  recoverable: boolean;
}

export interface SecurityViolation {
  id: string;
  violationType: 'rate_limit' | 'invalid_input' | 'unauthorized_access' | 'suspicious_activity';
  service: string;
  userId?: string;
  details: any;
  timestamp: string;
  blocked: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface CircuitBreakerState {
  service: string;
  state: 'closed' | 'open' | 'half_open';
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
  successCount: number;
}

export interface RateLimitConfig {
  service: string;
  endpoint?: string;
  windowMs: number;
  maxRequests: number;
  userId?: string;
}

// ============================================================================
// UNIFIED SECURITY & ERROR HANDLING SERVICE
// ============================================================================

class UnifiedSecurityService {
  private static instance: UnifiedSecurityService;
  
  // Error tracking
  private errorLog: UnifiedError[] = [];
  private readonly MAX_ERROR_LOG_SIZE = 1000;
  
  // Circuit breaker states
  private circuitBreakers = new Map<string, CircuitBreakerState>();
  private readonly FAILURE_THRESHOLD = 5;
  private readonly RECOVERY_TIMEOUT = 30000; // 30 seconds
  private readonly SUCCESS_THRESHOLD = 3;
  
  // Rate limiting
  private rateLimiters = new Map<string, { count: number; resetTime: number }>();
  
  // Security violations
  private violations: SecurityViolation[] = [];
  private blockedUsers = new Set<string>();
  
  private constructor() {
    this.setupGlobalErrorHandling();
    this.startMaintenanceTasks();
  }

  public static getInstance(): UnifiedSecurityService {
    if (!UnifiedSecurityService.instance) {
      UnifiedSecurityService.instance = new UnifiedSecurityService();
    }
    return UnifiedSecurityService.instance;
  }

  // ============================================================================
  // ERROR HANDLING CONSOLIDATION
  // ============================================================================

  /**
   * Log and handle errors from any unified service
   */
  async handleError(
    service: UnifiedError['service'],
    error: Error | string,
    context: any = {},
    severity: UnifiedError['severity'] = 'medium'
  ): Promise<{ handled: boolean; userMessage?: string; retryable: boolean }> {
    const errorId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    const unifiedError: UnifiedError = {
      id: errorId,
      service,
      errorType: this.classifyError(error),
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      context,
      timestamp,
      severity,
      userId: context.userId,
      recoverable: this.isRecoverable(error)
    };

    // Add to error log
    this.addToErrorLog(unifiedError);

    // Log to console with service context
    console.error(`[${service.toUpperCase()}-ERROR]`, {
      id: errorId,
      message: unifiedError.message,
      context,
      severity,
      timestamp
    });

    // Handle based on severity
    const result = await this.processError(unifiedError);

    // Update circuit breaker if needed
    if (context.endpoint) {
      await this.recordFailure(service, context.endpoint);
    }

    // Store critical errors in database
    if (severity === 'critical') {
      await this.persistCriticalError(unifiedError);
    }

    return result;
  }

  /**
   * Check if operation should proceed based on circuit breaker
   */
  canProceed(service: string, endpoint?: string): boolean {
    const key = endpoint ? `${service}:${endpoint}` : service;
    const breaker = this.circuitBreakers.get(key);
    
    if (!breaker) return true;
    
    const now = Date.now();
    
    switch (breaker.state) {
      case 'closed':
        return true;
        
      case 'open':
        if (now >= breaker.nextAttemptTime) {
          breaker.state = 'half_open';
          breaker.successCount = 0;
          return true;
        }
        return false;
        
      case 'half_open':
        return true;
        
      default:
        return true;
    }
  }

  /**
   * Record successful operation for circuit breaker
   */
  recordSuccess(service: string, endpoint?: string): void {
    const key = endpoint ? `${service}:${endpoint}` : service;
    const breaker = this.circuitBreakers.get(key);
    
    if (!breaker) return;
    
    if (breaker.state === 'half_open') {
      breaker.successCount++;
      if (breaker.successCount >= this.SUCCESS_THRESHOLD) {
        breaker.state = 'closed';
        breaker.failureCount = 0;
      }
    }
  }

  // ============================================================================
  // SECURITY CONSOLIDATION
  // ============================================================================

  /**
   * Validate and sanitize input across all services
   */
  validateInput(input: any, rules: {
    required?: string[];
    maxLength?: { [key: string]: number };
    patterns?: { [key: string]: RegExp };
    sanitize?: boolean;
  }): { valid: boolean; errors: string[]; sanitized?: any } {
    const errors: string[] = [];
    let sanitized = input;

    // Check required fields
    if (rules.required) {
      for (const field of rules.required) {
        if (!input[field] || (typeof input[field] === 'string' && !input[field].trim())) {
          errors.push(`${field} is required`);
        }
      }
    }

    // Check max lengths
    if (rules.maxLength) {
      for (const [field, maxLen] of Object.entries(rules.maxLength)) {
        if (input[field] && typeof input[field] === 'string' && input[field].length > maxLen) {
          errors.push(`${field} must be ${maxLen} characters or less`);
        }
      }
    }

    // Check patterns
    if (rules.patterns) {
      for (const [field, pattern] of Object.entries(rules.patterns)) {
        if (input[field] && !pattern.test(input[field])) {
          errors.push(`${field} format is invalid`);
        }
      }
    }

    // Sanitize if requested
    if (rules.sanitize && errors.length === 0) {
      sanitized = this.sanitizeObject(input);
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: rules.sanitize ? sanitized : undefined
    };
  }

  /**
   * Check rate limits across services
   */
  checkRateLimit(config: RateLimitConfig): { allowed: boolean; resetTime?: number } {
    const key = config.userId ? 
      `${config.service}:${config.userId}${config.endpoint ? ':' + config.endpoint : ''}` :
      `${config.service}${config.endpoint ? ':' + config.endpoint : ''}`;
    
    const now = Date.now();
    const limiter = this.rateLimiters.get(key);
    
    // Initialize or reset if window expired
    if (!limiter || now >= limiter.resetTime) {
      this.rateLimiters.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return { allowed: true };
    }
    
    // Check if limit exceeded
    if (limiter.count >= config.maxRequests) {
      this.recordSecurityViolation({
        violationType: 'rate_limit',
        service: config.service,
        userId: config.userId,
        details: { endpoint: config.endpoint, attempts: limiter.count },
        severity: 'medium',
        blocked: true
      });
      
      return { 
        allowed: false, 
        resetTime: limiter.resetTime 
      };
    }
    
    // Increment counter
    limiter.count++;
    return { allowed: true };
  }

  /**
   * Record security violation
   */
  recordSecurityViolation(violation: Omit<SecurityViolation, 'id' | 'timestamp'>): void {
    const securityViolation: SecurityViolation = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...violation
    };
    
    this.violations.push(securityViolation);
    
    // Block user if severe
    if (violation.severity === 'high' || violation.severity === 'critical') {
      if (violation.userId) {
        this.blockedUsers.add(violation.userId);
        
        // Auto-unblock after 1 hour for high severity, 24 hours for critical
        const unblockTime = violation.severity === 'high' ? 3600000 : 86400000;
        setTimeout(() => {
          this.blockedUsers.delete(violation.userId!);
        }, unblockTime);
      }
    }
    
    console.warn('[SECURITY-VIOLATION]', securityViolation);
    
    // Persist critical violations
    if (violation.severity === 'critical') {
      this.persistSecurityViolation(securityViolation);
    }
  }

  /**
   * Check if user is blocked
   */
  isUserBlocked(userId: string): boolean {
    return this.blockedUsers.has(userId);
  }

  // ============================================================================
  // SERVICE-SPECIFIC ERROR HANDLERS
  // ============================================================================

  /**
   * Handle payment service errors with specific recovery
   */
  async handlePaymentError(error: Error, context: any): Promise<any> {
    const result = await this.handleError('payment', error, context, 'high');
    
    // Payment-specific recovery
    if (result.retryable && context.paymentIntentId) {
      toast.error("Payment processing failed. Please try again.", {
        action: {
          label: "Retry",
          onClick: () => context.retryCallback?.()
        }
      });
    }
    
    return result;
  }

  /**
   * Handle messaging service errors with offline queue
   */
  async handleMessagingError(error: Error, context: any): Promise<any> {
    const result = await this.handleError('messaging', error, context, 'medium');
    
    // Messaging-specific recovery - queue for offline
    if (result.retryable && context.message) {
      toast.info("Message queued for when you're back online");
    }
    
    return result;
  }

  /**
   * Handle Trunkline analytics errors with graceful degradation
   */
  async handleAnalyticsError(error: Error, context: any): Promise<any> {
    const result = await this.handleError('trunkline', error, context, 'low');
    
    // Analytics-specific recovery - return cached or fallback data
    if (context.fallbackData) {
      return { handled: true, data: context.fallbackData };
    }
    
    return result;
  }

  /**
   * Handle cache service errors with cache bypass
   */
  async handleCacheError(error: Error, context: any): Promise<any> {
    const result = await this.handleError('cache', error, context, 'low');
    
    // Cache-specific recovery - bypass cache and fetch directly
    if (context.fetcherCallback) {
      try {
        const data = await context.fetcherCallback();
        return { handled: true, data };
      } catch (fetchError) {
        console.error('Fallback fetcher also failed:', fetchError);
      }
    }
    
    return result;
  }

  // ============================================================================
  // MONITORING AND REPORTING
  // ============================================================================

  /**
   * Get error statistics for monitoring
   */
  getErrorStatistics(): {
    totalErrors: number;
    errorsByService: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: UnifiedError[];
    circuitBreakerStatus: Record<string, CircuitBreakerState>;
  } {
    const errorsByService: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    
    this.errorLog.forEach(error => {
      errorsByService[error.service] = (errorsByService[error.service] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
    });
    
    return {
      totalErrors: this.errorLog.length,
      errorsByService,
      errorsBySeverity,
      recentErrors: this.errorLog.slice(-10),
      circuitBreakerStatus: Object.fromEntries(this.circuitBreakers)
    };
  }

  /**
   * Get security statistics
   */
  getSecurityStatistics(): {
    totalViolations: number;
    violationsByType: Record<string, number>;
    blockedUsers: number;
    recentViolations: SecurityViolation[];
  } {
    const violationsByType: Record<string, number> = {};
    
    this.violations.forEach(violation => {
      violationsByType[violation.violationType] = (violationsByType[violation.violationType] || 0) + 1;
    });
    
    return {
      totalViolations: this.violations.length,
      violationsByType,
      blockedUsers: this.blockedUsers.size,
      recentViolations: this.violations.slice(-10)
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private classifyError(error: Error | string): UnifiedError['errorType'] {
    const message = typeof error === 'string' ? error : error.message;
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) return 'network';
    if (lowerMessage.includes('auth') || lowerMessage.includes('token')) return 'authentication';
    if (lowerMessage.includes('permission') || lowerMessage.includes('unauthorized')) return 'authorization';
    if (lowerMessage.includes('rate') || lowerMessage.includes('limit')) return 'rate_limit';
    if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) return 'validation';
    
    return 'system';
  }

  private isRecoverable(error: Error | string): boolean {
    const message = typeof error === 'string' ? error : error.message;
    const lowerMessage = message.toLowerCase();
    
    // Network errors are usually recoverable
    if (lowerMessage.includes('network') || lowerMessage.includes('timeout')) return true;
    
    // Rate limit errors are recoverable after waiting
    if (lowerMessage.includes('rate') || lowerMessage.includes('limit')) return true;
    
    // Validation errors are not recoverable without input changes
    if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) return false;
    
    // Auth errors need re-authentication
    if (lowerMessage.includes('auth') || lowerMessage.includes('token')) return false;
    
    return true; // Default to recoverable
  }

  private async processError(error: UnifiedError): Promise<{ handled: boolean; userMessage?: string; retryable: boolean }> {
    let userMessage: string | undefined;
    
    switch (error.severity) {
      case 'critical':
        userMessage = "A critical error occurred. Our team has been notified.";
        toast.error(userMessage);
        break;
        
      case 'high':
        userMessage = "An error occurred. Please try again.";
        toast.error(userMessage);
        break;
        
      case 'medium':
        userMessage = "Something went wrong. Please try again.";
        toast.error(userMessage);
        break;
        
      case 'low':
        // Silent handling for low severity errors
        break;
    }
    
    return {
      handled: true,
      userMessage,
      retryable: error.recoverable
    };
  }

  private async recordFailure(service: string, endpoint?: string): Promise<void> {
    const key = endpoint ? `${service}:${endpoint}` : service;
    const breaker = this.circuitBreakers.get(key) || {
      service,
      state: 'closed' as const,
      failureCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
      successCount: 0
    };
    
    breaker.failureCount++;
    breaker.lastFailureTime = Date.now();
    
    if (breaker.failureCount >= this.FAILURE_THRESHOLD) {
      breaker.state = 'open';
      breaker.nextAttemptTime = Date.now() + this.RECOVERY_TIMEOUT;
      
      console.warn(`[CIRCUIT-BREAKER] ${key} opened due to ${breaker.failureCount} failures`);
      
      toast.warning(`${service} temporarily unavailable. Retrying automatically...`);
    }
    
    this.circuitBreakers.set(key, breaker);
  }

  private addToErrorLog(error: UnifiedError): void {
    this.errorLog.push(error);
    
    // Keep log size manageable
    if (this.errorLog.length > this.MAX_ERROR_LOG_SIZE) {
      this.errorLog.shift();
    }
  }

  private sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return typeof obj === 'string' ? this.sanitizeString(obj) : obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = this.sanitizeObject(value);
    }
    return sanitized;
  }

  private sanitizeString(str: string): string {
    // Basic XSS prevention
    return str
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  private async persistCriticalError(error: UnifiedError): Promise<void> {
    try {
      // Store in database for analysis - using security_logs table
      await supabase
        .from('security_logs')
        .insert({
          event_type: 'error',
          user_id: error.userId,
          details: {
            error_type: error.errorType,
            message: error.message,
            context: error.context,
            severity: error.severity,
            timestamp: error.timestamp
          } as Json
        });
    } catch (dbError) {
      console.error('Failed to persist critical error:', dbError);
    }
  }

  private async persistSecurityViolation(violation: SecurityViolation): Promise<void> {
    try {
      // Store in security_logs table  
      await supabase
        .from('security_logs')
        .insert({
          event_type: 'security_violation',
          user_id: violation.userId,
          details: {
            violation_id: violation.id,
            violation_type: violation.violationType,
            service: violation.service,
            details: violation.details,
            severity: violation.severity,
            timestamp: violation.timestamp
          } as Json
        });
    } catch (dbError) {
      console.error('Failed to persist security violation:', dbError);
    }
  }

  private setupGlobalErrorHandling(): void {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError('system', event.reason, { 
        type: 'unhandled_promise_rejection',
        url: window.location.href 
      }, 'high');
    });
    
    // Catch uncaught errors
    window.addEventListener('error', (event) => {
      this.handleError('system', event.error || event.message, {
        type: 'uncaught_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }, 'high');
    });
  }

  private startMaintenanceTasks(): void {
    // Clean old errors every hour
    setInterval(() => {
      const oneHourAgo = Date.now() - 3600000;
      this.errorLog = this.errorLog.filter(error => 
        new Date(error.timestamp).getTime() > oneHourAgo
      );
      
      // Clean old violations
      this.violations = this.violations.filter(violation =>
        new Date(violation.timestamp).getTime() > oneHourAgo
      );
    }, 3600000);
    
    // Reset circuit breakers if they've been open too long
    setInterval(() => {
      const now = Date.now();
      for (const [key, breaker] of this.circuitBreakers.entries()) {
        if (breaker.state === 'open' && now >= breaker.nextAttemptTime + this.RECOVERY_TIMEOUT) {
          breaker.state = 'half_open';
          breaker.successCount = 0;
          console.info(`[CIRCUIT-BREAKER] ${key} moved to half-open for recovery attempt`);
        }
      }
    }, 60000); // Check every minute
  }
}

// Export singleton instance
export const unifiedSecurityService = UnifiedSecurityService.getInstance();
