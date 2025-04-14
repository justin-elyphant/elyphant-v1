
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";
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
  const isRateLimited = localStorage.getItem("signupRateLimited") === "true";
  
  // Guaranteed-to-execute approach for auto-verification
  useEffect(() => {
    console.log("Auto-verification process started for:", userEmail);
    
    // Set flags for new signup journey
    localStorage.setItem("newSignUp", "true");
    localStorage.setItem("userEmail", userEmail);
    
    // Call verification success handler
    onVerificationSuccess();
    
    // Show success notification
    toast.success("Account created successfully!", {
      description: "Taking you to complete your profile."
    });
    
    // Navigate to profile setup with replace to prevent back-button issues
    console.log("Navigating to profile setup");
    setTimeout(() => {
      navigate('/profile-setup', { replace: true });
    }, 100); // Add a small delay to ensure proper navigation
    
  }, [onVerificationSuccess, userEmail, navigate]);

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {isRateLimited ? (
        <Alert variant="warning" className="bg-yellow-50 border-yellow-200 mb-4 w-full">
          <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
          <AlertDescription className="text-yellow-700">
            <span className="font-semibold">Simplified signup process activated!</span> Redirecting you to profile setup...
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="success" className="bg-green-50 border-green-200 mb-4 w-full">
          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
          <AlertDescription className="text-green-700">
            <span className="font-semibold">Account created successfully!</span> Redirecting you to profile setup...
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default VerificationForm;
