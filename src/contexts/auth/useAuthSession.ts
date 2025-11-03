import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { EmployeeDetectionService } from "@/services/employee/EmployeeDetectionService";
import { useSessionTracking } from "@/hooks/useSessionTracking";

interface UseAuthSessionReturn {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isProcessingToken: boolean;
}

export function useAuthSession(): UseAuthSessionReturn {
  // Fixed: Removed all router hooks to prevent context errors
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingToken, setIsProcessingToken] = useState(false);

  // Track sessions in database (Phase 2: Enterprise Session Management)
  useSessionTracking(session);

  // Validate session matches stored user ID - CRITICAL for account switching bug
  const validateSessionUser = async (session: Session | null) => {
    if (!session?.user) return true; // No session to validate
    
    const storedUserId = localStorage.getItem("userId");
    const sessionUserId = session.user.id;
    
    // Check for user ID mismatch - critical security issue
    if (storedUserId && storedUserId !== sessionUserId) {
      console.error('CRITICAL: Session user mismatch detected!', {
        stored: storedUserId,
        session: sessionUserId,
        timestamp: new Date().toISOString(),
        userEmail: session.user.email
      });
      
      // Log security event
      await supabase.from('security_logs').insert({
        user_id: sessionUserId,
        event_type: 'session_mismatch_detected',
        details: {
          stored_user_id: storedUserId,
          session_user_id: sessionUserId,
          detection_time: new Date().toISOString()
        },
        user_agent: navigator.userAgent,
        risk_level: 'critical'
      });
      
      // Force sign out to prevent account switching
      await supabase.auth.signOut();
      localStorage.clear();
      window.location.reload();
      return false;
    }
    
    return true;
  };

  // Process OAuth tokens from URL - SECURITY: Only on allowed routes
  useEffect(() => {
    let isProcessed = false;
    
    const processAuthRedirect = async () => {
      const currentPath = window.location.pathname;
      const fragment = window.location.hash.substring(1);
      
      // SECURITY FIX: Only process tokens on specific allowed routes
      const allowedRoutes = ['/oauth-complete', '/verify-email'];
      const isAllowedRoute = allowedRoutes.some(route => currentPath.startsWith(route));
      
      // Block token processing on auth pages and launch pages
      const blockedRoutes = ['/auth', '/reset-password/launch', '/reset-password'];
      const isBlockedRoute = blockedRoutes.some(route => currentPath.startsWith(route));
      
      console.log('Token processing attempt:', { 
        currentPath, 
        isAllowedRoute, 
        isBlockedRoute,
        hasFragment: !!fragment 
      });
      
      if (!fragment || isProcessed || isBlockedRoute || !isAllowedRoute) {
        if (fragment && isBlockedRoute) {
          console.warn('SECURITY: Blocked token processing on restricted route:', currentPath);
        }
        return;
      }

      const params = new URLSearchParams(fragment);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');
      
      if (accessToken && refreshToken && !isProcessed) {
        isProcessed = true;
        try {
          setIsProcessingToken(true);
          
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error("Error setting session from URL:", error);
          } else if (data.session) {
            // Simple localStorage update without batching
            localStorage.setItem("userId", data.session.user.id);
            if (data.session.user.email) {
              localStorage.setItem("userEmail", data.session.user.email);
            }

            if (type === 'recovery' || type === 'signup') {
              localStorage.setItem("emailVerified", "true");
              
              // Set user identification for social auth
              if (type === 'signup') {
                const urlParams = new URLSearchParams(window.location.search);
                const signupSource = urlParams.get('signup_source') || 'social_auth';
                const userType = urlParams.get('user_type') || 'shopper';
                
                try {
                  await supabase.rpc('set_user_identification', {
                    target_user_id: data.session.user.id,
                    user_type_param: userType as any,
                    signup_source_param: signupSource as any,
                    metadata_param: {
                      provider: 'oauth',
                      signup_timestamp: new Date().toISOString(),
                      oauth_provider: data.session.user.app_metadata?.provider || 'unknown'
                    },
                    attribution_param: {
                      source: signupSource,
                      campaign: 'oauth_signup',
                      referrer: document.referrer || 'direct'
                    }
                  });
                } catch (identificationError) {
                  console.error('Error setting OAuth user identification:', identificationError);
                }
              }
              if (data.session.user.email) {
                localStorage.setItem("verifiedEmail", data.session.user.email);
              }
            }

            // Handle employee routing after OAuth
            if (data.session.user) {
              handleEmployeeRoutingAfterOAuth(data.session.user);
            }
          }
        } catch (e) {
          console.error("Error processing auth redirect:", e);
        } finally {
          // Clean up URL
          window.history?.replaceState({}, document.title, window.location.pathname);
          setIsProcessingToken(false);
        }
      }
    };

    processAuthRedirect();
  }, []);

  // Simplified auth state management
  useEffect(() => {
    let mounted = true;

    const updateAuthState = async (newSession: Session | null, event?: string) => {
      if (!mounted) return;

      // Set session and user FIRST to make them available immediately
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);

      // Then validate in background (non-blocking)
      if (newSession?.user) {
        validateSessionUser(newSession).then(isValid => {
          if (!isValid && mounted) {
            // Validation failed, session was already handled by validateSessionUser
            return;
          }
        });
      }

      // Simple localStorage operations without batching
      if (newSession?.user) {
        localStorage.setItem("userId", newSession.user.id);
        if (newSession.user.email) {
          localStorage.setItem("userEmail", newSession.user.email);
        }
        if (newSession.user.user_metadata?.name) {
          localStorage.setItem("userName", newSession.user.user_metadata.name);
        }
      } else if (event === 'SIGNED_OUT') {
        // Clear ALL localStorage on sign out except theme/language preferences
        const theme = localStorage.getItem("theme");
        const language = localStorage.getItem("language");
        
        localStorage.clear();
        
        // Restore theme/language
        if (theme) localStorage.setItem("theme", theme);
        if (language) localStorage.setItem("language", language);
        
        // Emit custom event for navigation in Router context
        window.dispatchEvent(new CustomEvent('auth-signout'));
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        updateAuthState(session, event);
      }
    );

    // Get initial session and validate user still exists
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      // Set auth state immediately for faster initialization
      await updateAuthState(session);
      
      // Then validate in background
      if (session?.user) {
        try {
          const { data, error } = await supabase.auth.getUser();
          if (error && error.message.includes('User from sub claim in JWT does not exist')) {
            await supabase.auth.signOut();
            return;
          }
          
          // Additional validation check
          validateSessionUser(session);
        } catch (err) {
          console.error("Auth: Error validating user:", err);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Handle employee routing after OAuth completion
  const handleEmployeeRoutingAfterOAuth = async (user: User) => {
    try {
      const detection = await EmployeeDetectionService.detectEmployee(user);
      
      if (detection.isEmployee) {
        localStorage.setItem('pendingEmployeeRedirect', 'true');
        localStorage.setItem('employeeRedirectReason', detection.reason);
      }
    } catch (error) {
      console.error('Error handling employee routing after OAuth:', error);
    }
  };

  return { user, session, isLoading, isProcessingToken };
}