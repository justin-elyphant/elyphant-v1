
import React from "react";
import { toast } from "sonner";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";
import SignUpView from "./views/SignUpView";
import VerificationView from "./views/VerificationView";
import { SignUpFormValues } from "./SignUpForm";
import OnboardingIntentModal from "./OnboardingIntentModal";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";

interface SignUpContentWrapperProps {
  step: "signup" | "verification";
  userEmail: string;
  userName: string;
  onSignUpSubmit: (values: SignUpFormValues) => Promise<void>;
  handleBackToSignUp: () => void;
  isSubmitting?: boolean;
  onResendVerification: () => Promise<{ success: boolean; rateLimited?: boolean }>;
  resendCount: number;
  bypassVerification?: boolean;
}

const SignUpContentWrapper: React.FC<SignUpContentWrapperProps> = ({
  step,
  userEmail,
  userName,
  onSignUpSubmit,
  handleBackToSignUp,
  isSubmitting = false,
  onResendVerification = () => Promise.resolve({ success: true }),
  resendCount = 0,
  bypassVerification = true
}) => {
  const [shouldShowModal, setShouldShowModal] = React.useState(false);
  const [suggestedIntent, setSuggestedIntent] = React.useState<"quick-gift" | "browse-shop" | "create-wishlist" | undefined>(undefined);
  const [isCheckingIntent, setIsCheckingIntent] = React.useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Handle verification step logic
  React.useEffect(() => {
    console.log("[SignUpContentWrapper] Effect triggered:", { step, userEmail, shouldShowModal });
    
    // Clear flags during signup step
    if (step === "signup") {
      // Clean up deprecated localStorage keys
      LocalStorageService.cleanupDeprecatedKeys();
      setShouldShowModal(false);
      setIsCheckingIntent(false);
      return;
    }
    
    // Handle verification step - IMMEDIATELY show modal without any delays
    if (step === "verification" && userEmail) {
      console.log("[SignUpContentWrapper] Verification step detected - IMMEDIATELY showing intent modal");
      
      // Check for existing intent using LocalStorageService
      const nicoleContext = LocalStorageService.getNicoleContext();
      const validIntent = nicoleContext?.selectedIntent === "quick-gift" || 
                         nicoleContext?.selectedIntent === "browse-shop" || 
                         nicoleContext?.selectedIntent === "create-wishlist";
      
      console.log("[SignUpContentWrapper] Current intent:", nicoleContext?.selectedIntent, "Valid:", validIntent);

      // If valid intent already exists, navigate immediately
      if (validIntent) {
        console.log("[SignUpContentWrapper] Valid intent found, navigating immediately");
        setTimeout(() => {
          if (nicoleContext?.selectedIntent === "browse-shop") {
            console.log("[SignUpContentWrapper] Navigating to marketplace with AI mode");
            navigate("/marketplace?mode=nicole&open=true&greeting=personalized", { replace: true });
          } else if (nicoleContext?.selectedIntent === "quick-gift") {
            console.log("[SignUpContentWrapper] Navigating to dashboard for quick gift");
            navigate("/dashboard", { replace: true });
          } else {
            console.log("[SignUpContentWrapper] Navigating to dashboard for wishlist creation");
            navigate("/dashboard", { replace: true });
          }
        }, 100);
        return;
      }

      // Get suggested intent from existing context or migrate legacy data
      if (!nicoleContext?.selectedIntent) {
        // Check for legacy intent data and migrate
        const ctaIntent = localStorage.getItem("ctaIntent");
        if (ctaIntent === "giftor") {
          console.log("[SignUpContentWrapper] Migrating legacy giftor intent to browse-shop");
          setSuggestedIntent("browse-shop");
          LocalStorageService.setNicoleContext({ selectedIntent: "browse-shop" });
          localStorage.removeItem("ctaIntent");
        } else if (ctaIntent === "giftee") {
          console.log("[SignUpContentWrapper] Migrating legacy giftee intent to create-wishlist");
          setSuggestedIntent("create-wishlist");
          LocalStorageService.setNicoleContext({ selectedIntent: "create-wishlist" });
          localStorage.removeItem("ctaIntent");
        }
      } else {
        setSuggestedIntent(nicoleContext.selectedIntent as "quick-gift" | "browse-shop" | "create-wishlist");
      }

      // IMMEDIATELY show the intent modal without any loading states
      console.log("[SignUpContentWrapper] Setting up intent modal IMMEDIATELY");
      // Use new LocalStorageService instead of deprecated keys
      LocalStorageService.setNicoleContext({ source: 'signup_completion' });
      setShouldShowModal(true);
      setIsCheckingIntent(false); // No loading state needed
    }
  }, [step, userEmail, navigate]);

  const handleSelectIntent = (userIntent: "quick-gift" | "browse-shop" | "create-wishlist") => {
    console.log("[SignUpContentWrapper] Intent selected:", userIntent);
    
    // Set the intent and clear modal flags
    // Use new LocalStorageService
    LocalStorageService.setNicoleContext({ 
      selectedIntent: userIntent,
      source: 'signup_completion'
    });
    LocalStorageService.cleanupDeprecatedKeys();
    
    // Show success toast
    toast.success("Account created successfully!", {
      description: "Welcome to Elyphant!"
    });
    
    // Update local state
    setShouldShowModal(false);

    // Navigate based on intent with small delay
    setTimeout(() => {
      if (userIntent === "browse-shop") {
        console.log("[SignUpContentWrapper] Navigating to marketplace with AI mode");
        navigate("/marketplace?mode=nicole&open=true&greeting=personalized", { replace: true });
      } else if (userIntent === "quick-gift") {
        console.log("[SignUpContentWrapper] Navigating to dashboard for quick gift");
        navigate("/dashboard", { replace: true });
      } else {
        console.log("[SignUpContentWrapper] Navigating to dashboard for wishlist creation");
        navigate("/dashboard", { replace: true });
      }
    }, 100);
  };

  // Render signup step
  if (step === "signup") {
    return (
      <SignUpView 
        onSubmit={onSignUpSubmit} 
        isSubmitting={isSubmitting} 
      />
    );
  }

  // During verification step - ALWAYS render intent modal if we reach this step
  if (step === "verification") {
    console.log("[SignUpContentWrapper] RENDERING intent modal for verification step");
    return (
      <OnboardingIntentModal
        open={true}
        onSelect={handleSelectIntent}
        onSkip={() => {/* Not used */}}
        suggestedIntent={suggestedIntent}
      />
    );
  }

  // Default fallback
  return null;
};

export default SignUpContentWrapper;
