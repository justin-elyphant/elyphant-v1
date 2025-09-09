
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmailPasswordSignUpFormProps {
  onSuccess: () => void;
}

export const EmailPasswordSignUpForm: React.FC<EmailPasswordSignUpFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    console.log("Starting signup process...", { email });

    try {
      console.log("Calling supabase.auth.signUp...");
      const startTime = Date.now();
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      const endTime = Date.now();
      console.log("Signup completed in:", endTime - startTime, "ms");
      console.log("Signup response:", { data, error });

      if (error) {
        console.error("Signup error details:", { 
          message: error.message, 
          status: error.status, 
          name: error.name,
          fullError: error 
        });
        
        // Check for 504 timeout or server errors and try edge function fallback
        const isServerError = error.status === 504 || 
                             error.message.includes('504') || 
                             error.message.includes('timeout') || 
                             error.message.includes('Gateway') ||
                             error.name === 'AuthRetryableFetchError' ||
                             error.message === '{}'; // Empty message indicates server error
        
        console.log("Is server error?", isServerError);
        
        if (isServerError) {
          console.log("🔄 Attempting fallback via edge function...");
          toast.info("Server timeout, trying backup method...");
          
          try {
            // Use edge function that sends verification email properly
            const { data: edgeData, error: edgeError } = await supabase.functions.invoke('send-verification-email', {
              body: { email, name: email.split('@')[0] }
            });
            
            console.log("Verification email function response:", { edgeData, edgeError });
            
            if (edgeError) {
              console.error("Verification email error:", edgeError);
              toast.error("Signup failed: " + edgeError.message);
            } else {
              console.log("✅ Verification email sent successfully");
              toast.success("Account setup started! Please check your email for verification link.");
              onSuccess();
              return;
            }
          } catch (edgeErr) {
            console.error("Edge function exception:", edgeErr);
            toast.error("Signup failed. Please try again later.");
          }
        } else {
          toast.error(error.message || "Signup failed");
        }
      } else {
        console.log("Signup successful:", data);
        if (data.user && !data.user.email_confirmed_at) {
          toast.success("Account created! Please check your email for verification link.");
        } else {
          toast.success("Account created successfully!");
        }
        onSuccess();
      }
    } catch (error) {
      console.error("Signup exception:", error);
      toast.error("An unexpected error occurred: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create a password"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
          required
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating Account..." : "Sign Up"}
      </Button>
    </form>
  );
};
