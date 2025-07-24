import { toast } from "sonner";

export interface ErrorContext {
  service: string;
  operation: string;
  userId?: string;
  metadata?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ErrorHandlingOptions {
  showToast?: boolean;
  logError?: boolean;
  retryOptions?: RetryOptions;
  fallbackValue?: any;
}

export interface RetryOptions {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier?: number;
}

export interface ErrorReport {
  id: string;
  timestamp: Date;
  error: Error;
  context: ErrorContext;
  resolved: boolean;
  retryCount: number;
}

export class UnifiedErrorHandlingService {
  private static instance: UnifiedErrorHandlingService;
  private errorHistory: Map<string, ErrorReport> = new Map();
  private retryQueues: Map<string, (() => Promise<any>)[]> = new Map();

  private constructor() {}

  static getInstance(): UnifiedErrorHandlingService {
    if (!this.instance) {
      this.instance = new UnifiedErrorHandlingService();
    }
    return this.instance;
  }

  /**
   * Handle errors with context and options
   */
  async handleError(
    error: Error,
    context: ErrorContext,
    options: ErrorHandlingOptions = {}
  ): Promise<any> {
    const {
      showToast = true,
      logError = true,
      retryOptions,
      fallbackValue
    } = options;

    // Generate unique error ID
    const errorId = `${context.service}-${context.operation}-${Date.now()}`;
    
    // Log error if enabled
    if (logError) {
      console.error(`[${context.service}] ${context.operation} failed:`, {
        error: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString()
      });
    }

    // Store error report
    const errorReport: ErrorReport = {
      id: errorId,
      timestamp: new Date(),
      error,
      context,
      resolved: false,
      retryCount: 0
    };
    this.errorHistory.set(errorId, errorReport);

    // Show toast notification
    if (showToast) {
      this.showErrorToast(error, context, retryOptions);
    }

    // Handle retry logic
    if (retryOptions) {
      return this.handleRetry(errorReport, retryOptions);
    }

    // Return fallback value if provided
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }

    // Re-throw error if no fallback
    throw error;
  }

  /**
   * Show contextual error toast
   */
  private showErrorToast(
    error: Error,
    context: ErrorContext,
    retryOptions?: RetryOptions
  ): void {
    const title = this.getErrorTitle(context);
    const description = this.getErrorDescription(error, context);

    switch (context.severity) {
      case 'critical':
        toast.error(title, {
          description,
          duration: 10000,
          action: retryOptions ? {
            label: "Retry",
            onClick: () => this.retryLastOperation(context)
          } : undefined
        });
        break;
      case 'high':
        toast.error(title, {
          description,
          duration: 7000,
          action: retryOptions ? {
            label: "Retry",
            onClick: () => this.retryLastOperation(context)
          } : undefined
        });
        break;
      case 'medium':
        toast.warning(title, {
          description,
          duration: 5000
        });
        break;
      case 'low':
        toast.info(title, {
          description,
          duration: 3000
        });
        break;
    }
  }

  /**
   * Handle retry logic with backoff
   */
  private async handleRetry(
    errorReport: ErrorReport,
    retryOptions: RetryOptions
  ): Promise<any> {
    const { maxRetries, delayMs, backoffMultiplier = 1.5 } = retryOptions;
    
    if (errorReport.retryCount >= maxRetries) {
      toast.error("Maximum retry attempts exceeded", {
        description: `Failed to complete ${errorReport.context.operation} after ${maxRetries} attempts`
      });
      throw errorReport.error;
    }

    // Calculate delay with backoff
    const delay = delayMs * Math.pow(backoffMultiplier, errorReport.retryCount);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    errorReport.retryCount++;
    this.errorHistory.set(errorReport.id, errorReport);
    
    toast.info(`Retrying ${errorReport.context.operation}...`, {
      description: `Attempt ${errorReport.retryCount + 1} of ${maxRetries + 1}`
    });

    return null; // Caller should handle retry logic
  }

  /**
   * Get contextual error title
   */
  private getErrorTitle(context: ErrorContext): string {
    const operationTitles: Record<string, string> = {
      'fetch': 'Failed to load data',
      'create': 'Failed to create',
      'update': 'Failed to update',
      'delete': 'Failed to delete',
      'validate': 'Validation failed',
      'search': 'Search failed',
      'upload': 'Upload failed',
      'download': 'Download failed',
      'sync': 'Sync failed'
    };

    return operationTitles[context.operation] || `${context.service} error`;
  }

  /**
   * Get contextual error description
   */
  private getErrorDescription(error: Error, context: ErrorContext): string {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return "Please check your internet connection and try again";
    }

    // Authentication errors
    if (error.message.includes('unauthorized') || error.message.includes('auth')) {
      return "Please sign in again to continue";
    }

    // Validation errors
    if (error.message.includes('validation')) {
      return "Please check your input and try again";
    }

    // Rate limiting
    if (error.message.includes('rate') || error.message.includes('limit')) {
      return "Too many requests. Please wait a moment and try again";
    }

    // Generic fallback
    return error.message || "An unexpected error occurred";
  }

  /**
   * Retry last operation for a context
   */
  private async retryLastOperation(context: ErrorContext): Promise<void> {
    const queueKey = `${context.service}-${context.operation}`;
    const queue = this.retryQueues.get(queueKey) || [];
    
    if (queue.length > 0) {
      const lastOperation = queue[queue.length - 1];
      try {
        await lastOperation();
        toast.success("Operation completed successfully");
      } catch (error) {
        console.error("Retry failed:", error);
        toast.error("Retry failed", {
          description: "Please try again later"
        });
      }
    }
  }

  /**
   * Register operation for retry capability
   */
  registerRetryableOperation(
    service: string,
    operation: string,
    operationFn: () => Promise<any>
  ): void {
    const queueKey = `${service}-${operation}`;
    const queue = this.retryQueues.get(queueKey) || [];
    queue.push(operationFn);
    
    // Keep only last 5 operations
    if (queue.length > 5) {
      queue.shift();
    }
    
    this.retryQueues.set(queueKey, queue);
  }

  /**
   * Get error history for debugging
   */
  getErrorHistory(): ErrorReport[] {
    return Array.from(this.errorHistory.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory.clear();
  }

  /**
   * Mark error as resolved
   */
  markErrorResolved(errorId: string): void {
    const errorReport = this.errorHistory.get(errorId);
    if (errorReport) {
      errorReport.resolved = true;
      this.errorHistory.set(errorId, errorReport);
    }
  }
}

export const unifiedErrorHandlingService = UnifiedErrorHandlingService.getInstance();
