
import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuthSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingToken, setIsProcessingToken] = useState(false);

  useEffect(() => {
    // Check for URL parameters indicating an auth action (like email verification)
    const processAuthRedirect = async () => {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');
      
      if (accessToken && refreshToken) {
        try {
          setIsProcessingToken(true);
          
          console.log("Processing auth redirect with tokens");
          
          // Set session with tokens from URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error("Error setting session from URL parameters:", error);
          } else if (data.session) {
            console.log("Successfully set session from URL parameters");
            
            // Update auth state
            setSession(data.session);
            setUser(data.session.user);
            
            // Store verification state if this is an email verification
            if (type === 'recovery' || type === 'signup') {
              localStorage.setItem("emailVerified", "true");
              localStorage.setItem("verifiedEmail", data.session.user.email || "");
            }
          }
        } catch (e) {
          console.error("Error processing auth redirect:", e);
        } finally {
          // Clean up URL after processing
          if (window.history && window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          setIsProcessingToken(false);
        }
      }
    };

    processAuthRedirect();
  }, []);

  useEffect(() => {
    setIsLoading(true);
    
    // First set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state changed:", event);
        
        // Use setTimeout to avoid potential deadlocks with Supabase client
        setTimeout(() => {
          setSession(currentSession);
          setUser(currentSession?.user || null);
          
          if (event === 'SIGNED_IN') {
            // Store user info in localStorage for reliability
            if (currentSession?.user) {
              localStorage.setItem("userId", currentSession.user.id);
              localStorage.setItem("userEmail", currentSession.user.email || "");
              localStorage.setItem("userName", currentSession.user.user_metadata?.name || "");
            }
          } else if (event === 'SIGNED_OUT') {
            // Clear auth-related localStorage on signout
            localStorage.removeItem("userId");
            localStorage.removeItem("userEmail");
            localStorage.removeItem("userName");
            localStorage.removeItem("emailVerified");
            localStorage.removeItem("verifiedEmail");
          }
        }, 0);
      }
    );
    
    // Then get the current session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user || null);
      setIsLoading(false);
      
      // Store current user data if available
      if (currentSession?.user) {
        localStorage.setItem("userId", currentSession.user.id);
        localStorage.setItem("userEmail", currentSession.user.email || "");
        localStorage.setItem("userName", currentSession.user.user_metadata?.name || "");
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { session, user, isLoading, isProcessingToken };
};
