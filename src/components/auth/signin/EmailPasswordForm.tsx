
import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
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
      
      // Store user ID and email in localStorage for reliability
      if (data.user?.id) {
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("userEmail", data.user.email || '');
      }
      
      // Ensure the user has a profile even if sign-in worked
      if (data.user?.id) {
        try {
          console.log("Creating/updating profile on sign in for user:", data.user.id);
          
          const profileData = {
            email: data.user.email,
            name: data.user.user_metadata?.name || email.split('@')[0] || 'User',
            updated_at: new Date().toISOString()
          };
          
          const response = await supabase.functions.invoke('create-profile', {
            body: {
              user_id: data.user.id,
              profile_data: profileData
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
      
      // Force a short delay before navigation to ensure storage is updated
      setTimeout(() => {
        onSuccess();
      }, 100);
      
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
