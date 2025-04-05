

import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

interface UseAuthSessionReturn {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isProcessingToken: boolean;
}

export const useAuthSession = (): UseAuthSessionReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingToken, setIsProcessingToken] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Immediately check URL for access_token and handle it
  useEffect(() => {
    const handleAccessToken = async () => {
      const params = new URLSearchParams(location.hash.substring(1) || location.search);
      const accessToken = params.get('access_token') || null;
      const errorDescription = params.get('error_description') || null;
      const type = params.get('type') || null;
      
      // Handle auth errors explicitly
      if (errorDescription) {
        console.error("Auth error:", errorDescription);
        toast.error("Authentication error", { description: errorDescription });
        return;
      }
      
      // Detect any link with confirmation tokens from Supabase
      if ((accessToken && !isProcessingToken) || (type === 'signup' || type === 'recovery')) {
        setIsProcessingToken(true);
        console.log("Detected access token or confirmation link in URL - intercepting and redirecting to custom verification");
        
        // Clear URL parameters while preserving the path
        const cleanPath = location.pathname;
        window.history.replaceState(null, '', cleanPath);
        
        // Always redirect to our custom verification flow regardless of the token source
        navigate('/sign-up', { replace: true });
        
        setTimeout(() => {
          setIsProcessingToken(false);
          toast.info("Please complete email verification using the 6-digit code we sent you");
        }, 500);
        
        return;
      }
    };
    
    handleAccessToken();
  }, [location, navigate, isProcessingToken]);

  // Setup auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state change event:", event);
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        if (event === 'SIGNED_IN') {
          // Don't show success toast or redirect if we're processing a token
          // or if we're on the sign-up page (which handles its own verification)
          if (!isProcessingToken && !location.pathname.includes('/sign-up')) {
            toast.success('Signed in successfully!');
            navigate('/dashboard');
          }
        } else if (event === 'SIGNED_OUT') {
          toast.info('Signed out');
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate, location, isProcessingToken]);

  return { user, session, isLoading, isProcessingToken };
};

