
import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock } from "lucide-react";
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
        
        if (error.message.includes("Invalid login credentials")) {
          setError("The email or password you entered is incorrect");
          toast.error("Sign in failed", {
            description: "The email or password you entered is incorrect",
          });
        } else {
          setError(error.message);
          toast.error("Sign in failed", {
            description: error.message,
          });
        }
        setIsLoading(false);
        return;
      }
      
      console.log("Sign in successful:", data);
      
      // Check profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user?.id)
        .maybeSingle();
        
      if (profileError) {
        console.error("Error fetching profile after sign in:", profileError);
      }
      
      console.log("User profile data:", profileData);
      
      // If no profile exists, we'll create one
      if (!profileData && data.user) {
        console.log("No profile found, creating one now for user:", data.user.id);
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([
            { 
              id: data.user.id,
              email: data.user.email,
              name: data.user.user_metadata?.name || '',
              updated_at: new Date().toISOString()
            }
          ]);
          
        if (insertError) {
          console.error("Error creating profile:", insertError);
          toast.error("Could not create user profile");
        } else {
          console.log("Created new profile for user");
        }
      }
      
      toast.success("Signed in successfully!");
      onSuccess();
    } catch (err) {
      console.error("Unexpected sign in error:", err);
      setError("An unexpected error occurred");
      toast.error("Sign in failed");
    } finally {
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
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
};
