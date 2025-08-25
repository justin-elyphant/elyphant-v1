/**
 * Global Search Operations Tracker
 * Prevents duplicate search operations across all marketplace components
 */

import { useEffect, useRef } from "react";

// Global registry of active search operations
const activeSearchOperations = new Map<string, {
  startTime: number;
  abortController: AbortController;
  promise: Promise<any>;
}>();

// Cleanup completed operations
const OPERATION_TIMEOUT = 30000; // 30 seconds

export interface SearchOperation {
  id: string;
  query: string;
  page: number;
  type: 'search' | 'default' | 'category';
}

/**
 * Creates a unique operation ID
 */
function createOperationId(operation: SearchOperation): string {
  return `${operation.type}:${operation.query}:${operation.page}`.toLowerCase();
}

/**
 * Checks if a similar operation is already running
 */
export function isOperationActive(operation: SearchOperation): boolean {
  const id = createOperationId(operation);
  const existing = activeSearchOperations.get(id);
  
  if (!existing) return false;
  
  // Check if operation is still valid (not timed out)
  const age = Date.now() - existing.startTime;
  if (age > OPERATION_TIMEOUT) {
    // Clean up expired operation
    existing.abortController.abort();
    activeSearchOperations.delete(id);
    return false;
  }
  
  return true;
}

/**
 * Registers a new search operation
 */
export function registerSearchOperation(
  operation: SearchOperation,
  abortController: AbortController,
  promise: Promise<any>
): void {
  const id = createOperationId(operation);
  
  // Cancel any existing operation with the same ID
  const existing = activeSearchOperations.get(id);
  if (existing) {
    existing.abortController.abort();
  }
  
  // Register new operation
  activeSearchOperations.set(id, {
    startTime: Date.now(),
    abortController,
    promise
  });
  
  // Auto-cleanup when promise resolves/rejects
  promise.finally(() => {
    activeSearchOperations.delete(id);
  });
}

/**
 * Cancels all active search operations
 */
export function cancelAllSearchOperations(): void {
  for (const [id, operation] of activeSearchOperations.entries()) {
    operation.abortController.abort();
  }
  activeSearchOperations.clear();
}

/**
 * Gets debug information about active operations
 */
export function getActiveOperationsDebugInfo() {
  return Array.from(activeSearchOperations.entries()).map(([id, operation]) => ({
    id,
    age: Date.now() - operation.startTime,
    isAborted: operation.abortController.signal.aborted
  }));
}

/**
 * Hook to track and manage search operations in React components
 */
export function useSearchOperationsTracker() {
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  const startOperation = (operation: SearchOperation, searchPromise: Promise<any>) => {
    // Check if operation is already active
    if (isOperationActive(operation)) {
      console.log(`[SearchTracker] Operation already active: ${operation.type}:${operation.query}`);
      return null;
    }
    
    // Create abort controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    // Register operation
    registerSearchOperation(operation, abortControllerRef.current, searchPromise);
    
    console.log(`[SearchTracker] Started operation: ${operation.type}:${operation.query}`);
    
    return abortControllerRef.current;
  };
  
  const cancelCurrentOperation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };
  
  return {
    startOperation,
    cancelCurrentOperation,
    isActive: (operation: SearchOperation) => isOperationActive(operation)
  };
}

// Periodic cleanup of expired operations
setInterval(() => {
  const now = Date.now();
  for (const [id, operation] of activeSearchOperations.entries()) {
    const age = now - operation.startTime;
    if (age > OPERATION_TIMEOUT) {
      operation.abortController.abort();
      activeSearchOperations.delete(id);
    }
  }
}, OPERATION_TIMEOUT / 2);