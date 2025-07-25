import React, { useState } from "react";
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { X, Gift, Heart, Rocket, Lock, Zap, Bot, ShoppingBag, FileText } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";

// Import existing unified components
import { SocialLoginButtons } from "@/components/auth/signin/SocialLoginButtons";
import OnboardingIntentModal from "@/components/auth/signup/OnboardingIntentModal";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";
import { useProfileCreate } from "@/hooks/profile/useProfileCreate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import AddressAutocomplete from "@/components/settings/AddressAutocomplete";
import ProfileBubble from "@/components/ui/profile-bubble";
import { supabase } from "@/integrations/supabase/client";

// Enhanced auth modal steps
type AuthStep = "welcome" | "email-signup" | "profile-setup" | "intent-selection" | "agent-collection" | "sign-in";
type AuthMode = "signin" | "signup";

interface EnhancedAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStep?: AuthStep;
  initialMode?: AuthMode;
  suggestedIntent?: "quick-gift" | "browse-shop" | "create-wishlist";
}

const EnhancedAuthModal: React.FC<EnhancedAuthModalProps> = ({
  isOpen,
  onClose,
  defaultStep = "welcome",
  initialMode = "signup",
  suggestedIntent
}) => {
  const [currentStep, setCurrentStep] = useState<AuthStep>(initialMode === "signin" ? "sign-in" : defaultStep);
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [preventClose, setPreventClose] = useState(false); // Prevent modal from closing during critical transitions
  const [forceOpen, setForceOpen] = useState(false); // Force modal to stay open during transitions
  const { user } = useAuth();
  const navigate = useNavigate();

  // Debug modal state changes and check for localStorage flags
  React.useEffect(() => {
    console.log("🎭 Modal state change: isOpen =", isOpen, "currentStep =", currentStep, "user =", !!user, "forceOpen =", forceOpen);
    
    // Check for forced modal state from localStorage
    const shouldForceOpen = localStorage.getItem('modalForceOpen') === 'true';
    const targetStep = localStorage.getItem('modalTargetStep');
    
    if (shouldForceOpen && !forceOpen) {
      console.log("🔒 Setting forceOpen = true from localStorage flag");
      setForceOpen(true);
      setPreventClose(true);
    }
    
    if (targetStep && targetStep !== currentStep) {
      console.log("🎯 Setting target step from localStorage:", targetStep, "current user:", !!user);
      setCurrentStep(targetStep as AuthStep);
      
      // Clear the localStorage flags after a delay
      setTimeout(() => {
        console.log("🧹 Clearing localStorage flags and re-enabling modal close");
        localStorage.removeItem('modalForceOpen');
        localStorage.removeItem('modalTargetStep');
        setForceOpen(false);
        setPreventClose(false);
      }, 3000);
    }
    
    // Check for pending profile data after user authentication
    if (user && currentStep === "profile-setup") {
      const pendingData = localStorage.getItem('profileDataPending');
      if (pendingData) {
        console.log("🔄 Found pending profile data, retrying profile creation");
        localStorage.removeItem('profileDataPending');
        // The ProfileSetupStep component will handle the retry
      }
    }
    
    if (!isOpen && currentStep === "profile-setup") {
      console.error("🚨 MODAL CLOSED WHILE ON PROFILE-SETUP STEP! This is the bug!");
    }
  }, [isOpen, currentStep, user, forceOpen]);

  // Debug when onClose is called
  const handleClose = React.useCallback((reason?: any) => {
    console.log("🚪 Modal onClose called! Current step:", currentStep, "Prevent close:", preventClose, "Force open:", forceOpen, "Reason:", reason);
    
    if (preventClose || forceOpen || currentStep === "profile-setup") {
      console.log("🛡️ Modal close prevented during critical transition");
      return;
    }
    
    console.trace("Modal close trace:");
    onClose();
  }, [onClose, currentStep, preventClose, forceOpen]);

  const WelcomeStep = () => (
    <div className="text-center space-y-4 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          {authMode === "signin" ? "Welcome Back!" : "Welcome to Elyphant"}
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {authMode === "signin" 
            ? "Sign in to continue your thoughtful gift-giving journey" 
            : "The thoughtful way to give and receive gifts with friends and family"
          }
        </p>
      </div>

      {/* Value propositions */}
      <div className="space-y-2 text-left max-w-sm mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <Gift className="w-3 h-3 text-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-medium">AI-Powered Gift Discovery</h3>
            <p className="text-xs text-muted-foreground">
              Let Nicole help you find the perfect gift
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <Heart className="w-3 h-3 text-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Shared Wishlists</h3>
            <p className="text-xs text-muted-foreground">
              Create and share wishlists with your circle
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <Bot className="w-3 h-3 text-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Auto-Gifting</h3>
            <p className="text-xs text-muted-foreground">
              Never miss a birthday or special occasion
            </p>
          </div>
        </div>
      </div>

      {/* Social login prominence */}
      <div className="space-y-3">
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
          onClick={() => setCurrentStep(authMode === "signin" ? "sign-in" : "email-signup")}
          variant="outline"
          className="w-full"
        >
          {authMode === "signin" ? "Sign In with Email" : "Continue with Email"}
        </Button>
      </div>

      {/* Mode switching */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          {authMode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => {
              setAuthMode(authMode === "signin" ? "signup" : "signin");
              setCurrentStep("welcome");
            }}
            className="text-primary hover:underline font-medium"
          >
            {authMode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>

      {/* Trust elements */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Lock className="w-3 h-3 text-muted-foreground" />
          Secure & Private
        </span>
        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-muted-foreground" />
          Free to Join
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

      console.log("🚀 EmailSignupStep: Starting account creation");

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

        console.log("🚀 EmailSignupStep: Signup response:", { signUpData, signUpError });

        if (signUpError) {
          console.error("🚨 EmailSignupStep: Signup error:", signUpError);
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
          console.log("✅ EmailSignupStep: User created successfully:", signUpData.user.id);
          
          // Store completion state for streamlined profile setup
          LocalStorageService.setProfileCompletionState({
            email: formData.email,
            firstName: formData.name.split(' ')[0] || '',
            lastName: formData.name.split(' ').slice(1).join(' ') || '',
            step: 'profile',
            source: 'email'
          });

          console.log("✅ EmailSignupStep: Stored profile completion state");

          toast.success("Account created!", {
            description: "Please check your email to verify your account."
          });

          console.log("🔄 EmailSignupStep: About to transition to profile-setup");
          
          // Set a flag in localStorage to force modal to stay open
          localStorage.setItem('modalForceOpen', 'true');
          localStorage.setItem('modalTargetStep', 'profile-setup');
          
          // Use setTimeout to ensure state change happens after React batching
          setTimeout(() => {
            console.log("🔄 EmailSignupStep: Setting step to profile-setup (delayed)");
            setCurrentStep("profile-setup");
            console.log("✅ EmailSignupStep: Current step set to profile-setup (delayed)");
          }, 100); // Small delay to avoid React state batching conflicts
        }
      } catch (error) {
        console.error("🚨 EmailSignupStep: Unexpected error:", error);
        toast.error("An unexpected error occurred");
      } finally {
        setIsLoading(false);
        console.log("🏁 EmailSignupStep: Loading finished");
      }
    };

    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-start mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep("welcome")}
            className="self-start"
          >
            ← Back to Welcome
          </Button>
        </div>
        <div className="text-center space-y-2">
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
            <PasswordInput
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

  // Sign-in step using existing unified components
  const SignInStep = () => {
    const [formData, setFormData] = useState({
      email: "",
      password: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        const { supabase } = await import("@/integrations/supabase/client");
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          toast.error("Sign in failed", {
            description: error.message
          });
          return;
        }

        if (data?.user) {
          toast.success("Welcome back!");
          onClose();
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Sign in error:", error);
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
          <h2 className="text-2xl font-semibold">Sign In</h2>
          <p className="text-muted-foreground">
            Welcome back to your thoughtful gift-giving journey
          </p>
        </div>

        {/* Social login buttons */}
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

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <PasswordInput
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            disabled={isLoading}
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        {/* Mode switching */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Don't have an account?{" "}
            <button
              onClick={() => {
                setAuthMode("signup");
                setCurrentStep("welcome");
              }}
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    );
  };

  // Profile setup step with native form
  const ProfileSetupStep = () => {
    const { createProfile, isCreating } = useProfileCreate();
    const [profileData, setProfileData] = useState({
      first_name: "",
      last_name: "",
      username: "",
      date_of_birth: null as Date | null,
      profile_image: null as string | null,
      address: {
        street: "",
        line2: "",
        city: "",
        state: "",
        zipCode: "",
        country: "US"
      }
    });
    
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

    // Auto-generate username from first and last name
    React.useEffect(() => {
      if (profileData.first_name && profileData.last_name && !profileData.username) {
        const generatedUsername = `${profileData.first_name.toLowerCase()}.${profileData.last_name.toLowerCase()}`.replace(/[^a-z0-9.]/g, '');
        setProfileData(prev => ({ ...prev, username: generatedUsername }));
      }
    }, [profileData.first_name, profileData.last_name, profileData.username]);

    // Load stored data on component mount
    React.useEffect(() => {
      const completionState = LocalStorageService.getProfileCompletionState();
      if (completionState?.firstName || completionState?.lastName) {
        setProfileData(prev => ({
          ...prev,
          first_name: completionState.firstName || "",
          last_name: completionState.lastName || ""
        }));
      }
    }, []);

    const handleImageSelect = async (file: File) => {
      setProfileImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setProfileImageUrl(previewUrl);

      try {
        if (!user) return;

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(fileName, file);

        if (error) {
          toast.error('Failed to upload image');
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        setProfileData(prev => ({ ...prev, profile_image: publicUrl }));
        setProfileImageUrl(publicUrl);
        toast.success('Profile photo uploaded successfully!');
      } catch (error) {
        toast.error('Failed to upload profile photo');
      }
    };

    const handleAddressSelect = (address: {
      address: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    }) => {
      setProfileData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          street: address.address,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
          country: address.country
        }
      }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!profileData.first_name || !profileData.last_name || !profileData.date_of_birth) {
        toast.error("Please fill in all required fields");
        return;
      }

      try {
        const submissionData = {
          name: `${profileData.first_name} ${profileData.last_name}`,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          username: profileData.username,
          email: user?.email || "",
          profile_image: profileData.profile_image,
          date_of_birth: profileData.date_of_birth,
          address: profileData.address,
          interests: [],
          importantDates: [],
          data_sharing_settings: {
            dob: "friends" as const,
            shipping_address: "private" as const,
            gift_preferences: "public" as const,
            email: "private" as const
          }
        };

        await createProfile(submissionData);
        console.log("Profile created successfully, transitioning to intent selection");
        setCurrentStep("intent-selection");
      } catch (error) {
        console.error('Error creating profile:', error);
        toast.error('Failed to create profile. Please try again.');
      }
    };

    const fullName = `${profileData.first_name} ${profileData.last_name}`.trim();

    return (
      <div className="space-y-6 p-6">
        <div className="text-center space-y-2">
        <div className="flex justify-start mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep("email-signup")}
            className="self-start"
          >
            ← Back
          </Button>
        </div>
          <h2 className="text-2xl font-semibold">Complete Your Profile</h2>
          <p className="text-muted-foreground">
            Just a few details to personalize your experience
          </p>
        </div>

        {/* Profile Photo Section */}
        <div className="flex flex-col items-center space-y-4">
          <ProfileBubble
            imageUrl={profileImageUrl}
            userName={fullName}
            onImageSelect={handleImageSelect}
            size="lg"
          />
          <p className="text-sm text-muted-foreground">Click to add a profile photo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input
                placeholder="John"
                value={profileData.first_name}
                onChange={(e) => setProfileData(prev => ({ ...prev, first_name: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input
                placeholder="Doe"
                value={profileData.last_name}
                onChange={(e) => setProfileData(prev => ({ ...prev, last_name: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label>Username</Label>
            <Input
              placeholder="john.doe"
              value={profileData.username}
              onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Birthday */}
          <div className="space-y-2">
            <Label>Date of Birth</Label>
            <DatePicker
              date={profileData.date_of_birth}
              setDate={(date) => setProfileData(prev => ({ ...prev, date_of_birth: date }))}
              disabled={(date) => 
                date > new Date() || 
                date < new Date(new Date().getFullYear() - 120, 0, 1)
              }
            />
          </div>

          {/* Address */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Shipping Address</Label>
            <AddressAutocomplete
              value={profileData.address.street}
              onChange={(value) => setProfileData(prev => ({ 
                ...prev, 
                address: { ...prev.address, street: value }
              }))}
              onAddressSelect={handleAddressSelect}
            />

            <Input
              placeholder="Apartment, Suite, Unit, etc. (optional)"
              value={profileData.address.line2}
              onChange={(e) => setProfileData(prev => ({ 
                ...prev, 
                address: { ...prev.address, line2: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            disabled={isCreating}
          >
            {isCreating ? "Creating Profile..." : "Complete Profile"}
          </Button>
        </form>
      </div>
    );
  };

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
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Gift className="w-5 h-5 text-foreground" />
              </div>
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
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-foreground" />
              </div>
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
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <FileText className="w-5 h-5 text-foreground" />
              </div>
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
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
          <Bot className="w-8 h-8 text-foreground" />
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
    console.log("🎬 Modal renderCurrentStep: Rendering step =", currentStep);
    switch (currentStep) {
      case "welcome":
        return <WelcomeStep />;
      case "email-signup":
        return <EmailSignupStep />;
      case "sign-in":
        return <SignInStep />;
      case "profile-setup":
        return <ProfileSetupStep />;
      case "intent-selection":
        return <IntentSelectionStep />;
      case "agent-collection":
        return <AgentCollectionStep />;
      default:
        console.log("⚠️ Modal renderCurrentStep: Unknown step, defaulting to welcome");
        return <WelcomeStep />;
    }
  };

  // Handle OAuth success by moving to profile setup (only for OAuth, not email signup)
  React.useEffect(() => {
    console.log("🔍 Modal auth useEffect: user =", !!user, "currentStep =", currentStep, "authMode =", authMode, "isOpen =", isOpen);
    
    // Only trigger for OAuth users who land on welcome step
    // Don't interfere with email signup flow
    if (user && currentStep === "welcome" && authMode === "signup" && isOpen) {
      const isOAuthUser = !LocalStorageService.getProfileCompletionState();
      console.log("🔄 Modal auth useEffect: isOAuthUser =", isOAuthUser);
      
      if (isOAuthUser) {
        console.log("🔄 Modal auth useEffect: Moving OAuth user from welcome to profile-setup");
        setCurrentStep("profile-setup");
      }
    }
  }, [user, currentStep, authMode, isOpen]);

  return (
    <Dialog open={forceOpen || isOpen} onOpenChange={handleClose}>
      <DialogPortal>
        {/* Lighter overlay like Etsy - more transparent to show homepage */}
        <DialogOverlay className="fixed inset-0 z-50 bg-black/10 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-[calc(100%-2rem)] max-h-[85vh] max-w-md translate-x-[-50%] translate-y-[-50%] gap-0 overflow-y-auto bg-gradient-to-br from-white to-purple-50/30 border-0 shadow-xl p-0 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
          {/* Step progress indicator */}
          {currentStep !== "welcome" && currentStep !== "intent-selection" && (
            <div className="absolute top-4 left-4 z-10">
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
      </DialogPortal>
    </Dialog>
  );
};

export default EnhancedAuthModal;