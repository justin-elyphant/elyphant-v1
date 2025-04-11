
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
  
  // Immediately trigger success with no delay
  useEffect(() => {
    console.log("BYPASS: Completely skipping email verification process for", userEmail);
    
    // Show a toast notification to inform the user
    toast.success("Account created successfully!", {
      description: "Taking you to complete your profile."
    });
    
    // Call verification success synchronously
    onVerificationSuccess();
    
    // Also directly navigate to the profile setup to ensure we don't get stuck
    setTimeout(() => {
      navigate('/profile-setup', { replace: true });
    }, 500);
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
