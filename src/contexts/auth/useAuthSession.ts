
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
      
      // Special handling for new signups detected from URL params
      if ((accessToken && !isProcessingToken) || 
          (type === 'signup' || type === 'recovery') || 
          confirmToken) {
        setIsProcessingToken(true);
        console.log("Intercepted auth redirect - redirecting to profile setup");
        
        // Clear URL parameters for cleaner navigation
        window.history.replaceState(null, '', location.pathname);
        
        // Mark this as a new signup
        localStorage.setItem("newSignUp", "true");
        
        // Direct navigation to profile setup
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

        // Store user ID and email in localStorage for reliability
        if (session?.user) {
          localStorage.setItem("userId", session.user.id);
          localStorage.setItem("userEmail", session.user.email || '');
        } else {
          // Clear localStorage when user logs out
          if (event === 'SIGNED_OUT') {
            localStorage.removeItem("userId");
            localStorage.removeItem("userEmail");
            localStorage.removeItem("userName");
            localStorage.removeItem("newSignUp");
          }
        }

        if (event === 'SIGNED_IN') {
          // Check for new signup flow
          const isNewSignUp = localStorage.getItem("newSignUp") === "true";
          
          if (isNewSignUp || 
              location.pathname === '/sign-up' || 
              location.pathname.includes('/sign-up')) {
            console.log("Detected sign up flow, directing to profile setup");
            navigate('/profile-setup', { replace: true });
            return;
          }
          
          // Standard sign-in handling - don't redirect from profile-setup
          if (!isProcessingToken && 
              location.pathname !== '/profile-setup') {
            
            toast.success('Signed in successfully!');
            
            try {
              // Create or update profile for this user
              if (session?.user?.id) {
                try {
                  const response = await supabase.functions.invoke('create-profile', {
                    body: {
                      user_id: session.user.id,
                      profile_data: {
                        email: session.user.email,
                        name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                        updated_at: new Date().toISOString()
                      }
                    }
                  });
                  
                  if (response.error) {
                    console.error("Error creating/updating profile in auth state change:", response.error);
                  } else {
                    console.log("Profile created/updated in auth state change:", response.data);
                  }
                } catch (err) {
                  console.error("Failed to call create-profile in auth state change:", err);
                }
              }
              
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
      
      // Store user ID and email in localStorage for reliability
      if (session?.user) {
        localStorage.setItem("userId", session.user.id);
        localStorage.setItem("userEmail", session.user.email || '');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location, isProcessingToken]);

  return { user, session, isLoading, isProcessingToken };
}
