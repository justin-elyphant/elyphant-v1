/**
 * Global toast deduplication system
 * Prevents multiple identical toasts from appearing simultaneously
 */

import { toast } from "sonner";

// Global registry of active toasts
const activeToasts = new Map<string, { id: string; timestamp: number }>();

// Cleanup old toast entries
const CLEANUP_INTERVAL = 30000; // 30 seconds
const DUPLICATE_THRESHOLD = 2000; // 2 seconds

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of activeToasts.entries()) {
    if (now - value.timestamp > CLEANUP_INTERVAL) {
      activeToasts.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

/**
 * Creates a deduplication key for toast messages
 */
function createDeduplicationKey(type: string, message: string, description?: string): string {
  return `${type}:${message}:${description || ''}`.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Checks if a similar toast was recently shown
 */
function isDuplicate(key: string): boolean {
  const existing = activeToasts.get(key);
  if (!existing) return false;
  
  const timeDiff = Date.now() - existing.timestamp;
  return timeDiff < DUPLICATE_THRESHOLD;
}

/**
 * Registers a toast in the deduplication system
 */
function registerToast(key: string, toastId: string): void {
  activeToasts.set(key, {
    id: toastId,
    timestamp: Date.now()
  });
}

/**
 * Dismisses existing duplicate toasts
 */
function dismissExisting(key: string): void {
  const existing = activeToasts.get(key);
  if (existing) {
    toast.dismiss(existing.id);
    activeToasts.delete(key);
  }
}

/**
 * Deduplicated toast.success
 */
export const debouncedToastSuccess = (message: string, options?: { description?: string; id?: string }) => {
  const key = createDeduplicationKey('success', message, options?.description);
  
  // Dismiss any existing duplicate
  dismissExisting(key);
  
  // Check if this is a duplicate
  if (isDuplicate(key)) {
    console.log(`Deduplicated success toast: ${message}`);
    return null;
  }
  
  const toastId = options?.id || `success-${Date.now()}`;
  const result = toast.success(message, { ...options, id: toastId });
  registerToast(key, toastId);
  
  return result;
};

/**
 * Deduplicated toast.error
 */
export const debouncedToastError = (message: string, options?: { description?: string; id?: string; action?: any }) => {
  const key = createDeduplicationKey('error', message, options?.description);
  
  // Dismiss any existing duplicate
  dismissExisting(key);
  
  // Check if this is a duplicate
  if (isDuplicate(key)) {
    console.log(`Deduplicated error toast: ${message}`);
    return null;
  }
  
  const toastId = options?.id || `error-${Date.now()}`;
  const result = toast.error(message, { ...options, id: toastId });
  registerToast(key, toastId);
  
  return result;
};

/**
 * Deduplicated toast.info
 */
export const debouncedToastInfo = (message: string, options?: { description?: string; id?: string }) => {
  const key = createDeduplicationKey('info', message, options?.description);
  
  // Dismiss any existing duplicate
  dismissExisting(key);
  
  // Check if this is a duplicate
  if (isDuplicate(key)) {
    console.log(`Deduplicated info toast: ${message}`);
    return null;
  }
  
  const toastId = options?.id || `info-${Date.now()}`;
  const result = toast.info(message, { ...options, id: toastId });
  registerToast(key, toastId);
  
  return result;
};

/**
 * Deduplicated toast.loading
 */
export const debouncedToastLoading = (message: string, options?: { description?: string; id?: string }) => {
  const key = createDeduplicationKey('loading', message, options?.description);
  
  // Dismiss any existing duplicate
  dismissExisting(key);
  
  // Check if this is a duplicate
  if (isDuplicate(key)) {
    console.log(`Deduplicated loading toast: ${message}`);
    return null;
  }
  
  const toastId = options?.id || `loading-${Date.now()}`;
  const result = toast.loading(message, { ...options, id: toastId });
  registerToast(key, toastId);
  
  return result;
};

/**
 * Clear all registered toasts
 */
export const clearAllDuplicatedToasts = (): void => {
  for (const [key, value] of activeToasts.entries()) {
    toast.dismiss(value.id);
  }
  activeToasts.clear();
};

/**
 * Get debug information about active toasts
 */
export const getActiveToastsDebugInfo = () => {
  return Array.from(activeToasts.entries()).map(([key, value]) => ({
    key,
    id: value.id,
    age: Date.now() - value.timestamp
  }));
};