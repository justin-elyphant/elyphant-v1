
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
        try {
          console.log("📧 Sending custom verification email");
          const { error: emailError } = await supabase.functions.invoke('send-verification-email', {
            body: {
              email: data.email,
              name: data.name,
              invitationContext: invitationData
            }
          });
          
          if (emailError) {
            console.error("Verification email error:", emailError);
            toast.error("Account created but email failed", {
              description: "Your account was created but we couldn't send the verification email. Please contact support."
            });
          } else {
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
        
        // Navigate to verification page instead of profile setup
        navigate('/verify-email', { replace: true });
      }
    } catch (error) {
      console.error("Sign up error:", error);
      toast.error("An unexpected error occurred");
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
        
        {/* Temporary test button for debugging */}
        <Button 
          type="button" 
          variant="outline" 
          size="touch" 
          className="w-full touch-target-44" 
          onClick={async () => {
            try {
              console.log("🧪 Testing verification system");
              const { data, error } = await supabase.functions.invoke('test-verification-system');
              console.log("Test result:", { data, error });
              toast.success("Test completed - check console logs");
            } catch (err) {
              console.error("Test error:", err);
              toast.error("Test failed - check console");
            }
          }}
        >
          🧪 Test Email System
        </Button>
        
        <p className="text-caption text-muted-foreground text-center">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </form>
    </div>
  );
};

export default SignUpForm;
