import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface UseAuthSessionReturn {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isProcessingToken: boolean;
}

export function useAuthSession(): UseAuthSessionReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingToken, setIsProcessingToken] = useState(false);

  // Process OAuth tokens from URL - simplified
  useEffect(() => {
    const processAuthRedirect = async () => {
      const fragment = window.location.hash.substring(1);
      if (!fragment) return;

      const params = new URLSearchParams(fragment);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');
      
      if (accessToken && refreshToken) {
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
              if (data.session.user.email) {
                localStorage.setItem("verifiedEmail", data.session.user.email);
              }
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

      // Log auth state changes in development
      if (process.env.NODE_ENV === 'development' && event) {
        console.log(`Auth: ${event}`, { 
          hasSession: !!newSession, 
          hasUser: !!newSession?.user
        });
      }

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
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        updateAuthState(session, event);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (process.env.NODE_ENV === 'development') {
        console.log("Auth: Fresh session loaded", { hasSession: !!session });
      }
      updateAuthState(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, session, isLoading, isProcessingToken };
}