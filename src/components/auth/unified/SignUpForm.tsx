
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Gift } from "lucide-react";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";
import { SocialLoginButtons } from "@/components/auth/signin/SocialLoginButtons";

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

const SignUpForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [invitationData, setInvitationData] = useState<{
    invitation_id: string;
    recipient_name: string;
    recipient_email: string;
    inviter_first_name?: string;
  } | null>(null);
  
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema)
  });

  // Check for invitation parameters on load
  useEffect(() => {
    const invitation_id = searchParams.get('invitation_id');
    const recipient_name = searchParams.get('recipient_name');
    const recipient_email = searchParams.get('recipient_email');
    const inviter_context = searchParams.get('inviter_context');
    
    if (invitation_id && recipient_name && recipient_email) {
      // Parse inviter first name from inviter_context if available
      let inviter_first_name;
      try {
        if (inviter_context) {
          const contextData = JSON.parse(decodeURIComponent(inviter_context));
          inviter_first_name = contextData.inviter_first_name;
        }
      } catch (e) {
        console.log("Could not parse inviter_context:", e);
      }
      
      setInvitationData({
        invitation_id,
        recipient_name,
        recipient_email,
        inviter_first_name
      });
      
      // Pre-populate form fields
      setValue('name', recipient_name);
      setValue('email', recipient_email);
    }
  }, [searchParams, setValue]);

  const onSubmit = async (data: SignUpFormData) => {
    try {
      setIsLoading(true);
      
      // First, attempt the signup without email confirmation
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            invitation_context: invitationData
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (signUpError) {
        console.error("Signup error:", signUpError);
        
        if (signUpError.message.includes("already registered")) {
          toast.error("Email already registered", {
            description: "Please use a different email address or try to sign in."
          });
        } else if (signUpError.message.includes("timeout") || signUpError.message.includes("upstream request timeout")) {
          toast.error("Server timeout", {
            description: "The signup request timed out. Please try again in a moment."
          });
        } else {
          toast.error("Signup failed", {
            description: signUpError.message
          });
        }
        return;
      }
      
      // If signup succeeded, send custom verification email
      if (signUpData?.user) {
        let emailSent = false;
        
        try {
          console.log("📧 Sending custom verification email");
          const { data: emailData, error: emailError } = await supabase.functions.invoke('send-verification-email', {
            body: {
              email: data.email,
              name: data.name,
              invitationContext: invitationData
            }
          });
          
          console.log("Email function result:", { emailData, emailError });
          
          if (emailError) {
            console.error("Verification email error:", emailError);
            toast.error("Account created but email failed", {
              description: "Your account was created but we couldn't send the verification email. Please contact support."
            });
          } else {
            emailSent = true;
            toast.success("Account created!", {
              description: "Please check your email for a verification link to complete your signup."
            });
          }
        } catch (emailErr) {
          console.error("Email function error:", emailErr);
          toast.error("Account created but email failed", {
            description: "Your account was created but we couldn't send the verification email. Please contact support."
          });
        }
        
        // Store completion state for streamlined profile setup
        LocalStorageService.setProfileCompletionState({
          email: data.email,
          firstName: data.name.split(' ')[0] || '',
          lastName: data.name.split(' ').slice(1).join(' ') || '',
          step: 'profile',
          source: 'email'
        });
        
        // Store redirect path for after profile setup
        const redirectPath = searchParams.get('redirect');
        if (redirectPath) {
          localStorage.setItem('post_auth_redirect', redirectPath);
        }
        
        // Store invitation context for profile setup if present
        if (invitationData) {
          localStorage.setItem('invitation_context', JSON.stringify(invitationData));
        }
        
        // Navigate to verification page - create a simple one for now
        if (emailSent) {
          // For now, just show success and stay on same page since /verify-email doesn't exist
          console.log("✅ Account created and verification email sent successfully");
        } else {
          console.log("⚠️ Account created but email failed - user can try again");
        }
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      
      // Handle specific error types
      if (error?.status === 504 || error?.name === 'AuthRetryableFetchError') {
        toast.error("Authentication service overloaded", {
          description: "Supabase is experiencing high traffic. Please wait 30-60 seconds and try again, or try using Google/Apple sign-in instead.",
          duration: 8000
        });
      } else if (error?.message?.includes("timeout")) {
        toast.error("Request timeout", {
          description: "The signup request took too long. Please wait a moment and try again."
        });
      } else {
        toast.error("Signup failed", {
          description: error?.message || "An unexpected error occurred. Please try again."
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Render personalized welcome message for invitations
  const renderWelcomeMessage = () => {
    if (!invitationData) return null;
    
    const firstName = invitationData.recipient_name.split(' ')[0];
    const inviterName = invitationData.inviter_first_name || "someone";
    
    return (
      <div className="surface-secondary border border-border rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="surface-accent p-2 rounded-full">
            <Gift className="h-4 w-4 text-accent-foreground" />
          </div>
          <div>
            <h3 className="text-body font-medium text-foreground">
              Welcome to Elyphant, {firstName}!
            </h3>
            <p className="text-body-sm text-muted-foreground">
              {inviterName} invited you to join and start looking for great gifts for yourself
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-loose">
      {renderWelcomeMessage()}
      
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
          <Label htmlFor="name" className="text-body-sm">Full Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Enter your full name"
            {...register("name")}
            disabled={isLoading}
            className="touch-target-44"
          />
          {errors.name && (
            <p className="text-body-sm text-destructive">{errors.name.message}</p>
          )}
        </div>
        
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
            placeholder="Create a secure password"
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
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
        
        <p className="text-caption text-muted-foreground text-center">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </form>
    </div>
  );
};

export default SignUpForm;
