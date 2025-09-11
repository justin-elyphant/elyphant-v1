import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { EmployeeDetectionService } from "@/services/employee/EmployeeDetectionService";

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

  // Process OAuth tokens from URL - simplified with guards
  useEffect(() => {
    let isProcessed = false;
    
    const processAuthRedirect = async () => {
      const fragment = window.location.hash.substring(1);
      if (!fragment || isProcessed) return;

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

    const updateAuthState = (newSession: Session | null, event?: string) => {
      if (!mounted) return;


      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);

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
        // Clear localStorage on sign out
        localStorage.removeItem("userId");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userName");
        localStorage.removeItem("newSignUp");
        localStorage.removeItem("emailVerified");
        localStorage.removeItem("verifiedEmail");
        localStorage.removeItem("modalCurrentStep");
        localStorage.removeItem("modalInSignupFlow");
        localStorage.removeItem("modalForceOpen");
        localStorage.removeItem("modalTargetStep");
        
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
      
      // If we have a session, verify the user still exists
      if (session?.user) {
        try {
          const { data, error } = await supabase.auth.getUser();
          if (error && error.message.includes('User from sub claim in JWT does not exist')) {
            await supabase.auth.signOut();
            return;
          }
        } catch (err) {
          console.error("Auth: Error validating user:", err);
        }
      }
      
      updateAuthState(session);
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