
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

export function useAuthSession(): UseAuthSessionReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingToken, setIsProcessingToken] = useState(false);
  
  // Remove router dependencies from this hook
  // We'll handle navigation in components that use this context

  // Set up auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state change event:", event);
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
          toast.success('Signed in successfully!');
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
  }, []);

  return { user, session, isLoading, isProcessingToken };
}
