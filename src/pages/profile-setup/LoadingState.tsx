
import React, { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LoadingStateProps {
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = "Loading..." 
}) => {
  const navigate = useNavigate();

  // Fallback mechanism: if loading takes too long, clear stuck state and redirect
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      console.log("[LoadingState] Loading timeout reached, clearing stuck states");
      
      // Clear potentially stuck flags
      localStorage.removeItem("showingIntentModal");
      localStorage.removeItem("profileSetupLoading");
      
      // Check if we have necessary signup data
      const newSignUp = localStorage.getItem("newSignUp") === "true";
      const userIntent = localStorage.getItem("userIntent"); // OLD
      const signupContext = localStorage.getItem("signupContext"); // NEW

      // Support both old and new signup context patterns
      const isGiftRecipient = userIntent === "giftee" || signupContext === "gift_recipient";
      const isGiftGiver = userIntent === "giftor" || signupContext === "gift_giver";
      
      if (newSignUp && isGiftRecipient) {
        // Continue to profile setup
        console.log("[LoadingState] Fallback: Gift recipient, continuing to profile setup");
        navigate("/profile-setup", { replace: true });
      } else if (newSignUp && isGiftGiver) {
        // Go to marketplace
        console.log("[LoadingState] Fallback: Gift giver, redirecting to marketplace");
        navigate("/marketplace", { replace: true });
      } else {
        // Go to dashboard as fallback
        console.log("[LoadingState] Fallback: Redirecting to dashboard");
        navigate("/dashboard", { replace: true });
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(fallbackTimer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {message}
        </h2>
        <p className="text-gray-600">
          This will just take a moment...
        </p>
      </div>
    </div>
  );
};

export default LoadingState;
