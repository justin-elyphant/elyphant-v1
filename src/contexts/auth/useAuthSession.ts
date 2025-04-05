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

  // Check URL for access_token and handle it
  useEffect(() => {
    const handleAccessToken = async () => {
      // Check if the URL has an access_token parameter (from email verification)
      const params = new URLSearchParams(location.hash.substring(1) || location.search);
      const accessToken = params.get('access_token') || null;
      
      if (accessToken && !isProcessingToken) {
        try {
          setIsProcessingToken(true);
          console.log("Processing access token from URL");
          
          // Get the email and verified parameters if they exist
          const email = params.get('email') || null;
          const verified = params.get('verified') === 'true';
          
          // Check if we're in the signup flow with verified=true
          if (verified && email) {
            console.log("Detected verified=true in URL with email:", email);
            
            // Exchange the access token for a session
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
              console.error("Error getting session:", sessionError);
              toast.error("Verification failed: Invalid or expired token");
              setIsProcessingToken(false);
            } else if (sessionData?.session) {
              console.log("Session obtained from token");
              setSession(sessionData.session);
              setUser(sessionData.session.user);
              
              // Set a flag to show verification success message
              localStorage.setItem('email_just_verified', 'true');
              
              // If we're on the sign-up page, let the sign-up page component handle the redirect
              if (location.pathname === '/sign-up') {
                console.log("Already on sign-up page, will let the component handle verification");
                setTimeout(() => {
                  setIsProcessingToken(false);
                }, 100);
              } else {
                // Otherwise navigate to sign-up with the verified parameter
                navigate('/sign-up?verified=true&email=' + encodeURIComponent(email), { replace: true });
                setTimeout(() => {
                  setIsProcessingToken(false);
                }, 500);
              }
            }
          } else {
            // Regular token without verified=true
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
              console.error("Error getting session:", sessionError);
              setIsProcessingToken(false);
            } else if (sessionData?.session) {
              setSession(sessionData.session);
              setUser(sessionData.session.user);
              toast.success("Authentication successful!");
              navigate('/dashboard', { replace: true });
              setIsProcessingToken(false);
            }
          }
        } catch (err) {
          console.error("Error processing access token:", err);
          setIsProcessingToken(false);
          toast.error("Failed to process verification. Please try again.");
        }
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
          
          // If this is right after email verification
          const emailJustVerified = localStorage.getItem('email_just_verified');
          if (emailJustVerified === 'true') {
            toast.success('Email verified successfully!');
            localStorage.removeItem('email_just_verified');
          }
          
          // Check if we're in the signup flow with verified=true
          const params = new URLSearchParams(location.search);
          const verified = params.get('verified') === 'true';
          
          if (verified && location.pathname === '/sign-up') {
            console.log("Already on sign-up page with verified=true, not navigating");
            // Don't navigate - let the signup component handle the flow
          } else if (!isProcessingToken && location.pathname !== '/sign-up') {
            // Otherwise navigate to dashboard
            navigate('/dashboard');
          }
        } else if (event === 'SIGNED_OUT') {
          toast.info('Signed out');
        } else if (event === 'USER_UPDATED') {
          console.log("User updated event received");
          
          const emailJustVerified = localStorage.getItem('email_just_verified');
          
          if (session?.user.email_confirmed_at && emailJustVerified === 'true') {
            toast.success('Email verified successfully!');
            localStorage.removeItem('email_just_verified');
          }
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
