import { supabase } from '@/integrations/supabase/client';

/**
 * Wrapper for Supabase edge function invocations with automatic auth retry.
 * 
 * If a function call fails with a 401 or JWT/token error, this utility:
 * 1. Refreshes the session
 * 2. Retries the function call once
 * 
 * This prevents token expiry errors from blocking checkout flows.
 */
export async function invokeWithAuthRetry<T = any>(
  functionName: string,
  options?: { body?: any; headers?: Record<string, string> },
  maxRetries: number = 1
): Promise<{ data: T | null; error: any }> {
  let lastError: any = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const { data, error } = await supabase.functions.invoke(functionName, options);
    
    if (!error) {
      return { data, error: null };
    }
    
    lastError = error;
    
    // Check if error is auth-related (including corrupted JWT with missing claims)
    const errorMsg = error.message?.toLowerCase() || '';
    const isAuthError = 
      error.status === 401 || 
      error.status === 403 ||
      errorMsg.includes('jwt') ||
      errorMsg.includes('token') ||
      errorMsg.includes('unauthorized') ||
      errorMsg.includes('sub claim') ||
      errorMsg.includes('bad_jwt') ||
      errorMsg.includes('invalid claim');
    
    // If this is the last attempt or not an auth error, stop retrying
    if (attempt >= maxRetries || !isAuthError) {
      break;
    }
    
    // Attempt to refresh session
    console.log(`🔄 Auth error detected, refreshing session (attempt ${attempt + 1}/${maxRetries + 1})`);
    const { error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      console.error('❌ Failed to refresh session, clearing corrupted session:', refreshError);
      // Sign out to clear corrupted tokens - user will need to re-login
      await supabase.auth.signOut();
      break;
    }
    
    console.log('✅ Session refreshed, retrying function call...');
  }
  
  return { data: null, error: lastError };
}
