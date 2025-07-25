import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";

// Import existing unified components
import { SocialLoginButtons } from "@/components/auth/signin/SocialLoginButtons";
import StreamlinedProfileForm from "@/components/auth/unified/StreamlinedProfileForm";
import OnboardingIntentModal from "@/components/auth/signup/OnboardingIntentModal";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";

// Enhanced auth modal steps
type AuthStep = "welcome" | "email-signup" | "profile-setup" | "intent-selection" | "agent-collection";

interface EnhancedAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStep?: AuthStep;
  suggestedIntent?: "quick-gift" | "browse-shop" | "create-wishlist";
}

const EnhancedAuthModal: React.FC<EnhancedAuthModalProps> = ({
  isOpen,
  onClose,
  defaultStep = "welcome",
  suggestedIntent
}) => {
  const [currentStep, setCurrentStep] = useState<AuthStep>(defaultStep);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Enhanced welcome screen with value propositions
  const WelcomeStep = () => (
    <div className="text-center space-y-6 p-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Welcome to Elyphant
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          The thoughtful way to give and receive gifts with friends and family
        </p>
      </div>

      {/* Value propositions */}
      <div className="space-y-4 text-left max-w-sm mx-auto">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🎁</span>
          <div>
            <h3 className="font-medium">AI-Powered Gift Discovery</h3>
            <p className="text-sm text-muted-foreground">
              Let Nicole help you find the perfect gift for any occasion
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-2xl">💝</span>
          <div>
            <h3 className="font-medium">Shared Wishlists</h3>
            <p className="text-sm text-muted-foreground">
              Create and share wishlists with your inner circle
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-2xl">🚀</span>
          <div>
            <h3 className="font-medium">Auto-Gifting</h3>
            <p className="text-sm text-muted-foreground">
              Never miss a birthday or special occasion again
            </p>
          </div>
        </div>
      </div>

      {/* Social login prominence */}
      <div className="space-y-4">
        <SocialLoginButtons />
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        <Button
          onClick={() => setCurrentStep("email-signup")}
          variant="outline"
          className="w-full"
        >
          Continue with Email
        </Button>
      </div>

      {/* Trust elements */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          🔒 Secure & Private
        </span>
        <span className="flex items-center gap-1">
          ⚡ Free to Join
        </span>
      </div>
    </div>
  );

  // Email signup step using existing form logic
  const EmailSignupStep = () => {
    const [formData, setFormData] = useState({
      name: "",
      email: "",
      password: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        const { supabase } = await import("@/integrations/supabase/client");
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });

        if (signUpError) {
          if (signUpError.message.includes("already registered")) {
            toast.error("Email already registered", {
              description: "Please use a different email address or try to sign in."
            });
          } else {
            toast.error("Signup failed", {
              description: signUpError.message
            });
          }
          return;
        }

        if (signUpData?.user) {
          // Store completion state for streamlined profile setup
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

          // Move to profile setup step
          setCurrentStep("profile-setup");
        }
      } catch (error) {
        console.error("Sign up error:", error);
        toast.error("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="space-y-6 p-6">
        <div className="text-center space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep("welcome")}
            className="mb-4"
          >
            ← Back to Welcome
          </Button>
          <h2 className="text-2xl font-semibold">Create Your Account</h2>
          <p className="text-muted-foreground">
            Join thousands of thoughtful gift-givers
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <input
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Create Password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
              minLength={6}
            />
          </div>
          
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    );
  };

  // Profile setup step using existing StreamlinedProfileForm
  const ProfileSetupStep = () => (
    <div className="p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold">Complete Your Profile</h2>
        <p className="text-muted-foreground">
          Just a few details to personalize your experience
        </p>
      </div>
      <StreamlinedProfileForm onComplete={() => setCurrentStep("intent-selection")} />
    </div>
  );

  // Intent selection step using existing OnboardingIntentModal logic
  const IntentSelectionStep = () => {
    const handleIntentSelect = (intent: "quick-gift" | "browse-shop" | "create-wishlist" | "auto-gift") => {
      // Store intent for later use
      localStorage.setItem("userIntent", intent);
      
      if (intent === "quick-gift" || intent === "auto-gift") {
        // Move to agent collection for auto-gifting
        setCurrentStep("agent-collection");
      } else {
        // Complete onboarding and close modal
        toast.success("Welcome to Elyphant!", {
          description: "Your account is all set up!"
        });
        onClose();
        navigate("/dashboard");
      }
    };

    const handleSkip = () => {
      localStorage.removeItem("userIntent");
      toast.success("Welcome to Elyphant!");
      onClose();
      navigate("/dashboard");
    };

    return (
      <div className="p-6 text-center space-y-6">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold">What would you like to do?</h2>
          <p className="text-muted-foreground">
            Choose how you'd like to get started with Elyphant
          </p>
        </div>

        {/* Intent options */}
        <div className="space-y-3">
          <Button
            onClick={() => handleIntentSelect("quick-gift")}
            className="w-full p-4 h-auto text-left bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 hover:from-purple-100 hover:to-pink-100"
            variant="outline"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎁</span>
              <div>
                <h3 className="font-medium text-purple-700">Auto Gift</h3>
                <p className="text-sm text-muted-foreground">Let Elyphant pick the perfect gift</p>
              </div>
            </div>
          </Button>

          <Button
            onClick={() => handleIntentSelect("browse-shop")}
            className="w-full p-4 h-auto text-left bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 hover:from-blue-100 hover:to-indigo-100"
            variant="outline"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛍️</span>
              <div>
                <h3 className="font-medium text-blue-700">Browse & Shop</h3>
                <p className="text-sm text-muted-foreground">Explore with AI assistance</p>
              </div>
            </div>
          </Button>

          <Button
            onClick={() => handleIntentSelect("create-wishlist")}
            className="w-full p-4 h-auto text-left bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 hover:from-green-100 hover:to-emerald-100"
            variant="outline"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📝</span>
              <div>
                <h3 className="font-medium text-green-700">Create Wishlist</h3>
                <p className="text-sm text-muted-foreground">Share what you'd love to receive</p>
              </div>
            </div>
          </Button>
        </div>

        <Button
          variant="ghost"
          onClick={handleSkip}
          className="w-full text-muted-foreground"
        >
          Skip for now
        </Button>
      </div>
    );
  };

  // Agent collection step for auto-gifting
  const AgentCollectionStep = () => (
    <div className="p-6 text-center space-y-6">
      <div className="space-y-3">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto">
          <span className="text-2xl">🤖</span>
        </div>
        <h2 className="text-2xl font-semibold">Meet Nicole</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Our AI gift advisor will help you set up auto-gifting for your loved ones. 
          She'll handle everything from finding the perfect gift to scheduling delivery.
        </p>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 space-y-3">
        <h3 className="font-medium">How Auto-Gifting Works:</h3>
        <div className="space-y-2 text-sm text-left">
          <div className="flex items-start gap-2">
            <span className="text-purple-600">1.</span>
            <span>Nicole learns about your gift recipient</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-600">2.</span>
            <span>She finds the perfect gift within your budget</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-600">3.</span>
            <span>Gifts are delivered automatically on special dates</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          onClick={() => {
            // Open the AI Gift Advisor bot for setup
            toast.success("Let's set up your first auto-gift!");
            onClose();
            // TODO: Trigger AI Gift Advisor bot with auto-gift context
          }}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          Start Auto-Gifting Setup
        </Button>
        
        <Button
          variant="outline"
          onClick={() => {
            toast.success("Welcome to Elyphant!");
            onClose();
            navigate("/dashboard");
          }}
          className="w-full"
        >
          Skip for Now
        </Button>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "welcome":
        return <WelcomeStep />;
      case "email-signup":
        return <EmailSignupStep />;
      case "profile-setup":
        return <ProfileSetupStep />;
      case "intent-selection":
        return <IntentSelectionStep />;
      case "agent-collection":
        return <AgentCollectionStep />;
      default:
        return <WelcomeStep />;
    }
  };

  // Handle OAuth success by moving to profile setup
  React.useEffect(() => {
    if (user && currentStep === "welcome") {
      setCurrentStep("profile-setup");
    }
  }, [user, currentStep]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-purple-50/30 border-0 shadow-xl">
        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Step progress indicator */}
        {currentStep !== "welcome" && currentStep !== "intent-selection" && (
          <div className="absolute top-4 left-4">
            <div className="flex gap-1">
              {["welcome", "email-signup", "profile-setup", "agent-collection"].map((step, index) => (
                <div
                  key={step}
                  className={`w-2 h-2 rounded-full ${
                    index <= ["welcome", "email-signup", "profile-setup", "agent-collection"].indexOf(currentStep)
                      ? "bg-purple-600"
                      : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {renderCurrentStep()}
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedAuthModal;