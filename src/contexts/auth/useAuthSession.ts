
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

  // Immediately check URL for access_token and handle it
  useEffect(() => {
    const handleAccessToken = async () => {
      const params = new URLSearchParams(location.hash.substring(1) || location.search);
      const accessToken = params.get('access_token') || null;
      const errorDescription = params.get('error_description') || null;
      const type = params.get('type') || null;
      const confirmToken = params.get('token') || null;  // Used in email confirmation links
      
      // Handle auth errors explicitly
      if (errorDescription) {
        console.error("Auth error:", errorDescription);
        toast.error("Authentication error", { description: errorDescription });
        return;
      }
      
      // For any auth redirects, take them to profile setup directly
      if ((accessToken && !isProcessingToken) || 
          (type === 'signup' || type === 'recovery') || 
          confirmToken) {
        setIsProcessingToken(true);
        console.log("Intercepted auth redirect - redirecting to profile setup");
        
        // Clear URL parameters while preserving the path
        const cleanPath = location.pathname;
        window.history.replaceState(null, '', cleanPath);
        
        // Always redirect to profile setup
        navigate('/profile-setup', { replace: true });
        
        setTimeout(() => {
          setIsProcessingToken(false);
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
        console.log("Auth state change event:", event, "on path:", location.pathname);
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        if (event === 'SIGNED_IN') {
          // Don't redirect if we're already on profile setup or handling a token
          if (!isProcessingToken && 
              !location.pathname.includes('/sign-up') && 
              location.pathname !== '/profile-setup') {
            
            toast.success('Signed in successfully!');
            
            try {
              // Check if this is a new user that needs profile setup
              const { data: profile } = await supabase
                .from('profiles')
                .select('username, name')
                .eq('id', session?.user?.id)
                .single();
              
              console.log("Profile check for new user:", profile);
              
              // If user has incomplete profile, go to profile setup
              if (!profile || !profile.username) {
                console.log("New signup or incomplete profile, redirecting to profile setup");
                navigate('/profile-setup', { replace: true });
              } else {
                // If profile is complete, go to dashboard
                navigate('/dashboard', { replace: true });
              }
            } catch (error) {
              console.error("Error checking profile:", error);
              // Default to profile setup if we can't determine profile status
              navigate('/profile-setup', { replace: true });
            }
          } else {
            console.log("Skipping auto-redirect because of special path condition");
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
