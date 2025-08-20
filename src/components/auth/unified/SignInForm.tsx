
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { SocialLoginButtons } from "@/components/auth/signin/SocialLoginButtons";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type SignInFormData = z.infer<typeof signInSchema>;

const SignInForm = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema)
  });

  const onSubmit = async (data: SignInFormData) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password", {
            description: "Please check your credentials and try again."
          });
        } else {
          toast.error("Sign in failed", {
            description: error.message
          });
        }
        return;
      }

      toast.success("Welcome back!");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-loose">
      <SocialLoginButtons />
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-caption uppercase">
          <span className="surface-primary px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-standard">
        <div className="space-y-minimal">
          <Label htmlFor="email" className="text-body-sm">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            {...register("email")}
            disabled={isLoading}
            className="touch-target-44"
          />
          {errors.email && (
            <p className="text-body-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
        
        <div className="space-y-minimal">
          <Label htmlFor="password" className="text-body-sm">Password</Label>
          <PasswordInput
            id="password"
            placeholder="Enter your password"
            {...register("password")}
            disabled={isLoading}
            className="touch-target-44"
          />
          {errors.password && (
            <p className="text-body-sm text-destructive">{errors.password.message}</p>
          )}
        </div>
        
        <Button type="submit" size="touch" className="w-full touch-target-44" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing In...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
        
        <div className="text-center">
          <Button variant="link" size="touch" className="text-body-sm text-muted-foreground p-0 touch-target-44">
            Forgot your password?
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SignInForm;
