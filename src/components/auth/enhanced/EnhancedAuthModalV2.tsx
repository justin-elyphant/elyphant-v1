import React, { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";
import { useUnifiedProfile } from "@/hooks/useUnifiedProfile";

// Import components
import { SocialLoginButtons } from "@/components/auth/signin/SocialLoginButtons";
import OnboardingIntentModal from "@/components/auth/signup/OnboardingIntentModal";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";
import { PasswordInput } from "@/components/ui/password-input";
import AgentCollectionStep from "./steps/AgentCollectionStep";
import { supabase } from "@/integrations/supabase/client";

// Enhanced auth modal steps
type AuthStep = "unified-signup" | "profile-setup" | "intent-selection" | "agent-collection" | "sign-in";
type AuthMode = "signin" | "signup";

interface EnhancedAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStep?: AuthStep;
  initialMode?: AuthMode;
  suggestedIntent?: "quick-gift" | "browse-shop" | "create-wishlist";
}

const EnhancedAuthModalV2: React.FC<EnhancedAuthModalProps> = ({
  isOpen,
  onClose,
  defaultStep = "unified-signup",
  initialMode = "signup",
  suggestedIntent
}) => {
  console.log("🚀 EnhancedAuthModalV2 rendering with props:", { isOpen, defaultStep, initialMode });
  // Single source of truth for state management
  const [currentStep, setCurrentStep] = useState<AuthStep>(defaultStep);
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [isFlowCompleted, setIsFlowCompleted] = useState(false);
  const [collectedData, setCollectedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isNewSignup, setIsNewSignup] = useState(false); // Flag to prevent auto-skip for fresh signups
  
  const { user } = useAuth();
  const { profile, loading, error: profileError, hasCompletedOnboarding, updateProfile } = useUnifiedProfile();
  const navigate = useNavigate();

  // Clean up state on modal close
  const cleanupState = useCallback(() => {
    console.log("🧹 Cleaning up modal state");
    setIsFlowCompleted(false);
    setError(null);
    setCollectedData(null);
    setIsNewSignup(false);
  }, []);

  // Step navigation with validation
  const nextStep = useCallback((step: AuthStep, data?: any) => {
    console.log(`🔄 Enhanced Modal V2 Step transition: ${currentStep} → ${step}`, data);
    console.log(`📊 Modal Flow Progress: unified-signup → profile-setup → intent-selection → agent-collection`);
    console.log(`📍 Current Position: ${step}`);
    
    // Validate step transition
    const validTransitions: Record<AuthStep, AuthStep[]> = {
      "unified-signup": ["profile-setup", "sign-in"],
      "profile-setup": ["intent-selection"],
      "intent-selection": ["agent-collection"],
      "agent-collection": [],
      "sign-in": []
    };
    
    if (validTransitions[currentStep]?.includes(step) || currentStep === step) {
      setCurrentStep(step);
      
      if (data) {
        setCollectedData(data);
      }
    } else {
      console.warn(`❌ Invalid step transition from ${currentStep} to ${step}`);
      setError(`Invalid step transition from ${currentStep} to ${step}`);
    }
  }, [currentStep]);

  const previousStep = useCallback(() => {
    const stepOrder: AuthStep[] = ["unified-signup", "profile-setup", "intent-selection", "agent-collection"];
    const currentIndex = stepOrder.indexOf(currentStep);
    
    if (currentIndex > 0) {
      const prevStep = stepOrder[currentIndex - 1];
      setCurrentStep(prevStep);
    }
  }, [currentStep]);

  // Clear signup success handler
  const handleSignupSuccess = useCallback((userData: any) => {
    console.log("✅ Signup successful, moving to profile setup");
    console.log("🏷️ Setting isNewSignup flag to prevent auto-skip");
    setIsNewSignup(true); // Prevent auto-skip for fresh signups
    nextStep("profile-setup", userData);
  }, [nextStep]);

  const handleProfileComplete = useCallback(() => {
    console.log("✅ Profile setup complete, moving to intent selection");
    console.log("🏷️ Clearing isNewSignup flag - user has progressed past profile setup");
    setIsNewSignup(false); // Clear flag after profile setup
    nextStep("intent-selection");
  }, [nextStep]);

  // Handle modal close with completion check
  const handleClose = useCallback(() => {
    console.log("🚪 Modal close requested", { currentStep, isFlowCompleted, isNewSignup, isLoading });
    
    // Prevent auto-close for fresh signups going through onboarding
    if (isNewSignup && currentStep === "profile-setup") {
      console.log("🚫 Preventing modal close for fresh signup in profile setup");
      return;
    }
    
    // Prevent close during active profile operations
    if (isLoading && currentStep === "profile-setup") {
      console.log("🚫 Preventing modal close during profile update operation");
      return;
    }
    
    // If flow is completed or user is in signin, handle navigation
    if (isFlowCompleted || currentStep === "sign-in") {
      if (user && !isFlowCompleted) {
        // User signed in successfully
        navigate("/dashboard");
      }
    }
    
    cleanupState();
    onClose();
  }, [currentStep, isFlowCompleted, user, navigate, cleanupState, onClose, isNewSignup, isLoading]);

  // Single initialization effect
  useEffect(() => {
    const initialStep = initialMode === "signin" ? "sign-in" : defaultStep;
    console.log("🎯 Modal initialization effect running:", { initialMode, defaultStep, initialStep });
    setCurrentStep(initialStep);
  }, []); // Empty dependency array - only run once on mount

  // Simplified auto-skip logic - single responsibility
  useEffect(() => {
    console.log("🔍 Auto-skip check:", {
      hasUser: !!user,
      hasCompletedOnboarding,
      currentStep,
      profileLoading: loading,
      profileError,
      isNewSignup,
      profileData: profile,
      onboardingCompleted: profile?.onboarding_completed
    });
    
    // CRITICAL: Never auto-skip during fresh signup flow, regardless of profile state
    if (isNewSignup && currentStep === "profile-setup") {
      console.log("🚫 Fresh signup detected - BLOCKING auto-skip, user must complete full onboarding flow");
      return; // Exit early to prevent any auto-skip logic
    }
    
    // Only auto-skip if we have a user, profile is loaded, onboarding is completed, 
    // we're on profile-setup, AND this is NOT a fresh signup
    if (user && !loading && hasCompletedOnboarding && currentStep === "profile-setup" && !isNewSignup) {
      console.log("✅ Profile onboarding completed (existing user), auto-skipping to intent selection");
      setTimeout(() => {
        handleProfileComplete();
      }, 100);
    }
  }, [user, hasCompletedOnboarding, loading, currentStep, handleProfileComplete, isNewSignup, profile]);

  // Error boundary and fallback mechanism
  useEffect(() => {
    if (profileError) {
      console.warn("⚠️ Profile error detected:", profileError);
      setError(`Profile error: ${profileError}`);
    }
  }, [profileError]);

  // Intent-based routing logic
  const handleIntentSelect = useCallback((intent: string) => {
    console.log("✅ Intent selected:", intent);
    
    if (intent === "quick-gift") {
      // Progress to agent-collection step (stays in modal)
      nextStep("agent-collection");
    } else {
      // Mark flow as completed and navigate
      setIsFlowCompleted(true);
      
      // Navigate based on intent
      if (intent === "browse-shop") {
        navigate("/marketplace");
      } else if (intent === "create-wishlist") {
        navigate("/wishlist");
      }
      
      cleanupState();
      onClose();
    }
  }, [nextStep, cleanupState, onClose, navigate]);

  // Agent collection completion handler
  const handleAgentComplete = useCallback(async (giftData: any) => {
    console.log("✅ Agent collection complete:", giftData);
    setCollectedData(giftData);
    
    // Mark onboarding as truly completed in profile
    try {
      await updateProfile({ onboarding_completed: true });
      console.log("✅ Onboarding marked as completed in profile");
    } catch (error) {
      console.error("Failed to mark onboarding complete:", error);
    }
    
    // Mark flow as completed and navigate to marketplace
    setIsFlowCompleted(true);
    
    // Navigate to marketplace with search params
    const searchParams = new URLSearchParams({
      recipient: giftData.recipientInfo?.name || '',
      occasion: giftData.occasion || '',
      budget: giftData.budget ? `${giftData.budget[0]}-${giftData.budget[1]}` : ''
    });
    navigate(`/marketplace?${searchParams.toString()}`);
    
    cleanupState();
    onClose();
    
    toast.success("Perfect! Let's find some great gift options for " + (giftData.recipientInfo?.name || "them"));
  }, [updateProfile, cleanupState, onClose, navigate]);

  // Unified Signup Step Component
  const UnifiedSignupStep = () => {
    const [formData, setFormData] = useState({
      name: "",
      email: "",
      password: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { name: formData.name },
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });

        if (signUpError) {
          if (signUpError.message.includes("already registered")) {
            toast.error("Email already registered", {
              description: "Please use a different email or try signing in."
            });
          } else {
            toast.error("Signup failed", { description: signUpError.message });
          }
          return;
        }

        if (signUpData?.user) {
          // Store profile completion state
          LocalStorageService.setProfileCompletionState({
            email: formData.email,
            firstName: formData.name.split(' ')[0] || '',
            lastName: formData.name.split(' ').slice(1).join(' ') || '',
            step: 'profile',
            source: 'email'
          });

          toast.success("Account created!", {
            description: "Please check your email to verify your account."
          });

          console.log("🎯 About to call handleSignupSuccess with data:", { email: formData.email, name: formData.name });
          handleSignupSuccess(formData);
        }
      } catch (error) {
        console.error("Signup error:", error);
        toast.error("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="space-y-6 p-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Create Your Account
          </h2>
          <p className="text-muted-foreground">
            Create your account today to discover and automate gifts for your loved ones
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <input
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <PasswordInput
            placeholder="Create Password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
            minLength={6}
          />
          
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <SocialLoginButtons />

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Already have an account?{" "}
            <button
              onClick={() => {
                setAuthMode("signin");
                setCurrentStep("sign-in");
              }}
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </button>
          </p>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    );
  };

  // Sign In Step Component
  const SignInStep = () => {
    const [formData, setFormData] = useState({ email: "", password: "" });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          toast.error("Sign in failed", { description: error.message });
          return;
        }

        toast.success("Welcome back!");
        // Navigate to dashboard and close modal
        navigate("/dashboard");
        cleanupState();
        onClose();
      } catch (error) {
        toast.error("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="space-y-6 p-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Welcome Back
          </h2>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <PasswordInput
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            disabled={isLoading}
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <SocialLoginButtons />

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Don't have an account?{" "}
            <button
              onClick={() => {
                setAuthMode("signup");
                setCurrentStep("unified-signup");
              }}
              className="text-primary hover:underline font-medium"
            >
              Create account
            </button>
          </p>
        </div>
      </div>
    );
  };

  // Profile Setup Step Component
  const ProfileSetupStep = () => {
    const { updateProfile } = useUnifiedProfile();
    const [profileData, setProfileData] = useState({
      name: "",
      email: "",
      bio: "",
      date_of_birth: null as Date | null,
      shipping_address: {
        street: "",
        line2: "",
        city: "",
        state: "",
        zipCode: "",
        country: "US"
      },
      gift_preferences: [],
      data_sharing_settings: {
        dob: 'friends' as const,
        shipping_address: 'private' as const,
        gift_preferences: 'public' as const,
        email: 'private' as const
      }
    });

    useEffect(() => {
      // Load from stored completion state
      const completionState = LocalStorageService.getProfileCompletionState();
      if (completionState) {
        const fullName = `${completionState.firstName || ''} ${completionState.lastName || ''}`.trim();
        setProfileData(prev => ({
          ...prev,
          name: fullName,
          email: completionState.email || ''
        }));
      }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      
      try {
        console.log("🔄 Starting profile update during onboarding");
        
        // Check if user is still authenticated before updating
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          console.error("❌ User not authenticated during profile update");
          toast.error("Authentication lost. Please sign in again.");
          return;
        }
        
        // CRITICAL: For new signups, do NOT set onboarding_completed to true
        // This prevents auto-skip logic from triggering
        const result = await updateProfile({
          ...profileData,
          onboarding_completed: false // Keep false during onboarding flow
        });
        
        if (result.success) {
          console.log("✅ Profile updated successfully during onboarding (onboarding_completed: false)");
          toast.success("Profile created successfully!");
          
          // Small delay to ensure database consistency
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Clear localStorage state
          LocalStorageService.clearProfileCompletionState();
          handleProfileComplete();
        } else {
          console.error("❌ Profile update failed:", result.error);
          toast.error(result.error || "Profile creation failed");
        }
      } catch (error) {
        console.error("Profile creation failed:", error);
        toast.error("Profile creation failed");
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="space-y-6 p-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Complete Your Profile
          </h2>
          <p className="text-muted-foreground">
            Tell us a bit about yourself to personalize your experience
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={profileData.name}
            onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <input
            type="email"
            placeholder="Email Address"
            value={profileData.email}
            onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
            readOnly
          />
          <textarea
            placeholder="Tell us about yourself (optional)"
            value={profileData.bio}
            onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
          />
          
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            disabled={isLoading}
          >
            {isLoading ? "Saving Profile..." : "Continue"}
          </Button>
        </form>
      </div>
    );
  };

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case "unified-signup":
        return <UnifiedSignupStep />;
      case "sign-in":
        return <SignInStep />;
      case "profile-setup":
        return <ProfileSetupStep />;
      case "intent-selection":
        return (
          <OnboardingIntentModal
            open={true}
            onSelect={handleIntentSelect}
            onSkip={() => {
              console.log("Intent selection skipped");
              handleClose();
            }}
            suggestedIntent={suggestedIntent}
          />
        );
      case "agent-collection":
        return (
          <AgentCollectionStep
            onComplete={handleAgentComplete}
          />
        );
      default:
        return <UnifiedSignupStep />;
    }
  };

  // Show OnboardingIntentModal directly for intent-selection step
  if (currentStep === "intent-selection") {
    return (
      <OnboardingIntentModal
        open={isOpen}
        onSelect={handleIntentSelect}
        onSkip={() => {
          console.log("Intent selection skipped");
          handleClose();
        }}
        suggestedIntent={suggestedIntent}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md mx-auto p-0 overflow-hidden">
        {/* Header with close button */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            {currentStep !== "unified-signup" && currentStep !== "sign-in" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={previousStep}
                className="p-1 h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="p-1 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Error display */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md">
            {error}
          </div>
        )}

        {/* Step content */}
        {renderCurrentStep()}
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedAuthModalV2;