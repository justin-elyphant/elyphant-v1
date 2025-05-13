
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { AuthContextProps } from "./types";
import { useAuthFunctions } from "./authHooks";

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDebugMode] = useState(() => localStorage.getItem("debugMode") === "true");

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setIsLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { signOut, deleteUser } = useAuthFunctions(user);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        toast.error("Failed to sign in", { description: error.message });
        return { error, data: null };
      }
      
      toast.success("Signed in successfully");
      return { error: null, data: data.session };
    } catch (error) {
      toast.error("An unexpected error occurred");
      return { error: error as Error, data: null };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) {
        toast.error("Failed to sign up", { description: error.message });
        return { error, data: { user: null, session: null } };
      }
      
      toast.success("Signed up successfully", { 
        description: "Check your email for verification instructions"
      });
      
      return { error: null, data };
    } catch (error) {
      toast.error("An unexpected error occurred");
      return { 
        error: error as Error, 
        data: { user: null, session: null } 
      };
    }
  };

  const value: AuthContextProps = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    deleteUser,
    isDebugMode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
