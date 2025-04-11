
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
    
    // Show a toast notification to inform the user
    toast.success("Account created successfully!", {
      description: "Taking you to complete your profile."
    });
    
    // Call verification success synchronously
    onVerificationSuccess();
    
    // Also directly navigate to the profile setup to ensure we don't get stuck
    setTimeout(() => {
      // Try multiple ways to navigate in case one fails
      try {
        navigate('/profile-setup', { replace: true });
        console.log("Navigate method 1 executed");
      } catch (err) {
        console.error("Primary navigation failed, trying backup:", err);
        // Backup direct manipulation if React Router fails
        window.location.href = '/profile-setup';
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
