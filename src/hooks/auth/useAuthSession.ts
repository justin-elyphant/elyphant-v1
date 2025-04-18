
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

export function useAuthSession(): UseAuthSessionReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingToken, setIsProcessingToken] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check URL for access_token
  useEffect(() => {
    const handleAccessToken = async () => {
      const params = new URLSearchParams(location.hash.substring(1) || location.search);
      const accessToken = params.get('access_token') || null;
      const errorDescription = params.get('error_description') || null;
      const type = params.get('type') || null;
      const confirmToken = params.get('token') || null;
      
      if (errorDescription) {
        console.error("Auth error:", errorDescription);
        toast.error("Authentication error", { description: errorDescription });
        return;
      }
      
      if ((accessToken && !isProcessingToken) || 
          (type === 'signup' || type === 'recovery') || 
          confirmToken) {
        setIsProcessingToken(true);
        console.log("Intercepted auth redirect - redirecting to profile setup");
        
        // Clear URL parameters
        const cleanPath = location.pathname;
        window.history.replaceState(null, '', cleanPath);
        
        // Set flag for new signup
        localStorage.setItem("newSignUp", "true");
        
        // Navigate to profile setup
        navigate('/profile-setup', { replace: true });
        
        setTimeout(() => {
          setIsProcessingToken(false);
        }, 500);
      }
    };
    
    handleAccessToken();
  }, [location, navigate, isProcessingToken]);

  // Set up auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state change event:", event, "on path:", location.pathname);
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        if (event === 'SIGNED_IN') {
          // Check if this is from the signup flow
          const isNewSignUp = localStorage.getItem("newSignUp") === "true";
          
          if (isNewSignUp || 
              location.pathname === '/sign-up' || 
              location.pathname.includes('/sign-up')) {
            console.log("Detected sign up flow, directing to profile setup");
            navigate('/profile-setup', { replace: true });
            return;
          }
          
          // Standard sign-in handling
          if (!isProcessingToken && 
              location.pathname !== '/profile-setup') {
            
            toast.success('Signed in successfully!');
            
            // Check if profile is complete or needs setup
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('username, name')
                .eq('id', session?.user?.id)
                .single();
              
              if (!profile || !profile.username) {
                console.log("Incomplete profile, redirecting to profile setup");
                navigate('/profile-setup', { replace: true });
              } else {
                navigate('/dashboard', { replace: true });
              }
            } catch (error) {
              console.error("Error checking profile:", error);
              navigate('/profile-setup', { replace: true });
            }
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
}
