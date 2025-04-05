
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
      // Disable automatic email handling from Supabase redirects
      const params = new URLSearchParams(location.hash.substring(1) || location.search);
      const accessToken = params.get('access_token') || null;
      
      if (accessToken && !isProcessingToken) {
        setIsProcessingToken(true);
        console.log("Detected access token in URL - redirecting to sign up page for manual verification");
        
        // Instead of processing the token automatically, redirect to sign-up page
        // Our custom verification will handle it from there
        navigate('/sign-up', { replace: true });
        
        setTimeout(() => {
          setIsProcessingToken(false);
          toast.info("Please complete email verification using the 6-digit code we sent you");
        }, 500);
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
          // Don't show success toast if we're processing a token
          if (!isProcessingToken) {
            toast.success('Signed in successfully!');
          }
          
          // Redirect to dashboard only if not on sign-up page
          if (!isProcessingToken && !location.pathname.includes('/sign-up')) {
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
