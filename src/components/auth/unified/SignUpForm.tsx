
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Gift } from "lucide-react";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";

// Simplified schema for beta - only name and email (no password)
const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
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
      console.log("🚀 Beta signup: Storing data temporarily...", { email: data.email });
      
      // Store signup data temporarily in localStorage
      LocalStorageService.setProfileCompletionState({
        email: data.email,
        firstName: data.name.split(' ')[0] || '',
        lastName: data.name.split(' ').slice(1).join(' ') || '',
        step: 'signup',
        source: 'email'
      });
      
      // Store invitation context if present
      if (invitationData) {
        localStorage.setItem('invitation_context', JSON.stringify(invitationData));
      }
      
      // Store redirect path for after profile setup
      const redirectPath = searchParams.get('redirect');
      if (redirectPath) {
        localStorage.setItem('post_auth_redirect', redirectPath);
      }
      
      toast.success("Let's set up your profile!", {
        description: "We'll create your account after you complete your profile."
      });
      
      // Navigate directly to StreamlinedSignUp for profile collection
      navigate('/streamlined-signup');
      
    } catch (error: any) {
      console.error("Beta signup error:", error);
      toast.error("Something went wrong", {
        description: "Please try again or contact support."
      });
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
      
      {/* Hide social login buttons for beta */}
      
      {/* Remove social divider since we're hiding social login */}
      
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
        
        {/* Remove password field for beta */}
        
        <Button type="submit" size="touch" className="w-full touch-target-44" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Continue...
            </>
          ) : (
            "Continue to Profile Setup"
          )}
        </Button>
        
        <p className="text-caption text-muted-foreground text-center">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </form>
    </div>
  );
};

export default SignUpForm;
