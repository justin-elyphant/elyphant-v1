
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuthWithRateLimit } from "@/hooks/useAuthWithRateLimit";

interface EmailPasswordSignUpFormProps {
  onSuccess: () => void;
}

export const EmailPasswordSignUpForm: React.FC<EmailPasswordSignUpFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { signUp, isLoading } = useAuthWithRateLimit();

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

    console.log("Starting signup process...", { email });

    try {
      console.log("Calling rate-limited signup...");
      const startTime = Date.now();
      
      const { data, error } = await signUp(email, password, {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      });

      const endTime = Date.now();
      console.log("Signup completed in:", endTime - startTime, "ms");
      console.log("Signup response:", { data, error });

      if (error) {
        console.error("Signup error details:", error);
        toast.error(error.message || "Signup failed");
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
