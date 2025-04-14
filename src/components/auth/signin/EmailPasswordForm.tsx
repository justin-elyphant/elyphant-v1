
import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface EmailPasswordFormProps {
  onSuccess: () => void;
}

export const EmailPasswordForm = ({ onSuccess }: EmailPasswordFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log("Attempting to sign in with:", email);
      
      // Try to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error);
        
        // Try to check if user exists but password is wrong
        const { count, error: checkError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('email', email);
        
        if (!checkError && count && count > 0) {
          setError("The password you entered is incorrect");
          toast.error("Sign in failed", {
            description: "The password you entered is incorrect",
          });
        } else {
          // Check if user exists in auth but profile doesn't exist
          const { data: userData, error: authError } = await supabase.auth.admin.getUserByEmail(email);
          
          if (!authError && userData) {
            // User exists in auth but not in profiles
            console.log("User exists in auth but not in profiles, creating profile");
            try {
              const response = await supabase.functions.invoke('create-profile', {
                body: {
                  user_id: userData.id,
                  profile_data: {
                    email: userData.email,
                    name: userData.user_metadata?.name || email.split('@')[0],
                    updated_at: new Date().toISOString()
                  }
                }
              });
              
              if (response.error) {
                console.error("Error creating profile:", response.error);
              } else {
                console.log("Profile created successfully");
                // Try sign in again
                const { error: retryError } = await supabase.auth.signInWithPassword({
                  email,
                  password,
                });
                
                if (!retryError) {
                  toast.success("Signed in successfully!");
                  setIsLoading(false);
                  onSuccess();
                  return;
                }
              }
            } catch (profileError) {
              console.error("Error creating profile:", profileError);
            }
          }
          
          setError("The email or password you entered is incorrect");
          toast.error("Sign in failed", {
            description: "The email or password you entered is incorrect",
          });
        }
        setIsLoading(false);
        return;
      }
      
      console.log("Sign in successful:", data);
      
      // Store user ID and email in localStorage for reliability
      if (data.user?.id) {
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("userEmail", data.user.email || '');
        
        // Ensure the user has a profile
        try {
          const response = await supabase.functions.invoke('create-profile', {
            body: {
              user_id: data.user.id,
              profile_data: {
                email: data.user.email,
                name: data.user.user_metadata?.name || email.split('@')[0] || 'User',
                updated_at: new Date().toISOString()
              }
            }
          });
          
          if (response.error) {
            console.error("Error creating profile via edge function:", response.error);
          } else {
            console.log("Profile created/updated successfully via edge function:", response.data);
          }
        } catch (profileError) {
          console.error("Failed to call create-profile function:", profileError);
        }
      }
      
      toast.success("Signed in successfully!");
      
      // Set a flag to indicate that we're coming from sign-in
      localStorage.setItem("fromSignIn", "true");
      
      setIsLoading(false);
      onSuccess();
      
    } catch (err) {
      console.error("Unexpected sign in error:", err);
      setError("An unexpected error occurred");
      toast.error("Sign in failed");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            to="/reset-password"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            Forgot?
          </Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>
      
      {error && (
        <div className="text-sm text-destructive">{error}</div>
      )}
      
      <Button 
        type="submit" 
        className="w-full bg-purple-600 hover:bg-purple-700"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </Button>
    </form>
  );
};
