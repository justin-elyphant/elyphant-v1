
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { toast } from "sonner";

interface VerificationFormProps {
  userEmail: string;
  onVerificationSuccess: () => void;
  testVerificationCode?: string | null;
}

const VerificationForm: React.FC<VerificationFormProps> = ({ 
  userEmail, 
  onVerificationSuccess 
}) => {
  const navigate = useNavigate();
  
  // Multiple bypass mechanisms to ensure redirect works
  useEffect(() => {
    console.log("ULTIMATE BYPASS: Completely skipping email verification for", userEmail);
    
    // Store in localStorage for persistence through redirects
    localStorage.setItem("newSignUp", "true");
    localStorage.setItem("userEmail", userEmail);
    
    // Call verification success synchronously
    onVerificationSuccess();
    
    // Show a toast notification to inform the user
    toast.success("Account created successfully!", {
      description: "Taking you to complete your profile."
    });
    
    // Direct navigation using React Router
    navigate('/profile-setup', { replace: true });
    
    // Ultra-reliable fallback: Also directly manipulate location after a slight delay
    setTimeout(() => {
      // Try multiple ways to navigate in case one fails
      try {
        console.log("Executing fallback redirect to profile setup");
        window.location.href = '/profile-setup';
      } catch (err) {
        console.error("Navigation error:", err);
        // Last resort redirect
        document.location.href = '/profile-setup';
      }
    }, 100);
  }, [onVerificationSuccess, userEmail, navigate]);

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <Alert className="bg-amber-50 border-amber-200 mb-4 w-full">
        <Info className="h-4 w-4 text-amber-500 mr-2" />
        <AlertDescription className="text-amber-700">
          <span className="font-semibold">Auto-verification active:</span> Skipping verification and redirecting you automatically.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default VerificationForm;
