import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseAuthSessionReturn {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isProcessingToken: boolean;
}

// Optimized localStorage operations with batching
const batchLocalStorageOperations = (() => {
  let pending: { [key: string]: string | null } = {};
  let timeoutId: NodeJS.Timeout | null = null;

  const flush = () => {
    Object.entries(pending).forEach(([key, value]) => {
      if (value === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, value);
      }
    });
    pending = {};
    timeoutId = null;
  };

  return (operations: { [key: string]: string | null }) => {
    Object.assign(pending, operations);
    
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(flush, 50); // Batch operations within 50ms
  };
})();

// Cache for auth state to reduce redundant operations
let authCache: {
  session: Session | null;
  lastUpdate: number;
} = { session: null, lastUpdate: 0 };

export function useAuthSession(): UseAuthSessionReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingToken, setIsProcessingToken] = useState(false);

  // Process OAuth tokens from URL (optimized to only run when needed)
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
            // Update cache
            authCache = { session: data.session, lastUpdate: Date.now() };
            
            // Batch localStorage operations
            const operations: { [key: string]: string } = {
              "userId": data.session.user.id,
              "userEmail": data.session.user.email || ""
            };

            if (type === 'recovery' || type === 'signup') {
              operations["emailVerified"] = "true";
              operations["verifiedEmail"] = data.session.user.email || "";
            }

            batchLocalStorageOperations(operations);
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

  // Optimized auth state management
  useEffect(() => {
    let mounted = true;

    const updateAuthState = (newSession: Session | null, event?: string) => {
      if (!mounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);

      // Update cache
      authCache = { session: newSession, lastUpdate: Date.now() };

      // Batch localStorage operations
      if (newSession?.user) {
        batchLocalStorageOperations({
          "userId": newSession.user.id,
          "userEmail": newSession.user.email || '',
          "userName": newSession.user.user_metadata?.name || ''
        });

        if (event === 'SIGNED_IN') {
          toast.success('Signed in successfully!');
        }
      } else if (event === 'SIGNED_OUT') {
        batchLocalStorageOperations({
          "userId": null,
          "userEmail": null,
          "userName": null,
          "newSignUp": null,
          "emailVerified": null,
          "verifiedEmail": null
        });

        if (process.env.NODE_ENV === 'development') {
          toast.info('Signed out');
        }
      }
    };

    // Set up auth state change listener (avoid async callback to prevent deadlocks)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Use setTimeout to prevent Supabase deadlocks
        setTimeout(() => updateAuthState(session, event), 0);
      }
    );

    // Get initial session (use cache if recent)
    const now = Date.now();
    if (authCache.session && (now - authCache.lastUpdate) < 5000) {
      // Use cached session if less than 5 seconds old
      updateAuthState(authCache.session);
    } else {
      // Fetch fresh session
      supabase.auth.getSession().then(({ data: { session } }) => {
        updateAuthState(session);
      });
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, session, isLoading, isProcessingToken };
}