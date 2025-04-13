
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
    navigate('/profile-setup', { replace: true });
    
  }, [onVerificationSuccess, userEmail, navigate]);

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <Alert className="bg-amber-50 border-amber-200 mb-4 w-full">
        <Info className="h-4 w-4 text-amber-500 mr-2" />
        <AlertDescription className="text-amber-700">
          <span className="font-semibold">Account created!</span> Redirecting you to profile setup...
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default VerificationForm;
