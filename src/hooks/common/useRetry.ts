import { useState, useCallback } from "react";
import { toast } from "sonner";

interface UseRetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  onRetry?: (attempt: number) => void;
  onMaxRetriesReached?: () => void;
}

interface UseRetryReturn<T> {
  execute: (fn: () => Promise<T>) => Promise<T | null>;
  isRetrying: boolean;
  retryCount: number;
  reset: () => void;
}

export function useRetry<T = any>(options: UseRetryOptions = {}): UseRetryReturn<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
    onRetry,
    onMaxRetriesReached,
  } = options;

  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const execute = useCallback(
    async (fn: () => Promise<T>): Promise<T | null> => {
      let currentAttempt = 0;
      setIsRetrying(false);
      setRetryCount(0);

      while (currentAttempt <= maxRetries) {
        try {
          const result = await fn();
          setRetryCount(currentAttempt);
          setIsRetrying(false);
          return result;
        } catch (error) {
          currentAttempt++;
          setRetryCount(currentAttempt);

          if (currentAttempt <= maxRetries) {
            setIsRetrying(true);
            onRetry?.(currentAttempt);

            // Calculate delay with exponential backoff
            const delay = exponentialBackoff 
              ? retryDelay * Math.pow(2, currentAttempt - 1)
              : retryDelay;

            console.log(`Retry attempt ${currentAttempt}/${maxRetries} in ${delay}ms`);
            
            // Show retry toast
            toast.info(`Retrying... (${currentAttempt}/${maxRetries})`, {
              duration: delay,
            });

            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            // Max retries reached
            setIsRetrying(false);
            onMaxRetriesReached?.();
            console.error(`Max retries (${maxRetries}) reached:`, error);
            
            toast.error("Operation failed after multiple attempts", {
              description: "Please try again later or contact support.",
            });
            
            return null;
          }
        }
      }

      return null;
    },
    [maxRetries, retryDelay, exponentialBackoff, onRetry, onMaxRetriesReached]
  );

  const reset = useCallback(() => {
    setIsRetrying(false);
    setRetryCount(0);
  }, []);

  return {
    execute,
    isRetrying,
    retryCount,
    reset,
  };
}