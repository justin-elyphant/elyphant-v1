import { supabase } from '@/integrations/supabase/client';

/**
 * Rate Limit Service
 * Integrates with database-level rate limiting to prevent brute force attacks
 */

export interface RateLimitResult {
  isBlocked: boolean;
  attemptsRemaining: number;
  resetAt: string;
  currentAttempts: number;
}

export type RateLimitEventType = 'login' | 'signup' | 'password_reset' | 'token_refresh';

/**
 * Check if an identifier (email/IP) is rate limited for a specific event
 */
export async function checkRateLimit(
  identifier: string,
  eventType: RateLimitEventType,
  maxAttempts: number = 5,
  windowMinutes: number = 15
): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabase.rpc('check_auth_rate_limit', {
      p_identifier: identifier,
      p_event_type: eventType,
      p_max_attempts: maxAttempts,
      p_window_minutes: windowMinutes
    });

    if (error || !data) {
      console.error('Rate limit check failed:', error);
      // Fail open - allow request if rate limit check fails
      return {
        isBlocked: false,
        attemptsRemaining: maxAttempts,
        resetAt: new Date(Date.now() + windowMinutes * 60000).toISOString(),
        currentAttempts: 0
      };
    }

    // Type-safe parsing of RPC result
    const result = data as unknown as {
      is_blocked: boolean;
      attempts_remaining: number;
      reset_at: string;
      current_attempts: number;
    };

    return {
      isBlocked: result.is_blocked,
      attemptsRemaining: result.attempts_remaining,
      resetAt: result.reset_at,
      currentAttempts: result.current_attempts
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open for availability
    return {
      isBlocked: false,
      attemptsRemaining: maxAttempts,
      resetAt: new Date(Date.now() + windowMinutes * 60000).toISOString(),
      currentAttempts: 0
    };
  }
}

/**
 * Reset rate limit after successful authentication
 */
export async function resetRateLimit(
  identifier: string,
  eventType: RateLimitEventType
): Promise<void> {
  try {
    const { error } = await supabase.rpc('reset_auth_rate_limit', {
      p_identifier: identifier,
      p_event_type: eventType
    });

    if (error) {
      console.error('Failed to reset rate limit:', error);
    }
  } catch (error) {
    console.error('Rate limit reset error:', error);
  }
}

/**
 * Get rate limit configuration for different event types
 */
export const RATE_LIMIT_CONFIG = {
  login: { maxAttempts: 5, windowMinutes: 15 },
  signup: { maxAttempts: 3, windowMinutes: 60 },
  password_reset: { maxAttempts: 3, windowMinutes: 60 },
  token_refresh: { maxAttempts: 30, windowMinutes: 1 }
} as const;

/**
 * Format rate limit error message for user
 */
export function getRateLimitErrorMessage(result: RateLimitResult): string {
  const resetTime = new Date(result.resetAt);
  const now = new Date();
  const minutesUntilReset = Math.ceil((resetTime.getTime() - now.getTime()) / 60000);

  if (minutesUntilReset > 60) {
    const hours = Math.ceil(minutesUntilReset / 60);
    return `Too many attempts. Please try again in ${hours} hour${hours > 1 ? 's' : ''}.`;
  }

  return `Too many attempts. Please try again in ${minutesUntilReset} minute${minutesUntilReset > 1 ? 's' : ''}.`;
}
